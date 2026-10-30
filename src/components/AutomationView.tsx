import React from 'react';
import {
  Workflow,
  Sparkles,
  Video,
  Share2,
  Clock,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Download,
  Play,
  ArrowRight,
  Tv,
} from 'lucide-react';
import { NewsDraft, VideoRenderJob } from '../types/news';

interface AutomationViewProps {
  drafts: NewsDraft[];
  jobs: VideoRenderJob[];
  onSelectDraft: (draft: NewsDraft) => void;
  onNavigateToTab: (tab: any) => void;
  language: 'te' | 'en';
}

export const AutomationView: React.FC<AutomationViewProps> = ({
  drafts,
  jobs,
  onSelectDraft,
  onNavigateToTab,
  language,
}) => {
  const pipelineSteps = [
    {
      step: '01',
      titleTe: 'వార్తా సేకరణ & ట్రెండ్స్',
      titleEn: 'News Ingest & Trends',
      descTe: 'X/Twitter API & రిపోర్టర్ సమాచారం',
      icon: Tv,
      color: 'from-amber-600 to-amber-700',
    },
    {
      step: '02',
      titleTe: 'జెమిని AI స్క్రిప్టింగ్',
      titleEn: 'Gemini AI Scripting',
      descTe: 'హెడ్‌లైన్లు, యాంకర్ & వాయిస్ ఓవర్',
      icon: Sparkles,
      color: 'from-red-600 to-rose-700',
    },
    {
      step: '03',
      titleTe: 'FFmpeg వీడియో ఓవర్‌లే',
      titleEn: 'FFmpeg Video Studio',
      descTe: '16:9 / 9:16 బ్యాకెండ్ రెండరింగ్',
      icon: Video,
      color: 'from-blue-600 to-indigo-700',
    },
    {
      step: '04',
      titleTe: 'ఫేస్‌బుక్ బ్రాడ్‌కాస్ట్',
      titleEn: 'Meta Broadcast',
      descTe: 'షెడ్యూలింగ్ & పేజీ పబ్లిషింగ్',
      icon: Share2,
      color: 'from-purple-600 to-violet-700',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#141d2e] via-[#0f172a] to-[#111927] border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-600/30">
            <Workflow className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg lg:text-xl font-black text-white font-telugu flex items-center gap-2">
              న్యూస్-టు-వీడియో ఆటోమేషన్ పైప్‌లైన్
            </h2>
            <p className="text-xs text-slate-400 font-sans">
              End-to-End News Production Workflow: Ingest → Gemini Scripts → FFmpeg Video → Meta Broadcast
            </p>
          </div>
        </div>
      </div>

      {/* Production Pipeline Stages Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {pipelineSteps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="bg-[#0f1624] border border-slate-800 rounded-2xl p-4 relative overflow-hidden group hover:border-slate-700 transition-all shadow-md"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-black font-mono text-slate-700 group-hover:text-slate-500 transition-colors">
                  {step.step}
                </span>
                <div className={`p-2 rounded-xl bg-gradient-to-br ${step.color} text-white shadow`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <h4 className="text-sm font-bold text-white font-telugu">
                {language === 'te' ? step.titleTe : step.titleEn}
              </h4>
              <p className="text-xs text-slate-400 font-telugu mt-1">{step.descTe}</p>
            </div>
          );
        })}
      </div>

      {/* Active FFmpeg Video Jobs Queue */}
      <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white font-telugu uppercase tracking-wider">
              FFmpeg వీడియో రెండర్ జాబ్స్ క్యూ ({jobs.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Dedicated backend worker status
          </span>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs font-telugu">
            ప్రస్తుతం ఎటువంటి వీడియో రెండరింగ్ జాబ్స్ క్యూలో లేవు.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">జాబ్ ID (Job ID)</th>
                  <th className="py-3 px-4">హెడ్‌లైన్ (Title)</th>
                  <th className="py-3 px-4">ఫార్మాట్ (Aspect)</th>
                  <th className="py-3 px-4">స్థితి (Status)</th>
                  <th className="py-3 px-4">పురోగతి (Progress)</th>
                  <th className="py-3 px-4 text-right">చర్య (Action)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {job.id}
                    </td>
                    <td className="py-3.5 px-4 font-telugu font-semibold max-w-xs truncate">
                      {job.title}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono font-bold">
                        {job.aspectRatio}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {job.status === 'completed' && (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                        </span>
                      )}
                      {job.status === 'processing' && (
                        <span className="inline-flex items-center gap-1 text-blue-400 font-bold">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Rendering
                        </span>
                      )}
                      {job.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                          <Clock className="w-3.5 h-3.5" /> Queued
                        </span>
                      )}
                      {job.status === 'failed' && (
                        <span className="inline-flex items-center gap-1 text-red-400 font-bold">
                          <AlertCircle className="w-3.5 h-3.5" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 w-36">
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full transition-all"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                        {job.progress}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {job.outputVideoUrl && (
                        <a
                          href={job.outputVideoUrl}
                          download={`praja_sanketam_${job.id}.mp4`}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow cursor-pointer transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>MP4</span>
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Production Drafts Pipeline Board */}
      <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-bold text-white font-telugu uppercase tracking-wider">
              వార్తా డ్రాఫ్ట్‌లు &amp; ప్రొడక్షన్ స్టేటస్ ({drafts.length})
            </h3>
          </div>
          <button
            onClick={() => onNavigateToTab('writer')}
            className="text-xs text-red-400 hover:text-red-300 font-telugu font-bold flex items-center gap-1"
          >
            <span>కొత్త వార్త ప్రారంభించండి</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {drafts.map((d) => (
            <div
              key={d.id}
              onClick={() => {
                onSelectDraft(d);
                onNavigateToTab('writer');
              }}
              className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-red-600/50 rounded-xl p-3.5 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between text-[10px] mb-1.5">
                <span className="font-bold uppercase text-red-400">{d.category}</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-mono">
                  {d.status}
                </span>
              </div>
              <h5 className="text-xs font-bold text-white font-telugu line-clamp-2">
                {d.headlineTelugu || d.rawNews}
              </h5>
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-telugu">
                <span>{d.anchorScriptTelugu ? 'యాంకర్ స్క్రిప్ట్ సిద్ధం' : 'డ్రాఫ్ట్ దశ'}</span>
                <span className="text-amber-400 font-bold">ఎడిట్ చేయండి →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
