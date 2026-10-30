import React, { useState, useEffect } from 'react';
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
  Key,
  Info,
} from 'lucide-react';
import { MonitoredSource, NewsCategory } from '../types/news';
import { api } from '../services/api';

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
  // Real Connection States (loaded from backend)
  const [xAuthStatus, setXAuthStatus] = useState<{
    isConnected: boolean;
    isConfigured: boolean;
    status: string;
    username: string | null;
    name: string | null;
    profileImageUrl: string | null;
    followersCount?: number | null;
    followingCount?: number | null;
    connectedAt: string | null;
    clientIdConfigured: boolean;
    bearerTokenConfigured: boolean;
  }>({
    isConnected: false,
    isConfigured: false,
    status: 'NOT CONFIGURED',
    username: null,
    name: null,
    profileImageUrl: null,
    connectedAt: null,
    clientIdConfigured: false,
    bearerTokenConfigured: false,
  });

  const [facebookStatus, setFacebookStatus] = useState<{
    connected: boolean;
    isConfigured: boolean;
    status: string;
    pageId?: string;
    pageName?: string;
    category?: string;
    fanCount?: number;
    notice?: string;
    error?: string;
  }>({
    connected: false,
    isConfigured: false,
    status: 'NOT CONFIGURED',
  });

  const [facebookPages, setFacebookPages] = useState<any[]>([]);

  // Manual Page Connection Form (Direct Page Token)
  const [manualPageId, setManualPageId] = useState('');
  const [manualPageToken, setManualPageToken] = useState('');
  const [manualPageName, setManualPageName] = useState('');
  const [isVerifyingPage, setIsVerifyingPage] = useState(false);
  const [pageVerifyError, setPageVerifyError] = useState<string | null>(null);

  // General state
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [notificationMsg, setNotificationMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Tab inside X card: Selected Accounts vs Accounts You Follow vs Excluded
  const [xSubTab, setXSubTab] = useState<'selected' | 'following' | 'exclusions'>('selected');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states for adding manual sources
  const [newHandle, setNewHandle] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<NewsCategory>('Telangana');
  const [isSubmittingSource, setIsSubmittingSource] = useState(false);

  // Load real connection statuses from backend API
  const refreshStatuses = async () => {
    setIsLoadingStatus(true);
    try {
      const [xRes, fbRes, pagesRes] = await Promise.allSettled([
        api.getXAuthStatus(),
        api.getFacebookStatus(),
        api.getFacebookPages(),
      ]);

      if (xRes.status === 'fulfilled') {
        setXAuthStatus(xRes.value);
      }
      if (fbRes.status === 'fulfilled') {
        setFacebookStatus(fbRes.value);
        if (fbRes.value.pageId) {
          setManualPageId(fbRes.value.pageId);
        }
      }
      if (pagesRes.status === 'fulfilled') {
        setFacebookPages(pagesRes.value.pages || []);
      }
    } catch (e) {
      console.error('Failed to load connection status:', e);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    refreshStatuses();

    // Listen for OAuth popup completion
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setNotificationMsg({
          text: `Successfully authenticated ${event.data.service === 'x' ? 'X account' : 'Facebook Page'}!`,
          type: 'success',
        });
        refreshStatuses();
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        setNotificationMsg({
          text: `OAuth authorization failed: ${event.data.error || 'User denied request'}`,
          type: 'error',
        });
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  // Connect X via OAuth
  const handleConnectX = async () => {
    try {
      const res = await api.getXAuthUrl();
      if (!res.clientIdConfigured && !res.url) {
        alert('X Client ID is not configured. Go to Studio Settings to enter your X OAuth 2.0 Client ID.');
        return;
      }
      const popup = window.open(res.url, 'x_oauth_popup', 'width=600,height=720');
      if (!popup) {
        alert('Please allow popups for this site to complete X authentication.');
      }
    } catch (e: any) {
      alert(e.message || 'Failed to start X authorization flow');
    }
  };

  // Disconnect X
  const handleDisconnectX = async () => {
    if (!confirm('Are you sure you want to disconnect your X account?')) return;
    try {
      await api.disconnectXAuth();
      setNotificationMsg({ text: 'X account disconnected.', type: 'success' });
      await refreshStatuses();
    } catch (e: any) {
      alert(e.message || 'Failed to disconnect X account');
    }
  };

  // Connect Facebook via OAuth
  const handleConnectFacebookOAuth = async () => {
    try {
      const res = await api.getFacebookAuthUrl();
      if (!res.isConfigured || !res.url) {
        setNotificationMsg({
          text: res.notice || 'Meta App ID not configured. Please enter Page ID and Page Access Token below.',
          type: 'error',
        });
        return;
      }
      const popup = window.open(res.url, 'fb_oauth_popup', 'width=620,height=750');
      if (!popup) {
        alert('Please allow popups for this site to complete Meta authentication.');
      }
    } catch (e: any) {
      alert(e.message || 'Failed to start Facebook authorization flow');
    }
  };

  // Verify and Connect Page with direct token
  const handleVerifyDirectPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPageId.trim() || !manualPageToken.trim()) {
      setPageVerifyError('Page ID and Page Access Token are both required.');
      return;
    }

    setIsVerifyingPage(true);
    setPageVerifyError(null);

    try {
      const res = await api.verifyFacebookPage({
        pageId: manualPageId.trim(),
        pageAccessToken: manualPageToken.trim(),
        pageName: manualPageName.trim() || undefined,
      });

      setNotificationMsg({
        text: `Facebook Page "${res.page.name}" verified and connected with Meta Graph API!`,
        type: 'success',
      });
      setManualPageToken('');
      await refreshStatuses();
    } catch (err: any) {
      setPageVerifyError(err.message || 'Meta Graph API token verification failed.');
    } finally {
      setIsVerifyingPage(false);
    }
  };

  // Disconnect Facebook Page
  const handleDisconnectFacebook = async () => {
    if (!confirm('Are you sure you want to disconnect the Facebook Page?')) return;
    try {
      await api.disconnectFacebook();
      setNotificationMsg({ text: 'Facebook Page disconnected.', type: 'success' });
      await refreshStatuses();
    } catch (e: any) {
      alert(e.message || 'Failed to disconnect Facebook Page');
    }
  };

  // Add Source
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHandle.trim()) return;
    setIsSubmittingSource(true);
    try {
      await onAddSource(newHandle.trim(), newName.trim() || newHandle.trim(), newCategory);
      setNewHandle('');
      setNewName('');
      setNotificationMsg({ text: `Source @${newHandle.replace(/^@/, '')} added successfully.`, type: 'success' });
      setTimeout(() => setNotificationMsg(null), 3500);
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
            ? 'అధికారిక X API v2 మరియు Meta Graph API ధృవీకరణ. అన్ని కనెక్షన్లు లైవ్ API ద్వారా ధృవీకరించబడతాయి.'
            : 'Live external integrations with official X OAuth 2.0 and Meta Graph API. No simulated or mock connections.'}
        </p>
      </div>

      {notificationMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            notificationMsg.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-800 text-emerald-200'
              : 'bg-red-950/70 border-red-800 text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notificationMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            )}
            <span>{notificationMsg.text}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-slate-400 hover:text-white">
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
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    {xAuthStatus.isConnected ? (
                      <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> TOKEN ACTIVE (VERIFIED)
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {xAuthStatus.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {xAuthStatus.isConnected ? (
                <button
                  onClick={handleDisconnectX}
                  className="text-xs text-slate-400 hover:text-red-400 py-1 px-2.5 rounded-lg border border-slate-800 hover:border-red-900/60 transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={handleConnectX}
                  className="text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 py-1.5 px-3 rounded-lg border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Connect with 𝕏</span>
                  <ExternalLink className="w-3 h-3 text-cyan-400" />
                </button>
              )}
            </div>

            {/* Connected Account Profile Box (Only displayed if verified) */}
            {xAuthStatus.isConnected && xAuthStatus.username ? (
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {xAuthStatus.profileImageUrl ? (
                    <img
                      src={xAuthStatus.profileImageUrl}
                      alt={xAuthStatus.name || xAuthStatus.username}
                      className="w-9 h-9 rounded-full object-cover border border-cyan-500/40"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-xs">
                      {xAuthStatus.username.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-white">{xAuthStatus.name || `@${xAuthStatus.username}`}</p>
                    <a
                      href={`https://x.com/${xAuthStatus.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 font-mono hover:underline flex items-center gap-1"
                    >
                      <span>@{xAuthStatus.username}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-200 tabular-nums">
                    {xAuthStatus.followingCount != null ? `${xAuthStatus.followingCount} Following` : 'Verified Access'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Connected {xAuthStatus.connectedAt ? new Date(xAuthStatus.connectedAt).toLocaleDateString() : 'Active'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-[11px] text-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  <span>X Account Not Connected</span>
                </div>
                <p className="text-slate-400">
                  Connect your X account to automatically import and monitor accounts you follow, or add selected news accounts manually below.
                </p>
              </div>
            )}

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
                    onClick={async () => {
                      if (!xAuthStatus.isConnected && !xAuthStatus.bearerTokenConfigured) {
                        alert('X account connection is required to sync your following list. Please connect your X account with OAuth.');
                        return;
                      }
                      await onSyncFollowing();
                    }}
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
                  <p className="text-xs text-slate-500 py-4 text-center">
                    {xSubTab === 'following' && !xAuthStatus.isConnected
                      ? 'No following accounts synced yet. Connect your X account above to import followed handles.'
                      : 'No accounts in this list.'}
                  </p>
                ) : (
                  filteredSources.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-cyan-400 font-bold shrink-0">
                          {s.handle.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <p className="text-white font-medium truncate">{s.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono truncate">@{s.handle}</p>
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
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    {facebookStatus.connected ? (
                      <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> TOKEN ACTIVE (VERIFIED)
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {facebookStatus.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {facebookStatus.connected ? (
                <button
                  onClick={handleDisconnectFacebook}
                  className="text-xs text-slate-400 hover:text-red-400 py-1 px-2.5 rounded-lg border border-slate-800 hover:border-red-900/60 transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={handleConnectFacebookOAuth}
                  className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 py-1.5 px-3 rounded-lg border border-blue-500 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Connect Meta OAuth</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Verified Page Display (Only if verified) */}
            {facebookStatus.connected && facebookStatus.pageName ? (
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-700 flex items-center justify-center text-blue-300 font-bold text-xs">
                      FB
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{facebookStatus.pageName}</p>
                      <p className="text-[11px] text-slate-400">
                        {facebookStatus.category || 'Authorized Media Page'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-mono">Verified Active</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
                  <span>Page ID: {facebookStatus.pageId}</span>
                  <span>{facebookStatus.fanCount ? `${facebookStatus.fanCount.toLocaleString()} followers` : 'Publishing Ready'}</span>
                </div>
              </div>
            ) : (
              /* Direct Page Verification Form */
              <form onSubmit={handleVerifyDirectPage} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-blue-400" />
                    <span>Connect Facebook Page (Page ID &amp; Token)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Meta Graph API v21.0</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-0.5">Facebook Page ID</label>
                    <input
                      type="text"
                      placeholder="e.g. 109283746591823"
                      value={manualPageId}
                      onChange={(e) => setManualPageId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-0.5">
                      Page Access Token (Requires publish_video, pages_manage_posts)
                    </label>
                    <input
                      type="password"
                      placeholder="EAA..."
                      value={manualPageToken}
                      onChange={(e) => setManualPageToken(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                {pageVerifyError && (
                  <p className="text-[11px] text-red-400 font-medium">{pageVerifyError}</p>
                )}

                <button
                  type="submit"
                  disabled={isVerifyingPage || !manualPageId.trim() || !manualPageToken.trim()}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={`w-3 h-3 ${isVerifyingPage ? 'animate-spin' : ''}`} />
                  <span>{isVerifyingPage ? 'Verifying with Meta...' : 'Verify & Connect Facebook Page'}</span>
                </button>
              </form>
            )}

            {/* Meta Policy & Scope Notice */}
            <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-900/40 text-[11px] text-blue-200/90 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-blue-300">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Meta Official Policy &amp; Permissions</span>
              </div>
              <p>
                <strong>Authorized Facebook Pages only:</strong> Under Meta Graph API policies, video publishing is permitted exclusively on Facebook Pages where you hold Content Creator or Admin tasks. Personal user profiles are not supported by the Meta API.
              </p>
              <div className="text-[10px] text-blue-300/80 font-mono pt-1">
                Required permissions: <code>pages_manage_posts</code>, <code>pages_read_engagement</code>, <code>publish_video</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
