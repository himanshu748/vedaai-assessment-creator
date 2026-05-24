import dotenv from 'dotenv';
import { generateQuestionPaper } from './services/ai';

dotenv.config();

async function runTest() {
  console.log("Starting Hugging Face AI Generation Test...");
  try {
    const sections = await generateQuestionPaper({
      title: "Science Chapter 1 Quiz",
      subject: "Science",
      gradeClass: "Class 8",
      additionalInstructions: "Attempt all questions. Each MCQ carries 1 mark.",
      questionTypes: [
        { type: "Multiple Choice Questions", count: 2, marks: 1 },
        { type: "Short Answer Questions", count: 1, marks: 2 }
      ],
      fileTextContext: "Electroplating is the process of depositing a thin layer of metal on the surface of another metal using electric current. Its purpose is to prevent corrosion, improve appearance, or increase thickness. A conductor allows the flow of electric current, causing ions in the electrolyte to move and enabling chemical changes at electrodes."
    });

    console.log("\n--- TEST SUCCESS! ---");
    console.log(JSON.stringify(sections, null, 2));
  } catch (error) {
    console.error("\n--- TEST FAILED! ---", error);
  }
}

runTest();
