import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ChatInterface from '../components/ChatInterface';
import { assetService } from '../services/api';
import { 
  ArrowLeft, 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Video, 
  Sparkles, 
  Tag, 
  Download, 
  ExternalLink,
  Layers,
  Copy,
  CheckCircle2,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function WorkspacePage() {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('metadata'); // 'metadata' | 'chat' | 'extracted'
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadAsset() {
      try {
        setLoading(true);
        const res = await assetService.get(id);
        setAsset(res.data.asset);
      } catch (err) {
        console.error('Failed to load asset details:', err);
        setError(err.response?.data?.error || 'Asset not found or unauthorized.');
      } finally {
        setLoading(false);
      }
    }
    loadAsset();
  }, [id]);

  const fileUrl = id ? assetService.getFileUrl(id) : '';

  const copyExtractedText = () => {
    if (!asset?.extracted_text) return;
    navigator.clipboard.writeText(asset.extracted_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderMediaViewer = () => {
    if (!asset) return null;
    const mod = asset.modality.toLowerCase();

    if (mod === 'image') {
      return (
        <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 flex items-center justify-center min-h-[300px]">
          <img
            src={fileUrl}
            alt={asset.title}
            className="max-h-[450px] w-auto object-contain rounded-xl shadow-lg"
          />
        </div>
      );
    }

    if (mod === 'audio') {
      return (
        <div className="rounded-2xl bg-slate-950 p-6 border border-slate-800 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Music className="w-8 h-8" />
          </div>
          <p className="text-xs font-semibold text-slate-200">{asset.file_name}</p>
          <audio controls className="w-full max-w-md">
            <source src={fileUrl} type={asset.mime_type} />
            Your browser does not support audio playback.
          </audio>
        </div>
      );
    }

    if (mod === 'video') {
      return (
        <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 flex items-center justify-center">
          <video controls className="max-h-[450px] w-full rounded-xl shadow-lg">
            <source src={fileUrl} type={asset.mime_type} />
            Your browser does not support video playback.
          </video>
        </div>
      );
    }

    // Documents
    return (
      <div className="rounded-2xl bg-slate-950 p-6 border border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
          <FileText className="w-8 h-8" />
        </div>
        <h4 className="text-sm font-semibold text-slate-200">{asset.file_name}</h4>
        <p className="text-xs text-slate-400">
          Modality: {asset.modality.toUpperCase()} • Type: {asset.mime_type}
        </p>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Open Raw File in New Tab</span>
        </a>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col text-slate-100">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-8 overflow-y-auto space-y-6">
          {/* Back link */}
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
              <p className="text-xs text-slate-400">Loading asset workspace...</p>
            </div>
          ) : error || !asset ? (
            <div className="p-8 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error || 'Asset not found.'}</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Asset Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono uppercase bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded-md font-semibold">
                      {asset.modality}
                    </span>
                    <span className="text-xs text-slate-500">• Ingested {new Date(asset.created_at).toLocaleDateString()}</span>
                  </div>
                  <h1 className="text-xl font-bold text-white">{asset.title}</h1>
                  <p className="text-xs text-slate-400 font-mono truncate">{asset.file_name}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <a
                    href={fileUrl}
                    download={asset.file_name}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                  <Link
                    to="/chat"
                    className="px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-brand-500/20 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Cross-Modal Chat</span>
                  </Link>
                </div>
              </div>

              {/* Layout: Media Viewer (Left) & Deep Insights / Chat (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Media Column */}
                <div className="lg:col-span-5 space-y-4">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Asset Visual & Media Stream
                  </h3>
                  {renderMediaViewer()}

                  {/* Quick Metadata Box */}
                  <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Sentiment Rating:</span>
                      <span className="text-white font-medium">{asset.metadata?.sentiment || 'Technical'}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>File Size:</span>
                      <span className="text-white font-medium">
                        {(parseInt(asset.file_size, 10) / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>MIME Type:</span>
                      <span className="text-white font-mono text-[11px]">{asset.mime_type}</span>
                    </div>
                  </div>
                </div>

                {/* Insights / Chat Column */}
                <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
                  <div>
                    {/* Tabs */}
                    <div className="flex items-center space-x-3 border-b border-slate-800 pb-3 mb-4">
                      <button
                        onClick={() => setActiveTab('metadata')}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${
                          activeTab === 'metadata'
                            ? 'bg-brand-500 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        AI Executive Summary
                      </button>
                      <button
                        onClick={() => setActiveTab('extracted')}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${
                          activeTab === 'extracted'
                            ? 'bg-brand-500 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        OCR / Extracted Content
                      </button>
                      <button
                        onClick={() => setActiveTab('chat')}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${
                          activeTab === 'chat'
                            ? 'bg-brand-500 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        Targeted OmniChat
                      </button>
                    </div>

                    {/* Tab 1: AI Summary & Entities */}
                    {activeTab === 'metadata' && (
                      <div className="space-y-5">
                        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                          <h4 className="text-xs font-semibold text-brand-400 flex items-center space-x-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Executive Summary (Gemini 2.5 Flash)</span>
                          </h4>
                          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                            {asset.ai_summary || 'No summary available.'}
                          </p>
                        </div>

                        {/* Extracted Key Topics */}
                        {asset.metadata?.keyTopics && asset.metadata.keyTopics.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-slate-300">Key Thematic Topics</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {asset.metadata.keyTopics.map((topic, i) => (
                                <span key={i} className="text-xs bg-slate-800 text-slate-200 px-3 py-1 rounded-xl flex items-center space-x-1.5">
                                  <Tag className="w-3 h-3 text-brand-400" />
                                  <span>{topic}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Extracted Entities */}
                        {asset.metadata?.extractedEntities && asset.metadata.extractedEntities.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-slate-300">Identified Entities</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {asset.metadata.extractedEntities.map((entity, i) => (
                                <span key={i} className="text-xs bg-cyan-950/50 text-cyan-300 border border-cyan-800/40 px-3 py-1 rounded-xl">
                                  {entity}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 2: OCR / Extracted Content */}
                    {activeTab === 'extracted' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">Verbatim text & OCR output</span>
                          <button
                            onClick={copyExtractedText}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center space-x-1 transition-colors"
                          >
                            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copied ? 'Copied' : 'Copy Text'}</span>
                          </button>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-950 font-mono text-xs text-slate-300 max-h-[400px] overflow-y-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
                          {asset.extracted_text || 'No verbatim text was parsed for this asset.'}
                        </div>
                      </div>
                    )}

                    {/* Tab 3: Embedded Chat */}
                    {activeTab === 'chat' && (
                      <div className="h-[480px]">
                        <ChatInterface preselectedAssetId={asset.id} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

