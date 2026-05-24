import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

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
  const model = 'Qwen/Qwen2.5-72B-Instruct';
  const url = 'https://router.huggingface.co/v1/chat/completions';

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

  console.log(`Sending chat completion request to Hugging Face model ${model}...`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 3000,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face API error (${response.status}): ${errorText}`);
    }

    const result = await response.json() as any;
    let generatedText = '';
    if (result?.choices?.[0]?.message?.content) {
      generatedText = result.choices[0].message.content.trim();
    } else {
      throw new Error(`Unexpected Hugging Face response structure: ${JSON.stringify(result)}`);
    }

    console.log("Raw LLM output received.");
    console.log("Raw LLM text:", generatedText);

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
    return postProcessSections(parsed.sections as ISection[]);
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

  const mockMCQPool = [
    {
      concept: "Atoms and Molecules",
      question: "Which of the following laws states that mass can neither be created nor destroyed in a chemical reaction?",
      options: [
        "Law of conservation of mass",
        "Law of constant proportions",
        "Dalton's atomic theory",
        "Law of conservation of energy"
      ],
      correctOptionIdx: 0,
      explanation: "The Law of Conservation of Mass states that mass is neither created nor destroyed in a chemical reaction. Hence, the total mass of the reactants equals the total mass of the products."
    },
    {
      concept: "Definite proportions",
      question: "In a chemical substance, the elements are always present in definite proportions by mass. This is known as the:",
      options: [
        "Law of conservation of mass",
        "Law of constant proportions",
        "Dalton's atomic theory",
        "Avogadro's law"
      ],
      correctOptionIdx: 1,
      explanation: "The Law of Constant Proportions (definite proportions) states that in a chemical substance, the elements are always present in definite proportions by mass regardless of source."
    },
    {
      concept: "Dalton",
      question: "According to Dalton's atomic theory, what is the smallest indivisible particle of matter that can take part in a chemical reaction?",
      options: [
        "Molecule",
        "Atom",
        "Proton",
        "Electron"
      ],
      correctOptionIdx: 1,
      explanation: "According to Dalton's atomic theory, all matter is made of tiny, indivisible particles called atoms, which can neither be created nor destroyed."
    },
    {
      concept: "Molecular mass",
      question: "How is the molecular mass of a chemical substance calculated?",
      options: [
        "By dividing the atomic mass of all constituents",
        "By subtracting the mass of the lightest atom",
        "As the sum of atomic masses of all atoms in a molecule",
        "By multiplying the number of atoms by the atomic number"
      ],
      correctOptionIdx: 2,
      explanation: "The molecular mass of a substance is the sum of the atomic masses of all the atoms in a single molecule of that substance."
    },
    {
      concept: "Electrolysis",
      question: "During the electrolysis of water, at which electrode is hydrogen gas liberated?",
      options: [
        "Anode",
        "Cathode",
        "Both electrodes",
        "Neither electrode"
      ],
      correctOptionIdx: 1,
      explanation: "Hydrogen ions (H+) are positively charged and migrate towards the negatively charged electrode (Cathode) where they gain electrons and form hydrogen gas."
    },
    {
      concept: "Electroplating",
      question: "What is the primary purpose of electroplating metals like iron with chromium in consumer products?",
      options: [
        "To increase electrical conductivity",
        "To prevent corrosion and improve appearance",
        "To make the metal lighter in weight",
        "To lower the melting point of the metal"
      ],
      correctOptionIdx: 1,
      explanation: "Electroplating chromium onto iron provides a shiny appearance and prevents corrosion/rusting because chromium does not corrode easily."
    },
    {
      concept: "Inertia",
      question: "The property of an object to resist any change in its state of rest or of uniform motion is called:",
      options: [
        "Force",
        "Momentum",
        "Inertia",
        "Acceleration"
      ],
      correctOptionIdx: 2,
      explanation: "Inertia is the inherent property of an object by virtue of which it resists any change in its state of rest or uniform motion."
    },
    {
      concept: "Second law",
      question: "Which of the following mathematical equations represents Newton's Second Law of Motion?",
      options: [
        "F = m/a",
        "F = ma",
        "F = m + a",
        "F = p/t"
      ],
      correctOptionIdx: 1,
      explanation: "Newton's Second Law states that the force applied is directly proportional to the rate of change of momentum, resulting in F = ma."
    }
  ];

  const isScience = /science|physic|chem|bio|electr/i.test(params.subject || '');
  const isEnglish = /english|lit|grammar/i.test(params.subject || '');

  params.questionTypes.forEach((qt, index) => {
    const secLetter = alphabet[index];
    const questionsList: any[] = [];

    for (let i = 0; i < qt.count; i++) {
      const qNum = i + 1;
      let text = '';
      let answer = '';
      let options: string[] | undefined = undefined;
      const difficulties: ('Easy' | 'Moderate' | 'Hard')[] = ['Easy', 'Moderate', 'Hard'];
      const difficulty = difficulties[(qNum + index) % 3];

      if (qt.type.toLowerCase().includes('multiple choice') || qt.type.toLowerCase().includes('mcq')) {
        let mcqItem = mockMCQPool[(qNum + index + i) % mockMCQPool.length];
        
        // Keyword-based question selection
        const matched = mockMCQPool.find(item => 
          new RegExp(item.concept, 'i').test(params.title || '') ||
          new RegExp(item.concept, 'i').test(params.subject || '') ||
          (params.fileTextContext && new RegExp(item.concept, 'i').test(params.fileTextContext))
        );

        if (matched) {
          const matchedIdx = mockMCQPool.indexOf(matched);
          mcqItem = mockMCQPool[(matchedIdx + i) % mockMCQPool.length];
        } else if (params.fileTextContext) {
          const sentences = params.fileTextContext
            .split(/[.?!]/)
            .map(s => s.trim())
            .filter(s => s.length > 20 && s.length < 150);
          
          if (sentences.length > 0) {
            const sentenceIndex = (qNum + index + i) % sentences.length;
            const snippet = sentences[sentenceIndex];
            mcqItem = {
              concept: "custom",
              question: `Regarding the concept "${snippet}", which of the following statements is correct?`,
              options: [
                `It represents a valid factual mechanism as stated in the textbook.`,
                `It is an invalid statement that contradicts the basic subject rules.`,
                `It is a subjective opinion with no logical basis or references.`,
                `It has been proven false by modern laboratory observations.`
              ],
              correctOptionIdx: 0,
              explanation: `The textbook references indicate that "${snippet}" is indeed a correct statement.`
            };
          }
        }

        // Shuffle the options to make sure correct option is NOT always Option A
        const targetCorrectIdx = (qNum + index + i) % 4; // Varies correct option between A (0), B (1), C (2), D (3)
        const originalOptions = [...mcqItem.options];
        const correctText = originalOptions[mcqItem.correctOptionIdx];
        
        const finalOptions = [...originalOptions];
        finalOptions[mcqItem.correctOptionIdx] = finalOptions[targetCorrectIdx];
        finalOptions[targetCorrectIdx] = correctText;
        
        const optionLetter = ['A', 'B', 'C', 'D'][targetCorrectIdx];
        text = mcqItem.question;
        options = finalOptions;
        answer = `Option ${optionLetter} is correct. ${mcqItem.explanation}`;

      } else if (qt.type.toLowerCase().includes('true') || qt.type.toLowerCase().includes('false')) {
        const isTrue = (qNum + index) % 2 === 0;
        if (isScience) {
          text = isTrue
            ? `State True or False: Dalton's atomic theory proposed that atoms are indivisible particles.`
            : `State True or False: The molecular mass of water (H2O) is exactly 10 u.`;
          answer = isTrue
            ? `True. Dalton proposed that atoms are indivisible particles of matter that cannot be created or destroyed.`
            : `False. The molecular mass of water is 18 u (1*2 + 16).`;
        } else {
          text = `State True or False: The primary objective of "${params.title}" is to cover the core curriculum.`;
          answer = isTrue ? `True. It aligns directly with the curriculum guides.` : `False. It is a supplementary assessment.`;
        }
      } else if (qt.type.toLowerCase().includes('short')) {
        if (isScience) {
          if (qNum % 2 === 0) {
            text = `Explain the difference between atoms and molecules with suitable examples.`;
            answer = `An atom is the smallest unit of an element that retains its properties (e.g. O, H), whereas a molecule is formed by chemical combination of two or more atoms (e.g. O2, H2O).`;
          } else {
            text = `State the Law of Conservation of Mass and explain its significance.`;
            answer = `The Law of Conservation of Mass states that mass can neither be created nor destroyed in a chemical reaction. This means the mass of reactants equals the mass of products.`;
          }
        } else if (isEnglish) {
          text = `What is the significance of the central theme in the text of ${params.title}?`;
          answer = 'The central theme establishes the tone and structural elements, allowing readers to connect individual narrative pieces back to a unified concept.';
        } else {
          text = `Describe the core concepts of "${params.title}" in the context of ${params.subject}.`;
          answer = 'The core concepts involve definition of terms, analysis of structures, and application of formulas as described in the curriculum guides.';
        }
      } else {
        // Long / general questions
        if (isScience) {
          text = `Describe in detail the electrolysis of copper sulfate solution. Detail what reactions occur at the cathode and anode, and draw conclusions about metal purification.`;
          answer = 'During electrolysis of CuSO4 with copper electrodes: At the cathode, copper ions are reduced: Cu2+ + 2e- -> Cu (deposit). At the anode, copper is oxidized: Cu -> Cu2+ + 2e-. Impure copper at the anode dissolves while pure copper deposits at the cathode, widely used in industrial copper purification.';
        } else {
          text = `Write a comprehensive essay outlining the historical development and modern applications of "${params.title}" in the context of ${params.subject}.`;
          answer = 'This is a long answer question requiring students to describe development, explain key principles, list modern applications, and evaluate benefits and limitations with real-world examples.';
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

function postProcessSections(sections: ISection[]): ISection[] {
  for (const section of sections) {
    if (!section.questions || !Array.isArray(section.questions)) continue;
    
    for (const question of section.questions) {
      if (question.options && Array.isArray(question.options) && question.options.length > 0) {
        const options = question.options.map(o => String(o).trim());
        const originalAnswer = String(question.answer || '').trim();
        
        let correctIdx = -1;
        
        for (let i = 0; i < options.length; i++) {
          const opt = options[i];
          if (originalAnswer.toLowerCase() === opt.toLowerCase()) {
            correctIdx = i;
            break;
          }
        }
        
        if (correctIdx === -1) {
          const letterMatch = originalAnswer.match(/^(?:Option\s+)?([A-D])\b/i);
          if (letterMatch) {
            const letter = letterMatch[1].toUpperCase();
            correctIdx = letter.charCodeAt(0) - 65;
          }
        }
        
        if (correctIdx === -1) {
          const sortedOptIndices = options
            .map((opt, idx) => ({ opt, idx }))
            .sort((a, b) => b.opt.length - a.opt.length);
            
          for (const item of sortedOptIndices) {
            if (item.opt.length > 0 && originalAnswer.toLowerCase().includes(item.opt.toLowerCase())) {
              correctIdx = item.idx;
              break;
            }
          }
        }

        if (correctIdx === -1) {
          correctIdx = 0;
        }

        const correctOptionText = options[correctIdx];

        const shuffledOptions = [...options];
        for (let i = shuffledOptions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
        }

        let newCorrectIdx = shuffledOptions.indexOf(correctOptionText);
        if (newCorrectIdx === -1) {
          newCorrectIdx = 0;
          shuffledOptions[0] = correctOptionText;
        }

        const optionLetter = ['A', 'B', 'C', 'D'][newCorrectIdx];
        
        let explanation = originalAnswer;
        explanation = explanation.replace(/^(?:Option\s+)?[A-D]\b(?:\s*is\s*correct)?[.:\-\s]*/i, '').trim();
        if (explanation.toLowerCase().startsWith(correctOptionText.toLowerCase())) {
          explanation = explanation.substring(correctOptionText.length).trim();
        }
        explanation = explanation.replace(/^[.:\-\s,;]*/, '').trim();

        question.options = shuffledOptions;
        question.answer = `Option ${optionLetter} is correct: ${correctOptionText}.${explanation ? ' ' + explanation : ''}`;
      } else {
        if (question.text) {
          question.text = question.text
            .replace(/^(?:Based\s+on\s+the\s+uploaded\s+text\s+context|According\s+to\s+the\s+reference\s+document|With\s+reference\s+to\s+the\s+uploaded\s+text|From\s+the\s+context|Based\s+on\s+the\s+provided\s+text)[,:\-\s]*/i, '')
            .trim();
          if (question.text.length > 0) {
            question.text = question.text.charAt(0).toUpperCase() + question.text.slice(1);
          }
        }
      }
    }
  }
  return sections;
}

