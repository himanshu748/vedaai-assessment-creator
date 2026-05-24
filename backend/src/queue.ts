import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { Assignment } from './models/Assignment';
import { generateQuestionPaper } from './services/ai';
import { generateAssignmentPDF } from './services/pdf';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Setup connection options for BullMQ
const getRedisConnection = () => {
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    // Add SSL support for production Redis URLs like Upstash or Aiven
    tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined
  });
};

export const queueConnection = getRedisConnection();

export const assessmentQueue = new Queue('assessment-generation', {
  connection: queueConnection
});

export function setupWorker(io: any) {
  const workerConnection = getRedisConnection();

  const worker = new Worker(
    'assessment-generation',
    async (job: Job) => {
      const { assignmentId } = job.data;
      console.log(`Starting generation job for Assignment ID: ${assignmentId}`);

      // 1. Notify client that parsing/generation has started
      io.to(assignmentId).emit('status-update', {
        status: 'generating',
        step: 'Contacting LLM for question generation...'
      });

      // 2. Fetch the assignment details from MongoDB
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        throw new Error(`Assignment ${assignmentId} not found in database.`);
      }

      assignment.status = 'generating';
      await assignment.save();

      try {
        // 3. Generate questions using AI
        const sections = await generateQuestionPaper({
          title: assignment.title,
          subject: assignment.subject,
          gradeClass: assignment.gradeClass,
          additionalInstructions: assignment.additionalInstructions,
          questionTypes: assignment.questionTypes,
          fileTextContext: assignment.fileTextContext
        });

        // Update step status
        io.to(assignmentId).emit('status-update', {
          status: 'generating',
          step: 'Generating PDF document...'
        });

        // 4. Generate the PDF buffer
        const pdfBuffer = await generateAssignmentPDF({
          title: assignment.title,
          subject: assignment.subject,
          gradeClass: assignment.gradeClass,
          dueDate: assignment.dueDate,
          totalMarks: assignment.totalMarks,
          sections: sections
        });

        // 5. Update assignment in MongoDB
        assignment.sections = sections;
        assignment.pdfBuffer = pdfBuffer;
        assignment.status = 'completed';
        assignment.error = undefined;
        await assignment.save();

        console.log(`Job completed successfully for Assignment ID: ${assignmentId}`);

        // 6. Notify client of success
        io.to(assignmentId).emit('status-update', {
          status: 'completed',
          step: 'Question paper generated successfully!'
        });
      } catch (err: any) {
        console.error(`Error in queue worker for Assignment ${assignmentId}:`, err);
        assignment.status = 'failed';
        assignment.error = err.message || String(err);
        await assignment.save();

        // Notify client of failure
        io.to(assignmentId).emit('status-update', {
          status: 'failed',
          step: `Generation failed: ${err.message || String(err)}`
        });
        throw err;
      }
    },
    {
      connection: workerConnection,
      concurrency: 2 // Allow up to 2 jobs in parallel
    }
  );

  worker.on('active', (job) => {
    console.log(`Job ${job.id} is active`);
  });

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed: ${err.message}`);
  });

  return worker;
}
