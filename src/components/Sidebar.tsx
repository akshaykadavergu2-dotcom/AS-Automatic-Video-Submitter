import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Video,
  TrendingUp,
  Share2,
  Workflow,
  Settings,
  ChevronRight,
  Tv,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'writer'
  | 'video'
  | 'trends'
  | 'x_automation'
  | 'facebook'
  | 'automation'
  | 'settings';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  language: 'te' | 'en';
  draftsCount: number;
  jobsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  language,
  draftsCount,
  jobsCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as TabType,
      labelTe: 'న్యూస్‌రూమ్ డాష్‌బోర్డ్',
      labelEn: 'News Dashboard',
      icon: LayoutDashboard,
      badge: draftsCount > 0 ? draftsCount : null,
      desc: 'All news feeds & overview',
    },
    {
      id: 'writer' as TabType,
      labelTe: 'జెమిని AI న్యూస్ రైటర్',
      labelEn: 'Gemini AI Writer',
      icon: Sparkles,
      accent: 'text-amber-400',
      badge: 'AI',
      desc: 'Telugu scripts & headlines',
    },
    {
      id: 'video' as TabType,
      labelTe: 'వీడియో ఎడిటింగ్ స్టూడియో',
      labelEn: 'Video Studio',
      icon: Video,
      badge: jobsCount > 0 ? jobsCount : null,
      desc: '16:9 & 9:16 FFmpeg overlay',
    },
    {
      id: 'x_automation' as TabType,
      labelTe: 'ఆటోమేటెడ్ X & FB పబ్లిషింగ్',
      labelEn: 'Automated X to FB',
      icon: Share2,
      accent: 'text-purple-400',
      badge: 'AUTO',
      desc: 'X sources ingest & FB publish',
    },
    {
      id: 'trends' as TabType,
      labelTe: 'ట్రెండ్ మానిటర్ (X)',
      labelEn: 'Trend Monitor (X)',
      icon: TrendingUp,
      desc: 'Official X/Twitter trends',
    },
    {
      id: 'facebook' as TabType,
      labelTe: 'ఫేస్‌బుక్ పబ్లిషింగ్',
      labelEn: 'Facebook Publish',
      icon: Share2,
      desc: 'Meta Graph API broadcaster',
    },
    {
      id: 'automation' as TabType,
      labelTe: 'ఆటోమేషన్ వర్క్‌ఫ్లో',
      labelEn: 'Automation Pipeline',
      icon: Workflow,
      desc: 'News-to-video jobs',
    },
    {
      id: 'settings' as TabType,
      labelTe: 'స్టూడియో సెట్టింగ్స్',
      labelEn: 'Studio Settings',
      icon: Settings,
      desc: 'Logos, frames & API keys',
    },
  ];

  return (
    <aside className="w-full lg:w-72 shrink-0 bg-[#070b12] border-r border-slate-800/80 flex flex-col justify-between p-3 lg:p-4">
      <div className="space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase flex items-center justify-between">
          <span>{language === 'te' ? 'న్యూస్ ప్రొడక్షన్' : 'Production Modules'}</span>
          <span className="flex items-center gap-1 text-slate-400 font-mono-code text-[10px]">
            <Tv className="w-3 h-3 text-red-500" /> V2.5
          </span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full group flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all cursor-pointer relative overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-r from-red-950/70 to-slate-900 border border-red-700/60 text-white shadow-md shadow-red-950/30'
                  : 'hover:bg-slate-900/60 text-slate-300 hover:text-white border border-transparent'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 to-amber-500 rounded-r" />
              )}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-red-600/30 text-red-400'
                      : 'bg-slate-900 text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.accent || ''}`} />
                </div>
                <div className="truncate">
                  <p
                    className={`text-sm font-semibold truncate ${
                      isActive ? 'text-white' : 'text-slate-200'
                    } ${language === 'te' ? 'font-telugu' : ''}`}
                  >
                    {language === 'te' ? item.labelTe : item.labelEn}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate hidden xl:block">
                    {item.desc}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.badge === 'AI'
                        ? 'bg-gradient-to-r from-amber-500/20 to-red-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-red-600/30 text-red-300 border border-red-600/50'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                <ChevronRight
                  className={`w-3.5 h-3.5 text-slate-600 transition-transform ${
                    isActive ? 'text-red-400 translate-x-0.5' : 'group-hover:translate-x-0.5'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Studio Channel Info Card */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 px-2">
        <div className="bg-gradient-to-br from-slate-900/90 to-[#0b101b] rounded-xl p-3 border border-slate-800">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">
              Network Status
            </span>
          </div>
          <p className="text-xs text-slate-300 font-telugu font-semibold">
            ప్రజా సంకేతం నెట్‌వర్క్ ఆన్‌లైన్
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            FFmpeg Worker: Active • Gemini 3.8 Flash
          </p>
        </div>
      </div>
    </aside>
  );
};
