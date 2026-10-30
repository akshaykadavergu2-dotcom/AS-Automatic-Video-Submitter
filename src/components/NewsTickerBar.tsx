import React from 'react';
import { Flame, Radio } from 'lucide-react';

interface NewsTickerBarProps {
  tickerText: string;
  language: 'te' | 'en';
  onTickerClick?: () => void;
}

export const NewsTickerBar: React.FC<NewsTickerBarProps> = ({
  tickerText,
  language,
  onTickerClick,
}) => {
  const defaultTicker =
    tickerText ||
    'బ్రేకింగ్: ప్రజా సంకేతం AI న్యూస్ స్టూడియో 24x7 ప్రత్యక్ష ప్రసారం ప్రారంభం • తెలంగాణ, ఆంధ్రప్రదేశ్ మరియు జాతీయ వార్తా విశేషాలు నిరంతరం మీకోసం • సరికొత్త సాంకేతికతతో వేగవంతమైన వార్తలు';

  return (
    <div
      onClick={onTickerClick}
      className="w-full bg-[#080d19] border-y border-red-900/60 flex items-stretch h-10 select-none overflow-hidden cursor-pointer group"
      title="Click to edit or insert into video editor"
    >
      {/* Red Breaking Label */}
      <div className="shrink-0 flex items-center gap-1.5 px-4 bg-gradient-to-r from-red-600 via-red-700 to-rose-700 text-white font-black text-xs uppercase tracking-wider shadow-md z-10">
        <Flame className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
        <span className={language === 'te' ? 'font-telugu font-black' : ''}>
          {language === 'te' ? 'బ్రేకింగ్ న్యూస్' : 'BREAKING'}
        </span>
        <Radio className="w-3 h-3 text-white animate-pulse hidden sm:inline" />
      </div>

      {/* Marquee Strip */}
      <div className="relative flex-1 overflow-hidden flex items-center bg-slate-950/80">
        <div className="animate-ticker text-xs sm:text-sm font-semibold font-telugu text-slate-100 flex items-center gap-10">
          <span>{defaultTicker}</span>
          <span className="text-amber-400">★ PRAJA SANKETAM 24x7 ★</span>
          <span>{defaultTicker}</span>
          <span className="text-amber-400">★ PRAJA SANKETAM 24x7 ★</span>
        </div>
      </div>
    </div>
  );
};
