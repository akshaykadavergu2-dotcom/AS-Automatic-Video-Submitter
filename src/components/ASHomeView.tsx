import React from 'react';
import {
  Play,
  Square,
  Sparkles,
  Video,
  Share2,
  TrendingUp,
  Server,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Radio,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { ASNavTab } from './ASHeader';
import { CloudWorkerState, CollectedXPost } from '../types/news';

interface ASHomeViewProps {
  language: 'te' | 'en';
  onNavigateToTab: (tab: ASNavTab) => void;
  onOpenStudioTool?: (tool: 'writer' | 'video' | 'teleprompter') => void;
  cloudWorkerState: CloudWorkerState | null;
  onStartWorker: () => Promise<void>;
  onStopWorker: () => Promise<void>;
  isWorkerActionLoading: boolean;
  countdownSeconds: number | null;
  posts: CollectedXPost[];
}

export const ASHomeView: React.FC<ASHomeViewProps> = ({
  language,
  onNavigateToTab,
  onOpenStudioTool,
  cloudWorkerState,
  onStartWorker,
  onStopWorker,
  isWorkerActionLoading,
  countdownSeconds,
  posts,
}) => {
  const isRunning = cloudWorkerState?.status === 'RUNNING';

  const recentPosts = posts.slice(0, 4);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#0d1424] via-[#10132b] to-[#180f24] border border-slate-800 p-6 sm:p-8 overflow-hidden shadow-2xl">
        {/* Ambient background glows */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full p-[2px] bg-gradient-to-tr from-cyan-400 via-pink-400 to-purple-500">
                <div className="w-full h-full rounded-full bg-[#070a13] flex items-center justify-center">
                  <span className="text-[11px] font-black text-white">AS</span>
                </div>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                Automatic Video Submitter
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-xs text-slate-400">Praja Sanketam Network</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Connect <span className="text-cyan-400">·</span> Automate <span className="text-pink-400">·</span> Edit <span className="text-purple-400">·</span> Publish
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              Autonomous cloud platform that continuously harvests X news, generates crisp Telugu headlines &amp; scripts with Gemini AI, renders 16:9 &amp; 9:16 video packages with FFmpeg, and broadcasts to Facebook.
            </p>
          </div>

          {/* Quick Start / Stop HUD Box */}
          <div className="w-full lg:w-auto shrink-0 bg-[#070a13]/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 min-w-[280px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">24/7 Cloud Engine</span>
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                  }`}
                />
                <span className={isRunning ? 'text-emerald-300' : 'text-slate-300'}>
                  {cloudWorkerState?.status || 'STOPPED'}
                </span>
              </div>
            </div>

            {isRunning ? (
              <button
                onClick={onStopWorker}
                disabled={isWorkerActionLoading}
                className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Square className="w-3.5 h-3.5 fill-current text-white" />
                <span>STOP CLOUD AUTOMATION</span>
              </button>
            ) : (
              <button
                onClick={onStartWorker}
                disabled={isWorkerActionLoading}
                className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current text-white" />
                <span>START CLOUD AUTOMATION</span>
              </button>
            )}

            <div className="text-[11px] text-slate-400 text-center font-mono">
              {isRunning
                ? `Next cycle in: ${countdownSeconds ? `${countdownSeconds}s` : 'Active'}`
                : 'Background jobs paused'}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Feature Module Launch Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Connections */}
        <div
          onClick={() => onNavigateToTab('connections')}
          className="p-5 rounded-2xl bg-[#0b0f1a] border border-slate-800 hover:border-cyan-500/60 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 mb-3">
              <Share2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
              Account Connections
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Link official X API and Facebook Pages. Manage selected accounts &amp; following list.
            </p>
          </div>
          <div className="pt-4 flex items-center text-xs font-semibold text-cyan-400 gap-1">
            <span>Manage accounts</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: Automation */}
        <div
          onClick={() => onNavigateToTab('automation')}
          className="p-5 rounded-2xl bg-[#0b0f1a] border border-slate-800 hover:border-purple-500/60 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400 mb-3">
              <Server className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
              Automation Controls
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              24/7 background worker, cadence sliders, dual 16:9 &amp; 9:16 rendering, auto/manual mode.
            </p>
          </div>
          <div className="pt-4 flex items-center text-xs font-semibold text-purple-400 gap-1">
            <span>Configure worker</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: Analysis */}
        <div
          onClick={() => onNavigateToTab('analysis')}
          className="p-5 rounded-2xl bg-[#0b0f1a] border border-slate-800 hover:border-pink-500/60 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-pink-950/80 border border-pink-800/60 flex items-center justify-center text-pink-400 mb-3">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-pink-300 transition-colors">
              Activity Analytics
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Date filters (Today, Yesterday, 7d, 30d, Custom), visual volume charts, and success rates.
            </p>
          </div>
          <div className="pt-4 flex items-center text-xs font-semibold text-pink-400 gap-1">
            <span>View analysis</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 4: Activity History */}
        <div
          onClick={() => onNavigateToTab('activity')}
          className="p-5 rounded-2xl bg-[#0b0f1a] border border-slate-800 hover:border-emerald-500/60 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mb-3">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
              Activity History
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Full lifecycle logs, original tweets, Telugu AI results, MP4 outputs, and FB links.
            </p>
          </div>
          <div className="pt-4 flex items-center text-xs font-semibold text-emerald-400 gap-1">
            <span>Audit logs</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Production Studio Extra Power Tools (AI Telugu Scriptwriter, FFmpeg Video Studio) */}
      <div className="rounded-2xl bg-[#0b0f1a] border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Advanced Newsroom Tools</h2>
            <p className="text-xs text-slate-400">
              Interactive manual editors and teleprompter for full broadcast control.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => onOpenStudioTool && onOpenStudioTool('writer')}
            className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-purple-600/50 text-left transition-all cursor-pointer flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Gemini AI Writer</p>
              <p className="text-[11px] text-slate-400">Telugu headline &amp; anchor scripts</p>
            </div>
          </button>

          <button
            onClick={() => onOpenStudioTool && onOpenStudioTool('video')}
            className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-pink-600/50 text-left transition-all cursor-pointer flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-pink-950 border border-pink-800 flex items-center justify-center text-pink-400 shrink-0">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Video Studio (FFmpeg)</p>
              <p className="text-[11px] text-slate-400">Landscape &amp; Vertical Overlays</p>
            </div>
          </button>

          <button
            onClick={() => onOpenStudioTool && onOpenStudioTool('teleprompter')}
            className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-cyan-600/50 text-left transition-all cursor-pointer flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Live Teleprompter</p>
              <p className="text-[11px] text-slate-400">Anchor prompter &amp; scroll speed</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Feed Highlights */}
      <div className="bg-[#0b0f1a] rounded-2xl border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Recent Automation Highlights</h2>
            <p className="text-xs text-slate-400">Latest processed news stories and broadcast packages</p>
          </div>
          <button
            onClick={() => onNavigateToTab('activity')}
            className="text-xs text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All in Activity History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recentPosts.map((post) => (
            <div
              key={post.id}
              className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-cyan-400 font-mono">{post.authorHandle}</span>
                <span className="text-[11px] text-slate-500">
                  {new Date(post.detectedAt || post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="font-bold text-white font-telugu line-clamp-1">
                {post.geminiResult?.headlineTelugu || post.text}
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                <span className="text-emerald-400">
                  {post.status === 'published' ? 'Live on FB' : 'Ready'}
                </span>
                <span className="capitalize">{post.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
