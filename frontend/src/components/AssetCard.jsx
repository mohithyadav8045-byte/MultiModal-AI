import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Video, 
  Trash2, 
  ExternalLink, 
  Sparkles,
  Tag
} from 'lucide-react';

export default function AssetCard({ asset, onDelete, onSelect, isSelected }) {
  const getBadge = (modality) => {
    switch (modality) {
      case 'image':
        return {
          icon: ImageIcon,
          color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
          label: 'Visual Artifact'
        };
      case 'audio':
        return {
          icon: Music,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          label: 'Audio Recording'
        };
      case 'video':
        return {
          icon: Video,
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
          label: 'Video Stream'
        };
      default:
        return {
          icon: FileText,
          color: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
          label: 'Document'
        };
    }
  };

  const badge = getBadge(asset.modality);
  const Icon = badge.icon;
  const formattedSize = asset.file_size
    ? `${(parseInt(asset.file_size, 10) / (1024 * 1024)).toFixed(2)} MB`
    : '0 MB';
  const formattedDate = new Date(asset.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div
      className={`group relative rounded-2xl bg-slate-900/70 border transition-all duration-200 flex flex-col justify-between overflow-hidden hover:shadow-xl hover:shadow-brand-500/5 ${
        isSelected
          ? 'border-brand-500 ring-2 ring-brand-500/30'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="p-4 space-y-3">
        {/* Header: Modality badge and checkbox */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${badge.color}`}>
            <Icon className="w-3.5 h-3.5" />
            <span>{badge.label}</span>
          </span>

          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected || false}
              onChange={() => onSelect(asset)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-brand-500 focus:ring-brand-500 cursor-pointer"
            />
          )}
        </div>

        {/* Title & File Name */}
        <div>
          <Link
            to={`/workspace/${asset.id}`}
            className="text-sm font-semibold text-slate-100 hover:text-brand-400 transition-colors line-clamp-1"
          >
            {asset.title || asset.file_name}
          </Link>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">{asset.file_name}</p>
        </div>

        {/* AI Summary Preview */}
        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
          {asset.ai_summary || 'Ingestion completed. Metadata indexed.'}
        </p>

        {/* Tags / Topics if available */}
        {asset.metadata?.keyTopics && asset.metadata.keyTopics.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {asset.metadata.keyTopics.slice(0, 3).map((topic, i) => (
              <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md flex items-center space-x-1">
                <Tag className="w-2.5 h-2.5 text-slate-400" />
                <span>{topic}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer: Metadata & Actions */}
      <div className="px-4 py-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span>{formattedDate} • {formattedSize}</span>

        <div className="flex items-center space-x-2">
          <Link
            to={`/workspace/${asset.id}`}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-brand-400 transition-colors"
            title="Open Deep-dive Workspace"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {onDelete && (
            <button
              onClick={() => onDelete(asset.id)}
              className="p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
              title="Delete Asset"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

