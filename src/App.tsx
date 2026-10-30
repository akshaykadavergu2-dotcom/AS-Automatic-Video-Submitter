/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ASWelcomeScreen } from './components/ASWelcomeScreen';
import { ASHeader, ASNavTab } from './components/ASHeader';
import { ASHomeView } from './components/ASHomeView';
import { ASConnectionsView } from './components/ASConnectionsView';
import { ASAutomationView } from './components/ASAutomationView';
import { ASAnalysisView } from './components/ASAnalysisView';
import { ASActivityHistoryView } from './components/ASActivityHistoryView';
import { SettingsView } from './components/SettingsView';
import { AiWriterView } from './components/AiWriterView';
import { VideoStudioView } from './components/VideoStudioView';
import { TeleprompterModal } from './components/TeleprompterModal';
import { NewsTickerBar } from './components/NewsTickerBar';
import {
  NewsDraft,
  VideoRenderJob,
  StudioSettings,
  CollectedXPost,
  MonitoredSource,
  AutomationConfig,
  CloudWorkerState,
  NewsCategory,
} from './types/news';
import { api } from './services/api';
import { ArrowLeft, Sparkles, Video, Radio } from 'lucide-react';

const defaultStudioSettings: StudioSettings = {
  channelName: 'AS – AUTOMATIC VIDEO SUBMITTER',
  channelNameTelugu: 'ప్రజా సంకేతం ఆటోమేషన్ స్టూడియో',
  tagline: 'Connect • Automate • Edit • Publish',
  primaryColor: '#06b6d4',
  accentColor: '#ec4899',
  tickerSpeed: 25,
  logoUrl: '/assets/praja_sanketam_logo.svg',
  landscapeFrameUrl: '/assets/frames/landscape_frame.svg',
  verticalFrameUrl: '/assets/frames/vertical_frame.svg',
  metaConfig: {
    isConfigured: false,
    appId: '',
    appSecret: '',
    pageId: '',
    pageName: '',
    pageAccessToken: '',
  },
  xConfig: {
    isConfigured: false,
    apiKey: '',
    apiSecret: '',
    bearerToken: '',
  },
  renderQuality: '1080p',
  fps: 30,
};

