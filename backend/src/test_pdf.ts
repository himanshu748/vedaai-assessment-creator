import fs from 'fs';
import path from 'path';
import { generateAssignmentPDF } from './services/pdf';

async function testPDF() {
  console.log("Starting PDF generation test...");
  try {
    const mockSections = [
      {
        title: "Section A: Multiple Choice Questions",
        instruction: "Attempt all questions in this section. Each question carries 1 mark.",
        questions: [
          {
            text: "Which of the following describes a key process in Science for Class 8?",
            difficulty: "Easy" as const,
            marks: 1,
            options: [
              "Deposition of metal ions at the cathode during electrolysis",
              "Flow of electrons in a non-conductive medium",
              "Reduction of oxygen ions at the anode without current",
              "Electrostatic insulation of conducting copper wires"
            ],
            answer: "Option A is correct."
          }
        ]
      },
      {
        title: "Section B: Short Answer Questions",
        instruction: "Attempt all questions in this section. Each question carries 2 marks.",
        questions: [
          {
            text: "Explain the process of electroplating and list two industrial applications.",
            difficulty: "Moderate" as const,
            marks: 2,
            answer: "Electroplating is deposition of a metal layer. Applications include corrosion prevention and decoration."
          }
        ]
      }
    ];

    const pdfBuffer = await generateAssignmentPDF({
      title: "Delhi Public School CBSE Term 1 Science Exam",
      subject: "Science",
      gradeClass: "Class 8",
      dueDate: "2026-06-15",
      totalMarks: 3,
      sections: mockSections
    });

    const outputPath = path.join(__dirname, '../test_exam_paper.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`\n--- PDF TEST SUCCESS! ---`);
    console.log(`Saved PDF to: ${outputPath} (${pdfBuffer.length} bytes)`);
  } catch (error) {
    console.error(`\n--- PDF TEST FAILED! ---`, error);
  }
}

testPDF();
