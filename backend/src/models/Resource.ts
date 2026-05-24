import { Schema, model, Document } from 'mongoose';

export interface IResource extends Document {
  title: string;
  type: 'PDF' | 'TXT' | 'Syllabus' | 'Exam Template';
  size: string;
  uploadedAt: Date;
  subject: string;
  downloads: number;
  fileTextContext: string;
}

const ResourceSchema = new Schema<IResource>({
  title: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['PDF', 'TXT', 'Syllabus', 'Exam Template'], 
    required: true 
  },
  size: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  subject: { type: String, required: true },
  downloads: { type: Number, default: 0 },
  fileTextContext: { type: String, required: true }
});

export const Resource = model<IResource>('Resource', ResourceSchema);
