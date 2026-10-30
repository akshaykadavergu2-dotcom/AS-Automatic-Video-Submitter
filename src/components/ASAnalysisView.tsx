import React, { useState, useMemo } from 'react';
import {
  BarChart2,
  Calendar,
  Clock,
  TrendingUp,
  Video,
  Share2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Download,
  Layers,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { CollectedXPost, CloudWorkerState } from '../types/news';

export type DateRangePreset = 'today' | 'yesterday' | '7days' | '30days' | 'all' | 'custom';

interface ASAnalysisViewProps {
  language: 'te' | 'en';
  posts: CollectedXPost[];
  cloudWorkerState: CloudWorkerState | null;
}

export const ASAnalysisView: React.FC<ASAnalysisViewProps> = ({
  language,
  posts,
  cloudWorkerState,
}) => {
  const [dateRange, setDateRange] = useState<DateRangePreset>('all');
  const [customStart, setCustomStart] = useState<string>('2026-03-01');
  const [customEnd, setCustomEnd] = useState<string>('2026-03-31');

  // Compute strictly from real database records (Priority 6)
  const { filteredPosts, metrics, hourlyVolume, categoryBreakdown, hasDemoData } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const filtered = posts.filter((p) => {
      if (dateRange === 'all') return true;
      const pDate = new Date(p.detectedAt || p.createdAt);
      if (dateRange === 'today') {
        return (p.detectedAt || p.createdAt).startsWith(todayStr);
      }
      if (dateRange === 'yesterday') {
        return (p.detectedAt || p.createdAt).startsWith(yesterdayStr);
      }
      if (dateRange === '7days') {
        return pDate >= sevenDaysAgo;
      }
      if (dateRange === '30days') {
        return pDate >= thirtyDaysAgo;
      }
      if (dateRange === 'custom') {
        const start = new Date(customStart);
        const end = new Date(customEnd);
        end.setHours(23, 59, 59);
        return pDate >= start && pDate <= end;
      }
      return true;
    });

    const isDemo = filtered.some((p) => p.xPostId.startsWith('sim-') || p.id.startsWith('post-x-201'));

    // Exact database calculations with ZERO artificial inflation
    const totalCollected = filtered.length;
    const postsAnalysed = filtered.filter((p) => Boolean(p.geminiResult || p.status === 'ai_ready' || p.status === 'published')).length;
    const eligibleVideos = filtered.filter((p) => p.rightsStatus === 'eligible' && p.hasMedia).length;
    const videosDownloaded = filtered.filter((p) => Boolean(p.mediaUrl)).length;
    const videosEdited = filtered.filter((p) => Boolean(p.renderedVideo169Url || p.renderedVideo916Url)).length;
    const facebookPublished = filtered.filter((p) => p.status === 'published' || Boolean(p.facebookPublishResult?.postUrl)).length;
    const failedTasks = filtered.filter((p) => p.status === 'failed' || Boolean(p.lastError)).length;

    // Real hourly distribution computed by bucket
    const buckets: { [key: string]: { collected: number; published: number } } = {
      '00:00': { collected: 0, published: 0 },
      '04:00': { collected: 0, published: 0 },
      '08:00': { collected: 0, published: 0 },
      '12:00': { collected: 0, published: 0 },
      '16:00': { collected: 0, published: 0 },
      '20:00': { collected: 0, published: 0 },
    };

    filtered.forEach((p) => {
      const d = new Date(p.detectedAt || p.createdAt);
      const hour = d.getHours();
      let slot = '00:00';
      if (hour >= 4 && hour < 8) slot = '04:00';
      else if (hour >= 8 && hour < 12) slot = '08:00';
      else if (hour >= 12 && hour < 16) slot = '12:00';
      else if (hour >= 16 && hour < 20) slot = '16:00';
      else if (hour >= 20) slot = '20:00';

      buckets[slot].collected += 1;
      if (p.status === 'published' || p.facebookPublishResult?.postUrl) {
        buckets[slot].published += 1;
      }
    });

    // Real category breakdown
    const catMap: { [cat: string]: number } = {};
    filtered.forEach((p) => {
      const c = p.category || 'General';
      catMap[c] = (catMap[c] || 0) + 1;
    });

    return {
      filteredPosts: filtered,
      metrics: {
        totalCollected,
        postsAnalysed,
        eligibleVideos,
        videosDownloaded,
        videosEdited,
        facebookPublished,
        failedTasks,
      },
      hourlyVolume: Object.entries(buckets).map(([time, vals]) => ({
        time,
        collected: vals.collected,
        published: vals.published,
      })),
      categoryBreakdown: Object.entries(catMap).map(([name, count]) => ({
        name,
        count,
        pct: totalCollected > 0 ? Math.round((count / totalCollected) * 100) : 0,
      })),
      hasDemoData: isDemo,
    };
  }, [posts, dateRange, customStart, customEnd]);

  const maxVolume = Math.max(1, ...hourlyVolume.map((v) => Math.max(v.collected, v.published)));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
            <span>AS Platform</span>
            <span>/</span>
            <span className="text-pink-400">Activity Analytics</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>{language === 'te' ? 'వార్తల విశ్లేషణ & పబ్లిషింగ్ నివేదిక' : 'News & Video Production Analysis'}</span>
            {hasDemoData && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                DEMO DATA
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'te'
              ? 'డేటాబేస్ రికార్డుల ఆధారంగా నిజమైన గణాంకాలు. పక్షపాతం లేదా కల్పిత సంఖ్యలు లేవు.'
              : 'Direct database analytics. Real counts of ingested posts, Gemini analysis results, and Facebook broadcasts.'}
          </p>
        </div>

        {/* Date Range Segmented Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl shrink-0 self-start sm:self-auto overflow-x-auto">
          {[
            { id: 'all' as DateRangePreset, label: 'All Time' },
            { id: 'today' as DateRangePreset, label: 'Today' },
            { id: 'yesterday' as DateRangePreset, label: 'Yesterday' },
            { id: '7days' as DateRangePreset, label: 'Last 7 Days' },
            { id: '30days' as DateRangePreset, label: 'Last 30 Days' },
            { id: 'custom' as DateRangePreset, label: 'Custom' },
          ].map((tab) => {
            const isActive = dateRange === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setDateRange(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Date Pickers */}
      {dateRange === 'custom' && (
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3 text-xs">
          <Calendar className="w-4 h-4 text-pink-400" />
          <span className="text-slate-300 font-medium">From:</span>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white"
          />
          <span className="text-slate-300 font-medium">To:</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white"
          />
        </div>
      )}

      {/* 8 Primary Real Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-[#0b0f1a] rounded-2xl border border-slate-800 p-4 relative overflow-hidden">
          <div className="w-1.5 absolute left-0 top-0 bottom-0 bg-cyan-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Posts Collected</span>
            <span className="text-cyan-400 font-mono text-[10px]">Database</span>
          </div>
          <p className="text-2xl lg:text-3xl font-extrabold text-white font-mono tabular-nums">
            {metrics.totalCollected}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
            <span>Ingested from monitored accounts</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#0b0f1a] rounded-2xl border border-slate-800 p-4 relative overflow-hidden">
          <div className="w-1.5 absolute left-0 top-0 bottom-0 bg-purple-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Posts Analysed</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <p className="text-2xl lg:text-3xl font-extrabold text-white font-mono tabular-nums">
            {metrics.postsAnalysed}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
            <span>Telugu headlines &amp; scripts generated</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#0b0f1a] rounded-2xl border border-slate-800 p-4 relative overflow-hidden">
          <div className="w-1.5 absolute left-0 top-0 bottom-0 bg-emerald-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Eligible Videos</span>
            <span className="text-emerald-400 font-mono text-[10px]">Rights Verified</span>
          </div>
          <p className="text-2xl lg:text-3xl font-extrabold text-white font-mono tabular-nums">
            {metrics.eligibleVideos}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
            <span>Public footage eligible for news</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#0b0f1a] rounded-2xl border border-slate-800 p-4 relative overflow-hidden">
          <div className="w-1.5 absolute left-0 top-0 bottom-0 bg-blue-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Videos Downloaded</span>
            <Download className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <p className="text-2xl lg:text-3xl font-extrabold text-white font-mono tabular-nums">
            {metrics.videosDownloaded}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
            <span>Saved in local media buffer</span>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-[#0b0f1a] rounded-2xl border border-slate-800 p-4 relative overflow-hidden">
          <div className="w-1.5 absolute left-0 top-0 bottom-0 bg-pink-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Videos Edited (MP4)</span>
            <Video className="w-3.5 h-3.5 text-pink-400" />
          </div>
          <p className="text-2xl lg:text-3xl font-extrabold text-white font-mono tabular-nums">
            {metrics.videosEdited}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
            <span>16:9 &amp; 9:16 FFmpeg renders</span>
          </div>
        </div>

        {/* Metric 6 */}
        <div className="bg-[#0b0f1a] rounded-2xl border border-slate-800 p-4 relative overflow-hidden">
          <div className="w-1.5 absolute left-0 top-0 bottom-0 bg-teal-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Facebook Published</span>
            <Share2 className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <p className="text-2xl lg:text-3xl font-extrabold text-white font-mono tabular-nums">
            {metrics.facebookPublished}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
            <span>Broadcasts posted to Facebook Page</span>
          </div>
        </div>

        {/* Metric 7 */}
        <div className="bg-[#0b0f1a] rounded-2xl border border-slate-800 p-4 relative overflow-hidden">
          <div className="w-1.5 absolute left-0 top-0 bottom-0 bg-amber-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Failed Tasks</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-2xl lg:text-3xl font-extrabold text-white font-mono tabular-nums">
            {metrics.failedTasks}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
            <span>Logged errors / retries</span>
          </div>
        </div>

        {/* Metric 8 */}
        <div className="bg-[#0b0f1a] rounded-2xl border border-slate-800 p-4 relative overflow-hidden">
          <div className="w-1.5 absolute left-0 top-0 bottom-0 bg-indigo-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Last Successful Run</span>
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <p className="text-sm font-bold text-white font-mono truncate mt-2">
            {cloudWorkerState?.lastRunAt
              ? new Date(cloudWorkerState.lastRunAt).toLocaleTimeString()
              : 'No run recorded'}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
            <span>{cloudWorkerState?.status === 'RUNNING' ? 'Daemon Active' : 'Daemon Paused'}</span>
          </div>
        </div>
      </div>

      {/* Two-Column Real Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real Hourly Volume Visual Bar Chart */}
        <div className="lg:col-span-2 bg-[#0b0f1a] rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Ingest &amp; Broadcast Activity by Hour</h2>
              <p className="text-xs text-slate-400">Actual timestamp buckets from database records</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded bg-cyan-500" />
                <span>Ingested</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded bg-pink-500" />
                <span>Published</span>
              </span>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="h-52 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-800">
            {hourlyVolume.map((d, i) => {
              const colHeightPct = maxVolume > 0 ? (d.collected / maxVolume) * 100 : 0;
              const pubHeightPct = maxVolume > 0 ? (d.published / maxVolume) * 100 : 0;

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1.5 h-full">
                    {/* Collected bar */}
                    <div
                      className="w-1/2 max-w-[22px] rounded-t-md bg-cyan-500 group-hover:bg-cyan-400 transition-all relative"
                      style={{ height: `${Math.max(colHeightPct > 0 ? 8 : 0, colHeightPct)}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-[10px] text-white px-1.5 py-0.5 rounded shadow pointer-events-none transition-opacity font-mono">
                        {d.collected}
                      </div>
                    </div>
                    {/* Published bar */}
                    <div
                      className="w-1/2 max-w-[22px] rounded-t-md bg-pink-500 group-hover:bg-pink-400 transition-all relative"
                      style={{ height: `${Math.max(pubHeightPct > 0 ? 8 : 0, pubHeightPct)}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-[10px] text-white px-1.5 py-0.5 rounded shadow pointer-events-none transition-opacity font-mono">
                        {d.published}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{d.time}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500 text-center">
            {metrics.totalCollected === 0
              ? 'No activity records in selected date range.'
              : `${metrics.totalCollected} total posts analysed with ${metrics.facebookPublished} Facebook publications.`}
          </p>
        </div>

        {/* Real Category Breakdown */}
        <div className="bg-[#0b0f1a] rounded-2xl border border-slate-800 p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Category Distribution</h2>
            <p className="text-xs text-slate-400">Classified by Gemini Telugu News Categorizer</p>
          </div>

          <div className="space-y-3">
            {categoryBreakdown.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No categories to display.</p>
            ) : (
              categoryBreakdown.map((cat, idx) => {
                const colors = ['bg-cyan-500', 'bg-purple-500', 'bg-pink-500', 'bg-emerald-500', 'bg-amber-500'];
                const color = colors[idx % colors.length];

                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">{cat.name}</span>
                      <span className="text-slate-400 font-mono tabular-nums">{cat.count} stories ({cat.pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${cat.pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="text-slate-200 font-semibold block">Media Rights Breakdown</span>
            <div className="flex items-center justify-between">
              <span>Eligible for Broadcast:</span>
              <span className="text-emerald-400 font-mono">{metrics.eligibleVideos}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Requires Verification:</span>
              <span className="text-amber-400 font-mono">{metrics.totalCollected - metrics.eligibleVideos}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