export default function App() {
  // Welcome screen modal state (persistent via localStorage)
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(() => {
    try {
      return localStorage.getItem('as_intro_seen') !== 'true';
    } catch {
      return true;
    }
  });

  const [activeTab, setActiveTab] = useState<ASNavTab>('home');
  const [studioTool, setStudioTool] = useState<null | 'writer' | 'video' | 'teleprompter'>(null);
  const [language, setLanguage] = useState<'te' | 'en'>('te');

  // Core Data
  const [sources, setSources] = useState<MonitoredSource[]>([]);
  const [posts, setPosts] = useState<CollectedXPost[]>([]);
  const [automationConfig, setAutomationConfig] = useState<AutomationConfig | null>(null);
  const [cloudWorkerState, setCloudWorkerState] = useState<CloudWorkerState | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [isWorkerActionLoading, setIsWorkerActionLoading] = useState(false);
  const [isSyncingFollowing, setIsSyncingFollowing] = useState(false);

  // Studio Sub-tools Data
  const [drafts, setDrafts] = useState<NewsDraft[]>([]);
  const [jobs, setJobs] = useState<VideoRenderJob[]>([]);
  const [settings, setSettings] = useState<StudioSettings>(defaultStudioSettings);
  const [currentDraft, setCurrentDraft] = useState<NewsDraft | null>(null);

  // Teleprompter Modal
  const [isTeleprompterOpen, setIsTeleprompterOpen] = useState(false);
  const [teleprompterScript, setTeleprompterScript] = useState('');
  const [teleprompterTitle, setTeleprompterTitle] = useState('');

  // Initial Data Ingestion
  const loadInitialData = useCallback(async () => {
    try {
      const [
        sourcesRes,
        postsRes,
        configRes,
        workerRes,
        draftsRes,
        jobsRes,
        settingsRes,
      ] = await Promise.allSettled([
        api.getXSources(),
        api.getXPosts(),
        api.getXAutomationConfig(),
        api.getCloudWorkerStatus(),
        api.getDrafts(),
        api.getJobs(),
        api.getSettings(),
      ]);

      if (sourcesRes.status === 'fulfilled') setSources(sourcesRes.value.sources || []);
      if (postsRes.status === 'fulfilled') setPosts(postsRes.value.posts || []);
      if (configRes.status === 'fulfilled') setAutomationConfig(configRes.value.config || null);
      if (workerRes.status === 'fulfilled' && workerRes.value.state) {
        setCloudWorkerState(workerRes.value.state);
        if (workerRes.value.state.nextScheduledRunAt && workerRes.value.state.status === 'RUNNING') {
          const diffMs = new Date(workerRes.value.state.nextScheduledRunAt).getTime() - Date.now();
          setCountdownSeconds(Math.max(0, Math.floor(diffMs / 1000)));
        }
      }
      if (draftsRes.status === 'fulfilled') {
        setDrafts(draftsRes.value.drafts || []);
        if (!currentDraft && draftsRes.value.drafts?.length > 0) {
          setCurrentDraft(draftsRes.value.drafts[0]);
        }
      }
      if (jobsRes.status === 'fulfilled') setJobs(jobsRes.value.jobs || []);
      if (settingsRes.status === 'fulfilled') setSettings(settingsRes.value.settings);
    } catch (err) {
      console.error('Failed to load initial studio data:', err);
    }
  }, [currentDraft]);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Poll cloud worker status & countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          // Refresh status on zero
          api.getCloudWorkerStatus().then((res) => {
            if (res.state) {
              setCloudWorkerState(res.state);
              if (res.state.nextScheduledRunAt && res.state.status === 'RUNNING') {
                const diffMs = new Date(res.state.nextScheduledRunAt).getTime() - Date.now();
                return Math.max(0, Math.floor(diffMs / 1000));
              }
            }
          }).catch(() => {});
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Poll video rendering jobs if active
  useEffect(() => {
    const hasActiveJobs = jobs.some((j) => j.status === 'processing' || j.status === 'pending');
    if (!hasActiveJobs) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.getJobs();
        setJobs(res.jobs);
      } catch (e) {
        // silent
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [jobs]);

  // Actions for Cloud Background Worker
  const handleStartWorker = async () => {
    setIsWorkerActionLoading(true);
    try {
      const res = await api.startCloudWorker();
      if (res.success && res.state) {
        setCloudWorkerState(res.state);
        setCountdownSeconds(300); // 5 min default countdown
      }
    } catch (err: any) {
      alert(err.message || 'Failed to start cloud background worker');
    } finally {
      setIsWorkerActionLoading(false);
    }
  };

  const handleStopWorker = async () => {
    setIsWorkerActionLoading(true);
    try {
      const res = await api.stopCloudWorker();
      if (res.success && res.state) {
        setCloudWorkerState(res.state);
        setCountdownSeconds(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to stop cloud background worker');
    } finally {
      setIsWorkerActionLoading(false);
    }
  };

  const handleRunInstantCycle = async () => {
    setIsWorkerActionLoading(true);
    try {
      const res = await api.triggerCloudWorkerCycle();
      if (res.success && res.state) {
        setCloudWorkerState(res.state);
        // Refresh posts & sources
        const [postsRes, sourcesRes] = await Promise.all([api.getXPosts(), api.getXSources()]);
        setPosts(postsRes.posts || []);
        setSources(sourcesRes.sources || []);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to run cloud worker cycle');
    } finally {
      setIsWorkerActionLoading(false);
    }
  };

  // Actions for X Sources & Following
  const handleAddSource = async (handle: string, name: string, category: NewsCategory) => {
    const res = await api.addXSource({ handle, name, category });
    if (res.success && res.source) {
      setSources((prev) => [res.source, ...prev]);
    }
  };

  const handleRemoveSource = async (id: string) => {
    await api.deleteXSource(id);
    setSources((prev) => prev.filter((s) => s.id !== id));
  };

  const handleToggleExcludeSource = async (id: string, isExcluded: boolean) => {
    const res = await api.toggleExcludeXSource(id);
    if (res.success && res.source) {
      setSources((prev) => prev.map((s) => (s.id === id ? res.source : s)));
    }
  };

  const handleSyncFollowing = async () => {
    setIsSyncingFollowing(true);
    try {
      await api.syncXFollowing();
      const sourcesRes = await api.getXSources();
      setSources(sourcesRes.sources || []);
    } catch (err: any) {
      alert(err.message || 'Failed to sync following accounts');
    } finally {
      setIsSyncingFollowing(false);
    }
  };

  const handleUpdateConfig = async (newConfig: AutomationConfig) => {
    const res = await api.saveXAutomationConfig(newConfig);
    if (res.success) {
      setAutomationConfig(res.config);
    }
  };

  const handlePublishPost = async (postId: string) => {
    const res = await api.approveXPostToFacebook(postId);
    if (res.success) {
      const postsRes = await api.getXPosts();
      setPosts(postsRes.posts || []);
    }
  };

  const handleRetryPost = async (postId: string) => {
    const res = await api.processXPost(postId);
    if (res.success) {
      const postsRes = await api.getXPosts();
      setPosts(postsRes.posts || []);
    }
  };

  // Studio Sub-Tool Handlers
  const handleOpenStudioTool = (tool: 'writer' | 'video' | 'teleprompter') => {
    if (tool === 'teleprompter') {
      setTeleprompterScript(
        currentDraft?.anchorScriptTelugu ||
          'నమస్కారం, ప్రజా సంకేతం వార్తలకు స్వాగతం. నేటి ముఖ్యాంశాలు...'
      );
      setTeleprompterTitle(currentDraft?.headlineTelugu || 'ప్రజా సంకేతం లైవ్ బులెటిన్');
      setIsTeleprompterOpen(true);
    } else {
      setStudioTool(tool);
    }
  };

  const handleSaveDraft = async (draft: NewsDraft) => {
    const res = await api.saveDraft(draft);
    setDrafts((prev) => {
      const idx = prev.findIndex((d) => d.id === draft.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = res.draft;
        return next;
      }
      return [res.draft, ...prev];
    });
    setCurrentDraft(res.draft);
  };

  const handleGenerateAi = async (params: { rawNews: string; category: string; tone?: string }) => {
    return api.generateNews(params);
  };

  const handleUploadMedia = async (file: File) => {
    return api.uploadMedia(file);
  };

  const handleStartRender = async (config: any) => {
    const res = await api.startRender(config);
    const jobsRes = await api.getJobs();
    setJobs(jobsRes.jobs);
    return res;
  };

  const activeTickerText =
    currentDraft?.tickerLineTelugu ||
    posts[0]?.geminiResult?.tickerLineTelugu ||
    'బ్రేకింగ్: AS ఆటోమేటిక్ వీడియో సబ్మిటర్ 24/7 క్లౌడ్ ఆటోమేషన్ రన్ అవుతోంది • 𝕏 వార్తల సేకరణ, జెమిని AI విశ్లేషణ మరియు ఫేస్‌బుక్ లైవ్ ప్రసారాలు';

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* 1. Fullscreen Animated Welcome Screen */}
      {showWelcomeScreen && (
        <ASWelcomeScreen
          onEnter={() => setShowWelcomeScreen(false)}
          onSkip={() => {
            try {
              localStorage.setItem('as_intro_seen', 'true');
            } catch {}
            setShowWelcomeScreen(false);
          }}
        />
      )}

      {/* 2. Top Bar Navigation (AS – Automatic Video Submitter) */}
      <ASHeader
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setStudioTool(null);
          setActiveTab(tab);
        }}
        language={language}
        onToggleLanguage={() => setLanguage((prev) => (prev === 'te' ? 'en' : 'te'))}
        onReplayIntro={() => setShowWelcomeScreen(true)}
        cloudWorkerState={cloudWorkerState}
        onStartWorker={handleStartWorker}
        onStopWorker={handleStopWorker}
        isWorkerActionLoading={isWorkerActionLoading}
      />

      {/* 3. Live Broadcast Marquee Ticker */}
      <NewsTickerBar
        tickerText={activeTickerText}
        language={language}
        onTickerClick={() => {
          setStudioTool('video');
        }}
      />

      {/* 4. Main Content Canvas */}
      <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-12 bg-gradient-to-b from-[#070a13] via-[#090d18] to-[#060810] overflow-y-auto">
        {/* If user opened a deep manual studio tool */}
        {studioTool ? (
          <div className="space-y-4 max-w-6xl mx-auto">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setStudioTool(null)}
                className="flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to AS Automation Dashboard</span>
              </button>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span>Active Studio Tool:</span>
                <span className="text-white font-bold capitalize">{studioTool}</span>
              </div>
            </div>

            {studioTool === 'writer' && (
              <AiWriterView
                currentDraft={currentDraft}
                onUpdateDraft={setCurrentDraft}
                onSaveDraft={handleSaveDraft}
                onGenerateAi={handleGenerateAi}
                onNavigateToTab={() => {}}
                onOpenTeleprompter={(script, title) => {
                  setTeleprompterScript(script);
                  setTeleprompterTitle(title);
                  setIsTeleprompterOpen(true);
                }}
                language={language}
              />
            )}

            {studioTool === 'video' && (
              <VideoStudioView
                currentDraft={currentDraft}
                settings={settings}
                jobs={jobs}
                onStartRender={handleStartRender}
                onUploadMedia={handleUploadMedia}
                onNavigateToTab={() => {}}
                language={language}
              />
            )}
          </div>
        ) : (
          <>
            {activeTab === 'home' && (
              <ASHomeView
                language={language}
                onNavigateToTab={setActiveTab}
                onOpenStudioTool={handleOpenStudioTool}
                cloudWorkerState={cloudWorkerState}
                onStartWorker={handleStartWorker}
                onStopWorker={handleStopWorker}
                isWorkerActionLoading={isWorkerActionLoading}
                countdownSeconds={countdownSeconds}
                posts={posts}
              />
            )}

            {activeTab === 'connections' && (
              <ASConnectionsView
                language={language}
                sources={sources}
                onAddSource={handleAddSource}
                onRemoveSource={handleRemoveSource}
                onToggleExcludeSource={handleToggleExcludeSource}
                onSyncFollowing={handleSyncFollowing}
                isSyncingFollowing={isSyncingFollowing}
              />
            )}

            {activeTab === 'automation' && (
              <ASAutomationView
                language={language}
                cloudWorkerState={cloudWorkerState}
                onStartWorker={handleStartWorker}
                onStopWorker={handleStopWorker}
                onRunInstantCycle={handleRunInstantCycle}
                isWorkerActionLoading={isWorkerActionLoading}
                countdownSeconds={countdownSeconds}
                config={automationConfig}
                onUpdateConfig={handleUpdateConfig}
              />
            )}

            {activeTab === 'analysis' && (
              <ASAnalysisView
                language={language}
                posts={posts}
                cloudWorkerState={cloudWorkerState}
              />
            )}

            {activeTab === 'activity' && (
              <ASActivityHistoryView
                language={language}
                posts={posts}
                onPublishPost={handlePublishPost}
                onRetryPost={handleRetryPost}
                onNavigateToTab={setActiveTab}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                settings={settings}
                onUpdateSettings={setSettings}
                language={language}
              />
            )}
          </>
        )}
      </main>

      {/* 5. Fullscreen Studio Teleprompter Mode */}
      <TeleprompterModal
        isOpen={isTeleprompterOpen}
        onClose={() => setIsTeleprompterOpen(false)}
        scriptText={teleprompterScript}
        title={teleprompterTitle}
      />
    </div>
  );
}
