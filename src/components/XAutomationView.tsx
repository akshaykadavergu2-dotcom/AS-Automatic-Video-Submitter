import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Share2,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Play,
  Video,
  ExternalLink,
  ShieldCheck,
  Send,
  Sparkles,
  Clock,
  Layers,
  Settings,
  Tv,
  Eye,
  Filter,
  Check,
  X,
  Radio,
  FileText,
  UserCheck,
  Users,
  UserPlus,
  Zap,
  BarChart2,
  Lock,
  PauseCircle,
  PlayCircle,
  Film,
  Globe,
  Sliders,
  AlertCircle,
  Search,
  Server,
  Power,
  Terminal,
  Cpu,
  Square,
  Activity,
} from 'lucide-react';
import {
  MonitoredSource,
  CollectedXPost,
  AutomationConfig,
  AutomationLog,
  NewsCategory,
  CloudWorkerState,
  CloudWorkerStatus,
} from '../types/news';
import { api } from '../services/api';

export type ControlCentreTab =
  | 'overview'
  | 'selected_accounts'
  | 'my_following'
  | 'collected_posts'
  | 'news_analysis'
  | 'media_processing'
  | 'video_editing'
  | 'facebook_publishing'
  | 'api_usage'
  | 'automation_settings';

interface XAutomationViewProps {
  language: 'te' | 'en';
  onNavigateToTab: (tab: any) => void;
}

