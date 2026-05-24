'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAssignmentStore, IAssignment } from '../store/useAssignmentStore';
import DashboardLayout from '../components/DashboardLayout';
import { 
  Plus, 
  Search, 
  Filter, 
  BookOpen, 
  Calendar, 
  ArrowRight,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function DashboardHome() {
  const { assignments, loading, error, fetchAssignments } = useAssignmentStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && a.status === statusFilter;
  });

  const getStatusBadge = (status: IAssignment['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} />
            Ready
          </span>
        );
      case 'generating':
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <Loader2 size={12} className="animate-spin" />
            Generating
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle size={12} />
            Failed
          </span>
        );
    }
  };

  return (
    <DashboardLayout>
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Assignments Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Manage, generate, and view school assignment question papers.</p>
        </div>
        {assignments.length > 0 && (
          <Link
            href="/create"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow active:scale-[0.98]"
          >
            <Plus size={16} />
            Create Assignment
          </Link>
        )}
      </div>

      {loading && assignments.length === 0 ? (
        // Loading State
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 size={40} className="text-indigo-600 animate-spin" />
          <p className="text-slate-500 text-sm mt-4 font-medium">Loading assignments...</p>
        </div>
      ) : error ? (
        // Error State
        <div className="flex flex-col items-center justify-center min-h-[400px] border border-rose-100 bg-rose-50/50 rounded-2xl p-6">
          <AlertCircle size={40} className="text-rose-500" />
          <h3 className="text-lg font-bold text-slate-800 mt-4">Failed to load assignments</h3>
          <p className="text-slate-500 text-sm mt-1 text-center max-w-md">{error}</p>
          <button 
            onClick={fetchAssignments}
            className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : assignments.length === 0 ? (
        // 0 State Screen (matching Dashboard 19:309)
        <div className="flex flex-col items-center justify-center min-h-[500px] bg-white border border-[#E2E8F0] rounded-3xl p-8 md:p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 border border-indigo-100 shadow-sm">
            <BookOpen size={28} className="stroke-[2]" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">No assignments yet</h2>
          <p className="text-slate-500 text-sm mt-3 max-w-md leading-relaxed">
            Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.
          </p>
          <Link
            href="/create"
            className="mt-8 inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm active:scale-[0.98]"
          >
            Create Your First Assignment
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        // List View (matching Dashboard 19:452)
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 border border-[#E2E8F0] rounded-2xl shadow-sm">
            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search Name or Subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#E2E8F0] rounded-xl text-sm bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>
            
            {/* Filter Status */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={16} className="text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2 border border-[#E2E8F0] rounded-xl text-sm bg-white focus:border-indigo-500 focus:outline-none transition-colors text-slate-600 font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Ready</option>
                <option value="generating">Generating</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Assignments Grid/List */}
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-12 bg-white border border-[#E2E8F0] rounded-2xl">
              <p className="text-slate-400 text-sm font-medium">No assignments match your search or filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAssignments.map((assignment) => (
                <Link
                  key={assignment._id}
                  href={`/assignments/${assignment._id}`}
                  className="group block bg-white border border-[#E2E8F0] hover:border-indigo-300 rounded-2xl p-6 transition-all duration-200 hover:shadow-md hover:shadow-indigo-50/50 active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold tracking-wider text-violet-600 uppercase bg-violet-50 px-2.5 py-1 rounded-lg">
                        {assignment.subject}
                      </span>
                      <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors mt-2">
                        {assignment.title}
                      </h3>
                      <p className="text-xs text-slate-400">Class: {assignment.gradeClass}</p>
                    </div>
                    {getStatusBadge(assignment.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-[#F1F5F9] pt-4 text-xs font-medium text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-slate-400" />
                      <span>Due: {assignment.dueDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <Clock size={14} className="text-slate-400" />
                      <span>{assignment.totalQuestions} Questions • {assignment.totalMarks} Marks</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
