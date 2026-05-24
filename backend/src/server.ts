import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import pdfParse from 'pdf-parse';
import { connectDB } from './db';
import { Assignment } from './models/Assignment';
import { Resource } from './models/Resource';
import { assessmentQueue, setupWorker } from './queue';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // Allow any origin for testing
    methods: ['GET', 'POST']
  }
});

// Configure Express middleware
app.use(cors());
app.use(express.json());

// Setup Multer for memory storage (file upload)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log('Socket client connected:', socket.id);

  // Client joins a room for a specific assignment to get real-time updates
  socket.on('join-assignment', (assignmentId: string) => {
    console.log(`Socket ${socket.id} joining room: ${assignmentId}`);
    socket.join(assignmentId);
  });

  socket.on('disconnect', () => {
    console.log('Socket client disconnected:', socket.id);
  });
});

// Initialize BullMQ worker
const worker = setupWorker(io);

// --- REST API ENDPOINTS ---

// Create an assignment & queue generation
app.post('/api/assignments', upload.single('file'), async (req, res) => {
  try {
    const {
      title,
      subject,
      gradeClass,
      dueDate,
      additionalInstructions,
      questionTypes: questionTypesRaw,
      resourceId
    } = req.body;

    if (!title || !subject || !gradeClass || !dueDate || !questionTypesRaw) {
       res.status(400).json({ error: 'Missing required fields' });
       return;
    }

    let questionTypes = [];
    try {
      questionTypes = typeof questionTypesRaw === 'string' ? JSON.parse(questionTypesRaw) : questionTypesRaw;
    } catch (err) {
       res.status(400).json({ error: 'Invalid questionTypes format' });
       return;
    }

    if (!Array.isArray(questionTypes) || questionTypes.length === 0) {
       res.status(400).json({ error: 'At least one question type is required' });
       return;
    }

    // Extract text from uploaded PDF / TXT file OR use selected library resource
    let fileTextContext = '';
    if (resourceId) {
      const resource = await Resource.findById(resourceId);
      if (resource) {
        fileTextContext = resource.fileTextContext;
        // Increment downloads
        resource.downloads += 1;
        await resource.save();
      } else {
         res.status(400).json({ error: 'Selected library resource not found' });
         return;
      }
    } else if (req.file) {
      const mime = req.file.mimetype;
      if (mime === 'application/pdf') {
        const data = await pdfParse(req.file.buffer);
        fileTextContext = data.text;
      } else if (mime.startsWith('text/')) {
        fileTextContext = req.file.buffer.toString('utf-8');
      } else {
         res.status(400).json({ error: 'Unsupported file type. Only PDF and text files are supported.' });
         return;
      }
    }

    // Calculate total questions and marks
    let totalQuestions = 0;
    let totalMarks = 0;
    for (const q of questionTypes) {
      if (q.count <= 0 || q.marks <= 0) {
         res.status(400).json({ error: 'Question count and marks must be positive numbers' });
         return;
      }
      totalQuestions += Number(q.count);
      totalMarks += Number(q.count) * Number(q.marks);
    }

    // Create Draft Assignment in MongoDB
    const assignment = new Assignment({
      title,
      subject,
      gradeClass,
      dueDate,
      additionalInstructions,
      fileTextContext,
      questionTypes,
      totalQuestions,
      totalMarks,
      status: 'pending'
    });

    await assignment.save();

    console.log(`Created assignment draft: ${assignment._id}. Queueing generation...`);

    // Queue the background generation job
    await assessmentQueue.add('generate', {
      assignmentId: assignment._id.toString()
    });

    res.status(201).json(assignment);
  } catch (error: any) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// List all assignments (exclude pdfBuffer for efficiency)
app.get('/api/assignments', async (req, res) => {
  try {
    const assignments = await Assignment.find().select('-pdfBuffer').sort({ createdAt: -1 });
    res.json(assignments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific assignment details (exclude pdfBuffer)
app.get('/api/assignments/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).select('-pdfBuffer');
    if (!assignment) {
       res.status(404).json({ error: 'Assignment not found' });
       return;
    }
    res.json(assignment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger regeneration of an assignment
app.post('/api/assignments/:id/regenerate', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
       res.status(404).json({ error: 'Assignment not found' });
       return;
    }

    // Reset status and empty old results
    assignment.status = 'pending';
    assignment.sections = [];
    assignment.pdfBuffer = undefined;
    assignment.error = undefined;
    await assignment.save();

    console.log(`Re-queueing assignment: ${assignment._id}`);

    // Re-queue the background generation job
    await assessmentQueue.add('generate', {
      assignmentId: assignment._id.toString()
    });

    res.json(assignment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Download PDF file
app.get('/api/assignments/:id/pdf', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment || !assignment.pdfBuffer) {
       res.status(404).json({ error: 'PDF not found or not generated yet' });
       return;
    }

    const safeTitle = assignment.title.replace(/[^a-zA-Z0-9]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}_Question_Paper.pdf"`);
    res.send(assignment.pdfBuffer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- RESOURCE LIBRARY DATA & HELPERS ---

const mockResources = [
  {
    title: 'CBSE Grade 9 Chemistry Chapter 3: Atoms and Molecules Reference Notes',
    type: 'PDF' as const,
    size: '2.4 MB',
    subject: 'Chemistry',
    downloads: 48,
    fileTextContext: 'Atoms and Molecules. Chemical reactions are governed by laws of chemical combination: Law of conservation of mass, Law of constant proportions. Dalton proposed atomic theory. Atom is the smallest unit of matter. Molecules are formed by combination of atoms. Molecular mass is calculated as sum of atomic masses.'
  },
  {
    title: 'Biology Class 10: Cell Structure & Function Notes Summary',
    type: 'PDF' as const,
    size: '1.8 MB',
    subject: 'Biology',
    downloads: 32,
    fileTextContext: 'Cell structure and function. The cell is the basic structural and functional unit of life. Cell membrane, nucleus, cytoplasm, organelles like mitochondria, ribosomes, endoplasmic reticulum, Golgi body, lysosomes. Mitosis and meiosis cell divisions.'
  },
  {
    title: 'Grade 8 Science Term 1 Syllabus Guidelines',
    type: 'Syllabus' as const,
    size: '420 KB',
    subject: 'General Science',
    downloads: 15,
    fileTextContext: 'Grade 8 Science Term 1 Syllabus covers Crop Production and Management, Microorganisms: Friend and Foe, Synthetic Fibres and Plastics, Materials: Metals and Non-Metals, Coal and Petroleum.'
  },
  {
    title: 'Standard CBSE High School Exam Header Template Grid',
    type: 'Exam Template' as const,
    size: '12 KB',
    subject: 'Templates',
    downloads: 124,
    fileTextContext: 'General Exam Header template: Name of School, Class, Subject, Time Allowed, Maximum Marks, Name, Roll No, Section, General Instructions.'
  },
  {
    title: 'Physics Chapter 2: Force & Laws of Motion Reference Document',
    type: 'TXT' as const,
    size: '150 KB',
    subject: 'Physics',
    downloads: 27,
    fileTextContext: 'Force and Laws of Motion. First law of motion: inertia. Second law of motion: F = ma. Third law of motion: action and reaction. Momentum conservation.'
  }
];

// Seed library if empty
async function seedLibrary() {
  try {
    const count = await Resource.countDocuments();
    if (count === 0) {
      console.log('Seeding mock resource library...');
      await Resource.insertMany(mockResources);
      console.log('Resource library seeded successfully!');
    }
  } catch (err) {
    console.error('Error seeding library:', err);
  }
}

// --- RESOURCE LIBRARY REST API ENDPOINTS ---

// Fetch all resources
app.get('/api/resources', async (req, res) => {
  try {
    const resources = await Resource.find().sort({ uploadedAt: -1 });
    res.json(resources);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upload a new resource to the library
app.post('/api/resources', upload.single('file'), async (req, res) => {
  try {
    const { subject } = req.body;
    
    if (!req.file || !subject) {
       res.status(400).json({ error: 'File and subject are required' });
       return;
    }

    const mime = req.file.mimetype;
    let fileTextContext = '';
    let fileType: 'PDF' | 'TXT' = 'TXT';

    if (mime === 'application/pdf') {
      const data = await pdfParse(req.file.buffer);
      fileTextContext = data.text;
      fileType = 'PDF';
    } else if (mime.startsWith('text/')) {
      fileTextContext = req.file.buffer.toString('utf-8');
      fileType = 'TXT';
    } else {
       res.status(400).json({ error: 'Unsupported file type. Only PDF and text files are supported.' });
       return;
    }

    // Format file size
    const kb = req.file.size / 1024;
    const sizeStr = kb > 1024 
      ? `${(kb / 1024).toFixed(1)} MB` 
      : `${Math.round(kb)} KB`;

    const resource = new Resource({
      title: req.file.originalname,
      type: fileType,
      size: sizeStr,
      subject,
      downloads: 0,
      fileTextContext
    });

    await resource.save();
    res.status(201).json(resource);
  } catch (error: any) {
    console.error('Error uploading resource:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Delete a resource from the library
app.delete('/api/resources/:id', async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) {
       res.status(404).json({ error: 'Resource not found' });
       return;
    }
    res.json({ message: 'Resource deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Connect database and start server
const PORT = process.env.PORT || 5001;

async function startServer() {
  await connectDB();
  await seedLibrary();
  server.listen(PORT, () => {
    console.log(`VedaAI Backend Server running on port ${PORT}`);
  });
}

startServer();
