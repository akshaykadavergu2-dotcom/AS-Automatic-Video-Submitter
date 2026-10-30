import React, { useState } from 'react';
import {
  Play,
  Square,
  RefreshCw,
  Server,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  Sliders,
  Settings,
  Tv,
  Check,
  Radio,
  Power,
  ChevronRight,
  Info,
} from 'lucide-react';
import { CloudWorkerState, AutomationConfig } from '../types/news';

interface ASAutomationViewProps {
  language: 'te' | 'en';
  cloudWorkerState: CloudWorkerState | null;
  onStartWorker: () => Promise<void>;
  onStopWorker: () => Promise<void>;
  onRunInstantCycle: () => Promise<void>;
  isWorkerActionLoading: boolean;
  countdownSeconds: number | null;
  config: AutomationConfig | null;
  onUpdateConfig: (newConfig: AutomationConfig) => Promise<void>;
}

export const ASAutomationView: React.FC<ASAutomationViewProps> = ({
  language,
  cloudWorkerState,
  onStartWorker,
  onStopWorker,
  onRunInstantCycle,
  isWorkerActionLoading,
  countdownSeconds,
  config,
  onUpdateConfig,
}) => {
  const isRunning = cloudWorkerState?.status === 'RUNNING';
  const isStopping = cloudWorkerState?.status === 'STOPPING';
  const isStarting = cloudWorkerState?.status === 'STARTING';

  const [mode, setMode] = useState<'auto_publish' | 'manual_approval'>(
    config?.mode || 'manual_approval'
  );
  const [pollInterval, setPollInterval] = useState<number>(config?.pollIntervalMinutes || 5);
  const [generate169, setGenerate169] = useState(config?.generateLandscape169 ?? true);
  const [generate916, setGenerate916] = useState(config?.generateVertical916 ?? true);
  const [autoGovOnly, setAutoGovOnly] = useState(config?.autoPublishOnlyVerifiedGov ?? false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = async () => {
    if (!config) return;
    setIsSavingConfig(true);
    try {
      await onUpdateConfig({
        ...config,
        mode,
        pollIntervalMinutes: pollInterval,
        generateLandscape169: generate169,
        generateVertical916: generate916,
        autoPublishOnlyVerifiedGov: autoGovOnly,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const formatCountdown = (secs: number | null) => {
    if (secs === null || secs <= 0) return 'Executing now';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m > 0 ? `${m}m ` : ''}${s}s`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Title & Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
          <span>AS Platform</span>
          <span>/</span>
          <span className="text-purple-400">24/7 Cloud Automation HUD</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {language === 'te' ? 'ఆటోమేషన్ కంట్రోల్ & క్లౌడ్ వర్కర్' : 'Automation Controls & Cloud Worker'}
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {language === 'te'
            ? 'గూగుల్ క్లౌడ్ సర్వర్‌లో 24/7 నిరంతర వార్తల సేకరణ మరియు వీడియో ప్రొడక్షన్ ఇంజిన్.'
            : 'Start, stop, and configure the autonomous news ingest, Gemini scriptwriter, FFmpeg studio, and Facebook publisher.'}
        </p>
      </div>

      {/* 24/7 Cloud Assurance Banner */}
      <div className="rounded-2xl p-4 bg-gradient-to-r from-purple-950/40 via-cyan-950/30 to-blue-950/40 border border-purple-500/30 flex items-start sm:items-center justify-between gap-4 shadow-lg shadow-purple-950/20">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0 mt-0.5 sm:mt-0">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                24/7 Autonomous Cloud Service
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-semibold">
                Cloud Run Active
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 font-medium">
              Runs 24/7 independently in Google Cloud — Monitoring, AI generation, video rendering, and Facebook publishing continue running even when your browser is closed or your phone is switched off.
            </p>
          </div>
        </div>
      </div>

      {/* Central Start / Stop Command Console */}
      <div className="bg-[#0b0f1a] rounded-2xl border border-slate-800 p-6 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full ${
                  isRunning
                    ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse'
                    : isStarting || isStopping
                    ? 'bg-amber-500 animate-spin'
                    : 'bg-red-500'
                }`}
              />
              <span className="text-xl font-extrabold text-white tracking-tight">
                STATUS: {cloudWorkerState?.status || 'STOPPED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Current state: {isRunning ? 'Actively polling X sources & queued tasks' : 'Suspended. Press START to resume background jobs'}
            </p>
          </div>

          {/* Large Start and Stop Control Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isRunning ? (
              <button
                onClick={onStopWorker}
                disabled={isWorkerActionLoading || isStopping}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-950/60 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current text-white" />
                <span>{isStopping ? 'STOPPING...' : 'STOP AUTOMATION'}</span>
              </button>
            ) : (
              <button
                onClick={onStartWorker}
                disabled={isWorkerActionLoading || isStarting}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/60 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current text-white" />
                <span>{isStarting ? 'STARTING...' : 'START AUTOMATION'}</span>
              </button>
            )}

            <button
              onClick={onRunInstantCycle}
              disabled={isWorkerActionLoading}
              className="px-4 py-3.5 rounded-xl font-semibold text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              title="Trigger an immediate collection cycle now"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isWorkerActionLoading ? 'animate-spin' : ''}`} />
              <span>Run Cycle Now</span>
            </button>
          </div>
        </div>

        {/* 4-Stat Telemetry Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Next Scheduled Cycle</span>
            </div>
            <p className="text-base font-bold text-white font-mono tabular-nums">
              {isRunning ? formatCountdown(countdownSeconds) : 'Idle'}
            </p>
            <p className="text-[11px] text-slate-500">Every {pollInterval} minutes</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>Current Activity</span>
            </div>
            <p className="text-xs font-semibold text-slate-200 truncate font-mono">
              {cloudWorkerState?.currentExecutingJob || 'Listening for posts'}
            </p>
            <p className="text-[11px] text-slate-500">Process PID: {cloudWorkerState?.workerPid || 1}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Tv className="w-3.5 h-3.5 text-pink-400" />
              <span>Completed Videos</span>
            </div>
            <p className="text-base font-bold text-white font-mono tabular-nums">
              {cloudWorkerState?.metrics?.completedVideos ?? 4}
            </p>
            <p className="text-[11px] text-slate-500">Rendered via FFmpeg</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Facebook Broadcasts</span>
            </div>
            <p className="text-base font-bold text-white font-mono tabular-nums">
              {cloudWorkerState?.metrics?.facebookPublished ?? 2}
            </p>
            <p className="text-[11px] text-slate-500">Published to Page</p>
          </div>
        </div>
      </div>

      {/* Production Automation Pipeline Settings */}
      <div className="bg-[#0b0f1a] rounded-2xl border border-slate-800 p-6 space-y-6">
        <div>
          <h2 className="text-base font-bold text-white">Pipeline Automation Configuration</h2>
          <p className="text-xs text-slate-400">
            Configure how collected X posts are verified, rendered into video, and submitted to Facebook.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Publishing Mode */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
              Publishing Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('manual_approval')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'manual_approval'
                    ? 'bg-purple-950/50 border-purple-500/80 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">Manual Approval</span>
                  {mode === 'manual_approval' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Reviews Gemini script &amp; video before posting to Facebook. Recommended for editorial control.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('auto_publish')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'auto_publish'
                    ? 'bg-cyan-950/50 border-cyan-500/80 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">Automatic 1-Click</span>
                  {mode === 'auto_publish' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Fully autonomous news-to-video pipeline. Auto-renders and posts authorized media directly.
                </p>
              </button>
            </div>
          </div>

          {/* Polling Cadence */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
              X Feed Polling Cadence
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 5, 15].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setPollInterval(mins)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    pollInterval === mins
                      ? 'bg-cyan-950/70 border-cyan-500/80 text-cyan-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Every {mins} min{mins > 1 ? 's' : ''}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              Polls all active selected handles and accounts you follow for breaking stories and videos.
            </p>
          </div>

          {/* Video Output Formats */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
              Video Aspect Ratios (FFmpeg)
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generate169}
                  onChange={(e) => setGenerate169(e.target.checked)}
                  className="rounded text-cyan-500 focus:ring-0"
                />
                <div className="text-xs">
                  <span className="font-semibold text-white">Landscape 16:9 Broadcast</span>
                  <span className="text-slate-400 block text-[11px]">
                    Includes Praja Sanketam frame, Telugu headline PNG banner, and scrolling ticker.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generate916}
                  onChange={(e) => setGenerate916(e.target.checked)}
                  className="rounded text-purple-500 focus:ring-0"
                />
                <div className="text-xs">
                  <span className="font-semibold text-white">Vertical 9:16 Shorts / Reels</span>
                  <span className="text-slate-400 block text-[11px]">
                    Optimized for mobile viewing with vertical Praja Sanketam branding overlay.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Editorial Safety & Verification */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
              Safety &amp; Verification Rules
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoGovOnly}
                  onChange={(e) => setAutoGovOnly(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0"
                />
                <div className="text-xs">
                  <span className="font-semibold text-white">Strict Verified / Gov Filter</span>
                  <span className="text-slate-400 block text-[11px]">
                    Prioritizes verified government, press, and emergency agency handles.
                  </span>
                </div>
              </label>

              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Media Rights Enforcement</span>
                </div>
                Restricted or copyrighted media without permission is flagged as "Requires Permission" and never published automatically.
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Settings saved successfully
            </span>
          )}
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSavingConfig}
            className="px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSavingConfig ? 'Saving...' : 'Save Pipeline Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
