import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Video, 
  CheckCircle2, 
  AlertCircle,
  X,
  Loader2
} from 'lucide-react';
import { assetService } from '../services/api';

export default function FileUploadZone({ onUploadComplete }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const fileInputRef = useRef(null);

  const getFileIcon = (mimeType, name) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-indigo-400" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-5 h-5 text-emerald-400" />;
    if (mimeType.startsWith('video/')) return <Video className="w-5 h-5 text-purple-400" />;
    return <FileText className="w-5 h-5 text-brand-400" />;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles) => {
    setError(null);
    setSuccessMsg(null);
    const valid = [];
    for (const file of newFiles) {
      if (file.size > 50 * 1024 * 1024) {
        setError(`File "${file.name}" exceeds the 50MB limit.`);
        return;
      }
      valid.push(file);
    }
    setSelectedFiles((prev) => [...prev, ...valid]);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setProgress(0);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const res = await assetService.upload(formData, (p) => setProgress(p));
      setSuccessMsg(`Successfully uploaded and processed ${res.data.assets?.length || selectedFiles.length} multimodal asset(s).`);
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onUploadComplete) {
        onUploadComplete(res.data.assets);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.error || 'Failed to upload files. Please verify format and size.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-brand-400 bg-brand-500/10'
            : 'border-slate-700/80 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-600'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.docx,.txt,.md,.csv,.jpg,.jpeg,.png,.webp,.mp3,.wav,.mp4,.avi,.mov"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shadow-inner">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">
              Drag & drop heterogeneous files here, or <span className="text-brand-400 underline">browse</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports Documents (PDF, DOCX, TXT), Visuals (PNG, JPEG), Audio (MP3, WAV), and Video (MP4, AVI) up to 50MB
            </p>
          </div>
        </div>
      </div>

      {/* Selected file queue */}
      {selectedFiles.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Queued Files ({selectedFiles.length})
            </span>
            <button
              onClick={() => setSelectedFiles([])}
              className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs"
              >
                <div className="flex items-center space-x-2.5 truncate">
                  {getFileIcon(file.type, file.name)}
                  <div className="truncate">
                    <p className="font-medium text-slate-200 truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                {!uploading && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    className="p-1 hover:text-rose-400 text-slate-400 rounded-lg hover:bg-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {uploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span className="flex items-center space-x-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
                  <span>Processing & Ingesting via Gemini API...</span>
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-cyan-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload CTA */}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full mt-2 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-lg shadow-brand-500/20 transition-all"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Ingesting into Vector Store...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Upload & Extract with Gemini AI</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Feedback Messages */}
      {error && (
        <div className="flex items-center space-x-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center space-x-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
}

