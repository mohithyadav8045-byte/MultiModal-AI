import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  MessageSquare, 
  FileText, 
  Sparkles,
  Database,
  Layers,
  HelpCircle
} from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload & Ingest', path: '/upload', icon: UploadCloud },
    { name: 'OmniChat AI', path: '/chat', icon: MessageSquare },
    { name: 'Reports & Synthesis', path: '/reports', icon: FileText },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-[#0B0F19] flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 select-none">
      <div className="p-4 space-y-6">
        {/* Navigation list */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Workspace
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Multimodal Modalities Breakdown Box */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80">
          <div className="flex items-center space-x-2 mb-2 text-xs font-semibold text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Supported Modalities</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-400 font-mono">
            <span className="bg-slate-800/60 px-2 py-1 rounded text-center">PDF/DOCX</span>
            <span className="bg-slate-800/60 px-2 py-1 rounded text-center">PNG/JPEG</span>
            <span className="bg-slate-800/60 px-2 py-1 rounded text-center">MP3/WAV</span>
            <span className="bg-slate-800/60 px-2 py-1 rounded text-center">MP4/AVI</span>
          </div>
        </div>
      </div>

      {/* Bottom Status Card */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center space-x-1.5">
            <Database className="w-3.5 h-3.5 text-brand-400" />
            <span>PostgreSQL Vector DB</span>
          </span>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Online
          </span>
        </div>
      </div>
    </aside>
  );
}

