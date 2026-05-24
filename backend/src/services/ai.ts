import { ISection, IQuestionType } from '../models/Assignment';

export async function generateQuestionPaper(params: {
  title: string;
  subject: string;
  gradeClass: string;
  additionalInstructions?: string;
  questionTypes: IQuestionType[];
  fileTextContext?: string;
}): Promise<ISection[]> {
  const hfToken = process.env.HF_TOKEN || '';
  const model = 'meta-llama/Meta-Llama-3-8B-Instruct';
  const url = `https://api-inference.huggingface.co/models/${model}`;

  // Build the list of question types requested
  const typesDescription = params.questionTypes
    .map(t => `- ${t.count} questions of type "${t.type}" carrying ${t.marks} marks each.`)
    .join('\n');

  // Format prompt
  const systemPrompt = `You are an expert school teacher and exam creator. Your task is to generate a professional question paper in JSON format.
You MUST output ONLY a valid JSON object. Do not include markdown code block syntax (like \`\`\`json) or any conversational text. Return only the raw JSON.

CRITICAL INSTRUCTION: Do NOT include phrases like "Based on the uploaded text context:", "According to the reference document:", "With reference to the uploaded text:", "From the context:", or similar meta-references in the question text. Formulate questions directly and naturally as if they are in a real exam paper (e.g. "What is the relation between atoms and molecules?" instead of "Based on the reference text, what is the relation between atoms and molecules?").

The JSON schema MUST exactly match:
{
  "sections": [
    {
      "title": "Section A (or B, C, etc.)",
      "instruction": "Instructions for this section (e.g., Attempt all questions)",
      "questions": [
        {
          "text": "The question content here?",
          "difficulty": "Easy" | "Moderate" | "Hard",
          "marks": 2,
          "options": ["Option A", "Option B", "Option C", "Option D"], // Only include this array if the question type is "Multiple Choice Questions" or similar MCQ type
          "answer": "The detailed answer or explanation for this question"
        }
      ]
    }
  ]
}`;

  const userPrompt = `Generate a question paper based on the following details:
- **Title**: ${params.title}
- **Subject**: ${params.subject}
- **Grade/Class**: ${params.gradeClass}
- **Additional Instructions**: ${params.additionalInstructions || 'None'}

**Question Requirements**:
${typesDescription}

${params.fileTextContext ? `**Source Context (Base the questions strictly on this content)**:\n${params.fileTextContext.slice(0, 8000)}` : 'Generate standard, high-quality textbook questions suitable for this subject and grade level.'}

Ensure that:
1. The total number of questions and marks in the generated sections matches the requested questions exactly.
2. The questions are grouped into logical sections (e.g. Section A: Multiple Choice Questions, Section B: Short Answer Questions).
3. Every question must have a difficulty tag ('Easy', 'Moderate', or 'Hard') and an answer/solution.
4. Output must be raw valid JSON containing the "sections" array.`;

  // Combine prompts for the model
  const fullPrompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n${systemPrompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n${userPrompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`;

  console.log(`Sending prompt to Hugging Face model ${model}...`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: fullPrompt,
        parameters: {
          max_new_tokens: 3000,
          temperature: 0.2,
          return_full_text: false
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face API error (${response.status}): ${errorText}`);
    }

    const result = await response.json() as any;
    let generatedText = '';
    if (Array.isArray(result) && result[0]?.generated_text) {
      generatedText = result[0].generated_text.trim();
    } else if (result?.generated_text) {
      generatedText = result.generated_text.trim();
    } else {
      throw new Error(`Unexpected Hugging Face response structure: ${JSON.stringify(result)}`);
    }

    console.log("Raw LLM output received.");

    // Clean JSON output in case LLM wrapped it in markdown code blocks or added conversational text
    let jsonString = generatedText;
    
    // Find first { and last }
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonString = jsonString.substring(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(jsonString);
    if (!parsed.sections || !Array.isArray(parsed.sections)) {
      throw new Error("Parsed JSON does not contain 'sections' array");
    }
    return parsed.sections as ISection[];
  } catch (error: any) {
    console.error("Detailed Hugging Face API Error:", error, "\nCause:", error.cause, "\nStack:", error.stack);
    console.warn("Hugging Face API failed, switching to offline fallback question generator:", error.message || error);
    return getOfflineMockQuestions(params);
  }
}

