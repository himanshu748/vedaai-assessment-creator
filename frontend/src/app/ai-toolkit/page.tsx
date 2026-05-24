'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  Wand2, 
  Settings, 
  HelpCircle, 
  Sparkles, 
  Sliders, 
  ChevronRight, 
  Check, 
  RefreshCw,
  FileQuestion,
  Clipboard,
  SlidersHorizontal
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  type: string;
  icon: React.ComponentType<any>;
}

export default function AIToolkitPage() {
  const [model, setModel] = useState('meta-llama/Meta-Llama-3-8B-Instruct');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [activeTab, setActiveTab] = useState('templates');

  const templates: Template[] = [
    {
      id: 'temp-1',
      name: 'Question Paper Compiler',
      description: 'Generates structured assessments complete with multiple sections, difficulty grading, and answers.',
      type: 'Assessment',
      icon: FileQuestion
    },
    {
      id: 'temp-2',
      name: 'Marking Rubric Assistant',
      description: 'Creates professional criteria grids for essay grading, projects, and lab experiments.',
      type: 'Grading',
      icon: Clipboard
    },
    {
      id: 'temp-3',
      name: 'Syllabus Quiz Creator',
      description: 'Transforms syllabus topics into rapid five-minute classroom entry/exit tickets.',
      type: 'Revision',
      icon: Sparkles
    }
  ];

  const handleApplySettings = () => {
    alert('Settings applied successfully! These parameters will be used for your next assessment creation.');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">AI Toolkit</h1>
          <p className="text-sm text-slate-500 mt-1">Configure models, generation parameters, and template systems powering VedaAI's assessment engine.</p>
        </div>

        {/* Dashboard Tabs */}
        <div className="flex border-b border-[#E2E8F0] gap-6">
          <button
            onClick={() => setActiveTab('templates')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'templates'
                ? 'border-[#FF5623] text-[#FF5623]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Generation Templates
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-[#FF5623] text-[#FF5623]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Engine Configuration
          </button>
        </div>

        {/* Templates view */}
        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {templates.map(temp => {
              const Icon = temp.icon;
              return (
                <div 
                  key={temp.id} 
                  className="bg-white border border-[#E2E8F0] rounded-2xl p-6 hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <Icon size={18} />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                        {temp.type}
                      </span>
                      <h3 className="text-sm font-bold text-slate-850 mt-1">{temp.name}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{temp.description}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => alert(`Activated template: ${temp.name}`)}
                    className="mt-6 w-full flex items-center justify-center gap-1.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors active:scale-[0.98]"
                  >
                    <span>Use Template</span>
                    <ChevronRight size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Engine Settings view */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Form */}
            <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
              <div className="flex items-center gap-2 pb-4 border-b border-[#F1F5F9]">
                <Settings size={18} className="text-slate-400" />
                <h2 className="text-base font-bold text-slate-800">Parameters Configuration</h2>
              </div>

              {/* LLM Model Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <span>Hugging Face LLM Model</span>
                  <HelpCircle size={12} className="text-slate-400 cursor-pointer" title="LLM model used for serverless inference" />
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="px-3.5 py-2.5 border border-[#E2E8F0] rounded-xl text-sm bg-white focus:border-indigo-500 focus:outline-none transition-colors"
                >
                  <option value="meta-llama/Meta-Llama-3-8B-Instruct">meta-llama/Meta-Llama-3-8B-Instruct (Recommended)</option>
                  <option value="mistralai/Mistral-7B-Instruct-v0.2">mistralai/Mistral-7B-Instruct-v0.2</option>
                  <option value="google/gemma-7b-it">google/gemma-7b-it</option>
                </select>
              </div>

              {/* Temperature Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                    <span>Temperature</span>
                    <HelpCircle size={12} className="text-slate-400 cursor-pointer" title="Higher values make output more creative, lower values more deterministic" />
                  </label>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.5"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 bg-slate-100 rounded-lg appearance-none h-1.5 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>Deterministic (0.1)</span>
                  <span>Creative (1.5)</span>
                </div>
              </div>

              {/* Max Tokens Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <span>Max Tokens</span>
                  <HelpCircle size={12} className="text-slate-400 cursor-pointer" title="Max tokens allowed for LLM response generation" />
                </label>
                <input
                  type="number"
                  min={512}
                  max={4096}
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="px-3.5 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="border-t border-[#F1F5F9] pt-6 flex justify-end">
                <button
                  onClick={handleApplySettings}
                  className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
                >
                  <SlidersHorizontal size={14} />
                  Apply Parameters
                </button>
              </div>
            </div>

            {/* Sidebar Context */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4 text-slate-600 text-xs sm:text-sm">
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
                <Wand2 size={16} className="text-[#FF5623]" />
                <span>AI Core Architecture</span>
              </h3>
              <p className="leading-relaxed">
                VedaAI targets Hugging Face's serverless inference endpoints to run assessment generation jobs. The worker automatically serializes structured schemas and injects file context into prompts.
              </p>
              <div className="bg-white border border-slate-150 p-4.5 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">Offline Fail-Safe Enabled</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">The pipeline auto-falls back to context-aware local template generators in case of rate-limiting.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
