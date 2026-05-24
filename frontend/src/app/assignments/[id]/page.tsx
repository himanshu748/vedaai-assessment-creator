'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssignmentStore, IQuestion } from '../../../store/useAssignmentStore';
import { useSocket } from '../../../hooks/useSocket';
import DashboardLayout from '../../../components/DashboardLayout';
import { 
  Download, 
  RefreshCw, 
  ArrowLeft, 
  Check, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  CheckSquare, 
  HelpCircle,
  Clock,
  Award
} from 'lucide-react';

export default function AssignmentOutput({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  
  // Unwrap parameters
  const [unwrappedParams, setUnwrappedParams] = useState<{ id: string } | null>(null);
  useEffect(() => {
    params.then(setUnwrappedParams);
  }, [params]);

  const id = unwrappedParams?.id;

  // Global Store hooks
  const { 
    currentAssignment, 
    loading, 
    error, 
    isGenerating, 
    generationStep, 
    fetchAssignmentDetails, 
    regenerateAssignment 
  } = useAssignmentStore();

  // Socket connection hook
  useSocket(id);

  // Local state
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAssignmentDetails(id);
    }
  }, [id, fetchAssignmentDetails]);

  // Loading state of fetching metadata
  if (!id || (loading && !currentAssignment)) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 size={40} className="text-indigo-600 animate-spin" />
          <p className="text-slate-500 text-sm mt-4 font-medium">Loading details...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Error fetching state
  if (error && !currentAssignment) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] border border-rose-100 bg-rose-50/50 rounded-2xl p-6">
          <AlertCircle size={40} className="text-rose-500" />
          <h3 className="text-lg font-bold text-slate-800 mt-4">Failed to load assignment</h3>
          <p className="text-slate-500 text-sm mt-1">{error}</p>
          <button 
            onClick={() => fetchAssignmentDetails(id)}
            className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Try Again
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Guard: If we still don't have currentAssignment, return a fallback loading view
  if (!currentAssignment) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 size={40} className="text-indigo-600 animate-spin" />
          <p className="text-slate-500 text-sm mt-4 font-medium font-sans">Finding assignment...</p>
        </div>
      </DashboardLayout>
    );
  }

  // --- RENDERING SUB-VIEWS ---

  // 1. GENERATING / WAITING VIEW
  if (isGenerating || currentAssignment?.status === 'pending' || currentAssignment?.status === 'generating') {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto flex flex-col items-center justify-center min-h-[500px] text-center p-8 bg-white border border-[#E2E8F0] rounded-3xl shadow-sm">
          <div className="relative mb-8">
            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-full bg-indigo-100/60 scale-150 animate-ping -z-10" />
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Loader2 size={32} className="animate-spin" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Creating Question Paper...</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-sm">
            VedaAI is building a structured question paper. We format prompts, consult LLMs, and pre-render PDF assets.
          </p>

          {/* Progress Bar Mock */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-8 max-w-md">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full animate-[progress_10s_ease-in-out_infinite]" style={{ width: '85%' }} />
          </div>

          {/* Current worker status step message */}
          <div className="mt-6 p-3 bg-slate-50 border border-slate-200 rounded-xl max-w-md w-full text-xs text-slate-500 font-semibold flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{generationStep || 'Queued in background worker...'}</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 2. FAILED STATE VIEW
  if (currentAssignment?.status === 'failed') {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto flex flex-col items-center justify-center min-h-[500px] text-center p-8 bg-white border border-rose-100 rounded-3xl shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-6">
            <AlertCircle size={32} />
          </div>

          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Generation Failed</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-sm">
            An error occurred while compiling your assessment paper.
          </p>

          <div className="w-full p-4 mt-6 bg-rose-50 border border-rose-100 rounded-xl text-left text-xs font-mono text-rose-700 overflow-x-auto whitespace-pre-wrap">
            {currentAssignment.error || 'Unknown error occurred'}
          </div>

          <div className="flex gap-4 mt-8 w-full max-w-sm">
            <button
              onClick={() => router.push('/')}
              className="flex-1 px-4 py-2.5 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={() => regenerateAssignment(currentAssignment._id)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <RefreshCw size={14} />
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 3. COMPLETED OUTPUT VIEW
  const handleRegenerate = () => {
    if (currentAssignment && window.confirm('Are you sure you want to regenerate? This will overwrite the current questions.')) {
      regenerateAssignment(currentAssignment._id);
    }
  };

  const handleDownloadPDF = async () => {
    if (!currentAssignment) return;
    setIsDownloading(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/assignments/${currentAssignment._id}/pdf`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('PDF download request failed');
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${currentAssignment.title.replace(/\s+/g, '_')}_Question_Paper.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert('Failed to download PDF. Please try again.');
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  const getDifficultyColor = (difficulty: IQuestion['difficulty']) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Moderate':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Hard':
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <DashboardLayout>
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors self-start"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRegenerate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm active:scale-[0.98]"
          >
            <RefreshCw size={14} />
            Regenerate
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm active:scale-[0.98]"
          >
            {isDownloading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            Download PDF
          </button>
        </div>
      </div>

      {/* Main Exam Paper Container */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 md:p-12 shadow-sm font-sans relative overflow-hidden">
        {/* Decorative corner accents for paper effect */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-50 to-transparent pointer-events-none" />

        {/* Paper Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 uppercase tracking-tight">{currentAssignment.title}</h1>
          <div className="flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-wider mt-2.5">
            <span className="bg-violet-50 text-violet-600 px-2.5 py-1 rounded-lg">Subject: {currentAssignment.subject}</span>
            <span className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg">Class: {currentAssignment.gradeClass}</span>
          </div>
        </div>

        {/* Time Allowed & Max Marks Grid */}
        <div className="grid grid-cols-2 gap-4 py-3 border-y border-[#E2E8F0] text-xs md:text-sm font-bold text-slate-600 mb-6">
          <div className="flex items-center gap-1.5">
            <Clock size={16} className="text-slate-400" />
            <span>Time Allowed: 90 Minutes</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <Award size={16} className="text-slate-400" />
            <span>Maximum Marks: {currentAssignment.totalMarks}</span>
          </div>
        </div>

        {/* Student details input fields (exactly matching figma dotted lines layout) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 text-sm text-slate-600">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-slate-700 shrink-0">Name:</span>
            <div className="w-full border-b border-dashed border-slate-300 min-h-[20px] select-text focus:outline-none" contentEditable />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-slate-700 shrink-0">Roll Number:</span>
            <div className="w-full border-b border-dashed border-slate-300 min-h-[20px] select-text focus:outline-none" contentEditable />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-slate-700 shrink-0">Section:</span>
            <div className="w-full border-b border-dashed border-slate-300 min-h-[20px] select-text focus:outline-none" contentEditable />
          </div>
        </div>

        {/* General Instructions Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-10 text-xs md:text-sm text-slate-600">
          <h3 className="font-bold text-slate-800 mb-2">General Instructions:</h3>
          <ul className="list-decimal pl-4 space-y-1">
            <li>All questions are compulsory.</li>
            <li>Write your details clearly in the fields above.</li>
            <li>Subdivisions inside the question sections are indicated where necessary.</li>
            <li>Attempt the exam within the prescribed time limit.</li>
          </ul>
        </div>

        {/* Generated Sections List */}
        <div className="space-y-10">
          {currentAssignment.sections?.map((section, sIdx) => (
            <div key={sIdx} className="space-y-5">
              {/* Section Divider & Header */}
              <div className="border-b border-[#E2E8F0] pb-2">
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">{section.title}</h2>
                <p className="text-xs text-slate-400 font-medium italic mt-0.5">{section.instruction}</p>
              </div>

              {/* Questions inside Section */}
              <div className="space-y-6">
                {section.questions.map((question, qIdx) => (
                  <div key={qIdx} className="p-4 bg-white border border-[#E2E8F0] rounded-2xl relative hover:border-slate-300 transition-colors shadow-sm">
                    {/* Header: Question meta & badges */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <span className="font-bold text-slate-800 text-sm md:text-base">Q{qIdx + 1}</span>
                      
                      <div className="flex items-center gap-2">
                        {/* Difficulty badge */}
                        <span className={`inline-flex items-center px-2 py-0.5 border rounded-full text-[10px] font-bold ${getDifficultyColor(question.difficulty)}`}>
                          {question.difficulty}
                        </span>
                        
                        {/* Marks badge */}
                        <span className="inline-flex items-center px-2 py-0.5 border border-indigo-100 bg-indigo-50/50 text-indigo-700 rounded-full text-[10px] font-bold">
                          {question.marks} Marks
                        </span>
                      </div>
                    </div>

                    {/* Question text */}
                    <p className="text-slate-800 text-sm leading-relaxed mb-4 font-medium">{question.text}</p>

                    {/* Options list if MCQ */}
                    {question.options && question.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pl-2">
                        {question.options.map((option, oIdx) => (
                          <div 
                            key={oIdx}
                            className="flex items-center gap-2.5 p-2.5 border border-slate-100 bg-slate-50/50 rounded-xl text-xs md:text-sm text-slate-700"
                          >
                            <span className="w-5 h-5 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-500 shadow-sm shrink-0">
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="font-medium">{option}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Dotted horizontal line at paper bottom */}
        <div className="border-t border-dashed border-slate-300 pt-8 mt-12 text-center text-xs font-semibold text-slate-400 tracking-wider">
          --- END OF QUESTION PAPER ---
        </div>
      </div>

      {/* Answer Key Expandable Drawer */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl mt-6 p-6 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowAnswerKey(!showAnswerKey)}
          className="w-full flex items-center justify-between gap-4 font-bold text-slate-800 text-base md:text-lg transition-colors focus:outline-none"
        >
          <div className="flex items-center gap-2">
            <CheckSquare size={18} className="text-indigo-600" />
            <span>Answer Key & Detailed Solutions</span>
          </div>
          <div className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            {showAnswerKey ? <EyeOff size={18} /> : <Eye size={18} />}
          </div>
        </button>

        {showAnswerKey && (
          <div className="border-t border-[#F1F5F9] pt-6 mt-6 space-y-8 animate-[fadeIn_0.2s_ease-out]">
            {currentAssignment.sections?.map((section, sIdx) => (
              <div key={sIdx} className="space-y-4">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{section.title} Solutions</h3>
                
                <div className="space-y-4 pl-1">
                  {section.questions.map((question, qIdx) => (
                    <div key={qIdx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs md:text-sm">
                      <p className="font-bold text-slate-800">Q{qIdx + 1}: {question.text}</p>
                      <div className="mt-3 flex items-start gap-2.5 text-slate-600 bg-white border border-slate-100 rounded-xl p-3.5">
                        <HelpCircle size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-700">Answer:</span>{' '}
                          <span className="font-medium leading-relaxed">{question.answer}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
