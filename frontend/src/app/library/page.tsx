'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  Library, 
  Search, 
  FileText, 
  BookOpen, 
  Clock, 
  Download, 
  Trash2, 
  Plus, 
  FileCheck,
  ChevronRight,
  Filter
} from 'lucide-react';

interface LibraryItem {
  id: string;
  title: string;
  type: 'PDF' | 'TXT' | 'Syllabus' | 'Exam Template';
  size: string;
  uploadedAt: string;
  subject: string;
  downloads: number;
}

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');

  // Premium mock library resources
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([
    {
      id: 'lib-1',
      title: 'CBSE Grade 9 Chemistry Chapter 3: Atoms and Molecules',
      type: 'PDF',
      size: '2.4 MB',
      uploadedAt: 'May 23, 2026',
      subject: 'Chemistry',
      downloads: 48
    },
    {
      id: 'lib-2',
      title: 'Biology Class 10: Cell Structure & Function Notes',
      type: 'PDF',
      size: '1.8 MB',
      uploadedAt: 'May 20, 2026',
      subject: 'Biology',
      downloads: 32
    },
    {
      id: 'lib-3',
      title: 'Grade 8 Science Term 1 Syllabus Guide',
      type: 'Syllabus',
      size: '420 KB',
      uploadedAt: 'May 18, 2026',
      subject: 'General Science',
      downloads: 15
    },
    {
      id: 'lib-4',
      title: 'Standard CBSE High School Exam Header Template',
      type: 'Exam Template',
      size: '12 KB',
      uploadedAt: 'May 12, 2026',
      subject: 'Templates',
      downloads: 124
    },
    {
      id: 'lib-5',
      title: 'Physics Chapter 2: Force & Laws of Motion Reference',
      type: 'TXT',
      size: '150 KB',
      uploadedAt: 'May 10, 2026',
      subject: 'Physics',
      downloads: 27
    }
  ]);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this resource from the library?')) {
      setLibraryItems(libraryItems.filter(item => item.id !== id));
    }
  };

  const handleDownload = (title: string) => {
    alert(`Downloading "${title}" reference file...`);
  };

  const filteredItems = libraryItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || item.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const subjects = ['All', 'Chemistry', 'Biology', 'Physics', 'General Science', 'Templates'];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Resource Library</h1>
            <p className="text-sm text-slate-500 mt-1">Manage study materials, syllabus plans, and reference texts used for assessment generation.</p>
          </div>
          <button 
            onClick={() => alert('File upload dialog opened!')}
            className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-[#FF5623] hover:bg-[#E04B1E] text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm shadow-[#FF5623]/10 active:scale-[0.98]"
          >
            <Plus size={16} />
            Upload Resource
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search reference name or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-thin py-1">
            <Filter size={14} className="text-slate-400 shrink-0 hidden sm:block" />
            {subjects.map(subj => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
                  selectedSubject === subj
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>

        {/* Resources Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredItems.map(item => (
              <div 
                key={item.id} 
                className="bg-white border border-[#E2E8F0] rounded-2xl p-5 hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${
                    item.type === 'PDF' 
                      ? 'bg-rose-50 border-rose-100 text-rose-600'
                      : item.type === 'TXT'
                        ? 'bg-amber-50 border-amber-100 text-amber-600'
                        : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                  }`}>
                    {item.type === 'PDF' ? <BookOpen size={20} /> : <FileText size={20} />}
                  </div>
                  
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-violet-50 text-violet-700 px-2 py-0.5 rounded">
                        {item.subject}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                        {item.type}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 line-clamp-1 leading-snug">{item.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {item.uploadedAt}
                      </span>
                      <span>{item.size}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#F1F5F9] pt-4 mt-5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <FileCheck size={14} className="text-emerald-500" />
                    <span>{item.downloads} assessments generated</span>
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDownload(item.title)}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100"
                      title="Download reference"
                    >
                      <Download size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                      title="Delete reference"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white border border-[#E2E8F0] rounded-3xl p-8 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-400 mx-auto mb-4">
              <Library size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-850">No matches found</h3>
            <p className="text-xs text-slate-500 mt-1.5">We couldn't find any resources matching your search queries. Try adjusting your filters or search keywords.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
