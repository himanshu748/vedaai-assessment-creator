import { Schema, model, Document } from 'mongoose';

export interface IQuestion {
  text: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  marks: number;
  options?: string[];
  answer: string;
}

export interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IQuestionType {
  type: string;
  count: number;
  marks: number;
}

export interface IAssignment extends Document {
  title: string;
  subject: string;
  gradeClass: string;
  dueDate: string;
  additionalInstructions?: string;
  fileTextContext?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error?: string;
  questionTypes: IQuestionType[];
  totalQuestions: number;
  totalMarks: number;
  sections?: ISection[];
  pdfBuffer?: Buffer;
  createdAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  text: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Moderate', 'Hard'], required: true },
  marks: { type: Number, required: true },
  options: [{ type: String }],
  answer: { type: String, required: true }
});

const SectionSchema = new Schema<ISection>({
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questions: [QuestionSchema]
});

const QuestionTypeSchema = new Schema<IQuestionType>({
  type: { type: String, required: true },
  count: { type: Number, required: true },
  marks: { type: Number, required: true }
});

const AssignmentSchema = new Schema<IAssignment>({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  gradeClass: { type: String, required: true },
  dueDate: { type: String, required: true },
  additionalInstructions: { type: String },
  fileTextContext: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'generating', 'completed', 'failed'], 
    default: 'pending' 
  },
  error: { type: String },
  questionTypes: [QuestionTypeSchema],
  totalQuestions: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  sections: [SectionSchema],
  pdfBuffer: { type: Buffer },
  createdAt: { type: Date, default: Date.now }
});

export const Assignment = model<IAssignment>('Assignment', AssignmentSchema);
