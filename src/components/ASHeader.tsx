import React from 'react';
import { Play, Square, RefreshCw, Sparkles, Globe, Radio, ExternalLink } from 'lucide-react';
import { CloudWorkerState, CloudWorkerStatus } from '../types/news';

export type ASNavTab = 'home' | 'connections' | 'automation' | 'analysis' | 'activity' | 'settings';

interface ASHeaderProps {
  activeTab: ASNavTab;
  onSelectTab: (tab: ASNavTab) => void;
  language: 'te' | 'en';
  onToggleLanguage: () => void;
  onReplayIntro: () => void;
  cloudWorkerState: CloudWorkerState | null;
  onStartWorker: () => void;
  onStopWorker: () => void;
  isWorkerActionLoading: boolean;
}

export const ASHeader: React.FC<ASHeaderProps> = ({
  activeTab,
  onSelectTab,
  language,
  onToggleLanguage,
  onReplayIntro,
  cloudWorkerState,
  onStartWorker,
  onStopWorker,
  isWorkerActionLoading,
}) => {
  const isRunning = cloudWorkerState?.status === 'RUNNING';

  const navLinks: { id: ASNavTab; labelEn: string; labelTe: string }[] = [
    { id: 'home', labelEn: 'Home', labelTe: 'హోమ్' },
    { id: 'connections', labelEn: 'Connections', labelTe: 'ఖాతాలు' },
    { id: 'automation', labelEn: 'Automation', labelTe: 'ఆటోమేషన్' },
    { id: 'analysis', labelEn: 'Analysis', labelTe: 'విశ్లేషణ' },
    { id: 'activity', labelEn: 'Activity History', labelTe: 'యాక్టివిటీ హిస్టరీ' },
    { id: 'settings', labelEn: 'Settings', labelTe: 'సెట్టింగ్స్' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#070a13]/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-3 transition-all">
      <div className="flex items-center justify-between gap-8">
        {/* Zone 1: Single text element Brand wordmark with circular AS logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus-visible:outline-none"
          >
            {/* Circular colorful AS monogram */}
            <div className="relative w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr from-cyan-500 via-pink-500 to-purple-600 shadow-md shadow-purple-950/40">
              <div className="w-full h-full rounded-full bg-[#070a13] flex items-center justify-center">
                <span className="text-xs font-black tracking-tight bg-gradient-to-r from-cyan-400 via-white to-pink-400 bg-clip-text text-transparent">
                  AS
                </span>
              </div>
            </div>

            <div className="leading-tight">
              <span className="text-base font-extrabold tracking-tight text-white whitespace-nowrap group-hover:text-cyan-300 transition-colors">
                AS
              </span>
              <span className="text-xs text-slate-400 font-medium ml-1.5 hidden sm:inline whitespace-nowrap">
                Automatic Video Submitter
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: 6 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onSelectTab(link.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'text-white bg-slate-800/80 shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                {language === 'te' ? link.labelTe : link.labelEn}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action cluster (Start/Stop Quick State + Language) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Quick Start / Stop Toggle */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900/90 border border-slate-800">
            {isRunning ? (
              <button
                onClick={onStopWorker}
                disabled={isWorkerActionLoading}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold text-red-300 bg-red-950/70 hover:bg-red-900/80 border border-red-700/50 transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
                title="Stop Background Cloud Automation"
              >
                <Square className="w-3 h-3 fill-current text-red-400" />
                <span>STOP</span>
              </button>
            ) : (
              <button
                onClick={onStartWorker}
                disabled={isWorkerActionLoading}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-700/50 transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
                title="Start Background Cloud Automation"
              >
                <Play className="w-3 h-3 fill-current text-emerald-400" />
                <span>START</span>
              </button>
            )}

            <div className="hidden sm:flex items-center gap-1 px-2 text-[11px] font-mono tabular-nums text-slate-300">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                }`}
              />
              <span className="font-semibold">{cloudWorkerState?.status || 'STOPPED'}</span>
            </div>
          </div>

          {/* Replay Intro Button */}
          <button
            onClick={onReplayIntro}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
            title="Replay Welcome Intro Animation"
            aria-label="Replay Welcome Intro"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          </button>

          {/* Language Toggle */}
          <button
            onClick={onToggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Globe className="w-3 h-3 text-cyan-400" />
            <span>{language === 'te' ? 'తెలుగు' : 'EN'}</span>
          </button>
        </div>
      </div>

      {/* Mobile secondary navigation strip */}
      <div className="flex md:hidden items-center gap-1 pt-2.5 overflow-x-auto scrollbar-none">
        {navLinks.map((link) => {
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => onSelectTab(link.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'text-white bg-slate-800 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
              }`}
            >
              {language === 'te' ? link.labelTe : link.labelEn}
            </button>
          );
        })}
      </div>
    </header>
  );
};
