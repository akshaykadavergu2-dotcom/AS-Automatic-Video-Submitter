import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ExternalLink,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Hash,
  ShieldAlert,
  ArrowRight,
  Settings,
} from 'lucide-react';
import { TrendingTopic, NewsCategory } from '../types/news';
import { api } from '../services/api';

interface TrendMonitorViewProps {
  onSelectTrendForAi: (trend: TrendingTopic) => void;
  onNavigateToTab: (tab: any) => void;
  language: 'te' | 'en';
}

export const TrendMonitorView: React.FC<TrendMonitorViewProps> = ({
  onSelectTrendForAi,
  onNavigateToTab,
  language,
}) => {
  const [trends, setTrends] = useState<TrendingTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [provider, setProvider] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('All');

  const fetchTrends = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTrends();
      setTrends(data.trends || []);
      setIsConfigured(data.isConfigured);
      setIsLive(data.isLive);
      setProvider(data.provider);
      setNotice(data.notice || null);
    } catch (err: any) {
      console.error('Error fetching trends:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  const filteredTrends = trends.filter((t) => {
    if (selectedFilter === 'All') return true;
    return t.category === selectedFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#141d2e] via-[#0f172a] to-[#111927] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg lg:text-xl font-black text-white font-telugu flex items-center gap-2">
                ట్రెండ్ మానిటర్ (Official X/Twitter API)
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Real-Time Regional News Intelligence &amp; Verified Viral Topics
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTrends}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>రిఫ్రెష్ (Refresh)</span>
          </button>
        </div>
      </div>

      {/* Integration Verification Status Notice Banner */}
      {!isLive ? (
        <div className="bg-amber-950/40 border border-amber-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-300 font-telugu">
                అధికారిక X/Twitter API ఇంటిగ్రేషన్ స్థితి: కాన్ఫిగరేషన్ అవసరం
              </h4>
              <p className="text-xs text-amber-200/80 mt-0.5">
                {notice ||
                  'Official X/Twitter API v2 credentials are not configured yet. Set your X Bearer Token in Studio Settings to activate live stream.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('settings')}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>సెట్టింగ్స్‌లో సెటప్ చేయండి</span>
          </button>
        </div>
      ) : (
        <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs text-emerald-300">
            <span className="font-bold">Official X API v2 Active:</span> Connected to live trends stream for India / Hyderabad region.
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['All', 'Telangana', 'Andhra Pradesh', 'Politics', 'Tech & Business'].map((f) => (
          <button
            key={f}
            onClick={() => setSelectedFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
              selectedFilter === f
                ? 'bg-sky-600 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {f === 'All' ? 'అన్ని ట్రెండ్స్ (All)' : f}
          </button>
        ))}
      </div>

      {/* Trends Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTrends.map((item, index) => (
          <div
            key={item.id}
            className="bg-[#0f1624] border border-slate-800 hover:border-sky-500/50 rounded-2xl p-4 shadow-md flex flex-col justify-between transition-all group"
          >
            <div>
              {/* Header: Rank, Category, Time */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-300 text-xs font-mono font-bold flex items-center justify-center">
                    #{index + 1}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800/60">
                    {item.category}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-telugu flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {item.timeDetected}
                </span>
              </div>

              {/* Topic Hashtag */}
              <div className="flex items-center gap-1.5 text-base font-bold text-white group-hover:text-sky-400 transition-colors">
                <Hash className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="truncate">{item.topic}</span>
              </div>

              {/* Telugu summary & description */}
              <h4 className="text-sm font-bold text-slate-200 font-telugu mt-1.5 leading-snug">
                {item.topicTelugu}
              </h4>
              <p className="text-xs text-slate-400 font-telugu mt-1 line-clamp-2">
                {item.summary}
              </p>

              {/* Tweet volume */}
              {item.tweetVolume && (
                <div className="mt-2 text-[11px] font-semibold text-slate-500">
                  {item.tweetVolume} on X
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <span>X లో చూడండి</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => {
                  onSelectTrendForAi(item);
                  onNavigateToTab('writer');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-bold shadow cursor-pointer transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className="font-telugu">AI రైటర్‌కు పంపు</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
