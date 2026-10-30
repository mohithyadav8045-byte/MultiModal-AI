import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Paperclip, 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Video, 
  Check, 
  X,
  ExternalLink,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { chatService, assetService } from '../services/api';

export default function ChatInterface({ preselectedAssetId = null }) {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputContent, setInputContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState(preselectedAssetId ? [preselectedAssetId] : []);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Load available assets
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

  // Load sessions
  useEffect(() => {
    async function loadSessions() {
      try {
        const res = await chatService.listSessions();
        const list = res.data.sessions || [];
        setSessions(list);
        if (list.length > 0 && !currentSessionId) {
          setCurrentSessionId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load sessions:', err);
      }
    }
    loadSessions();
  }, []);

  // Load messages whenever currentSessionId changes
  useEffect(() => {
    if (!currentSessionId) {
      setMessages([]);
      return;
    }
    async function loadMessages() {
      try {
        const res = await chatService.getMessages(currentSessionId);
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    }
    loadMessages();
  }, [currentSessionId]);

  // Scroll to bottom on messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleCreateNewSession = async () => {
    try {
      const res = await chatService.createSession('Multimodal Inquiry ' + new Date().toLocaleTimeString());
      setSessions([res.data.session, ...sessions]);
      setCurrentSessionId(res.data.session.id);
      setMessages([]);
    } catch (err) {
      console.error('Failed to create new session:', err);
    }
  };

  const toggleAssetSelection = (id) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const trimmed = inputContent.trim();
    if (!trimmed || loading) return;

    const optimisticUserMessage = {
      id: 'temp-' + Date.now(),
      sender: 'user',
      content: trimmed,
      citations: [],
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimisticUserMessage]);
    setInputContent('');
    setLoading(true);

    try {
      const res = await chatService.sendMessage({
        sessionId: currentSessionId,
        content: trimmed,
        assetIds: selectedAssetIds
      });

      if (!currentSessionId) {
        setCurrentSessionId(res.data.sessionId);
        const sessionsRes = await chatService.listSessions();
        setSessions(sessionsRes.data.sessions || []);
      }

      setMessages((prev) => [
        ...prev.filter(m => m.id !== optimisticUserMessage.id),
        res.data.userMessage,
        res.data.aiMessage
      ]);
    } catch (err) {
      console.error('Send error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sender: 'ai',
          content: '⚠️ Failed to obtain AI response: ' + (err.response?.data?.error || err.message),
          citations: [],
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getModalityIcon = (mod) => {
    switch (mod) {
      case 'image': return <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />;
      case 'audio': return <Music className="w-3.5 h-3.5 text-emerald-400" />;
      case 'video': return <Video className="w-3.5 h-3.5 text-purple-400" />;
      default: return <FileText className="w-3.5 h-3.5 text-brand-400" />;
    }
  };

  return (
    <div className="flex h-full w-full rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-2xl">
      {/* Left Session Drawer */}
      <div className="w-72 border-r border-slate-800 bg-[#0B0F19]/60 flex flex-col justify-between hidden md:flex">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">Chat Sessions</span>
          <button
            onClick={handleCreateNewSession}
            className="px-2.5 py-1 text-xs bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:bg-brand-500/20 rounded-lg transition-colors font-medium"
          >
            + New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <p className="p-4 text-xs text-slate-500 text-center">No sessions yet. Send a prompt to start one.</p>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setCurrentSessionId(s.id)}
                className={`w-full text-left p-3 rounded-xl text-xs font-medium transition-all truncate block ${
                  currentSessionId === s.id
                    ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="truncate font-semibold">{s.title || 'Untitled Session'}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {new Date(s.created_at).toLocaleDateString()}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Selected Assets summary bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-full flex items-center justify-between text-xs text-slate-300 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition-colors"
          >
            <span className="flex items-center space-x-1.5 truncate">
              <Paperclip className="w-3.5 h-3.5 text-brand-400" />
              <span>Grounded Assets ({selectedAssetIds.length})</span>
            </span>
            <span className="text-[10px] text-brand-400 underline">Manage</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col justify-between h-full bg-[#0B0F19]">
        {/* Top Header */}
        <div className="h-14 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/30">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span className="text-xs font-semibold text-slate-200">
              OmniMind Cross-Modal Reasoning Engine
            </span>
          </div>

          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300"
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>Assets ({selectedAssetIds.length})</span>
          </button>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-12">
              <div className="w-16 h-16 rounded-3xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-4 shadow-xl">
                <Bot className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-slate-100 mb-2">
                Ask OmniMind Across Documents, Images, Audio & Video
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Attach heterogeneous data assets and ask comparative questions like: <br />
                <span className="italic text-slate-300 font-mono">
                  "Compare the figures in the scanned invoice with commitments in the audio interview."
                </span>
              </p>

              {/* Quick suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full text-xs text-left">
                {[
                  'Summarize the core takeaways across all attached files',
                  'Identify discrepancies between audio statements and written documents',
                  'Extract structured tables and numerical figures from visual artifacts',
                  'Synthesize an executive briefing with citations'
                ].map((promptText, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInputContent(promptText);
                    }}
                    className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-brand-500/40 text-slate-300 hover:text-white transition-all text-[11px]"
                  >
                    "{promptText}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isUser = msg.sender === 'user';
              const citations = msg.citations || [];

              return (
                <div
                  key={msg.id || index}
                  className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-semibold ${
                      isUser
                        ? 'bg-gradient-to-tr from-brand-600 to-cyan-500 text-white'
                        : 'bg-slate-800 border border-slate-700 text-brand-400 shadow'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                    isUser
                      ? 'bg-brand-600/20 border border-brand-500/30 text-white'
                      : 'bg-slate-900/80 border border-slate-800 text-slate-200'
                  }`}>
                    {/* Markdown rendering for AI responses */}
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="markdown-body">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}

                    {/* Grounded Citation Chips */}
                    {citations.length > 0 && !isUser && (
                      <div className="pt-2 border-t border-slate-800 mt-2">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                          Referenced Multimodal Sources:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {citations.map((c, ci) => (
                            <span
                              key={ci}
                              className="inline-flex items-center space-x-1.5 px-2 py-1 rounded-md bg-slate-800/90 border border-slate-700 text-[10px] text-slate-300 font-mono"
                            >
                              {getModalityIcon(c.modality)}
                              <span>{c.title || c.fileName}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {loading && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-xl shrink-0 bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-400">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                <span>OmniMind is reasoning across multimodal assets...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40 space-y-2">
          {/* Active Asset Badges */}
          {selectedAssetIds.length > 0 && (
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs text-slate-400">
              <span className="text-[10px] uppercase font-mono text-brand-400 font-semibold">Grounded in:</span>
              {selectedAssetIds.map(id => {
                const asset = assets.find(a => a.id === id);
                if (!asset) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-[10px] text-slate-200"
                  >
                    {getModalityIcon(asset.modality)}
                    <span className="truncate max-w-[100px]">{asset.title}</span>
                    <button
                      onClick={() => toggleAssetSelection(id)}
                      className="hover:text-rose-400 text-slate-400 ml-1"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          <form onSubmit={handleSend} className="relative flex items-center">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="absolute left-3 p-1.5 text-slate-400 hover:text-brand-400 transition-colors"
              title="Attach & ground assets"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              placeholder={selectedAssetIds.length > 0 ? "Ask anything about attached assets..." : "Ask OmniMind a multimodal query (attach files for grounded answers)..."}
              className="w-full pl-10 pr-12 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />

            <button
              type="submit"
              disabled={!inputContent.trim() || loading}
              className="absolute right-2 p-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white transition-all shadow-md shadow-brand-500/20"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Asset Selector Modal/Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-100">Select Grounding Assets</h4>
                <p className="text-xs text-slate-400">Attached files will be analyzed directly by Gemini</p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {assets.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">
                  No assets found. Upload files in the Upload Center first!
                </p>
              ) : (
                assets.map((asset) => {
                  const selected = selectedAssetIds.includes(asset.id);
                  return (
                    <div
                      key={asset.id}
                      onClick={() => toggleAssetSelection(asset.id)}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        selected
                          ? 'bg-brand-500/10 border-brand-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <div className="p-2 rounded-xl bg-slate-800/80">
                          {getModalityIcon(asset.modality)}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold truncate">{asset.title}</p>
                          <p className="text-[10px] text-slate-400">{asset.file_name} • {asset.modality.toUpperCase()}</p>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                        selected ? 'bg-brand-500 border-brand-500 text-white' : 'border-slate-700'
                      }`}>
                        {selected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setDrawerOpen(false)}
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-colors"
              >
                Done ({selectedAssetIds.length} Selected)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

