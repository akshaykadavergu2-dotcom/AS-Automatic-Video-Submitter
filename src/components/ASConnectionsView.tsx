import React, { useState } from 'react';
import {
  Share2,
  Users,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Search,
  Check,
  X,
  Lock,
  Globe,
  Sliders,
  AlertCircle,
} from 'lucide-react';
import { MonitoredSource, NewsCategory } from '../types/news';

interface ASConnectionsViewProps {
  language: 'te' | 'en';
  sources: MonitoredSource[];
  onAddSource: (handle: string, name: string, category: NewsCategory) => Promise<void>;
  onRemoveSource: (id: string) => Promise<void>;
  onToggleExcludeSource: (id: string, isExcluded: boolean) => Promise<void>;
  onSyncFollowing: () => Promise<void>;
  isSyncingFollowing: boolean;
}

export const ASConnectionsView: React.FC<ASConnectionsViewProps> = ({
  language,
  sources,
  onAddSource,
  onRemoveSource,
  onToggleExcludeSource,
  onSyncFollowing,
  isSyncingFollowing,
}) => {
  // Mock/Configured Connection States
  const [isXConnected, setIsXConnected] = useState(true);
  const [xAccount, setXAccount] = useState({
    handle: '@PrajaSanketam_Live',
    name: 'Praja Sanketam Live Network',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
    followingCount: 148,
    lastSync: '12 minutes ago',
  });

  const [isFacebookConnected, setIsFacebookConnected] = useState(true);
  const [selectedPageId, setSelectedPageId] = useState('page_982341908');
  const facebookPages = [
    {
      id: 'page_982341908',
      name: 'Praja Sanketam Official (ప్రజా సంకేతం)',
      category: 'Media / News Company',
      likes: '84,200 followers',
      tokenStatus: 'Valid (Page Token Granted)',
    },
    {
      id: 'page_445129031',
      name: 'Praja Sanketam Telangana Express',
      category: 'Broadcasting & Media Production',
      likes: '22,400 followers',
      tokenStatus: 'Valid (Page Token Granted)',
    },
  ];

  // Tab inside X card: Selected Accounts vs Accounts You Follow
  const [xSubTab, setXSubTab] = useState<'selected' | 'following' | 'exclusions'>('selected');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [newHandle, setNewHandle] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<NewsCategory>('Telangana');
  const [isSubmittingSource, setIsSubmittingSource] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHandle.trim()) return;
    setIsSubmittingSource(true);
    try {
      await onAddSource(newHandle.trim(), newName.trim() || newHandle.trim(), newCategory);
      setNewHandle('');
      setNewName('');
      setNotificationMsg(`Source @${newHandle.replace(/^@/, '')} added successfully.`);
      setTimeout(() => setNotificationMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to add source');
    } finally {
      setIsSubmittingSource(false);
    }
  };

  const manualSources = sources.filter((s) => s.sourceType === 'manual' || s.sourceType === 'both');
  const followingSources = sources.filter((s) => s.sourceType === 'following' || s.sourceType === 'both');
  const excludedSources = sources.filter((s) => s.isExcluded);

  const displayedSources =
    xSubTab === 'selected'
      ? manualSources.filter((s) => !s.isExcluded)
      : xSubTab === 'following'
      ? followingSources.filter((s) => !s.isExcluded)
      : excludedSources;

  const filteredSources = displayedSources.filter(
    (s) =>
      s.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Title & Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
          <span>AS Platform</span>
          <span>/</span>
          <span className="text-cyan-400">Account Connections</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {language === 'te' ? 'సోషల్ మీడియా ఖాతాల అనుసంధానం' : 'Connected Media Accounts'}
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {language === 'te'
            ? 'X (ట్విట్టర్) అధికారిక API మరియు మెటా ఫేస్‌బుక్ గ్రాఫ్ API ద్వారా సురక్షిత ఆథరైజేషన్.'
            : 'Official OAuth 2.0 authorization for X timeline feeds and authorized Meta Facebook Page broadcasting.'}
        </p>
      </div>

      {notificationMsg && (
        <div className="p-3 rounded-xl bg-cyan-950/70 border border-cyan-800/60 text-cyan-200 text-xs flex items-center justify-between">
          <span>{notificationMsg}</span>
          <button onClick={() => setNotificationMsg(null)} className="text-cyan-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2-Column Grid: X Connection & Facebook Connection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ================= X / TWITTER CARD ================= */}
        <div className="bg-[#0b0f1a] rounded-2xl border border-slate-800 p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header Lockup */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-white">
                  <span className="text-xl font-bold">𝕏</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>X (Twitter) Feed Engine</span>
                    {isXConnected && (
                      <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-400">Official API v2 OAuth 2.0 with PKCE</p>
                </div>
              </div>

              {isXConnected ? (
                <button
                  onClick={() => setIsXConnected(false)}
                  className="text-xs text-slate-400 hover:text-red-400 py-1 px-2.5 rounded-lg border border-slate-800 hover:border-red-900/60 transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => setIsXConnected(true)}
                  className="text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 py-1.5 px-3 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  Connect 𝕏
                </button>
              )}
            </div>

            {/* Connected Account Profile Box */}
            {isXConnected && (
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-800 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-xs">
                    PS
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{xAccount.name}</p>
                    <p className="text-[11px] text-cyan-400 font-mono">{xAccount.handle}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-200 tabular-nums">
                    {xAccount.followingCount} Following
                  </p>
                  <p className="text-[10px] text-slate-500">Synced {xAccount.lastSync}</p>
                </div>
              </div>
            )}

            {/* Scopes & Permissions Notice */}
            <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800/60 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Granted Scopes</span>
              </div>
              <p>
                <code className="text-cyan-300 font-mono text-[10px]">tweet.read</code> ·{' '}
                <code className="text-cyan-300 font-mono text-[10px]">users.read</code> ·{' '}
                <code className="text-cyan-300 font-mono text-[10px]">follows.read</code>
              </p>
              <p className="text-[10px] text-slate-500">
                Media retrieved only when usage rights permit. Excluded accounts are ignored during collection cycles.
              </p>
            </div>

            {/* Sub-Tabs: Selected Accounts vs Accounts You Follow vs Excluded */}
            <div className="pt-2">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1 p-1 bg-slate-900/80 rounded-lg">
                  <button
                    onClick={() => setXSubTab('selected')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      xSubTab === 'selected'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Selected ({manualSources.length})
                  </button>
                  <button
                    onClick={() => setXSubTab('following')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      xSubTab === 'following'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Following ({followingSources.length})
                  </button>
                  <button
                    onClick={() => setXSubTab('exclusions')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      xSubTab === 'exclusions'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Excluded ({excludedSources.length})
                  </button>
                </div>

                {xSubTab === 'following' && (
                  <button
                    onClick={onSyncFollowing}
                    disabled={isSyncingFollowing}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncingFollowing ? 'animate-spin' : ''}`} />
                    <span>Sync List</span>
                  </button>
                )}
              </div>

              {/* Add Source Input Form for Selected Accounts */}
              {xSubTab === 'selected' && (
                <form onSubmit={handleAddSubmit} className="pt-3 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="@handle or profile URL"
                      value={newHandle}
                      onChange={(e) => setNewHandle(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as NewsCategory)}
                      aria-label="Category for new source"
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="Telangana">Telangana</option>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Politics">Politics</option>
                      <option value="Breaking News">Breaking News</option>
                      <option value="National">National</option>
                    </select>
                    <button
                      type="submit"
                      disabled={isSubmittingSource || !newHandle.trim()}
                      className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Source List Table */}
              <div className="mt-3 max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {filteredSources.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No accounts found in this list.</p>
                ) : (
                  filteredSources.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-cyan-400 font-bold shrink-0">
                          {s.handle.substring(1, 3).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <p className="text-white font-medium truncate">{s.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono truncate">{s.handle}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-slate-500">{s.category}</span>
                        {s.isExcluded ? (
                          <button
                            onClick={() => onToggleExcludeSource(s.id, false)}
                            className="text-[10px] text-emerald-400 hover:underline px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40 cursor-pointer"
                          >
                            Unexclude
                          </button>
                        ) : (
                          <button
                            onClick={() => onToggleExcludeSource(s.id, true)}
                            className="text-[10px] text-amber-400 hover:underline px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-800/40 cursor-pointer"
                          >
                            Exclude
                          </button>
                        )}
                        <button
                          onClick={() => onRemoveSource(s.id)}
                          className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                          title="Remove source"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ================= FACEBOOK PAGE CARD ================= */}
        <div className="bg-[#0b0f1a] rounded-2xl border border-slate-800 p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header Lockup */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-900/60 border border-blue-700/60 flex items-center justify-center text-blue-400">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Facebook Page Broadcasting</span>
                    {isFacebookConnected && (
                      <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-400">Official Meta Graph API v21.0</p>
                </div>
              </div>

              {isFacebookConnected ? (
                <button
                  onClick={() => setIsFacebookConnected(false)}
                  className="text-xs text-slate-400 hover:text-red-400 py-1 px-2.5 rounded-lg border border-slate-800 hover:border-red-900/60 transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => setIsFacebookConnected(true)}
                  className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 py-1.5 px-3 rounded-lg border border-blue-500 transition-colors cursor-pointer"
                >
                  Connect Meta
                </button>
              )}
            </div>

            {/* Target Facebook Page Selection Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Target Facebook Publishing Page
              </label>
              <select
                value={selectedPageId}
                onChange={(e) => setSelectedPageId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
              >
                {facebookPages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.name} — ({page.likes})
                  </option>
                ))}
              </select>
            </div>

            {/* Page Metadata Box */}
            {isFacebookConnected && (
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-700 flex items-center justify-center text-blue-300 font-bold text-xs">
                      FB
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        {facebookPages.find((p) => p.id === selectedPageId)?.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {facebookPages.find((p) => p.id === selectedPageId)?.category}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-medium">Token Active</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
                  <span>Page ID: {selectedPageId}</span>
                  <span className="text-slate-500">Expires: Never (System User)</span>
                </div>
              </div>
            )}

            {/* Meta Graph API Permissions Notice */}
            <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-900/40 text-[11px] text-blue-200/90 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-blue-300">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Meta Official Policy &amp; Permissions</span>
              </div>
              <p>
                <strong>Authorized Facebook Pages only:</strong> In strict compliance with Meta Graph API Terms of Service, video publishing is authorized exclusively for Pages where you hold administrative/editor rights. Publishing directly to personal user profiles is prohibited by Meta.
              </p>
              <div className="text-[10px] text-blue-300/80 font-mono pt-1">
                Required permissions: <code>pages_manage_posts</code>, <code>pages_read_engagement</code>, <code>publish_video</code>
              </div>
            </div>

            {/* Automated Publishing Defaults */}
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 space-y-2">
              <p className="text-xs font-semibold text-slate-300">Publishing Defaults</p>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Video Aspect Ratio</span>
                <span className="font-semibold text-slate-200">16:9 Landscape &amp; 9:16 Vertical</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Telugu Headline Overlay</span>
                <span className="text-emerald-400 font-semibold">Enabled (FFmpeg)</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Hashtags &amp; Description</span>
                <span className="text-cyan-400 font-semibold">Gemini AI Auto-Generated</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
