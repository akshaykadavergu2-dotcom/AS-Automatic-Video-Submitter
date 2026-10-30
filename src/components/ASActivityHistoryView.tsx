import React, { useState } from 'react';
import {
  ExternalLink,
  Video,
  Share2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ShieldCheck,
  Film,
  Send,
  X,
  Play,
  RotateCcw,
} from 'lucide-react';
import { CollectedXPost } from '../types/news';

interface ASActivityHistoryViewProps {
  language: 'te' | 'en';
  posts: CollectedXPost[];
  onRetryPost?: (postId: string) => Promise<void>;
  onPublishPost?: (postId: string) => Promise<void>;
  onNavigateToTab?: (tab: any) => void;
}

export const ASActivityHistoryView: React.FC<ASActivityHistoryViewProps> = ({
  language,
  posts,
  onRetryPost,
  onPublishPost,
  onNavigateToTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'ready_for_review' | 'rendering_video' | 'failed'>('all');
  const [selectedPost, setSelectedPost] = useState<CollectedXPost | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filter posts
  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      p.authorHandle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.geminiResult?.headlineTelugu && p.geminiResult.headlineTelugu.includes(searchQuery));

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'published'
        ? p.status === 'published' || p.facebookPublishResult?.postUrl
        : statusFilter === 'ready_for_review'
        ? p.status === 'ready_for_review' || p.status === 'ai_ready'
        : statusFilter === 'rendering_video'
        ? p.status === 'rendering_video'
        : p.status === 'failed' || p.lastError;

    return matchesSearch && matchesStatus;
  });

  const handleActionPublish = async (id: string) => {
    if (!onPublishPost) return;
    setActionLoadingId(id);
    try {
      await onPublishPost(id);
    } catch (err: any) {
      alert(err.message || 'Publishing failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleActionRetry = async (id: string) => {
    if (!onRetryPost) return;
    setActionLoadingId(id);
    try {
      await onRetryPost(id);
    } catch (err: any) {
      alert(err.message || 'Retry failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
            <span>AS Platform</span>
            <span>/</span>
            <span className="text-purple-400">Activity History</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {language === 'te' ? 'పూర్తి ప్రొడక్షన్ యాక్టివిటీ లాగ్' : 'Production Activity History & Audit'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'te'
              ? 'X పోస్టులు, తెలుగు శీర్షికలు, వీడియో రెండర్ స్టేటస్ మరియు ఫేస్‌బుక్ లైవ్ లింకులు.'
              : 'Detailed lifecycle log of all ingested posts, Telugu AI scripts, rendered 16:9 / 9:16 videos, and Facebook broadcast links.'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#0b0f1a] border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by author, handle, headline or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: 'All Records' },
            { id: 'published', label: 'FB Published' },
            { id: 'ready_for_review', label: 'Review Queue' },
            { id: 'rendering_video', label: 'Rendering' },
            { id: 'failed', label: 'Failed / Retries' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === item.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-900/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Table & Cards */}
      <div className="space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#0b0f1a] border border-slate-800 text-slate-400 text-xs">
            No activity records matched your search or filter.
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isPublished = post.status === 'published' || post.facebookPublishResult?.postUrl;
            const isRendering = post.status === 'rendering_video';
            const isFailed = post.status === 'failed' || post.lastError;
            const hasVideo = post.renderedVideo169Url || post.renderedVideo916Url;

            return (
              <div
                key={post.id}
                className="bg-[#0b0f1a] rounded-2xl border border-slate-800 p-4 hover:border-slate-700 transition-colors space-y-3"
              >
                {/* Row 1: Source Info & Meta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold text-xs shrink-0">
                      {post.authorHandle.substring(1, 3).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{post.authorName}</span>
                        <a
                          href={post.originalPostUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-cyan-400 font-mono hover:underline flex items-center gap-0.5 truncate"
                        >
                          <span>{post.authorHandle}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                        {(post.xPostId.startsWith('sim-') || post.id.startsWith('post-x-201')) && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            DEMO DATA
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{new Date(post.detectedAt || post.createdAt).toLocaleString()}</span>
                        <span>·</span>
                        <span>Category: {post.category}</span>
                        <span>·</span>
                        <span className="capitalize">{post.mediaType}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isPublished ? (
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                        <CheckCircle2 className="w-3 h-3" /> Live on FB
                      </span>
                    ) : isRendering ? (
                      <span className="text-xs font-semibold text-pink-400 flex items-center gap-1 bg-pink-950/40 px-2 py-0.5 rounded border border-pink-800/40 animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Rendering MP4
                      </span>
                    ) : isFailed ? (
                      <span className="text-xs font-semibold text-red-400 flex items-center gap-1 bg-red-950/40 px-2 py-0.5 rounded border border-red-800/40">
                        <AlertTriangle className="w-3 h-3" /> Action Required
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                        <Clock className="w-3 h-3" /> Ready for Review
                      </span>
                    )}

                    <button
                      onClick={() => setSelectedPost(post)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 cursor-pointer"
                      title="Inspect full AI script and details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Row 2: Telugu Headline & Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 space-y-1.5">
                    {post.geminiResult?.headlineTelugu ? (
                      <div>
                        <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                          తెలుగు ముఖ్యాంశం (Telugu Headline)
                        </span>
                        <p className="text-sm font-bold text-white font-telugu leading-snug">
                          {post.geminiResult.headlineTelugu}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-300 line-clamp-2">{post.text}</p>
                    )}

                    {post.geminiResult?.bulletSummary && post.geminiResult.bulletSummary.length > 0 && (
                      <div className="text-[11px] text-slate-400 font-telugu space-y-0.5 pt-1">
                        {post.geminiResult.bulletSummary.slice(0, 2).map((b, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <span className="text-cyan-400">·</span>
                            <span className="line-clamp-1">{b}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Media Rights Notice */}
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1 text-slate-400 font-medium">
                        <ShieldCheck className="w-3 h-3 text-cyan-400" />
                        <span>Rights:</span>
                      </span>
                      <span
                        className={
                          post.rightsStatus === 'eligible'
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }
                      >
                        {post.rightsStatus === 'eligible'
                          ? 'Authorised Public Footage'
                          : 'Requires Permission'}
                      </span>
                      {post.retryCount > 0 && (
                        <span>· Retry count: {post.retryCount}</span>
                      )}
                    </div>
                  </div>

                  {/* Video & Publishing Link Strip */}
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between space-y-2">
                    <div>
                      <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Production Output
                      </p>
                      <div className="text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-400">
                          <span>16:9 Landscape:</span>
                          {post.renderedVideo169Url ? (
                            <span className="text-emerald-400 font-mono text-[11px]">Rendered (MP4)</span>
                          ) : (
                            <span className="text-slate-500 font-mono text-[11px]">Pending</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-slate-400">
                          <span>9:16 Vertical:</span>
                          {post.renderedVideo916Url ? (
                            <span className="text-purple-400 font-mono text-[11px]">Rendered (Reels)</span>
                          ) : (
                            <span className="text-slate-500 font-mono text-[11px]">Pending</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                      {isPublished && post.facebookPublishResult?.postUrl ? (
                        <a
                          href={post.facebookPublishResult.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          <span>View on Facebook</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : isFailed ? (
                        <button
                          onClick={() => handleActionRetry(post.id)}
                          disabled={actionLoadingId === post.id}
                          className="text-xs font-semibold text-amber-300 hover:text-white bg-amber-950/60 hover:bg-amber-900 border border-amber-700/60 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Retry Job</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActionPublish(post.id)}
                          disabled={actionLoadingId === post.id}
                          className="text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-3 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Publish to FB</span>
                        </button>
                      )}

                      {hasVideo && (
                        <button
                          onClick={() => setSelectedPost(post)}
                          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          <Play className="w-3 h-3 text-cyan-400" />
                          <span>Preview</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail / Inspection Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0b0f1a] border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Production Story Audit</h3>
                <p className="text-xs text-slate-400">Post ID: {selectedPost.xPostId} · {selectedPost.authorHandle}</p>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Telugu Headline */}
              <div>
                <label className="text-slate-400 font-bold block mb-1">తెలుగు హెడ్‌లైన్ (Headline):</label>
                <p className="text-sm font-bold text-white font-telugu bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  {selectedPost.geminiResult?.headlineTelugu || 'Pending Gemini AI Analysis'}
                </p>
              </div>

              {/* Anchor Script */}
              {selectedPost.geminiResult?.anchorScriptTelugu && (
                <div>
                  <label className="text-slate-400 font-bold block mb-1">యాంకర్ స్క్రిప్ట్ (Anchor Script):</label>
                  <p className="text-slate-200 font-telugu bg-slate-900 p-2.5 rounded-lg border border-slate-800 whitespace-pre-line leading-relaxed">
                    {selectedPost.geminiResult.anchorScriptTelugu}
                  </p>
                </div>
              )}

              {/* Facebook Description & Hashtags */}
              {selectedPost.geminiResult?.facebookDescription && (
                <div>
                  <label className="text-slate-400 font-bold block mb-1">ఫేస్‌బుక్ డిస్క్రిప్షన్ &amp; హ్యాష్‌ట్యాగ్‌లు:</label>
                  <p className="text-slate-300 font-telugu bg-slate-900 p-2.5 rounded-lg border border-slate-800 whitespace-pre-line">
                    {selectedPost.geminiResult.facebookDescription}
                  </p>
                </div>
              )}

              {/* Original Raw Text */}
              <div>
                <label className="text-slate-400 font-bold block mb-1">Original 𝕏 Tweet Content:</label>
                <p className="text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800 whitespace-pre-line">
                  {selectedPost.text}
                </p>
              </div>

              {/* Video Assets */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-center">
                  <p className="font-semibold text-slate-300">16:9 Landscape MP4</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Praja Sanketam Master Overlay</p>
                  {selectedPost.renderedVideo169Url ? (
                    <a
                      href={selectedPost.renderedVideo169Url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[11px] font-semibold"
                    >
                      Download MP4
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-500 block mt-2">Not rendered yet</span>
                  )}
                </div>

                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-center">
                  <p className="font-semibold text-slate-300">9:16 Vertical Reels MP4</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Mobile Optimized Frame</p>
                  {selectedPost.renderedVideo916Url ? (
                    <a
                      href={selectedPost.renderedVideo916Url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-[11px] font-semibold"
                    >
                      Download MP4
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-500 block mt-2">Not rendered yet</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedPost(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
