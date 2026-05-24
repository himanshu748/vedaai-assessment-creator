'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface LibraryItem {
  _id: string;
  title: string;
  type: 'PDF' | 'TXT' | 'Syllabus' | 'Exam Template';
  size: string;
  uploadedAt: string;
  subject: string;
  downloads: number;
  fileTextContext: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch resources from backend
  const fetchResources = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/resources`);
      if (!res.ok) {
        throw new Error('Failed to fetch resource library items');
      }
      const data = await res.json();
      setLibraryItems(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while loading the library.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource from the library?')) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/resources/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        throw new Error('Failed to delete resource');
      }
      setLibraryItems(prev => prev.filter(item => item._id !== id));
    } catch (err: any) {
      alert(err.message || 'Error deleting resource');
    }
  };

  const handleDownload = (item: LibraryItem) => {
    try {
      // Generate a downloadable Blob from the text context
      const blob = new Blob([item.fileTextContext], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Use original filename or title with .txt suffix
      const filename = item.title.endsWith('.pdf') || item.title.endsWith('.txt') 
        ? item.title 
        : `${item.title}.txt`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download resource context');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    // Simple validation
    const mime = file.type;
    if (mime !== 'application/pdf' && !mime.startsWith('text/') && !file.name.endsWith('.pdf') && !file.name.endsWith('.txt')) {
      alert('Unsupported file type. Only PDF and text files are supported.');
      return;
    }

    const subject = prompt(
      `Enter the subject/category for "${file.name}" (e.g. Chemistry, Biology, Physics, General Science, Templates):`,
      'Chemistry'
    );

    if (subject === null) return; // Cancelled
    if (!subject.trim()) {
      alert('Subject is required to upload a resource.');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subject', subject.trim());

      const res = await fetch(`${API_BASE}/api/resources`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to upload resource');
      }

      const newResource = await res.json();
      setLibraryItems(prev => [newResource, ...prev]);
      alert('Resource uploaded successfully to the library!');
    } catch (err: any) {
      alert(err.message || 'Error uploading resource');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">My Library</h1>
            <p className="text-sm text-slate-500 mt-1">Manage study materials, syllabus plans, and reference texts used for assessment generation.</p>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            accept=".pdf,.txt"
            className="hidden"
          />

          <button 
            onClick={handleUploadClick}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-[#FF5623] hover:bg-[#E04B1E] disabled:bg-slate-350 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm shadow-[#FF5623]/10 active:scale-[0.98]"
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>Upload Resource</span>
              </>
            )}
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

        {/* Loading and Error states */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#E2E8F0] rounded-3xl">
            <Loader2 size={36} className="text-[#FF5623] animate-spin" />
            <p className="text-sm font-semibold text-slate-500 mt-4">Loading library items...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8 bg-rose-50 border border-rose-100 rounded-3xl text-center max-w-md mx-auto">
            <AlertCircle size={36} className="text-rose-500" />
            <h3 className="text-base font-bold text-slate-800 mt-4">Failed to load library</h3>
            <p className="text-xs text-slate-550 mt-1.5">{error}</p>
            <button 
              onClick={fetchResources}
              className="mt-5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all"
            >
              Retry
            </button>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredItems.map(item => (
              <div 
                key={item._id} 
                className="bg-white border border-[#E2E8F0] rounded-2xl p-5 hover:border-slate-350 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
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
                    <h3 className="text-sm font-bold text-slate-800 line-clamp-1 leading-snug" title={item.title}>
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(item.uploadedAt).toLocaleDateString(undefined, { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
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
                      onClick={() => handleDownload(item)}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100 cursor-pointer"
                      title="Download reference context"
                    >
                      <Download size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100 cursor-pointer"
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
