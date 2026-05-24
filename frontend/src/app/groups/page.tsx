'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  BookOpen, 
  Clock, 
  ArrowRight,
  UserPlus,
  MoreVertical,
  GraduationCap
} from 'lucide-react';

interface GroupItem {
  id: string;
  name: string;
  gradeClass: string;
  subject: string;
  studentsCount: number;
  activeAssignments: number;
  lastActive: string;
}

export default function GroupsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All');

  const [groups, setGroups] = useState<GroupItem[]>([
    {
      id: 'grp-1',
      name: 'Class 9 Science Batch A',
      gradeClass: 'Class 9',
      subject: 'Science',
      studentsCount: 32,
      activeAssignments: 2,
      lastActive: '2 hours ago'
    },
    {
      id: 'grp-2',
      name: 'Class 10 Biology Honours',
      gradeClass: 'Class 10',
      subject: 'Biology',
      studentsCount: 28,
      activeAssignments: 1,
      lastActive: '1 day ago'
    },
    {
      id: 'grp-3',
      name: 'Class 8 Physics Core',
      gradeClass: 'Class 8',
      subject: 'Physics',
      studentsCount: 35,
      activeAssignments: 0,
      lastActive: '3 days ago'
    },
    {
      id: 'grp-4',
      name: 'Class 9 Chemistry Advanced',
      gradeClass: 'Class 9',
      subject: 'Chemistry',
      studentsCount: 24,
      activeAssignments: 3,
      lastActive: '5 hours ago'
    }
  ]);

  const handleCreateGroup = () => {
    alert('Create group dialog opened! You can now invite students to join via a sharing link.');
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          group.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = selectedGrade === 'All' || group.gradeClass === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  const grades = ['All', 'Class 8', 'Class 9', 'Class 10'];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">My Groups</h1>
            <p className="text-sm text-slate-500 mt-1">Organize student classrooms, manage batches, and monitor assignment distributions.</p>
          </div>
          <button 
            onClick={handleCreateGroup}
            className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-[#FF5623] hover:bg-[#E04B1E] text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm shadow-[#FF5623]/10 active:scale-[0.98]"
          >
            <Plus size={16} />
            Create Group
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search group name or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-thin py-1">
            <Filter size={14} className="text-slate-400 shrink-0 hidden sm:block" />
            {grades.map(grade => (
              <button
                key={grade}
                onClick={() => setSelectedGrade(grade)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
                  selectedGrade === grade
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {grade}
              </button>
            ))}
          </div>
        </div>

        {/* Groups Grid */}
        {filteredGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredGroups.map(group => (
              <div 
                key={group.id} 
                className="bg-white border border-[#E2E8F0] rounded-2xl p-5 hover:border-slate-350 hover:shadow-md transition-all duration-205 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-[#FF5623] flex items-center justify-center shrink-0">
                        <Users size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 line-clamp-1 leading-snug">{group.name}</h3>
                        <p className="text-xs text-slate-450 mt-0.5">{group.gradeClass} • {group.subject}</p>
                      </div>
                    </div>
                    
                    <button className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </div>

                  {/* Info stats */}
                  <div className="grid grid-cols-2 gap-4 mt-6 bg-slate-50/50 border border-slate-100/50 p-4 rounded-xl">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Students</span>
                      <span className="text-lg font-extrabold text-slate-800 mt-0.5 block">{group.studentsCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Active Exams</span>
                      <span className="text-lg font-extrabold text-slate-800 mt-0.5 block">{group.activeAssignments}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#F1F5F9] pt-4 mt-5 flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    Active {group.lastActive}
                  </span>
                  
                  <button 
                    onClick={() => alert(`Navigating to group details for ${group.name}...`)}
                    className="inline-flex items-center gap-1 text-[#FF5623] hover:text-[#E04B1E] font-bold transition-colors cursor-pointer"
                  >
                    <span>View Group</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white border border-[#E2E8F0] rounded-3xl p-8 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-400 mx-auto mb-4">
              <Users size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-850">No groups found</h3>
            <p className="text-xs text-slate-500 mt-1.5">Create your first group to manage your classrooms and distribute question paper assessments easily.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
