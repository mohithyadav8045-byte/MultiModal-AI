import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  FileText, 
  Sparkles, 
  Download, 
  Check, 
  Loader2, 
  Layers, 
  Printer,
  Copy,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { assetService, reportService } from '../services/api';

export default function ReportBuilder({ onReportGenerated }) {
  const [assets, setAssets] = useState([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState([]);
  const [title, setTitle] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadAssets() {
      try {
        const res = await assetService.list();
        setAssets(res.data.assets || []);
      } catch (err) {
        console.error('Failed to load assets:', err);
      }
    }
    loadAssets();
  }, []);

  const toggleAsset = (id) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a report title.');
      return;
    }

    setGenerating(true);
    setError(null);
    try {
      const res = await reportService.generate({
        title: title.trim(),
        assetIds: selectedAssetIds,
        customPrompt: customPrompt.trim()
      });
      setGeneratedReport(res.data.report);
      if (onReportGenerated) {
        onReportGenerated(res.data.report);
      }
    } catch (err) {
      console.error('Report error:', err);
      setError(err.response?.data?.error || 'Failed to generate multimodal report.');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedReport) return;
    navigator.clipboard.writeText(generatedReport.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMarkdown = () => {
    if (!generatedReport) return;
    const blob = new Blob([generatedReport.content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${generatedReport.title.replace(/\s+/g, '_')}_Report.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJson = () => {
    if (!generatedReport) return;
    const blob = new Blob([JSON.stringify(generatedReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${generatedReport.title.replace(/\s+/g, '_')}_Report.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Configuration Form */}
      <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span>Multimodal Synthesis Generator</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Leverage Gemini 2.5 Pro reasoning to extract findings and cross-reference multi-format files.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Report Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Multimodal Operations & Audit Summary"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Custom Directives & Focus Areas
            </label>
            <textarea
              rows={3}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. Focus on financial liabilities found in scanned invoices vs verbal pledges in audio interviews."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Asset Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">
                Select Source Assets ({selectedAssetIds.length})
              </label>
              <button
                type="button"
                onClick={() => {
                  if (selectedAssetIds.length === assets.length) setSelectedAssetIds([]);
                  else setSelectedAssetIds(assets.map(a => a.id));
                }}
                className="text-[11px] text-brand-400 hover:underline"
              >
                {selectedAssetIds.length === assets.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {assets.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No assets in workspace yet.</p>
              ) : (
                assets.map((a) => {
                  const isChecked = selectedAssetIds.includes(a.id);
                  return (
                    <div
                      key={a.id}
                      onClick={() => toggleAsset(a.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-brand-500/10 border-brand-500/50 text-white'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="truncate">
                        <p className="font-medium truncate">{a.title}</p>
                        <p className="text-[10px] text-slate-500 uppercase">{a.modality} • {a.file_name}</p>
                      </div>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ml-2 ${
                        isChecked ? 'bg-brand-500 border-brand-500 text-white' : 'border-slate-700'
                      }`}>
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={generating}
            className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-lg shadow-brand-500/20 transition-all"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gemini 2.5 Pro Synthesizing Report...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Generate Executive Synthesis Report</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Report Preview Panel */}
      <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-100">
                {generatedReport ? generatedReport.title : 'Live Report Viewer'}
              </h4>
              <p className="text-xs text-slate-500">
                {generatedReport ? `Created ${new Date(generatedReport.created_at).toLocaleString()}` : 'Generate a report or select one from the archive'}
              </p>
            </div>

            {generatedReport && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={copyToClipboard}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1"
                  title="Copy Markdown"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={downloadMarkdown}
                  className="p-2 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-400 text-xs flex items-center space-x-1"
                  title="Download .md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>.MD</span>
                </button>

                <button
                  onClick={downloadJson}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1"
                  title="Download .json"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>.JSON</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                  title="Print / Save as PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="max-h-[550px] overflow-y-auto pr-2">
            {generatedReport ? (
              <div className="markdown-body text-xs">
                <ReactMarkdown>{generatedReport.content}</ReactMarkdown>
              </div>
            ) : (
              <div className="h-72 flex flex-col items-center justify-center text-slate-500 text-xs text-center space-y-2">
                <FileText className="w-10 h-10 text-slate-700" />
                <p>Configure parameters on the left and click "Generate Executive Synthesis Report".</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

