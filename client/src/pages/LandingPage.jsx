import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  ArrowRight, 
  Layers, 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Video, 
  ShieldCheck, 
  Database, 
  Cpu, 
  Zap, 
  CheckCircle,
  BarChart3,
  Search
} from 'lucide-react';
import Navbar from '../components/Navbar';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-28 max-w-6xl mx-auto text-center flex-1 flex flex-col items-center justify-center">
        {/* Glow ambient effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-brand-600/20 via-cyan-500/15 to-transparent blur-[120px] pointer-events-none rounded-full" />

        {/* Pill Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-8 animate-in fade-in duration-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Powered by Google Gemini 2.5 Multimodal Architecture</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.1] mb-6">
          One Intelligent Workspace for <br className="hidden sm:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 via-cyan-300 to-indigo-400">
            All Your Heterogeneous Data
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
          Ingest, cross-examine, and extract verifiable intelligence across text contracts, scanned invoices, audio recordings, and video streams with citations grounded in PostgreSQL.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            to={isAuthenticated ? "/dashboard" : "/register"}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 text-white font-semibold text-sm shadow-xl shadow-brand-500/25 flex items-center justify-center space-x-2.5 transition-all transform hover:-translate-y-0.5"
          >
            <span>{isAuthenticated ? "Enter Workspace" : "Get Started Now"}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to={isAuthenticated ? "/chat" : "/login"}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white font-semibold text-sm flex items-center justify-center space-x-2 transition-all"
          >
            <span>{isAuthenticated ? "Launch OmniChat" : "Sign In to Account"}</span>
          </Link>
        </div>

        {/* Modality Chips Bar */}
        <div className="mt-16 pt-8 border-t border-slate-800/80 w-full max-w-3xl flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-400">
          <span className="flex items-center space-x-2 bg-slate-900/60 px-3.5 py-1.5 rounded-xl border border-slate-800">
            <FileText className="w-4 h-4 text-brand-400" />
            <span>PDF, DOCX, TXT</span>
          </span>
          <span className="flex items-center space-x-2 bg-slate-900/60 px-3.5 py-1.5 rounded-xl border border-slate-800">
            <ImageIcon className="w-4 h-4 text-indigo-400" />
            <span>PNG, JPEG, Scans</span>
          </span>
          <span className="flex items-center space-x-2 bg-slate-900/60 px-3.5 py-1.5 rounded-xl border border-slate-800">
            <Music className="w-4 h-4 text-emerald-400" />
            <span>MP3, WAV Audio</span>
          </span>
          <span className="flex items-center space-x-2 bg-slate-900/60 px-3.5 py-1.5 rounded-xl border border-slate-800">
            <Video className="w-4 h-4 text-purple-400" />
            <span>MP4, AVI Video</span>
          </span>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="px-6 py-20 bg-slate-950/60 border-t border-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Engineered for Enterprise Multimodal Operations
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Eliminate information silos with unified ingestion, cross-modal reasoning, and automated report synthesis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-brand-500/30 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white">Cross-Modal Reasoning</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ask questions that correlate statements from an audio interview with data points from an invoice image and clauses in a PDF contract.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white">Dynamic Synthesis Reports</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate publication-grade Markdown executive summaries, compliance checklists, and structured tables with export to JSON or PDF.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-indigo-500/30 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white">RLS Data Isolation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Strict user scoping, parameterized SQL queries, JWT cryptographic verification, and bcrypt salt rounds of 12 protect corporate assets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500">
        <p>OmniMind AI (OmniDoc AI) — Enterprise Multimodal Intelligence & Operational Workspace.</p>
      </footer>
    </div>
  );
}

