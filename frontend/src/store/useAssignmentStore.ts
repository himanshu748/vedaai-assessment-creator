import { create } from 'zustand';

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

export interface IAssignment {
  _id: string;
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
  createdAt: string;
}

interface AssignmentState {
  assignments: IAssignment[];
  currentAssignment: IAssignment | null;
  loading: boolean;
  error: string | null;
  
  // Real-time status states
  isGenerating: boolean;
  generationStep: string;
  
  fetchAssignments: () => Promise<void>;
  fetchAssignmentDetails: (id: string) => Promise<IAssignment | null>;
  createAssignment: (formData: FormData) => Promise<IAssignment | null>;
  regenerateAssignment: (id: string) => Promise<void>;
  updateAssignmentStatus: (id: string, status: IAssignment['status'], step: string) => void;
  clearCurrentAssignment: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  assignments: [],
  currentAssignment: null,
  loading: false,
  error: null,
  isGenerating: false,
  generationStep: '',

  fetchAssignments: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/assignments`);
      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }
      const data = await response.json();
      set({ assignments: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Something went wrong', loading: false });
    }
  },

  fetchAssignmentDetails: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/assignments/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch assignment details');
      }
      const data = await response.json();
      
      // Update generation progress states if the assignment is still processing
      const isProcessing = data.status === 'pending' || data.status === 'generating';
      set({ 
        currentAssignment: data, 
        loading: false,
        isGenerating: isProcessing,
        generationStep: isProcessing ? 'Processing generation job...' : ''
      });
      return data;
    } catch (err: any) {
      set({ error: err.message || 'Something went wrong', loading: false });
      return null;
    }
  },

  createAssignment: async (formData: FormData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/assignments`, {
        method: 'POST',
        body: formData, // Multer handles multipart/form-data
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create assignment');
      }
      const data = await response.json();
      set((state) => ({ 
        assignments: [data, ...state.assignments],
        currentAssignment: data,
        loading: false,
        isGenerating: true,
        generationStep: 'Queued in background job queue...'
      }));
      return data;
    } catch (err: any) {
      set({ error: err.message || 'Something went wrong', loading: false });
      return null;
    }
  },

  regenerateAssignment: async (id: string) => {
    set({ isGenerating: true, generationStep: 'Re-queueing generation job...' });
    try {
      const response = await fetch(`${API_BASE}/api/assignments/${id}/regenerate`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to trigger regeneration');
      }
      const data = await response.json();
      set({ 
        currentAssignment: data,
        isGenerating: true,
        generationStep: 'Re-queued in background job queue...'
      });
    } catch (err: any) {
      set({ error: err.message || 'Something went wrong', isGenerating: false });
    }
  },

  updateAssignmentStatus: (id: string, status: IAssignment['status'], step: string) => {
    set((state) => {
      const isCurrent = state.currentAssignment?._id === id;
      const updatedCurrent = isCurrent && state.currentAssignment 
        ? { ...state.currentAssignment, status } 
        : state.currentAssignment;
      
      const updatedAssignments = state.assignments.map(a => 
        a._id === id ? { ...a, status } : a
      );

      const isProcessing = status === 'pending' || status === 'generating';

      return {
        currentAssignment: updatedCurrent,
        assignments: updatedAssignments,
        isGenerating: isProcessing,
        generationStep: isProcessing ? step : ''
      };
    });
  },

  clearCurrentAssignment: () => {
    set({ currentAssignment: null, isGenerating: false, generationStep: '' });
  }
}));
