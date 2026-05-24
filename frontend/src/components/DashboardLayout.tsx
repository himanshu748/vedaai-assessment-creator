'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  FileText, 
  Library, 
  Wand2, 
  Menu, 
  X, 
  GraduationCap,
  Users
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

const sidebarItems: SidebarItem[] = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'My Groups', href: '/groups', icon: Users },
  { name: 'Assignments', href: '/assignments', icon: FileText },
  { name: 'AI Teacher\'s Toolkit', href: '/ai-toolkit', icon: Wand2 },
  { name: 'My Library', href: '/library', icon: Library },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/' && pathname !== '/') return false;
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#E2E8F0] px-4 py-6 shrink-0">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-200">
            <GraduationCap size={20} className="stroke-[2.5]" />
          </div>
          <span className="font-sans font-bold text-xl tracking-tight text-slate-800">
            Veda<span className="bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent">AI</span>
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1">
          {sidebarItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-50/50'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon size={18} className={`transition-colors duration-200 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile / Status Mock */}
        <div className="border-t border-[#F1F5F9] pt-4 mt-auto">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-semibold text-slate-600 border border-slate-200">
              T
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 leading-tight">Teacher Account</p>
              <p className="text-xs text-slate-400">Delhi Public School</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Sidebar for Mobile */}
      <div className="md:hidden">
        {/* Mobile Header Bar */}
        <header className="flex items-center justify-between px-4 py-4 bg-white border-b border-[#E2E8F0] fixed top-0 left-0 right-0 z-40">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-sm">
              <GraduationCap size={18} className="stroke-[2.5]" />
            </div>
            <span className="font-sans font-bold text-lg text-slate-800">
              Veda<span className="bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent">AI</span>
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </header>

        {/* Mobile Slide-out Drawer */}
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <nav className="fixed top-[65px] left-0 bottom-0 w-64 bg-white border-r border-[#E2E8F0] px-4 py-6 z-50 flex flex-col shadow-xl transition-transform duration-300">
              <div className="flex-1 space-y-1">
                {sidebarItems.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        active
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      <Icon size={18} className={active ? 'text-indigo-600' : 'text-slate-400'} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>

              {/* Profile in drawer */}
              <div className="border-t border-[#F1F5F9] pt-4 mt-auto">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-semibold text-slate-600 border border-slate-200">
                    T
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 leading-tight">Teacher Account</p>
                    <p className="text-xs text-slate-400">Delhi Public School</p>
                  </div>
                </div>
              </div>
            </nav>
          </>
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen pt-[65px] md:pt-0 overflow-x-hidden">
        <div className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
