import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import FileUploadZone from '../components/FileUploadZone';
import AssetCard from '../components/AssetCard';
import { 
  UploadCloud, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Video 
} from 'lucide-react';

export default function UploadPage() {
  const [recentlyUploaded, setRecentlyUploaded] = useState([]);
  const navigate = useNavigate();

  const handleUploadComplete = (newAssets) => {
    if (newAssets && newAssets.length > 0) {
      setRecentlyUploaded((prev) => [...newAssets, ...prev]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col text-slate-100">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-8 overflow-y-auto space-y-8 max-w-5xl mx-auto">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Multimodal Ingestion Portal</h1>
            <p className="text-xs text-slate-400 mt-1">
              Upload documents, high-resolution visuals, audio recordings, or videos for automated OCR, transcription, and semantic indexing.
            </p>
          </div>

          {/* Upload Component */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <FileUploadZone onUploadComplete={handleUploadComplete} />
          </div>

          {/* Advisory & Modality Guidelines */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-semibold text-brand-400">
                <FileText className="w-4 h-4" />
                <span>Text & Documents</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                PDF contracts, DOCX briefings, TXT, CSV. Automatically parses layouts and extracts entities.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400">
                <ImageIcon className="w-4 h-4" />
                <span>Visual Artifacts</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Invoices, architectural blueprints, screenshots. Gemini OCR extracts numbers, tables, and graphs.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400">
                <Music className="w-4 h-4" />
                <span>Audio Intelligence</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                MP3, WAV voice memos, meetings, interviews. Generates timestamped verbatim transcripts.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-semibold text-purple-400">
                <Video className="w-4 h-4" />
                <span>Video Streams</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                MP4, AVI product demos, webinars, surveillance clips. Synthesizes visual and speech cues.
              </p>
            </div>
          </div>

          {/* Recently Uploaded In This Session */}
          {recentlyUploaded.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Ingested In Current Session ({recentlyUploaded.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentlyUploaded.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

