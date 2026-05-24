'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAssignmentStore, IQuestionType } from '../../store/useAssignmentStore';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  Upload, 
  File, 
  Trash2, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  AlertCircle,
  Loader2,
  Calendar,
  Layers,
  GraduationCap,
  Library,
  BookOpen
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default function CreateAssignment() {
  const router = useRouter();
  const createAssignment = useAssignmentStore((state) => state.createAssignment);
  const loading = useAssignmentStore((state) => state.loading);
  const error = useAssignmentStore((state) => state.error);

  // Form step tracking
  const [step, setStep] = useState(1);

  // Form state
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeClass, setGradeClass] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [questionTypes, setQuestionTypes] = useState<IQuestionType[]>([
    { type: 'Multiple Choice Questions', count: 5, marks: 1 },
    { type: 'Short Answer Questions', count: 5, marks: 2 }
  ]);

  // Library Integration State
  const [libraryResources, setLibraryResources] = useState<any[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [useLibrary, setUseLibrary] = useState(false);
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  // UI drag/drop state
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch library resources on mount
  useEffect(() => {
    const loadLibrary = async () => {
      try {
        setLoadingLibrary(true);
        const res = await fetch(`${API_BASE}/api/resources`);
        if (res.ok) {
          const data = await res.json();
          setLibraryResources(data);
        }
      } catch (err) {
        console.error('Error fetching library in wizard:', err);
      } finally {
        setLoadingLibrary(false);
      }
    };
    loadLibrary();
  }, []);

  // File drop helpers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const validTypes = ['application/pdf', 'text/plain'];
      if (validTypes.includes(droppedFile.type)) {
        setFile(droppedFile);
        setValidationError(null);
      } else {
        setValidationError('Invalid file type. Please upload a PDF or TXT file.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setValidationError(null);
    }
  };

  // Question types handlers
  const handleAddQuestionType = () => {
    setQuestionTypes([...questionTypes, { type: 'Multiple Choice Questions', count: 5, marks: 1 }]);
  };

  const handleRemoveQuestionType = (index: number) => {
    const updated = questionTypes.filter((_, i) => i !== index);
    setQuestionTypes(updated);
  };

  const handleQuestionTypeChange = (index: number, field: keyof IQuestionType, value: any) => {
    const updated = questionTypes.map((q, i) => {
      if (i === index) {
        return { ...q, [field]: value };
      }
      return q;
    });
    setQuestionTypes(updated);
  };

  // Calculations
  const totalQuestions = questionTypes.reduce((acc, q) => acc + Number(q.count || 0), 0);
  const totalMarks = questionTypes.reduce((acc, q) => acc + (Number(q.count || 0) * Number(q.marks || 0)), 0);

  // Form validation per step
  const validateStep = () => {
    setValidationError(null);

    if (step === 2) {
      if (!title.trim()) return 'Assignment Title is required';
      if (!subject.trim()) return 'Subject is required';
      if (!gradeClass.trim()) return 'Grade / Class is required';
      if (!dueDate.trim()) return 'Due Date is required';
    }

    if (step === 3) {
      if (questionTypes.length === 0) return 'At least one question type is required';
      for (const q of questionTypes) {
        if (!q.type) return 'Question type label is required';
        if (q.count <= 0) return 'Number of questions must be greater than 0';
        if (q.marks <= 0) return 'Marks per question must be greater than 0';
      }
    }

    return null;
  };

  const handleNext = () => {
    const errorMsg = validateStep();
    if (errorMsg) {
      setValidationError(errorMsg);
      return;
    }
    setStep(step + 1);
  };

  const handlePrev = () => {
    setValidationError(null);
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errorMsg = validateStep();
    if (errorMsg) {
      setValidationError(errorMsg);
      return;
    }

    // Build Form Data for upload
    const formData = new FormData();
    if (selectedResourceId) {
      formData.append('resourceId', selectedResourceId);
    } else if (file) {
      formData.append('file', file);
    }
    formData.append('title', title);
    formData.append('subject', subject);
    formData.append('gradeClass', gradeClass);
    formData.append('dueDate', dueDate);
    formData.append('additionalInstructions', additionalInstructions);
    formData.append('questionTypes', JSON.stringify(questionTypes));

    const result = await createAssignment(formData);
    if (result) {
      router.push(`/assignments/${result._id}`);
    }
  };

  // Render current step form inputs
  const renderStepContent = () => {
    switch (step) {
      case 1: // File Upload Selector (matching Figma 2:9436 / 19:644)
        return (
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <h3 className="text-lg font-bold text-slate-800">Upload Reference Material</h3>
              <p className="text-sm text-slate-500 mt-1">Upload study material, chapters, or reference texts to base the assessment questions on (Optional).</p>
            </div>

            {/* Selector Tabs */}
            <div className="flex border-b border-[#E2E8F0] gap-6">
              <button
                type="button"
                onClick={() => { setUseLibrary(false); setSelectedResourceId(null); }}
                className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  !useLibrary
                    ? 'border-[#FF5623] text-[#FF5623]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Upload Reference File
              </button>
              <button
                type="button"
                onClick={() => { setUseLibrary(true); setFile(null); }}
                className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  useLibrary
                    ? 'border-[#FF5623] text-[#FF5623]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Select from Library
              </button>
            </div>

            {/* Render Upload File Zone */}
            {!useLibrary && (
              <>
                {/* Dropzone */}
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[220px] transition-colors duration-200 cursor-pointer ${
                    dragActive 
                      ? 'border-indigo-500 bg-indigo-50/30' 
                      : 'border-[#E2E8F0] hover:border-indigo-300 hover:bg-slate-50/50'
                  }`}
                >
                  <input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.txt"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 mb-4 border border-slate-200">
                    <Upload size={20} />
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-slate-700">Choose a file or drag & drop it here</p>
                    <p className="text-xs text-slate-400">PDF, TXT up to 10MB</p>
                  </div>

                  <label
                    htmlFor="file-upload"
                    className="mt-6 inline-flex items-center justify-center px-4 py-2 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    Browse Files
                  </label>
                </div>

                {/* Uploaded File Item */}
                {file && (
                  <div className="flex items-center justify-between p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-650">
                        <File size={18} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-slate-800 truncate max-w-[240px] sm:max-w-md">{file.name}</p>
                        <p className="text-xs text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Render Select from Library */}
            {useLibrary && (
              <div className="space-y-4">
                {loadingLibrary ? (
                  <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-[#E2E8F0] rounded-2xl min-h-[220px]">
                    <Loader2 className="animate-spin text-[#FF5623]" size={28} />
                    <p className="text-xs text-slate-455 mt-3 font-semibold">Loading reference materials...</p>
                  </div>
                ) : libraryResources.length === 0 ? (
                  <div className="text-center p-8 bg-slate-50 border border-dashed border-[#E2E8F0] rounded-2xl min-h-[220px] flex flex-col items-center justify-center">
                    <Library className="text-slate-400 mb-2" size={24} />
                    <p className="text-sm font-semibold text-slate-700">No resources in your library</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">Upload study materials in the "My Library" page first to select them here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
                    {libraryResources.map((resItem) => (
                      <div
                        key={resItem._id}
                        onClick={() => setSelectedResourceId(resItem._id)}
                        className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-all duration-200 ${
                          selectedResourceId === resItem._id
                            ? 'border-[#FF5623] bg-amber-50/10 shadow-sm'
                            : 'border-[#E2E8F0] hover:border-slate-350 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 ${
                            resItem.type === 'PDF'
                              ? 'bg-rose-50 border-rose-100 text-rose-600'
                              : 'bg-indigo-50 border-indigo-100 text-indigo-650'
                          }`}>
                            {resItem.type === 'PDF' ? <BookOpen size={16} /> : <File size={16} />}
                          </div>
                          <div className="text-left min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate pr-2" title={resItem.title}>
                              {resItem.title}
                            </p>
                            <p className="text-[10px] text-slate-450 mt-0.5 font-semibold">{resItem.subject} • {resItem.size}</p>
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center pr-1">
                          <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all ${
                            selectedResourceId === resItem._id
                              ? 'border-[#FF5623] bg-[#FF5623] text-white'
                              : 'border-slate-300 bg-white'
                          }`}>
                            {selectedResourceId === resItem._id && <Check size={10} strokeWidth={3} />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 2: // Assignment Details (matching Figma 19:644)
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Assignment Details</h3>
              <p className="text-sm text-slate-500 mt-1">Configure general metadata for the generated paper.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Assignment Title</label>
                <input
                  type="text"
                  placeholder="e.g. CBSE Term 1 Science Exam"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Subject */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g. Physics, Science, English"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Grade/Class */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Grade / Class</label>
                <input
                  type="text"
                  placeholder="e.g. Class 8, Grade 5"
                  value={gradeClass}
                  onChange={(e) => setGradeClass(e.target.value)}
                  className="px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Due Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Due Date</label>
                <div className="relative">
                  <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="DD-MM-YYYY"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Additional Instructions */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Additional Instructions</label>
              <textarea
                placeholder="e.g. Attempt all questions. Scientific calculator is allowed."
                rows={3}
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
                className="px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:border-indigo-500 focus:outline-none transition-colors resize-none"
              />
            </div>
          </div>
        );

      case 3: // Question Types configuration (matching Figma 19:644)
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Question Types</h3>
                <p className="text-sm text-slate-500 mt-1">Specify types, counts, and marks for AI question generation.</p>
              </div>
              <button
                type="button"
                onClick={handleAddQuestionType}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-indigo-200 hover:border-indigo-300 bg-indigo-50/50 text-indigo-600 rounded-xl text-xs font-bold transition-colors active:scale-[0.98]"
              >
                <Plus size={14} />
                Add Type
              </button>
            </div>

            {/* Question Types List */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {questionTypes.map((q, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-end gap-3 p-4 bg-slate-50 border border-[#E2E8F0] rounded-xl relative group">
                  {/* Select Question Type */}
                  <div className="flex-1 w-full flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Question Type</label>
                    <select
                      value={q.type}
                      onChange={(e) => handleQuestionTypeChange(idx, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm bg-white focus:border-indigo-500 focus:outline-none transition-colors"
                    >
                      <option value="Multiple Choice Questions">Multiple Choice Questions</option>
                      <option value="Short Answer Questions">Short Answer Questions</option>
                      <option value="Long Answer Questions">Long Answer Questions</option>
                      <option value="True / False Questions">True / False Questions</option>
                    </select>
                  </div>

                  {/* Question Count */}
                  <div className="w-full sm:w-28 flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">No. of Questions</label>
                    <input
                      type="number"
                      min={1}
                      value={q.count}
                      onChange={(e) => handleQuestionTypeChange(idx, 'count', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Marks per Question */}
                  <div className="w-full sm:w-28 flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Marks</label>
                    <input
                      type="number"
                      min={1}
                      value={q.marks}
                      onChange={(e) => handleQuestionTypeChange(idx, 'marks', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Delete Button */}
                  {questionTypes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestionType(idx)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100 mb-[1px]"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Total Aggregate Box */}
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-xl shadow-sm">
              <span className="text-xs font-semibold text-slate-400">Assignment Summary</span>
              <div className="flex gap-6 text-sm font-bold">
                <span>Total Questions : {totalQuestions}</span>
                <span>Total Marks : {totalMarks}</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render steps indicator
  const steps = [
    { number: 1, label: 'Upload Material' },
    { number: 2, label: 'Assignment Details' },
    { number: 3, label: 'Question Types' }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Create Assignment</h1>
          <p className="text-sm text-slate-500 mt-1">Design a customized, AI-generated assessment paper.</p>
        </div>

        {/* Steps Progress Header */}
        <div className="flex justify-between items-center mb-8 relative">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-slate-200 -z-10" />
          
          {steps.map((s) => {
            const isCompleted = s.number < step;
            const isCurrent = s.number === step;
            return (
              <div key={s.number} className="flex flex-col items-center">
                <div 
                  className={`w-9 h-9 rounded-full flex items-center justify-center border font-semibold text-xs transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                      : isCurrent 
                        ? 'bg-white border-indigo-600 text-indigo-600 ring-4 ring-indigo-50 shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check size={14} className="stroke-[2.5]" /> : s.number}
                </div>
                <span 
                  className={`text-[10px] sm:text-xs font-semibold mt-2.5 bg-[#F8FAFC] px-2 ${
                    isCurrent ? 'text-indigo-600 font-bold' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-white border border-[#E2E8F0] rounded-3xl p-6 md:p-8 shadow-sm">
          
          {/* Validation Alert */}
          {validationError && (
            <div className="flex items-center gap-2 p-3.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl mb-6 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              <span className="font-medium">{validationError}</span>
            </div>
          )}

          {/* Core Content */}
          <div className="min-h-[280px] mb-8">
            {renderStepContent()}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between border-t border-[#F1F5F9] pt-6">
            <button
              type="button"
              onClick={handlePrev}
              disabled={step === 1 || loading}
              className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                step === 1 
                  ? 'text-slate-300 bg-slate-50 border border-[#E2E8F0] cursor-not-allowed' 
                  : 'text-slate-700 bg-white border border-[#E2E8F0] hover:bg-slate-50 active:scale-[0.98]'
              }`}
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
              >
                Next
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Generate Paper
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Global Store Errors */}
        {error && (
          <div className="mt-4 flex items-center gap-2 p-4 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
