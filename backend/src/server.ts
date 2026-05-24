import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import pdfParse from 'pdf-parse';
import { connectDB } from './db';
import { Assignment } from './models/Assignment';
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
      questionTypes: questionTypesRaw
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

    // Extract text from uploaded PDF / TXT file
    let fileTextContext = '';
    if (req.file) {
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

// Connect database and start server
const PORT = process.env.PORT || 5001;

async function startServer() {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`VedaAI Backend Server running on port ${PORT}`);
  });
}

startServer();
