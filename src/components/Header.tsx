import React from 'react';
import { Radio, RefreshCw, Sparkles, Clock, Globe } from 'lucide-react';

interface HeaderProps {
  language: 'te' | 'en';
  onToggleLanguage: () => void;
  onNewStory: () => void;
  activeJobsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onToggleLanguage,
  onNewStory,
  activeJobsCount,
}) => {
  const [time, setTime] = React.useState('');

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#080c14]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-red-600 via-red-700 to-rose-900 border border-amber-400/40 shadow-lg shadow-red-950/50">
            <span className="font-telugu font-black text-white text-2xl drop-shadow">ప్ర</span>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg lg:text-xl font-black tracking-wide text-white font-sans flex items-center gap-1.5">
                PRAJA SANKETAM <span className="text-red-500 text-xs px-2 py-0.5 rounded-full bg-red-950/80 border border-red-800/60 font-semibold tracking-normal">AI STUDIO</span>
              </h1>
              <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                <Radio className="w-3 h-3 text-red-500 animate-pulse" />
                LIVE BROADCAST
              </div>
            </div>
            <p className="text-xs text-slate-400 font-telugu font-medium">
              {language === 'te'
                ? 'ప్రజా సంకేతం AI న్యూస్ ఆటోమేషన్ & ప్రొడక్షన్ స్టూడియో'
                : 'AI News Automation & Multi-Platform Television Production'}
            </p>
          </div>
        </div>

        {/* Status, Language & Actions */}
        <div className="flex items-center gap-3">
          {/* Active FFmpeg render jobs badge */}
          {activeJobsCount > 0 && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-950/60 border border-blue-800/50 text-blue-300 text-xs font-semibold animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{activeJobsCount} Video {activeJobsCount === 1 ? 'Job' : 'Jobs'} Rendering</span>
            </div>
          )}

          {/* Time display */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono-code text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{time} IST</span>
          </div>

          {/* Language Toggle */}
          <button
            onClick={onToggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
            title="Toggle Language: Telugu / English"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'te' ? 'తెలుగు' : 'English'}</span>
          </button>

          {/* New Story Action */}
          <button
            onClick={onNewStory}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs lg:text-sm font-bold shadow-lg shadow-red-900/40 transition-all transform active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{language === 'te' ? 'కొత్త వార్త (+)' : 'New Story (+)'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