export const XAutomationView: React.FC<XAutomationViewProps> = ({
  language,
  onNavigateToTab,
}) => {
  const [activeTab, setActiveTab] = useState<ControlCentreTab>('overview');

  // Data states
  const [sources, setSources] = useState<MonitoredSource[]>([]);
  const [posts, setPosts] = useState<CollectedXPost[]>([]);
  const [config, setConfig] = useState<AutomationConfig | null>(null);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [apiUsage, setApiUsage] = useState<any>(null);

  // 24/7 Cloud Background Worker state
  const [cloudWorkerState, setCloudWorkerState] = useState<CloudWorkerState | null>(null);
  const [isWorkerActionLoading, setIsWorkerActionLoading] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);


  // Operation states
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [isSyncingFollowing, setIsSyncingFollowing] = useState(false);
  const [processingPostId, setProcessingPostId] = useState<string | null>(null);
  const [renderingPostId, setRenderingPostId] = useState<string | null>(null);
  const [publishingPostId, setPublishingPostId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Manual Add Source Form (Username or Profile URL)
  const [sourceInput, setSourceInput] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [sourceCategory, setSourceCategory] = useState<NewsCategory>('Telangana');
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [sourceSearchQuery, setSourceSearchQuery] = useState('');

  // Feed Filter States
  const [feedSourceType, setFeedSourceType] = useState<'all' | 'manual' | 'following'>('all');
  const [feedMediaType, setFeedMediaType] = useState<'all' | 'video' | 'image' | 'text'>('all');
  const [feedStatusFilter, setFeedStatusFilter] = useState<'all' | 'ready' | 'published' | 'collected'>('all');

  // Load all module data
  const loadModuleData = async () => {
    setIsLoading(true);
    try {
      const [sourcesRes, postsRes, configRes, logsRes, authRes, usageRes, workerRes] = await Promise.allSettled([
        api.getXSources(),
        api.getXPosts(),
        api.getXAutomationConfig(),
        api.getXAutomationLogs(),
        api.getXAuthStatus(),
        api.getXUsage(),
        api.getCloudWorkerStatus(),
      ]);

      if (sourcesRes.status === 'fulfilled') setSources(sourcesRes.value.sources || []);
      if (postsRes.status === 'fulfilled') setPosts(postsRes.value.posts || []);
      if (configRes.status === 'fulfilled') setConfig(configRes.value.config || null);
      if (logsRes.status === 'fulfilled') setLogs(logsRes.value.logs || []);
      if (authRes.status === 'fulfilled') setAuthStatus(authRes.value || null);
      if (usageRes.status === 'fulfilled') setApiUsage(usageRes.value.usage || null);
      if (workerRes.status === 'fulfilled' && workerRes.value.state) {
        setCloudWorkerState(workerRes.value.state);
        if (workerRes.value.state.nextScheduledRunAt && workerRes.value.state.status === 'RUNNING') {
          const diffMs = new Date(workerRes.value.state.nextScheduledRunAt).getTime() - Date.now();
          setCountdownSeconds(Math.max(0, Math.floor(diffMs / 1000)));
        }
      }
    } catch (err: any) {
      console.error('Error loading X automation data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCloudWorkerStatus = async () => {
    try {
      const res = await api.getCloudWorkerStatus();
      if (res.success && res.state) {
        setCloudWorkerState(res.state);
        if (res.state.nextScheduledRunAt && res.state.status === 'RUNNING') {
          const diffMs = new Date(res.state.nextScheduledRunAt).getTime() - Date.now();
          setCountdownSeconds(Math.max(0, Math.floor(diffMs / 1000)));
        } else {
          setCountdownSeconds(null);
        }
      }
    } catch (e) {
      console.warn('Could not poll cloud worker state:', e);
    }
  };

  useEffect(() => {
    loadModuleData();
    // Poll cloud worker heartbeat every 6 seconds so user sees live cloud state without refreshing
    const pollInterval = setInterval(() => {
      loadCloudWorkerStatus();
    }, 6000);
    return () => clearInterval(pollInterval);
  }, []);

  // Tick countdown every second
  useEffect(() => {
    if (countdownSeconds === null || countdownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdownSeconds]);


  // OAuth popup listener
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setActionNotice('X account successfully connected via OAuth!');
        loadModuleData();
        setTimeout(() => setActionNotice(null), 4000);
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  // Connect X OAuth Popup
  const handleConnectXOAuth = async () => {
    try {
      const res = await api.getXAuthUrl();
      const authWindow = window.open(
        res.url,
        'x_oauth_popup',
        'width=600,height=720,menubar=no,toolbar=no'
      );
      if (!authWindow) {
        alert('దయచేసి పాప్‌అప్‌లను అనుమతించండి (Please allow popups to connect X account).');
      }
    } catch (e: any) {
      alert(`OAuth URL generation failed: ${e.message}`);
    }
  };

  const handleDisconnectX = async () => {
    if (confirm('X ఖాతాను డిస్‌కనెక్ట్ చేయాలా? (Disconnect X account?)')) {
      await api.disconnectXAuth();
      loadModuleData();
    }
  };

  // 24/7 Cloud Worker Controls

  const handleStartCloudWorker = async () => {
    setIsWorkerActionLoading(true);
    setActionNotice(null);
    try {
      const res = await api.startCloudWorker();
      setCloudWorkerState(res.state);
      setActionNotice('క్లౌడ్ ఆటోమేషన్ విజయవంతంగా ప్రారంభించబడింది! బ్రౌజర్ క్లోజ్ చేసినా బ్యాక్‌గ్రౌండ్‌లో 24/7 రన్ అవుతుంది.');
      await loadModuleData();
      setTimeout(() => setActionNotice(null), 5000);
    } catch (e: any) {
      alert(`Start failed: ${e.message}`);
    } finally {
      setIsWorkerActionLoading(false);
    }
  };

  const handleStopCloudWorker = async () => {
    if (!confirm('క్లౌడ్ ఆటోమేషన్‌ను ఆపాలనుకుంటున్నారా? (Are you sure you want to STOP cloud automation?)')) {
      return;
    }
    setIsWorkerActionLoading(true);
    setActionNotice(null);
    try {
      const res = await api.stopCloudWorker();
      setCloudWorkerState(res.state);
      setActionNotice('క్లౌడ్ వర్కర్ నిలిపివేయబడింది. చురుకుగా ఉన్న ప్రక్రియ పూర్తయి షెడ్యూలింగ్ ఆపబడింది.');
      await loadModuleData();
      setTimeout(() => setActionNotice(null), 5000);
    } catch (e: any) {
      alert(`Stop failed: ${e.message}`);
    } finally {
      setIsWorkerActionLoading(false);
    }
  };

  const handleTriggerManualCycle = async () => {
    setIsWorkerActionLoading(true);
    setActionNotice('క్లౌడ్ రన్ సైకిల్ ప్రారంభించబడింది...');
    try {
      const res = await api.triggerCloudWorkerCycle();
      setCloudWorkerState(res.state);
      setActionNotice('క్లౌడ్ కలెక్షన్ సైకిల్ విజయవంతంగా పూర్తయింది!');
      await loadModuleData();
      setTimeout(() => setActionNotice(null), 5000);
    } catch (e: any) {
      alert(`Cycle execution failed: ${e.message}`);
    } finally {
      setIsWorkerActionLoading(false);
    }
  };

  // Trigger Poller
  const handleTriggerPoll = async () => {
    setIsPolling(true);

    setActionNotice(null);
    try {
      const res = await api.pollXPosts();
      if (res.paused) {
        alert('ఆటోమేషన్ పాజ్ చేయబడింది (Global Automation is currently paused).');
      } else {
        setActionNotice(
          `పోలింగ్ పూర్తయింది! ${res.newPostsCount} కొత్త అర్హత గల వార్తలు సేకరించబడ్డాయి.`
        );
      }
      loadModuleData();
      setTimeout(() => setActionNotice(null), 5000);
    } catch (e: any) {
      alert(`Polling error: ${e.message}`);
    } finally {
      setIsPolling(false);
    }
  };

  // Sync Following List
  const handleSyncFollowing = async () => {
    setIsSyncingFollowing(true);
    setActionNotice(null);
    try {
      const res = await api.syncXFollowing();
      setActionNotice(
        `ఫాలోయింగ్ సింక్ పూర్తయింది! మొత్తం ఖాతాలు: ${res.syncedCount}, కొత్తగా చేరినవి: +${res.newAccountsAdded}`
      );
      loadModuleData();
      setTimeout(() => setActionNotice(null), 5000);
    } catch (e: any) {
      alert(`Following sync error: ${e.message}`);
    } finally {
      setIsSyncingFollowing(false);
    }
  };

  // Add Manual Source
  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceInput.trim()) return;
    setIsAddingSource(true);
    try {
      await api.addXSource({
        handle: sourceInput,
        name: sourceName || undefined,
        category: sourceCategory,
      });
      setSourceInput('');
      setSourceName('');
      loadModuleData();
      setActionNotice('కొత్త X ఖాతా విజయవంతంగా జోడించబడింది!');
      setTimeout(() => setActionNotice(null), 4000);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsAddingSource(false);
    }
  };

  // Toggle Source Active/Paused
  const handleToggleSourceActive = async (id: string, currentState: boolean) => {
    try {
      await api.toggleXSource(id, !currentState);
      setSources((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive: !currentState } : s))
      );
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Exclude / Include following account
  const handleToggleExclude = async (id: string) => {
    try {
      const res = await api.toggleExcludeXSource(id);
      setSources((prev) => prev.map((s) => (s.id === id ? res.source : s)));
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Delete Source
  const handleDeleteSource = async (id: string) => {
    if (confirm('ఈ సోర్స్‌ను తొలగించాలా? (Delete this source?)')) {
      try {
        await api.deleteXSource(id);
        setSources((prev) => prev.filter((s) => s.id !== id));
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  // Gemini AI Script on demand
  const handleProcessGemini = async (postId: string) => {
    setProcessingPostId(postId);
    try {
      const res = await api.processXPost(postId);
      setPosts((prev) => prev.map((p) => (p.id === postId ? res.post : p)));
    } catch (e: any) {
      alert(`Gemini analysis error: ${e.message}`);
    } finally {
      setProcessingPostId(null);
    }
  };

  // FFmpeg Branded Video Render on demand
  const handleRenderVideo = async (postId: string, aspectRatio: '16:9' | '9:16') => {
    setRenderingPostId(postId);
    try {
      const res = await api.renderXPostVideo(postId, aspectRatio);
      setActionNotice(`FFmpeg ${aspectRatio} రెండరింగ్ పూర్తయింది!`);
      loadModuleData();
      setTimeout(() => setActionNotice(null), 4000);
    } catch (e: any) {
      alert(`Video render error: ${e.message}`);
    } finally {
      setRenderingPostId(null);
    }
  };

  // Approve & Publish to Facebook
  const handleApprovePublish = async (postId: string) => {
    setPublishingPostId(postId);
    try {
      await api.approveXPostToFacebook(postId);
      setActionNotice('ఫేస్‌బుక్ పేజీలో విజయవంతంగా పబ్లిష్ చేయబడింది!');
      loadModuleData();
      setTimeout(() => setActionNotice(null), 5000);
    } catch (e: any) {
      alert(`Publish error: ${e.message}`);
    } finally {
      setPublishingPostId(null);
    }
  };

  // Reject Post
  const handleRejectPost = async (postId: string) => {
    try {
      await api.rejectXPost(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status: 'rejected' } : p))
      );
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Update Rights Status
  const handleUpdateRights = async (
    postId: string,
    rightsStatus: 'eligible' | 'requires_permission' | 'restricted'
  ) => {
    try {
      const res = await api.updateXPostRights(postId, rightsStatus);
      setPosts((prev) => prev.map((p) => (p.id === postId ? res.post : p)));
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Save Automation Config
  const handleSaveConfig = async (newConf: Partial<AutomationConfig>) => {
    try {
      const res = await api.saveXAutomationConfig(newConf);
      setConfig(res.config);
      setActionNotice('ఆటోమేషన్ కాన్ఫిగరేషన్ భద్రపరచబడింది!');
      setTimeout(() => setActionNotice(null), 3000);
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Computed metrics
  const processedPostsCount = posts.filter(
    (p) => p.status === 'ai_ready' || p.status === 'ready_for_review' || p.status === 'published'
  ).length;
  const videoCandidatesCount = posts.filter((p) => p.hasMedia && p.mediaType === 'video').length;
  const publishedVideosCount = posts.filter((p) => p.status === 'published').length;

  const manualSources = sources.filter((s) => s.sourceType === 'manual' || s.sourceType === 'both');
  const followingSources = sources.filter((s) => s.sourceType === 'following' || s.sourceType === 'both');

  // Filtered collected posts
  const filteredPosts = posts.filter((p) => {
    const matchesSource =
      feedSourceType === 'all' ||
      (feedSourceType === 'manual' && (p.sourceType === 'manual' || p.sourceType === 'both')) ||
      (feedSourceType === 'following' && (p.sourceType === 'following' || p.sourceType === 'both'));

    const matchesMedia =
      feedMediaType === 'all' ||
      (feedMediaType === 'video' && p.mediaType === 'video') ||
      (feedMediaType === 'image' && p.mediaType === 'image') ||
      (feedMediaType === 'text' && p.mediaType === 'text_only');

    const matchesStatus =
      feedStatusFilter === 'all' ||
      (feedStatusFilter === 'ready' && (p.status === 'ai_ready' || p.status === 'ready_for_review')) ||
      (feedStatusFilter === 'published' && p.status === 'published') ||
      (feedStatusFilter === 'collected' && p.status === 'collected');

    return matchesSource && matchesMedia && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Control Centre Master Banner */}
      <div className="bg-gradient-to-r from-[#141d2e] via-[#0f172a] to-[#111927] border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-600 via-rose-700 to-indigo-700 text-white shadow-lg">
              <Zap className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl lg:text-2xl font-black text-white font-telugu">
                  X మానిటరింగ్ కంట్రోల్ సెంటర్
                </h1>
                <span className="text-xs font-bold text-red-400 bg-red-950/80 px-2 py-0.5 rounded-full border border-red-800">
                  DUAL SOURCE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Praja Sanketam X News Collection &amp; Meta Publishing Pipeline • Selected Accounts + Following List
              </p>
            </div>
          </div>
        </div>

        {/* Global Pause Switch & Quick Action */}
        <div className="flex items-center gap-3">
          {config && (
            <button
              onClick={() => handleSaveConfig({ isGlobalPaused: !config.isGlobalPaused })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                config.isGlobalPaused
                  ? 'bg-amber-950 text-amber-300 border-amber-700 animate-pulse'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Global pause stops all automatic polling and background renderers"
            >
              {config.isGlobalPaused ? (
                <>
                  <PauseCircle className="w-4 h-4 text-amber-400" />
                  <span>ఆటోమేషన్ పాజ్ చేయబడింది (Paused)</span>
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 text-emerald-400" />
                  <span>ఆటోమేషన్ లైవ్ (Active)</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleTriggerPoll}
            disabled={isPolling || config?.isGlobalPaused}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-red-950/50 cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin' : ''}`} />
            <span className="font-telugu">ఇప్పుడే పోల్ చేయండి (Poll Now)</span>
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionNotice && (
        <div className="bg-emerald-950/70 border border-emerald-800 text-emerald-300 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-bold font-telugu animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Recommended Dashboard Design: Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-telugu">
              మూలాల రకాలు (Source Types)
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">2</span>
              <span className="text-xs text-red-400 font-bold font-telugu">ఖాతాలు + ఫాలోయింగ్</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-red-600/20 text-red-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-telugu">
              ప్రాసెస్ చేసిన వార్తలు (Processed Posts)
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{processedPostsCount}</span>
              <span className="text-xs text-amber-400 font-bold font-telugu">AI స్క్రిప్టెడ్</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-telugu">
              వీడియో అభ్యర్థులు (Video Candidates)
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{videoCandidatesCount}</span>
              <span className="text-xs text-blue-400 font-bold font-telugu">ఫుటేజ్ గుర్తించబడింది</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-blue-600/20 text-blue-400">
            <Film className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-telugu">
              ప్రచురితమైన వీడియోలు (Published Videos)
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{publishedVideosCount}</span>
              <span className="text-xs text-emerald-400 font-bold font-telugu">ఫేస్‌బుక్ లైవ్</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-600/20 text-emerald-400">
            <Share2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 10 Separate Tabs Navigation Bar */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'overview' as ControlCentreTab, labelTe: '1. ఓవర్‌వ్యూ', labelEn: '1. Overview', icon: Tv },
          { id: 'selected_accounts' as ControlCentreTab, labelTe: '2. ఎంపిక చేసిన ఖాతాలు', labelEn: '2. Selected Accounts', icon: UserPlus, count: manualSources.length },
          { id: 'my_following' as ControlCentreTab, labelTe: '3. నా ఫాలోయింగ్ లిస్ట్', labelEn: '3. My Following', icon: Users, count: followingSources.length },
          { id: 'collected_posts' as ControlCentreTab, labelTe: '4. సేకరించిన వార్తలు', labelEn: '4. Collected Feed', icon: Radio, count: posts.length },
          { id: 'news_analysis' as ControlCentreTab, labelTe: '5. AI న్యూస్ విశ్లేషణ', labelEn: '5. News Analysis', icon: Sparkles },
          { id: 'media_processing' as ControlCentreTab, labelTe: '6. మీడియా & హక్కులు', labelEn: '6. Media & Rights', icon: ShieldCheck },
          { id: 'video_editing' as ControlCentreTab, labelTe: '7. వీడియో ఎడిటింగ్ క్యూ', labelEn: '7. Video Editing', icon: Video },
          { id: 'facebook_publishing' as ControlCentreTab, labelTe: '8. ఫేస్‌బుక్ పబ్లిషింగ్', labelEn: '8. Facebook Publish', icon: Share2 },
          { id: 'api_usage' as ControlCentreTab, labelTe: '9. API బడ్జెట్ & లాగ్స్', labelEn: '9. API Usage & Logs', icon: BarChart2 },
          { id: 'automation_settings' as ControlCentreTab, labelTe: '10. ఆటోమేషన్ సెట్టింగ్స్', labelEn: '10. Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className={language === 'te' ? 'font-telugu' : 'font-sans'}>
                {language === 'te' ? tab.labelTe : tab.labelEn}
              </span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OVERVIEW */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* PRAJA SANKETAM CLOUD AUTOMATION START / STOP MASTER CONTROL */}
          <div
            className={`border rounded-2xl p-6 shadow-2xl transition-all relative overflow-hidden ${
              cloudWorkerState?.status === 'RUNNING'
                ? 'bg-gradient-to-br from-[#0c1c1a] via-[#0f172a] to-[#111c2e] border-emerald-500/50 shadow-emerald-950/30'
                : 'bg-gradient-to-br from-[#1c1214] via-[#0f172a] to-[#161922] border-red-500/40 shadow-red-950/20'
            }`}
          >
            {/* Top Bar: Title & Live Server Status Badge */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
              <div className="flex items-center gap-3.5">
                <div
                  className={`p-3 rounded-2xl border shadow-inner ${
                    cloudWorkerState?.status === 'RUNNING'
                      ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400'
                      : 'bg-red-950/80 border-red-500/40 text-red-400'
                  }`}
                >
                  <Cpu className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg lg:text-xl font-black text-white font-telugu">
                      ప్రజా సంకేతం క్లౌడ్ ఆటోమేషన్ కంట్రోల్
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-700/60">
                      24/7 CLOUD RUN WORKER
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans mt-0.5">
                    Cloud Background Worker controls monitoring independently of the website or mobile browser.
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase border shadow-lg ${
                    cloudWorkerState?.status === 'RUNNING'
                      ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600 shadow-emerald-950/50'
                      : cloudWorkerState?.status === 'STARTING' || cloudWorkerState?.status === 'STOPPING'
                      ? 'bg-amber-950/90 text-amber-300 border-amber-600'
                      : 'bg-slate-900 text-slate-300 border-slate-700'
                  }`}
                >
                  {cloudWorkerState?.status === 'RUNNING' ? (
                    <>
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                      <span className="font-sans font-bold">RUNNING</span>
                      <span className="font-telugu text-[11px] font-normal text-emerald-400">
                        (క్లౌడ్‌లో నడుస్తోంది)
                      </span>
                    </>
                  ) : cloudWorkerState?.status === 'STARTING' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>STARTING...</span>
                    </>
                  ) : cloudWorkerState?.status === 'STOPPING' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>STOPPING...</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                      <span className="font-sans font-bold text-red-400">STOPPED</span>
                      <span className="font-telugu text-[11px] font-normal text-slate-400">
                        (ఆపబడింది)
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Main Action Control Buttons Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5 pb-5">
              {/* Big START Button */}
              <button
                onClick={handleStartCloudWorker}
                disabled={cloudWorkerState?.status === 'RUNNING' || isWorkerActionLoading}
                className={`relative group overflow-hidden rounded-2xl p-4 text-left transition-all border cursor-pointer ${
                  cloudWorkerState?.status === 'RUNNING'
                    ? 'bg-emerald-950/20 border-emerald-900/50 opacity-60 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-400/50 shadow-xl shadow-emerald-950/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-white/10 text-white shrink-0 group-hover:scale-105 transition-transform">
                    <Play className="w-6 h-6 fill-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-emerald-200 block">
                      ACTIVATE CLOUD ENGINE
                    </span>
                    <h3 className="text-base font-black text-white font-telugu">
                      START ఆటోమేషన్ ప్రారంభించండి
                    </h3>
                    <p className="text-[11px] text-emerald-100/80 mt-0.5">
                      {cloudWorkerState?.status === 'RUNNING'
                        ? 'ఆటోమేషన్ ప్రస్తుతం చురుకుగా ఉంది (Active)'
                        : 'ఖాతాలు & ఫాలోయింగ్ మానిటరింగ్ మొదలుపెట్టండి'}
                    </p>
                  </div>
                </div>
              </button>

              {/* Big STOP Button */}
              <button
                onClick={handleStopCloudWorker}
                disabled={cloudWorkerState?.status === 'STOPPED' || isWorkerActionLoading}
                className={`relative group overflow-hidden rounded-2xl p-4 text-left transition-all border cursor-pointer ${
                  cloudWorkerState?.status === 'STOPPED'
                    ? 'bg-slate-900/40 border-slate-800 opacity-60 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 via-rose-700 to-red-800 hover:from-red-500 hover:to-rose-600 text-white border-red-500/50 shadow-xl shadow-red-950/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-white/10 text-white shrink-0 group-hover:scale-105 transition-transform">
                    <Square className="w-6 h-6 fill-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-rose-200 block">
                      HALT BACKGROUND MONITORING
                    </span>
                    <h3 className="text-base font-black text-white font-telugu">
                      STOP ఆటోమేషన్ ఆపండి
                    </h3>
                    <p className="text-[11px] text-rose-100/80 mt-0.5">
                      కొత్త పోస్ట్‌ల సేకరణను సురక్షితంగా నిలిపివేయండి
                    </p>
                  </div>
                </div>
              </button>

              {/* Immediate Cycle Trigger */}
              <button
                onClick={handleTriggerManualCycle}
                disabled={isWorkerActionLoading}
                className="relative group overflow-hidden rounded-2xl p-4 text-left transition-all border bg-slate-900/90 hover:bg-slate-800/90 text-white border-slate-700/80 shadow-lg cursor-pointer flex items-center gap-3"
              >
                <div className="p-3 rounded-xl bg-slate-800 text-cyan-400 shrink-0 group-hover:scale-105 transition-transform border border-slate-700">
                  <RefreshCw className={`w-6 h-6 ${isWorkerActionLoading ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-cyan-300 block">
                    MANUAL SYNC OVERRIDE
                  </span>
                  <h3 className="text-sm font-black text-white font-telugu">
                    ఇప్పుడే రన్ చేయండి (Run Now)
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    టైమర్‌తో సంబంధం లేకుండా తక్షణమే కలెక్షన్ &amp; AI రన్ చేయండి
                  </p>
                </div>
              </button>
            </div>

            {/* Live Telemetry Status Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80">
              {/* Account Connection */}
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-telugu">
                    X ఖాతా కనెక్షన్ (Account Connection)
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        authStatus?.authenticated ? 'bg-emerald-400' : 'bg-red-400'
                      }`}
                    ></span>
                    <span className="text-xs font-bold text-white">
                      {authStatus?.authenticated
                        ? `@${authStatus.username || 'PrajaSanketamNews'}`
                        : 'కనెక్ట్ కాలేదు (Disconnected)'}
                    </span>
                  </div>
                </div>
                {!authStatus?.authenticated ? (
                  <button
                    onClick={handleConnectXOAuth}
                    className="text-[11px] font-bold text-red-400 hover:text-red-300 underline font-telugu cursor-pointer"
                  >
                    కనెక్ట్ చేయండి
                  </button>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                    OAUTH OK
                  </span>
                )}
              </div>

              {/* Next Scheduled Run */}
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-telugu">
                  తదుపరి పోలింగ్ షెడ్యూల్ (Next Cycle)
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300 font-mono">
                    {cloudWorkerState?.status === 'RUNNING'
                      ? countdownSeconds !== null
                        ? `మరింత ${Math.floor(countdownSeconds / 60)}నిమి ${countdownSeconds % 60}సెకన్లలో`
                        : 'త్వరలో నడుస్తుంది...'
                      : 'ఆపబడింది (Worker Stopped)'}
                  </span>
                </div>
              </div>

              {/* Current Active Task */}
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-telugu">
                  సర్వర్ టాస్క్ స్టేటస్ (Current Task)
                </span>
                <div className="flex items-center gap-2 mt-1 truncate">
                  <Activity
                    className={`w-3.5 h-3.5 shrink-0 ${
                      cloudWorkerState?.currentExecutingJob ? 'text-emerald-400 animate-pulse' : 'text-slate-500'
                    }`}
                  />
                  <span className="text-xs font-mono text-slate-200 truncate">
                    {cloudWorkerState?.currentExecutingJob || 'వేచి ఉంది (Idle / Listening)'}
                  </span>
                </div>
              </div>

              {/* Last Successful Cycle */}
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-telugu">
                  చివరి కలెక్షన్ సమయం (Last Execution)
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-mono text-slate-300">
                    {cloudWorkerState?.lastRunAt
                      ? new Date(cloudWorkerState.lastRunAt).toLocaleTimeString()
                      : 'ఇంకా జరగలేదు'}
                  </span>
                </div>
              </div>
            </div>

            {/* Cloud Worker 24/7 Guarantee Banner */}
            <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-telugu">
                  <strong>క్లౌడ్ హామీ:</strong> ఈ ఆటోమేషన్ క్లౌడ్ సర్వర్‌లో స్వతంత్రంగా నడుస్తుంది.
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  వెబ్‌సైట్ మూసివేసినా నడుస్తుంది
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  మొబైల్ ఆఫ్ చేసినా ఆగదు
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ఆటోమేటిక్ రీ-స్టార్ట్
                </span>
              </div>
            </div>
          </div>

          {/* Architecture Visual Summary */}
          <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">

            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-telugu flex items-center gap-2">
              <Tv className="w-4 h-4 text-red-500" />
              <span>ప్రజా సంకేతం X మానిటరింగ్ ఆర్కిటెక్చర్ (Unified Ingest Engine)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-red-400 uppercase block font-mono">STEP 1: SOURCES</span>
                <h4 className="text-xs font-bold text-white font-telugu mt-1">ద్వివిధ మూలాలు</h4>
                <p className="text-[11px] text-slate-400 mt-1">ఎంపిక చేసిన ఖాతాలు + కనెక్ట్ చేసిన ఫాలోయింగ్ లిస్ట్</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-amber-400 uppercase block font-mono">STEP 2: INGEST</span>
                <h4 className="text-xs font-bold text-white font-telugu mt-1">యూనిఫైడ్ కలెక్షన్</h4>
                <p className="text-[11px] text-slate-400 mt-1">డూప్లికేట్ నిరోధకత, మీడియా గుర్తింపు &amp; హక్కుల చెక్</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-blue-400 uppercase block font-mono">STEP 3: GEMINI AI</span>
                <h4 className="text-xs font-bold text-white font-telugu mt-1">తెలుగు న్యూస్ ప్యాకేజ్</h4>
                <p className="text-[11px] text-slate-400 mt-1">క్రిస్ప్ హెడ్‌లైన్లు, యాంకర్ స్క్రిప్ట్, 3-పదాల టైటిల్</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-indigo-400 uppercase block font-mono">STEP 4: FFMPEG</span>
                <h4 className="text-xs font-bold text-white font-telugu mt-1">వీడియో ఎడిటింగ్</h4>
                <p className="text-[11px] text-slate-400 mt-1">ప్రజా సంకేతం లోగో, ఫ్రేమ్‌లు &amp; టిక్కర్ ఓవర్‌లే (16:9/9:16)</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-emerald-400 uppercase block font-mono">STEP 5: META FB</span>
                <h4 className="text-xs font-bold text-white font-telugu mt-1">ఫేస్‌బుక్ బ్రాడ్‌కాస్ట్</h4>
                <p className="text-[11px] text-slate-400 mt-1">గ్రాఫ్ API ద్వారా వీడియో &amp; డిస్క్రిప్షన్ అప్‌లోడ్</p>
              </div>
            </div>
          </div>

          {/* Quick Dual Sources Overview Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-red-400" />
                  <h4 className="text-xs font-bold text-white uppercase font-telugu">
                    ఎంపిక చేసిన ఖాతాలు ({manualSources.length})
                  </h4>
                </div>
                <button
                  onClick={() => setActiveTab('selected_accounts')}
                  className="text-xs text-red-400 hover:underline font-telugu"
                >
                  నిర్వహించండి →
                </button>
              </div>
              <p className="text-xs text-slate-400 font-telugu">
                మీరు మాన్యువల్‌గా యూజర్‌నేమ్ లేదా ప్రొఫైల్ URL ద్వారా జోడించిన ఖాతాలు. నిరంతరం మానిటర్ చేయబడతాయి.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {manualSources.slice(0, 5).map((s) => (
                  <span key={s.id} className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                    @{s.handle}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <h4 className="text-xs font-bold text-white uppercase font-telugu">
                    కనెక్ట్ చేసిన ఫాలోయింగ్ లిస్ట్ ({followingSources.length})
                  </h4>
                </div>
                <button
                  onClick={() => setActiveTab('my_following')}
                  className="text-xs text-purple-400 hover:underline font-telugu"
                >
                  సింక్ చూడండి →
                </button>
              </div>
              <p className="text-xs text-slate-400 font-telugu">
                మీ X ఖాతా ఫాలోయింగ్ లిస్ట్ ప్రతి 24 గంటలకు ఆటోమేటిక్‌గా సింక్ అవుతుంది. కొత్త ఖాతాలు ఆటోమేటిక్‌గా చేరతాయి.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {followingSources.slice(0, 5).map((s) => (
                  <span key={s.id} className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                    @{s.handle}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: SELECTED X ACCOUNTS (MANUAL) */}
      {/* ======================================================== */}
      {activeTab === 'selected_accounts' && (
        <div className="space-y-6">
          {/* Add Account by Username or Profile URL Form */}
          <form
            onSubmit={handleAddSource}
            className="bg-[#0f1624] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4"
          >
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <UserPlus className="w-4 h-4 text-red-500" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-telugu">
                కొత్త X ఖాతాను మాన్యువల్‌గా జోడించండి (Add Selected Account)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  X Username or Profile URL
                </label>
                <input
                  type="text"
                  value={sourceInput}
                  onChange={(e) => setSourceInput(e.target.value)}
                  placeholder="e.g. TelanganaCMO or https://x.com/TelanganaCMO"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="e.g. CMO Telangana Official"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1 font-telugu">
                  కేటగిరీ (Category)
                </label>
                <select
                  value={sourceCategory}
                  onChange={(e) => setSourceCategory(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500 cursor-pointer"
                >
                  <option value="Telangana">తెలంగాణ</option>
                  <option value="Andhra Pradesh">ఆంధ్రప్రదేశ్</option>
                  <option value="Politics">రాజకీయాలు</option>
                  <option value="National">జాతీయం</option>
                  <option value="Breaking News">బ్రేకింగ్ న్యూస్</option>
                  <option value="Local News">స్థానిక వార్తలు</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isAddingSource}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="font-telugu">జాబితాలో చేర్చండి (Add Account)</span>
              </button>
            </div>
          </form>

          {/* Selected Accounts Table */}
          <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-telugu">
                ఎంపిక చేసిన ఖాతాలు ({manualSources.length})
              </h3>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={sourceSearchQuery}
                  onChange={(e) => setSourceSearchQuery(e.target.value)}
                  placeholder="ఖాతాను శోధించండి..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">ఖాతా &amp; హ్యాండిల్</th>
                    <th className="py-3 px-4">మూలం రకం</th>
                    <th className="py-3 px-4">కేటగిరీ</th>
                    <th className="py-3 px-4">సేకరణ</th>
                    <th className="py-3 px-4">మానిటరింగ్ స్థితి</th>
                    <th className="py-3 px-4 text-right">చర్య</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {manualSources
                    .filter((s) =>
                      !sourceSearchQuery ||
                      s.handle.toLowerCase().includes(sourceSearchQuery.toLowerCase()) ||
                      s.name.toLowerCase().includes(sourceSearchQuery.toLowerCase())
                    )
                    .map((s) => (
                      <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white">
                              {s.handle.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white">{s.name}</span>
                                {s.isVerified && (
                                  <span className="w-3 h-3 rounded-full bg-blue-500 text-[8px] text-white flex items-center justify-center font-bold">
                                    ✓
                                  </span>
                                )}
                              </div>
                              <a
                                href={s.profileUrl || `https://x.com/${s.handle}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] font-mono text-slate-400 hover:text-white inline-flex items-center gap-1"
                              >
                                <span>@{s.handle}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-900/60 text-[10px] uppercase font-mono">
                            {s.sourceType}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300">
                            {s.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-300">
                          {s.postsCollectedCount || 0} posts
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleSourceActive(s.id, s.isActive)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                              s.isActive
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {s.isActive ? 'Active (పాజ్ చేయండి)' : 'Paused (యాక్టివేట్ చేయండి)'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteSource(s.id)}
                            className="text-slate-600 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: MY FOLLOWING (X OAUTH FOLLOWING LIST SYNC) */}
      {/* ======================================================== */}
      {activeTab === 'my_following' && (
        <div className="space-y-6">
          {/* Sync Header Bar */}
          <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-telugu flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>కనెక్ట్ చేసిన X ఖాతా ఫాలోయింగ్ లిస్ట్ ఆటోమేషన్</span>
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Automatically synchronizes your following list every 24 hours. Unfollowed accounts are deactivated automatically.
              </p>
              {config?.lastFollowingSyncAt && (
                <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                  చివరి సింక్: {new Date(config.lastFollowingSyncAt).toLocaleString()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncFollowing}
                disabled={isSyncingFollowing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFollowing ? 'animate-spin' : ''}`} />
                <span className="font-telugu">
                  {isSyncingFollowing ? 'సింక్ అవుతోంది...' : 'ఇప్పుడే ఫాలోయింగ్ సింక్ చేయండి'}
                </span>
              </button>
            </div>
          </div>

          {/* Following Accounts Table */}
          <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase font-telugu">
                ఫాలోయింగ్ మూలాలు ({followingSources.length})
              </h4>
              <span className="text-xs text-slate-500">
                Individual accounts can be paused or excluded from news collection.
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">ఖాతా</th>
                    <th className="py-3 px-4">రకం</th>
                    <th className="py-3 px-4">కేటగిరీ</th>
                    <th className="py-3 px-4">మినహాయింపు (Exclude)</th>
                    <th className="py-3 px-4 text-right">స్థితి</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {followingSources.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white">
                            {s.handle.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{s.name}</span>
                            <span className="text-[11px] font-mono text-slate-400">@{s.handle}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-900/60 text-[10px] font-mono uppercase">
                          {s.sourceType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300">
                          {s.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleExclude(s.id)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                            s.isExcluded
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {s.isExcluded ? 'మినహాయించబడింది (Excluded)' : 'చేర్చబడింది (Included)'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`text-[10px] font-bold font-mono ${
                            s.isActive && !s.isExcluded ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                        >
                          {s.isActive && !s.isExcluded ? 'MONITORING' : 'INACTIVE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: COLLECTED POSTS FEED */}
      {/* ======================================================== */}
      {activeTab === 'collected_posts' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase font-telugu">మూలం:</span>
              {(['all', 'manual', 'following'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFeedSourceType(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize cursor-pointer transition-colors ${
                    feedSourceType === st
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'all' ? 'అన్నీ' : st}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase font-telugu">మీడియా:</span>
              {(['all', 'video', 'image', 'text'] as const).map((mt) => (
                <button
                  key={mt}
                  onClick={() => setFeedMediaType(mt)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize cursor-pointer transition-colors ${
                    feedMediaType === mt
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {mt}
                </button>
              ))}
            </div>
          </div>

          {/* Cards */}
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-[#0f1624] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">@{post.authorHandle}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {post.sourceType}
                    </span>
                    {post.isBreakingNews && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-600 text-white uppercase">
                        BREAKING
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(post.createdAt).toLocaleTimeString()}
                  </span>
                </div>

                <p className="text-sm text-slate-200 font-telugu bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                  {post.text}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>{post.sourceAttribution}</span>
                  <button
                    onClick={() => handleProcessGemini(post.id)}
                    className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer"
                  >
                    AI విశ్లేషణ చేయండి →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: NEWS ANALYSIS (GEMINI AI SCRIPTING & FACT CHECKS) */}
      {/* ======================================================== */}
      {activeTab === 'news_analysis' && (
        <div className="space-y-4">
          <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-telugu flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>జెమిని AI వార్తా విశ్లేషణ &amp; సంపాదకీయ సమీక్ష డెస్క్</span>
            </h3>

            <div className="space-y-4">
              {posts
                .filter((p) => p.geminiResult)
                .map((post) => (
                  <div
                    key={post.id}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-red-400 font-telugu">
                          [{post.category}]
                        </span>
                        <h4 className="text-base font-bold text-white font-telugu">
                          {post.geminiResult?.headlineTelugu}
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 font-mono">
                        {post.geminiResult?.threeWordThumbnailTitle}
                      </span>
                    </div>

                    {/* Unverified Claim Warning for Human Review */}
                    {post.requiresHumanReview && (
                      <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-300 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span className="font-telugu">
                          సంపాదకీయ పరిశీలన అవసరం: ఈ కథనంలో పేర్కొన్న వివరాలను ప్రసారానికి ముందు నిర్ధారించుకోండి.
                        </span>
                      </div>
                    )}

                    <div className="text-xs text-slate-300 font-telugu bg-slate-950 p-3 rounded-xl border border-slate-800 whitespace-pre-line">
                      [యాంకర్ ప్రసార స్క్రిప్ట్]: {post.geminiResult?.anchorScriptTelugu}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex gap-2">
                        {post.geminiResult?.verticalHashtags.slice(0, 4).map((h, i) => (
                          <span key={i} className="text-xs text-indigo-400 font-mono">
                            {h}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => handleRenderVideo(post.id, '16:9')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>వీడియో ఎడిటింగ్ క్యూకి పంపు →</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: MEDIA PROCESSING & RIGHTS CHECK */}
      {/* ======================================================== */}
      {activeTab === 'media_processing' && (
        <div className="space-y-4">
          <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-telugu flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>మీడియా అర్హత &amp; కాపీరైట్ అనుమతుల ధృవీకరణ డెస్క్</span>
              </h3>
              <span className="text-xs text-slate-500">
                Rule: Never publish unauthorized third-party footage
              </span>
            </div>

            <div className="space-y-3">
              {posts
                .filter((p) => p.hasMedia)
                .map((post) => (
                  <div
                    key={post.id}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-telugu">
                          @{post.authorHandle}: {post.text.slice(0, 50)}...
                        </span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {post.mediaType}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {post.rightsNote || 'Public Information Statement'}
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                        {post.sourceAttribution}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={post.rightsStatus}
                        onChange={(e) => handleUpdateRights(post.id, e.target.value as any)}
                        className="bg-slate-950 border border-slate-700 text-xs font-semibold text-slate-200 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
                      >
                        <option value="eligible">అర్హత కలిగినది (Eligible)</option>
                        <option value="requires_permission">అనుమతి అవసరం (Requires Permission)</option>
                        <option value="restricted">నిషేధించబడినది (Restricted)</option>
                      </select>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 7: VIDEO EDITING QUEUE */}
      {/* ======================================================== */}
      {activeTab === 'video_editing' && (
        <div className="space-y-4">
          <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-telugu flex items-center gap-2">
              <Video className="w-4 h-4 text-blue-400" />
              <span>FFmpeg బ్రాండెడ్ వీడియో ప్రొడక్షన్ క్యూ (1080p Landscape &amp; Vertical)</span>
            </h3>

            <div className="space-y-3">
              {posts
                .filter((p) => p.renderedVideo169Url || p.renderedVideo916Url || p.status === 'rendering_video')
                .map((post) => (
                  <div
                    key={post.id}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white font-telugu">
                        {post.geminiResult?.headlineTelugu || post.text.slice(0, 60)}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                        Source: @{post.authorHandle} • Branding: Praja Sanketam Red/Gold
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {post.renderedVideo169Url && (
                        <a
                          href={post.renderedVideo169Url}
                          download
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                        >
                          🎬 16:9 MP4
                        </a>
                      )}
                      {post.renderedVideo916Url && (
                        <a
                          href={post.renderedVideo916Url}
                          download
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                        >
                          📱 9:16 Shorts
                        </a>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 8: FACEBOOK PUBLISHING */}
      {/* ======================================================== */}
      {activeTab === 'facebook_publishing' && (
        <div className="space-y-4">
          <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-telugu flex items-center gap-2">
              <Share2 className="w-4 h-4 text-indigo-400" />
              <span>అధికారిక మెటా ఫేస్‌బుక్ పేజీ ప్రసార హిస్టరీ &amp; షెడ్యూలింగ్</span>
            </h3>

            <div className="space-y-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-telugu">
                        {post.geminiResult?.headlineTelugu || post.text.slice(0, 60)}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase ${
                          post.status === 'published'
                            ? 'bg-emerald-950 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {post.status}
                      </span>
                    </div>
                    {post.facebookPublishResult?.postUrl && (
                      <a
                        href={post.facebookPublishResult.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400 underline text-xs font-mono mt-1 inline-flex items-center gap-1"
                      >
                        <span>View Facebook Broadcast</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {post.status !== 'published' && post.geminiResult && (
                    <button
                      onClick={() => handleApprovePublish(post.id)}
                      disabled={publishingPostId === post.id}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                    >
                      అప్రూవ్ &amp; ఫేస్‌బుక్‌లో పబ్లిష్ చేయండి
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 9: API USAGE & LOGS */}
      {/* ======================================================== */}
      {activeTab === 'api_usage' && (
        <div className="space-y-6">
          {/* Usage Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">X API Requests Today</span>
              <span className="text-2xl font-black text-white font-mono mt-1 block">
                {apiUsage?.xApiRequestsToday || 0} / {apiUsage?.xApiDailyLimit || 500}
              </span>
            </div>

            <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">Following Sync Calls</span>
              <span className="text-2xl font-black text-white font-mono mt-1 block">
                {apiUsage?.followingSyncRequestsToday || 0}
              </span>
            </div>

            <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">Gemini Tokens Used</span>
              <span className="text-2xl font-black text-white font-mono mt-1 block">
                {(apiUsage?.geminiTokensUsedToday || 0).toLocaleString()}
              </span>
            </div>

            <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">Meta Graph Calls</span>
              <span className="text-2xl font-black text-white font-mono mt-1 block">
                {apiUsage?.metaGraphCallsToday || 0}
              </span>
            </div>
          </div>

          {/* Logs */}
          <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <h4 className="text-xs font-bold text-white uppercase font-telugu">
              సిస్టమ్ ఆడిట్ లాగ్స్ ({logs.length})
            </h4>
            <div className="max-h-80 overflow-y-auto space-y-2 font-mono text-xs pr-1">
              {logs.map((log) => (
                <div key={log.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-800 uppercase font-bold">
                      {log.stage}
                    </span>
                    <span className="text-slate-200">{log.message}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 10: AUTOMATION SETTINGS */}
      {/* ======================================================== */}
      {activeTab === 'automation_settings' && config && (
        <div className="space-y-6">
          {/* Cloud Worker Quick Toggle Banner */}
          <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white font-telugu">
                  24/7 క్లౌడ్ వర్కర్ లైవ్‌స్టేటస్ (Google Cloud Run Worker)
                </h3>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Current State:{' '}
                <strong
                  className={
                    cloudWorkerState?.status === 'RUNNING'
                      ? 'text-emerald-400'
                      : 'text-red-400'
                  }
                >
                  {cloudWorkerState?.status || 'STOPPED'}
                </strong>{' '}
                • Independent cloud service runs whether website is open or closed.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleStartCloudWorker}
                disabled={cloudWorkerState?.status === 'RUNNING' || isWorkerActionLoading}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold font-telugu cursor-pointer flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>START ఆటోమేషన్</span>
              </button>

              <button
                onClick={handleStopCloudWorker}
                disabled={cloudWorkerState?.status === 'STOPPED' || isWorkerActionLoading}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-bold font-telugu cursor-pointer flex items-center gap-1.5"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>STOP ఆటోమేషన్</span>
              </button>
            </div>
          </div>

          <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-telugu flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-400" />
              <span>ఆటోమేషన్ నిబంధనలు &amp; గ్లోబల్ కంట్రోల్స్</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 block font-telugu">
                  మోడ్ (Publishing Mode)
                </label>
                <select
                  value={config.mode}
                  onChange={(e) => handleSaveConfig({ mode: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="manual_approval">జర్నలిస్ట్ అప్రూవల్ మోడ్ (Manual Approval - Recommended)</option>
                  <option value="auto_publish">ఆటో-పైలట్ మోడ్ (Auto-Publish Direct to Meta)</option>
                </select>
                <span className="text-[10px] text-slate-500 block">
                  {config.mode === 'manual_approval'
                    ? 'AI మరియు వీడియో రెడీ అయ్యాక జర్నలిస్ట్ సమీక్ష కోసం వేచి ఉంటుంది.'
                    : 'అర్హత గల వీడియోలు ఆటోమేటిక్‌గా ఫేస్‌బుక్‌లో పోస్ట్ చేయబడతాయి.'}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 block font-telugu">
                  న్యూస్ పోలింగ్ సమయం (Polling Interval)
                </label>
                <select
                  value={config.pollIntervalMinutes}
                  onChange={(e) => handleSaveConfig({ pollIntervalMinutes: parseInt(e.target.value, 10) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                >
                  <option value={5}>ప్రతి 5 నిమిషాలకు (Every 5 mins)</option>
                  <option value={15}>ప్రతి 15 నిమిషాలకు (Every 15 mins)</option>
                  <option value={30}>ప్రతి 30 నిమిషాలకు (Every 30 mins)</option>
                  <option value={60}>ప్రతి 1 గంటకు (Every 1 hour)</option>
                </select>
                <span className="text-[10px] text-slate-500 block">
                  క్లౌడ్ వర్కర్ X సోర్స్‌లను ఎంత సమయానికి ఒకసారి చెక్ చేయాలో నిర్ణయించండి.
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 block font-telugu">
                  ఫాలోయింగ్ సింక్ ఫ్రీక్వెన్సీ (Following Sync Interval)
                </label>
                <select
                  value={config.followingSyncIntervalHours || 6}
                  onChange={(e) => handleSaveConfig({ followingSyncIntervalHours: parseInt(e.target.value, 10) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                >
                  <option value={1}>ప్రతి గంటకు ఒకసారి (Every 1 hour)</option>
                  <option value={6}>ప్రతి 6 గంటలకు ఒకసారి (Every 6 hours - Recommended)</option>
                  <option value={12}>ప్రతి 12 గంటలకు ఒకసారి (Every 12 hours)</option>
                  <option value={24}>రోజుకు ఒకసారి (Once daily)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 block font-telugu">
                  రోజువారీ పోస్ట్ బడ్జెట్ పరిమితి (Daily Post Budget)
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={config.dailyPostBudgetLimit || 25}
                  onChange={(e) => handleSaveConfig({ dailyPostBudgetLimit: parseInt(e.target.value, 10) || 25 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
                <span className="text-[10px] text-slate-500 block">
                  రోజుకు గరిష్టంగా ఎన్ని వీడియోలు లేదా పోస్ట్‌లు ప్రాసెస్ చేయాలో పరిమితి విధించండి.
                </span>
              </div>
            </div>

            {/* Video Format Generation Toggles */}
            <div className="border-t border-slate-800 pt-5 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase font-telugu">
                వీడియో ఫార్మాట్ ఎంపికలు (Video Output Toggles)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={config.generateLandscape169}
                    onChange={(e) => handleSaveConfig({ generateLandscape169: e.target.checked })}
                    className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">లాండ్‌స్కేప్ 16:9 (Landscape HD)</span>
                    <span className="text-[11px] text-slate-400 block">
                      1920x1080 ఫేస్‌బుక్ వీడియో ఫీడ్ మరియు యూట్యూబ్ కోసం
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={config.generateVertical916}
                    onChange={(e) => handleSaveConfig({ generateVertical916: e.target.checked })}
                    className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">వర్టికల్ 9:16 (Vertical Reels / Stories)</span>
                    <span className="text-[11px] text-slate-400 block">
                      1080x1920 ఫేస్‌బుక్ రీల్స్ మరియు మొబైల్ ఫీడ్ కోసం
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Trust and Verification Filter */}
            <div className="border-t border-slate-800 pt-5 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase font-telugu">
                విశ్వసనీయత &amp; ఫిల్టర్ నిబంధనలు (Safety &amp; Verification)
              </h4>
              <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={config.autoPublishOnlyVerifiedGov || false}
                  onChange={(e) => handleSaveConfig({ autoPublishOnlyVerifiedGov: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-white block font-telugu">
                    ధృవీకరించబడిన ఖాతాలు మాత్రమే (Verified / Official Sources Only)
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    అధికారిక ప్రభుత్వ మరియు ధృవీకరించబడిన మీడియా సంస్థల నుండి వచ్చే వార్తలను మాత్రమే ఆటో-పబ్లిష్ చేయండి.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
