import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import AssetCard from '../components/AssetCard';
import { assetService } from '../services/api';
import { 
  Layers, 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Video, 
  Search, 
  UploadCloud, 
  MessageSquare, 
  TrendingUp, 
  Database,
  Filter,
  Loader2
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModality, setSelectedModality] = useState('all');

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [statsRes, assetsRes] = await Promise.all([
          assetService.getStats(),
          assetService.list()
        ]);
        setStats(statsRes.data.stats);
        setAssets(assetsRes.data.assets || []);
        setFilteredAssets(assetsRes.data.assets || []);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // Filter effect
  useEffect(() => {
    let result = [...assets];
    if (selectedModality !== 'all') {
      result = result.filter(a => a.modality.toLowerCase() === selectedModality.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(a => 
        a.title.toLowerCase().includes(q) ||
        a.file_name.toLowerCase().includes(q) ||
        (a.ai_summary && a.ai_summary.toLowerCase().includes(q))
      );
    }
    setFilteredAssets(result);
  }, [searchQuery, selectedModality, assets]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this asset from the repository?')) return;
    try {
      await assetService.delete(id);
      setAssets(prev => prev.filter(a => a.id !== id));
      const statsRes = await assetService.getStats();
      setStats(statsRes.data.stats);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const breakdown = stats?.modalityBreakdown || { document: 0, image: 0, audio: 0, video: 0 };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col text-slate-100">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-8 overflow-y-auto space-y-8">
          {/* Header & Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">OmniMind Workspace Overview</h1>
              <p className="text-xs text-slate-400 mt-1">
                Real-time metrics and cross-modal assets indexed in your private repository
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                to="/upload"
                className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs flex items-center space-x-2 shadow-lg shadow-brand-500/20 transition-all"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Assets</span>
              </Link>
              <Link
                to="/chat"
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-2 transition-all"
              >
                <MessageSquare className="w-4 h-4 text-brand-400" />
                <span>Open OmniChat</span>
              </Link>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Total Assets</span>
                <Layers className="w-4 h-4 text-brand-400" />
              </div>
              <p className="text-2xl font-bold text-white">{stats?.totalAssets ?? 0}</p>
              <p className="text-[11px] text-slate-500">Indexed in vector repository</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Documents & Text</span>
                <FileText className="w-4 h-4 text-brand-400" />
              </div>
              <p className="text-2xl font-bold text-white">{breakdown.document ?? 0}</p>
              <p className="text-[11px] text-slate-500">PDF, DOCX, TXT contracts</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Visuals & Scans</span>
                <ImageIcon className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-bold text-white">{breakdown.image ?? 0}</p>
              <p className="text-[11px] text-slate-500">Invoices, blueprints, photos</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Audio & Video</span>
                <Music className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white">{(breakdown.audio || 0) + (breakdown.video || 0)}</p>
              <p className="text-[11px] text-slate-500">Interviews, webinars, memos</p>
            </div>
          </div>

          {/* Asset Explorer & Filters */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Global search across titles, transcripts, and AI summaries..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Modality Filter Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
                {['all', 'document', 'image', 'audio', 'video'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedModality(m)}
                    className={`px-3 py-1.5 rounded-xl font-medium transition-colors capitalize ${
                      selectedModality === m
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {m === 'all' ? 'All Modalities' : m}
                  </button>
                ))}
              </div>
            </div>

            {/* Asset Grid */}
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
                <p className="text-xs text-slate-400">Loading multimodal repository...</p>
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-800 p-12 text-center bg-slate-900/20">
                <Layers className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-200">No assets found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {searchQuery || selectedModality !== 'all'
                    ? 'No files matched your current search or filter criteria.'
                    : 'Your workspace repository is empty. Upload documents, images, audio, or video files to get started.'}
                </p>
                <Link
                  to="/upload"
                  className="inline-flex items-center space-x-2 mt-4 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition-all"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload First Asset</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAssets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