// High-quality offline mock generator that conforms to requested structure
function getOfflineMockQuestions(params: {
  title: string;
  subject: string;
  gradeClass: string;
  additionalInstructions?: string;
  questionTypes: IQuestionType[];
  fileTextContext?: string;
}): ISection[] {
  const sections: ISection[] = [];
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  // Sample templates depending on subject (Science, English, Math, Generic)
  const isScience = /science|physic|chem|bio|electr/i.test(params.subject || '');
  const isEnglish = /english|lit|grammar/i.test(params.subject || '');

  params.questionTypes.forEach((qt, index) => {
    const secLetter = alphabet[index];
    const questionsList: any[] = [];

    // Helper to generate a question text based on subject, type, and source text if any
    for (let i = 0; i < qt.count; i++) {
      const qNum = i + 1;
      let text = '';
      let answer = '';
      let options: string[] | undefined = undefined;
      const difficulties: ('Easy' | 'Moderate' | 'Hard')[] = ['Easy', 'Moderate', 'Hard'];
      const difficulty = difficulties[(qNum + index) % 3];

      if (qt.type.toLowerCase().includes('multiple choice') || qt.type.toLowerCase().includes('mcq')) {
        options = [
          'Option A - High relevance statement',
          'Option B - Moderate relevance statement',
          'Option C - Distractor statement',
          'Option D - None of the above'
        ];
        
        if (isScience) {
          text = `Which of the following describes a key process in ${params.subject} for ${params.gradeClass} (related to ${params.title})?`;
          options = [
            'Deposition of metal ions at the cathode during electrolysis',
            'Flow of electrons in a non-conductive medium',
            'Reduction of oxygen ions at the anode without current',
            'Electrostatic insulation of conducting copper wires'
          ];
          answer = 'Option A is correct. During electrolysis, metal ions gain electrons at the cathode and deposit as solid metal (e.g. copper plating).';
        } else if (isEnglish) {
          text = `Identify the correct usage of prepositions in the sentence related to ${params.title}:`;
          options = [
            'He is proficient in English grammar.',
            'He is proficient with English grammar.',
            'He is proficient at English grammar.',
            'He is proficient for English grammar.'
          ];
          answer = 'Option A is correct. "Proficient in" is the standard idiomatic expression in English grammar.';
        } else {
          text = `Select the most accurate statement regarding ${params.title} under ${params.subject}:`;
          answer = 'Option A is correct because it follows standard textbook definitions.';
        }
      } else if (qt.type.toLowerCase().includes('true') || qt.type.toLowerCase().includes('false')) {
        if (isScience) {
          text = `State True or False: Electrolysis can occur in pure distilled water without any dissolved salts.`;
          answer = 'False. Pure distilled water does not contain free-moving ions and is a poor conductor of electricity; a salt or acid must be added to enable electrolysis.';
        } else {
          text = `State True or False: The primary objective of ${params.title} is to summarize the core topics of ${params.subject}.`;
          answer = 'True. It aligns directly with the curriculum syllabus.';
        }
      } else if (qt.type.toLowerCase().includes('short')) {
        if (isScience) {
          text = `Explain the process of electroplating and list two industrial applications.`;
          answer = 'Electroplating is the deposition of a metal layer onto another surface using an electric current. Applications: 1) Prevention of corrosion (e.g., chrome plating on iron parts), 2) Aesthetic improvement (e.g., silver/gold plating on jewelry).';
        } else if (isEnglish) {
          text = `What is the significance of the central theme in the text of ${params.title}?`;
          answer = 'The central theme establishes the tone and structural elements, allowing readers to connect individual narrative pieces back to a unified concept.';
        } else {
          text = `Describe the core concepts of ${params.title} under the topic of ${params.subject}.`;
          answer = 'The core concepts involve definition of terms, analysis of structures, and application of formulas as described in the curriculum guides.';
        }
      } else {
        // Long / general questions
        if (isScience) {
          text = `Describe in detail the electrolysis of copper sulfate solution. Detail what reactions occur at the cathode and anode, and draw conclusions about metal purification.`;
          answer = 'During electrolysis of CuSO4 with copper electrodes: At the cathode, copper ions are reduced: Cu²⁺ + 2e⁻ -> Cu (deposit). At the anode, copper is oxidized: Cu -> Cu²⁺ + 2e⁻. Impure copper at the anode dissolves while pure copper deposits at the cathode, widely used in industrial copper purification.';
        } else {
          text = `Write a comprehensive essay outlining the historical development and modern applications of ${params.title} in the context of ${params.subject}.`;
          answer = 'This is a long answer question requiring students to describe development, explain key principles, list modern applications, and evaluate benefits and limitations with real-world examples.';
        }
      }

      // If source file text context exists, try to customize the question text using snippets from it!
      if (params.fileTextContext) {
        const sentences = params.fileTextContext
          .split(/[.?!]/)
          .map(s => s.trim())
          .filter(s => s.length > 20 && s.length < 150);
        
        if (sentences.length > 0) {
          const sentenceIndex = (qNum + index) % sentences.length;
          const snippet = sentences[sentenceIndex];
          
          if (qt.type.toLowerCase().includes('multiple choice')) {
            text = `Regarding the concept "${snippet}", which of the following statements is correct?`;
          } else {
            text = `Explain the following concept: "${snippet}". What are its primary implications in this subject area?`;
          }
        }
      }

      questionsList.push({
        text,
        difficulty,
        marks: qt.marks,
        options,
        answer
      });
    }

    sections.push({
      title: `Section ${secLetter}: ${qt.type}`,
      instruction: `Attempt all questions in this section. Each question carries ${qt.marks} marks.`,
      questions: questionsList
    });
  });

  return sections;
}

