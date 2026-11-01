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
  HelpCircle,
  Radio,
  Layers,
  ArrowRight,
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

interface FacebookPageItem {
  id: string;
  name: string;
  category: string;
  fanCount: number;
  pictureUrl?: string | null;
  tasks?: string[];
  canPublish: boolean;
  isSelected: boolean;
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
    pageId?: string | null;
    pageName?: string | null;
    category?: string | null;
    fanCount?: number | null;
    pictureUrl?: string | null;
    notice?: string;
    error?: string;
  }>({
    connected: false,
    isConfigured: false,
    status: 'NOT CONFIGURED',
  });

  // Pages retrieved from official Meta OAuth
  const [availablePages, setAvailablePages] = useState<FacebookPageItem[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [isSelectingPage, setIsSelectingPage] = useState(false);
  const [showPageSelector, setShowPageSelector] = useState(false);

  // Diagnostics and guidance modal
  const [diagnosticInfo, setDiagnosticInfo] = useState<{
    title: string;
    message: string;
    missingKeys: string[];
    redirectUri: string;
    portalName: string;
    portalUrl: string;
  } | null>(null);

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
          setSelectedPageId(fbRes.value.pageId);
        }
      }
      if (pagesRes.status === 'fulfilled') {
        const pages = pagesRes.value.pages || [];
        setAvailablePages(pages);
        if (!selectedPageId && pages.length > 0) {
          const selected = pages.find((p) => p.isSelected) || pages[0];
          setSelectedPageId(selected.id);
        }
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
      } else if (event.data?.type === 'FACEBOOK_OAUTH_PAGES_LOADED') {
        setNotificationMsg({
          text: `Retrieved ${event.data.pagesCount || 'manageable'} Facebook Pages! Please select your publishing Page below.`,
          type: 'success',
        });
        setShowPageSelector(true);
        refreshStatuses();
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        setNotificationMsg({
          text: `Authorization failed: ${event.data.error || 'User cancelled login request'}`,
          type: 'error',
        });
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  // 1. One-Click Connect X via Official OAuth 2.0 PKCE
  const handleConnectX = async () => {
    try {
      const res = await api.getXAuthUrl();
      if (!res.isConfigured || !res.url) {
        setDiagnosticInfo({
          title: 'X OAuth 2.0 Client ID Required',
          message:
            res.error ||
            'X_CLIENT_ID is not configured in Netlify Environment Variables. If you recently added it to Netlify, trigger a new deploy (Clear cache and deploy site) so serverless functions can read it.',
          missingKeys: res.missingConfig || ['X_CLIENT_ID'],
          redirectUri: res.redirectUri || `${window.location.origin}/auth/callback`,
          portalName: 'X Developer Portal',
          portalUrl: 'https://developer.x.com/en/portal/dashboard',
        });
        return;
      }
      const popup = window.open(res.url, 'x_oauth_popup', 'width=620,height=750,menubar=no,toolbar=no');
      if (!popup) {
        alert('Please allow popups in your browser to complete X authorization.');
      }
    } catch (e: any) {
      setDiagnosticInfo({
        title: 'Backend Endpoint Notice',
        message: `${e.message}. If you recently added X_CLIENT_ID to Netlify, remember to trigger a new deploy (Deploys > Trigger deploy > Clear cache and deploy site) so functions pick up the new variables.`,
        missingKeys: ['X_CLIENT_ID', 'X_CLIENT_SECRET'],
        redirectUri: `${window.location.origin}/auth/callback`,
        portalName: 'X Developer Portal',
        portalUrl: 'https://developer.x.com/en/portal/dashboard',
      });
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

  // 2. One-Click Connect Facebook via Official Meta OAuth
  const handleConnectFacebookOAuth = async () => {
    try {
      const res = await api.getFacebookAuthUrl();
      if (!res.isConfigured || !res.url) {
        setDiagnosticInfo({
          title: 'Meta Facebook App ID Missing in Netlify',
          message:
            res.error ||
            'META_APP_ID or META_APP_SECRET is not configured in Netlify Environment Variables.',
          missingKeys: res.missingConfig || ['META_APP_ID', 'META_APP_SECRET'],
          redirectUri: res.redirectUri,
          portalName: 'Meta Developer Portal',
          portalUrl: 'https://developers.facebook.com/apps/',
        });
        return;
      }
      const popup = window.open(res.url, 'fb_oauth_popup', 'width=650,height=780,menubar=no,toolbar=no');
      if (!popup) {
        alert('Please allow popups in your browser to complete Facebook Login.');
      }
    } catch (e: any) {
      setDiagnosticInfo({
        title: 'Meta OAuth URL Generation Error',
        message: e.message || 'Could not contact backend Facebook OAuth endpoint.',
        missingKeys: ['META_APP_ID', 'META_APP_SECRET'],
        redirectUri: `${window.location.origin}/auth/facebook/callback`,
        portalName: 'Meta Developer Portal',
        portalUrl: 'https://developers.facebook.com/apps/',
      });
    }
  };

  // 3. Connect Selected Real Facebook Page (Zero manual tokens)
  const handleConnectSelectedPage = async () => {
    if (!selectedPageId) {
      alert('Please select a Facebook Page from the list.');
      return;
    }
    setIsSelectingPage(true);
    try {
      const res = await api.selectFacebookPage(selectedPageId);
      setNotificationMsg({
        text: `Facebook Page "${res.page.name}" successfully connected!`,
        type: 'success',
      });
      setShowPageSelector(false);
      await refreshStatuses();
    } catch (err: any) {
      alert(err.message || 'Failed to connect selected page');
    } finally {
      setIsSelectingPage(false);
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

  // Add Manual Source
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
          {language === 'te' ? 'సోషల్ మీడియా ఖాతాల అనుసంధానం' : 'Official Account Connections'}
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {language === 'te'
            ? 'అధికారిక Meta Graph API మరియు X OAuth 2.0 డైరెక్ట్ లాగిన్. ఎలాంటి మాన్యువల్ టోకెన్లు అవసరం లేదు.'
            : 'One-click direct login with official Meta OAuth & X OAuth 2.0 PKCE. Zero manual tokens or Page IDs required.'}
        </p>
      </div>

      {/* Global Notification Banner */}
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
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{notificationMsg.text}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2-Column Grid: X Connection & Facebook Connection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ================= X / TWITTER CARD ================= */}
        <div className="bg-[#0b0f1a] rounded-2xl border border-slate-800 p-5 space-y-4">
          {/* Header Lockup */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-white shadow-inner">
                <span className="text-xl font-bold font-mono">𝕏</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>X (Twitter) Feed Engine</span>
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  {xAuthStatus.isConnected ? (
                    <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      TOKEN ACTIVE (VERIFIED)
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-400" /> NOT CONNECTED
                    </span>
                  )}
                </div>
              </div>
            </div>

            {xAuthStatus.isConnected ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleConnectX}
                  className="text-xs text-slate-300 hover:text-white py-1 px-2.5 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
                  title="Reconnect with X"
                >
                  Reconnect
                </button>
                <button
                  onClick={handleDisconnectX}
                  className="text-xs text-slate-400 hover:text-red-400 py-1 px-2.5 rounded-lg border border-slate-800 hover:border-red-900/60 transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            ) : null}
          </div>

          {/* Connected Profile Card vs Connect Button */}
          {xAuthStatus.isConnected ? (
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {xAuthStatus.profileImageUrl ? (
                    <img
                      src={xAuthStatus.profileImageUrl}
                      alt={xAuthStatus.username || 'X Profile'}
                      className="w-10 h-10 rounded-full border border-slate-700 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400 font-bold">
                      {(xAuthStatus.username || 'X').substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{xAuthStatus.name || `@${xAuthStatus.username}`}</span>
                      <span className="text-[10px] bg-sky-950 text-sky-400 px-1.5 py-0.2 rounded font-mono">
                        OAuth 2.0 PKCE
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">@{xAuthStatus.username}</p>
                  </div>
                </div>
                <span className="text-[11px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60">
                  Active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
                <div>
                  Following:{' '}
                  <span className="text-white font-bold">{xAuthStatus.followingCount?.toLocaleString() ?? '—'}</span>
                </div>
                <div>
                  Followers:{' '}
                  <span className="text-white font-bold">{xAuthStatus.followersCount?.toLocaleString() ?? '—'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-gradient-to-b from-slate-900/60 to-slate-950 border border-slate-800/90 text-center space-y-3">
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Connect your X account to automatically import accounts you follow into the video news stream and monitor news posts in real time.
              </p>
              <button
                onClick={handleConnectX}
                className="w-full max-w-xs mx-auto py-3 px-5 bg-white hover:bg-slate-100 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg hover:shadow-cyan-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="font-mono text-sm">𝕏</span>
                <span>CONNECT X ACCOUNT</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <p className="text-[10px] text-slate-500 font-mono">
                Secure OAuth 2.0 with PKCE • Zero password sharing • Read-only feed access
              </p>
            </div>
          )}

          {/* Subtabs for Monitored Sources */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                <button
                  onClick={() => setXSubTab('selected')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    xSubTab === 'selected' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Selected ({manualSources.filter((s) => !s.isExcluded).length})
                </button>
                <button
                  onClick={() => setXSubTab('following')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    xSubTab === 'following' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Following ({followingSources.filter((s) => !s.isExcluded).length})
                </button>
                <button
                  onClick={() => setXSubTab('exclusions')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    xSubTab === 'exclusions' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Excluded ({excludedSources.length})
                </button>
              </div>

              {xSubTab === 'following' && xAuthStatus.isConnected && (
                <button
                  onClick={onSyncFollowing}
                  disabled={isSyncingFollowing}
                  className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Resync following list from X"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingFollowing ? 'animate-spin' : ''}`} />
                  <span>Sync Following</span>
                </button>
              )}
            </div>

            {/* Search Filter */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search accounts by handle or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Add Manual Public Source */}
            {xSubTab === 'selected' && (
              <form onSubmit={handleAddSubmit} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2 mb-2">
                <span className="text-[11px] font-bold text-white block">Add Public X Account to Monitor</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="@username or URL"
                    value={newHandle}
                    onChange={(e) => setNewHandle(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as NewsCategory)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Telangana">Telangana</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Politics">Politics</option>
                    <option value="Breaking News">Breaking News</option>
                    <option value="Local News">Local News</option>
                    <option value="National">National</option>
                  </select>
                  <button
                    type="submit"
                    disabled={isSubmittingSource || !newHandle.trim()}
                    className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Source</span>
                  </button>
                </div>
              </form>
            )}

            {/* Source List */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {filteredSources.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  {xSubTab === 'following' && !xAuthStatus.isConnected
                    ? 'Connect your X account above to automatically import followed news accounts.'
                    : 'No accounts found.'}
                </p>
              ) : (
                filteredSources.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {s.avatarUrl ? (
                        <img src={s.avatarUrl} alt={s.handle} className="w-6 h-6 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-cyan-400 font-bold shrink-0">
                          {s.handle.substring(0, 2).toUpperCase()}
                        </div>
                      )}
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
                          className="text-[10px] text-emerald-400 hover:underline px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40 cursor-pointer"
                        >
                          Include
                        </button>
                      ) : (
                        <button
                          onClick={() => onToggleExcludeSource(s.id, true)}
                          className="text-[10px] text-amber-400 hover:underline px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/40 cursor-pointer"
                        >
                          Exclude
                        </button>
                      )}
                      {s.sourceType !== 'following' && (
                        <button
                          onClick={() => onRemoveSource(s.id)}
                          className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                          title="Remove source"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ================= FACEBOOK PAGE CARD ================= */}
        <div className="bg-[#0b0f1a] rounded-2xl border border-slate-800 p-5 space-y-4">
          {/* Header Lockup */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-900/60 border border-blue-700/60 flex items-center justify-center text-blue-400 shadow-inner">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Facebook Page Broadcasting</span>
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  {facebookStatus.connected ? (
                    <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      TOKEN ACTIVE (VERIFIED)
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-400" /> NOT CONNECTED
                    </span>
                  )}
                </div>
              </div>
            </div>

            {facebookStatus.connected ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPageSelector(!showPageSelector)}
                  className="text-xs text-slate-300 hover:text-white py-1 px-2.5 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
                >
                  {showPageSelector ? 'Hide Selector' : 'Switch Page'}
                </button>
                <button
                  onClick={handleConnectFacebookOAuth}
                  className="text-xs text-blue-400 hover:text-blue-300 py-1 px-2.5 rounded-lg border border-blue-800 hover:border-blue-700 transition-colors cursor-pointer"
                  title="Re-authenticate with Meta"
                >
                  Reconnect
                </button>
                <button
                  onClick={handleDisconnectFacebook}
                  className="text-xs text-slate-400 hover:text-red-400 py-1 px-2.5 rounded-lg border border-slate-800 hover:border-red-900/60 transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            ) : null}
          </div>

          {/* Connected Page Display */}
          {facebookStatus.connected && facebookStatus.pageName && !showPageSelector ? (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {facebookStatus.pictureUrl ? (
                    <img
                      src={facebookStatus.pictureUrl}
                      alt={facebookStatus.pageName}
                      className="w-11 h-11 rounded-xl border border-slate-700 object-cover"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-blue-950 border border-blue-700 flex items-center justify-center text-blue-300 font-bold text-sm">
                      FB
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{facebookStatus.pageName}</span>
                      <span className="text-[10px] bg-blue-950 text-blue-400 px-1.5 py-0.2 rounded font-mono">
                        Meta Graph API
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">{facebookStatus.category || 'Media / News Publishing Page'}</p>
                  </div>
                </div>

                <span className="text-[11px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60">
                  Connected
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
                <div>
                  Page ID: <span className="text-white font-bold">{facebookStatus.pageId}</span>
                </div>
                <div>
                  Audience:{' '}
                  <span className="text-white font-bold">
                    {facebookStatus.fanCount ? `${facebookStatus.fanCount.toLocaleString()} followers` : 'Publishing Ready'}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Page Selection Area: Shows whenever pages have been retrieved via OAuth */}
          {showPageSelector || (!facebookStatus.connected && availablePages.length > 0) ? (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-blue-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>Select Target Facebook Page</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{availablePages.length} Pages Available</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {availablePages.map((page) => {
                  const isSelected = selectedPageId === page.id;
                  return (
                    <div
                      key={page.id}
                      onClick={() => setSelectedPageId(page.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-950/50 border-blue-500 shadow-md shadow-blue-500/10'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {page.pictureUrl ? (
                          <img
                            src={page.pictureUrl}
                            alt={page.name}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-700"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-blue-900/40 border border-blue-700/50 flex items-center justify-center text-blue-300 font-bold text-xs shrink-0">
                            FB
                          </div>
                        )}
                        <div className="truncate">
                          <p className="text-xs font-bold text-white truncate">{page.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{page.category}</p>
                          <p className="text-[10px] text-slate-500 font-mono truncate">ID: {page.id}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                        {page.canPublish ? (
                          <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                            <Check className="w-3 h-3" /> Publishing Rights
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-full">
                            Limited Rights
                          </span>
                        )}
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-blue-400 bg-blue-500' : 'border-slate-700 bg-slate-900'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={handleConnectSelectedPage}
                  disabled={isSelectingPage || !selectedPageId}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-lg hover:shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSelectingPage ? 'animate-spin' : ''}`} />
                  <span>{isSelectingPage ? 'Verifying with Meta...' : 'CONNECT SELECTED PAGE'}</span>
                </button>

                <button
                  onClick={handleConnectFacebookOAuth}
                  className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs border border-slate-700 cursor-pointer"
                  title="Login with a different Facebook Account"
                >
                  Switch Account
                </button>
              </div>
            </div>
          ) : !facebookStatus.connected ? (
            /* Direct One-Click Connect Facebook Button (Zero manual tokens) */
            <div className="p-5 rounded-xl bg-gradient-to-b from-blue-950/30 via-slate-900/60 to-slate-950 border border-blue-900/40 text-center space-y-3">
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Log in with your Facebook account. We will automatically fetch all authorized Facebook Pages you manage so you can select your publishing destination with one click.
              </p>
              <button
                onClick={handleConnectFacebookOAuth}
                className="w-full max-w-xs mx-auto py-3 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs transition-all shadow-lg hover:shadow-blue-500/25 cursor-pointer flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>CONNECT FACEBOOK</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <p className="text-[10px] text-slate-500 font-mono">
                Official Meta Graph API v21.0 • No manual Page IDs or Tokens required
              </p>
            </div>
          ) : null}

          {/* Meta Policy & Scope Info */}
          <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-900/40 text-[11px] text-blue-200/90 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-blue-300">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Meta Graph API Compliance</span>
            </div>
            <p>
              Video publishing is permitted exclusively on Facebook Pages where you have Content Creator or Admin permissions. Personal profiles are not supported by the official Meta API.
            </p>
            <div className="text-[10px] text-blue-300/80 font-mono pt-1">
              Required permissions: <code>pages_manage_posts</code>, <code>pages_read_engagement</code>, <code>publish_video</code>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnostics / Guidance Modal for Missing Netlify Credentials */}
      {diagnosticInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0b0f1a] border border-amber-500/50 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5 text-amber-400">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h3 className="text-base font-bold text-white">{diagnosticInfo.title}</h3>
              </div>
              <button
                onClick={() => setDiagnosticInfo(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{diagnosticInfo.message}</p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <p className="font-bold text-amber-400">Required Netlify Environment Variables:</p>
              <div className="space-y-1 font-mono text-[11px] text-cyan-300">
                {diagnosticInfo.missingKeys.map((key) => (
                  <div key={key} className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                    <span>{key}</span>
                    <span className="text-[10px] text-amber-400 font-sans font-semibold">Missing</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <p className="text-slate-400 text-[11px] mb-1 font-bold">Valid OAuth Redirect URI to register:</p>
                <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400">
                  <span className="truncate">{diagnosticInfo.redirectUri}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(diagnosticInfo.redirectUri);
                      alert('Copied Redirect URI to clipboard!');
                    }}
                    className="ml-2 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] cursor-pointer shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href={diagnosticInfo.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Open {diagnosticInfo.portalName}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setDiagnosticInfo(null)}
                className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
