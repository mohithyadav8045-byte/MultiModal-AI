import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ReportBuilder from '../components/ReportBuilder';
import { reportService } from '../services/api';
import ReactMarkdown from 'react-markdown';
import { 
  FileText, 
  Trash2, 
  Download, 
  Calendar, 
  ChevronRight, 
  Sparkles,
  Archive,
  Loader2
} from 'lucide-react';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await reportService.list();
      setReports(res.data.reports || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this report from the archive?')) return;
    try {
      await reportService.delete(id);
      setReports(prev => prev.filter(r => r.id !== id));
      if (selectedReport?.id === id) {
        setSelectedReport(null);
      }
    } catch (err) {
      console.error('Delete report error:', err);
    }
  };

  const handleSelectReport = async (id) => {
    try {
      const res = await reportService.get(id);
      setSelectedReport(res.data.report);
    } catch (err) {
      console.error('Failed to fetch report detail:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col text-slate-100">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-8 overflow-y-auto space-y-8 max-w-7xl mx-auto">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Executive Reports & Synthesis Archive</h1>
            <p className="text-xs text-slate-400 mt-1">
              Synthesize cross-modal data from documents, recordings, and images into structured audit and research briefs.
            </p>
          </div>

          {/* Builder Component */}
          <ReportBuilder onReportGenerated={() => loadReports()} />

          {/* Past Reports Archive Section */}
          <div className="space-y-4 pt-6 border-t border-slate-800">
            <div className="flex items-center space-x-2">
              <Archive className="w-4 h-4 text-brand-400" />
              <h2 className="text-sm font-semibold text-white">Archived Synthesis Reports</h2>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center items-center space-y-2">
                <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
              </div>
            ) : reports.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No reports generated yet. Use the tool above to create one.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => handleSelectReport(report.id)}
                    className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(report.created_at).toLocaleDateString()}</span>
                        </span>
                        <button
                          onClick={(e) => handleDelete(report.id, e)}
                          className="hover:text-rose-400 text-slate-500 p-1 rounded-md"
                          title="Delete Report"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h3 className="text-xs font-semibold text-slate-200 line-clamp-1">{report.title}</h3>
                      <p className="text-[11px] text-slate-400 line-clamp-3 mt-1 leading-relaxed">
                        {report.preview ? report.preview.replace(/[#*`]/g, '') : 'Generated multimodal synthesis.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-brand-400 font-semibold">
                      <span>View Full Report</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Full Report Viewer Modal */}
          {selectedReport && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedReport.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Generated {new Date(selectedReport.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 markdown-body text-xs">
                  <ReactMarkdown>{selectedReport.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

