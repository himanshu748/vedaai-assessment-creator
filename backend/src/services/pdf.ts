import PDFDocument from 'pdfkit';
import { ISection } from '../models/Assignment';

export function generateAssignmentPDF(params: {
  title: string;
  subject: string;
  gradeClass: string;
  dueDate: string;
  totalMarks: number;
  sections: ISection[];
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, bufferPages: true });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // --- HEADER SECTION ---
      doc.font('Helvetica-Bold').fontSize(16).text(params.title.toUpperCase(), { align: 'center' });
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').fontSize(12).text(`SUBJECT: ${params.subject.toUpperCase()}`, { align: 'center' });
      doc.font('Helvetica-Bold').fontSize(11).text(`CLASS: ${params.gradeClass.toUpperCase()}`, { align: 'center' });
      doc.moveDown(0.5);

      // Horizontal line
      doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor('#ccc').lineWidth(1).stroke();
      doc.moveDown(0.4);

      // Time Allowed & Max Marks
      const currentY = doc.y;
      doc.font('Helvetica-Bold').fontSize(10).text(`Time Allowed: 90 Minutes`, 50, currentY);
      doc.font('Helvetica-Bold').fontSize(10).text(`Maximum Marks: ${params.totalMarks}`, 450, currentY, { align: 'right' });
      doc.moveDown(0.8);

      // Dotted horizontal line
      doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor('#888').dash(3, { space: 3 }).stroke();
      doc.undash();
      doc.moveDown(0.8);

      // --- STUDENT DETAILS SECTION ---
      const detailY = doc.y;
      doc.font('Helvetica').fontSize(10).text('Name: _________________________________', 50, detailY);
      doc.font('Helvetica').fontSize(10).text('Roll Number: ___________________', 380, detailY);
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(10).text(`Class: ${params.gradeClass}          Section: ___________`);
      doc.moveDown(0.8);

      // Another dotted horizontal line
      doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor('#888').dash(3, { space: 3 }).stroke();
      doc.undash();
      doc.moveDown(1);

      // --- GENERAL INSTRUCTIONS ---
      doc.font('Helvetica-Bold').fontSize(10).text('General Instructions:');
      doc.font('Helvetica').fontSize(9).text('1. All questions are compulsory.', { indent: 15 });
      doc.font('Helvetica').fontSize(9).text('2. Please write your Name, Roll Number, and Section clearly on the question paper.', { indent: 15 });
      doc.font('Helvetica').fontSize(9).text('3. Section subdivisions are as specified in the question paper.', { indent: 15 });
      doc.font('Helvetica').fontSize(9).text(`4. The question paper must be submitted on or before the due date: ${params.dueDate}.`, { indent: 15 });
      doc.moveDown(1.5);

      // --- SECTIONS AND QUESTIONS ---
      params.sections.forEach((section, sIdx) => {
        // Section Header
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#1a1a1a').text(section.title, { underline: true });
        doc.font('Helvetica-Oblique').fontSize(9).fillColor('#555555').text(section.instruction);
        doc.moveDown(0.8);

        section.questions.forEach((question, qIdx) => {
          // Question text and metadata
          const qText = `${qIdx + 1}. ${question.text}`;
          const qMarks = `[${question.marks} Marks]`;
          const qDifficulty = `(${question.difficulty})`;

          const startY = doc.y;

          // Draw question text (left aligned)
          doc.font('Helvetica').fontSize(10).fillColor('#000000').text(qText, 50, startY, {
            width: 400,
            align: 'left'
          });

          const textHeight = doc.heightOfString(qText, { width: 400 });
          const textEndY = startY + textHeight;

          // Right aligned difficulty and marks
          doc.font('Helvetica-Bold').fontSize(9).fillColor('#666').text(`${qDifficulty}   ${qMarks}`, 450, startY, {
            width: 112,
            align: 'right'
          });

          doc.y = textEndY + 8;

          // MCQ Options if present
          if (question.options && question.options.length > 0) {
            question.options.forEach((option, oIdx) => {
              const letter = String.fromCharCode(65 + oIdx); // A, B, C, D
              doc.font('Helvetica').fontSize(9).fillColor('#333').text(`   (${letter}) ${option}`, { indent: 15 });
            });
            doc.moveDown(0.5);
          }

          doc.moveDown(0.5);
          
          // Page break check
          if (doc.y > 700) {
            doc.addPage();
          }
        });

        doc.moveDown(1.5);
        if (doc.y > 700) {
          doc.addPage();
        }
      });

      // --- END OF QUESTION PAPER ---
      doc.moveDown(1);
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#777777').text('--- END OF QUESTION PAPER ---', { align: 'center' });

      // --- ANSWER KEY (Starts on a new page) ---
      doc.addPage();
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#2d3748').text('ANSWER KEY & EXPLANATIONS', { align: 'center', underline: true });
      doc.moveDown(1.5);

      params.sections.forEach((section) => {
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#1a1a1a').text(section.title);
        doc.moveDown(0.5);

        section.questions.forEach((question, qIdx) => {
          doc.font('Helvetica-Bold').fontSize(9).fillColor('#333333').text(`Q${qIdx + 1}: ${question.text}`);
          doc.font('Helvetica').fontSize(9).fillColor('#4a5568').text(`Answer: ${question.answer}`);
          doc.moveDown(0.8);
          
          if (doc.y > 720) {
            doc.addPage();
          }
        });
        doc.moveDown(1);
      });

      // --- Footer / Page Numbering ---
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#999999').text(
          `Page ${i + 1} of ${range.count}`,
          50,
          750,
          { align: 'center' }
        );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
