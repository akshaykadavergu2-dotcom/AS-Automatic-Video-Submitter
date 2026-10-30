import React, { useState } from 'react';
import {
  Sparkles,
  Video,
  Share2,
  TrendingUp,
  Clock,
  Layers,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Tv,
  CheckCircle2,
  Trash2,
  FileText,
  Upload,
} from 'lucide-react';
import { NewsCategory, NewsDraft, VideoRenderJob } from '../types/news';

interface DashboardViewProps {
  drafts: NewsDraft[];
  jobs: VideoRenderJob[];
  language: 'te' | 'en';
  onSelectStory: (draft: NewsDraft) => void;
  onNewStory: () => void;
  onNavigateToTab: (tab: any) => void;
  onDeleteDraft: (id: string) => void;
  onUploadMedia: (file: File) => Promise<any>;
}

const CATEGORIES: NewsCategory[] = [
  'Breaking News',
  'Telangana',
  'Andhra Pradesh',
  'Politics',
  'National',
  'Local News',
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  drafts,
  jobs,
  language,
  onSelectStory,
  onNewStory,
  onNavigateToTab,
  onDeleteDraft,
  onUploadMedia,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickNewsText, setQuickNewsText] = useState('');
  const [quickCategory, setQuickCategory] = useState<NewsCategory>('Breaking News');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');

  const completedJobs = jobs.filter((j) => j.status === 'completed');
  const activeJobs = jobs.filter((j) => j.status === 'processing' || j.status === 'pending');

  const filteredDrafts = drafts.filter((d) => {
    const matchesCategory = selectedCategory === 'All' || d.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      d.headlineTelugu?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.headlineEnglish?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.rawNews?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleQuickVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadSuccessMsg('');
    try {
      const res = await onUploadMedia(file);
      setUploadSuccessMsg(`వీడియో అప్‌లోడ్ విజయవంతం: ${res.file.originalName}`);
      setTimeout(() => setUploadSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleQuickCreate = () => {
    if (!quickNewsText.trim()) return;
    const newDraft: NewsDraft = {
      id: `draft-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: quickCategory,
      rawNews: quickNewsText,
      headlineTelugu: quickNewsText.slice(0, 80) + '..',
      headlineEnglish: '',
      tickerLineTelugu: quickNewsText.slice(0, 100),
      threeWordThumbnailTitle: 'తాజా బ్రేకింగ్ అప్‌డేట్!',
      anchorScriptTelugu: '',
      voiceoverScriptTelugu: '',
      facebookDescription: quickNewsText,
      verticalHashtags: ['#PrajaSanketam', '#TeluguNews', '#BreakingNews'],
      bulletSummary: [quickNewsText.slice(0, 100)],
      status: 'draft',
    };
    onSelectStory(newDraft);
    onNavigateToTab('writer');
  };

  return (
    <div className="space-y-6">
      {/* Studio Banner & Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-gradient-to-br from-[#121927] to-[#0a0f19] p-4 rounded-2xl border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-red-600/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {language === 'te' ? 'న్యూస్ కథనాలు' : 'Total Stories'}
            </span>
            <div className="p-2 rounded-xl bg-red-600/20 text-red-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{drafts.length}</span>
            <span className="text-xs text-red-400 font-semibold font-telugu">యాక్టివ్ న్యూస్‌రూమ్</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-gradient-to-br from-[#121927] to-[#0a0f19] p-4 rounded-2xl border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {language === 'te' ? 'జెమిని AI స్క్రిప్టులు' : 'AI Scripts Ready'}
            </span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {drafts.filter((d) => d.status === 'ai_generated' || d.status === 'video_ready').length}
            </span>
            <span className="text-xs text-amber-400 font-semibold font-telugu">టెలిప్రాంప్టర్ రెడీ</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-gradient-to-br from-[#121927] to-[#0a0f19] p-4 rounded-2xl border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {language === 'te' ? 'వీడియో రెండర్లు' : 'Rendered Videos'}
            </span>
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <Video className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{completedJobs.length}</span>
            <span className="text-xs text-blue-400 font-semibold font-telugu">
              {activeJobs.length > 0 ? `${activeJobs.length} ప్రాసెసింగ్‌లో...` : 'FFmpeg రెడీ'}
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-gradient-to-br from-[#121927] to-[#0a0f19] p-4 rounded-2xl border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {language === 'te' ? 'లైవ్ బ్రాడ్‌కాస్ట్' : 'Broadcast Status'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Tv className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-lg font-black text-white">24x7 HD</span>
            <span className="text-xs text-emerald-400 font-semibold font-telugu">సిద్ధంగా ఉంది</span>
          </div>
        </div>
      </div>

      {/* Quick Input & Video Ingest Desk */}
      <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <h2 className="text-base font-bold text-white font-telugu flex items-center gap-2">
              <span>త్వరిత వార్తా సేకరణ &amp; వీడియో అప్‌లోడ్</span>
              <span className="text-xs text-slate-400 font-sans font-normal">
                (Quick News Ingest &amp; Video Desk)
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={quickCategory}
              onChange={(e) => setQuickCategory(e.target.value as NewsCategory)}
              className="bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 rounded-lg px-3 py-1.5 focus:border-red-500 outline-none cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <textarea
            value={quickNewsText}
            onChange={(e) => setQuickNewsText(e.target.value)}
            placeholder={
              language === 'te'
                ? 'తాజా వార్త లేదా రిపోర్టర్ సమాచారాన్ని ఇక్కడ టైప్ చేయండి లేదా పేస్ట్ చేయండి (ఉదా: తెలంగాణ/ఆంధ్రప్రదేశ్ తాజా రాజకీయ పరిణామాలు)...'
                : 'Enter raw news notes, press release or wire update here...'
            }
            rows={3}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors font-telugu"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Video upload input */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {isUploading
                    ? 'అప్‌లోడ్ అవుతోంది...'
                    : language === 'te'
                    ? 'వీడియో క్లిప్ అప్‌లోడ్ చేయండి'
                    : 'Upload Video Clip'}
                </span>
                <input
                  type="file"
                  accept="video/*,image/*"
                  onChange={handleQuickVideoUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>

              {uploadSuccessMsg && (
                <span className="text-xs text-emerald-400 font-telugu font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {uploadSuccessMsg}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleQuickCreate}
                disabled={!quickNewsText.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 disabled:opacity-50 text-white text-xs lg:text-sm font-bold shadow-lg shadow-red-950/50 cursor-pointer transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{language === 'te' ? 'AI రైటర్‌లో ప్రొడ్యూస్ చేయండి' : 'Produce with AI Writer'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Pills & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
              selectedCategory === 'All'
                ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {language === 'te' ? 'అన్నీ (All)' : 'All'}
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                selectedCategory === cat
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'te' ? 'వార్తలను శోధించండి...' : 'Search stories...'}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500 font-telugu"
          />
        </div>
      </div>

      {/* News Feed Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-300 font-telugu uppercase tracking-wider flex items-center gap-2">
            <span>న్యూస్‌రూమ్ కథనాలు ({filteredDrafts.length})</span>
          </h3>
          <span className="text-xs text-slate-500">
            Click any story to open script &amp; video studio
          </span>
        </div>

        {filteredDrafts.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-2xl p-8">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-300 font-telugu">
              కథనాలు ఏవీ లేవు (No Stories Found)
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'మీ శోధనకు తగిన వార్త దొరకలేదు. శోధన పదాన్ని మార్చండి.'
                : 'కొత్త కథనాన్ని ప్రారంభించడానికి "కొత్త వార్త (+)" బటన్‌ను క్లిక్ చేయండి.'}
            </p>
            <button
              onClick={onNewStory}
              className="mt-4 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all cursor-pointer"
            >
              కొత్త కథనం రాయండి
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredDrafts.map((draft) => {
              const isAiReady = draft.status === 'ai_generated' || draft.anchorScriptTelugu;
              return (
                <div
                  key={draft.id}
                  className="bg-[#0d131f] border border-slate-800 hover:border-red-600/50 rounded-2xl p-4 transition-all shadow-md group flex flex-col justify-between"
                >
                  <div>
                    {/* Top row: Category, date, delete */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-red-950/80 border border-red-800/80 text-red-400">
                          {draft.category}
                        </span>
                        {isAiReady && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-800/60 text-amber-300">
                            <Sparkles className="w-3 h-3" />
                            AI Script
                          </span>
                        )}
                        {draft.status === 'scheduled' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-800/60 text-purple-300">
                            Scheduled
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-mono-code flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(draft.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('ఈ కథనాన్ని తొలగించాలా? (Delete this story?)')) {
                              onDeleteDraft(draft.id);
                            }
                          }}
                          className="text-slate-600 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                          title="Delete story"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Headline in Telugu */}
                    <h4
                      onClick={() => {
                        onSelectStory(draft);
                        onNavigateToTab('writer');
                      }}
                      className="text-base font-bold text-white font-telugu leading-snug group-hover:text-red-400 transition-colors cursor-pointer line-clamp-2"
                    >
                      {draft.headlineTelugu || draft.rawNews.slice(0, 100)}
                    </h4>

                    {/* English subtitle if present */}
                    {draft.headlineEnglish && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1 italic">
                        {draft.headlineEnglish}
                      </p>
                    )}

                    {/* 3-word punchy thumbnail title pill */}
                    {draft.threeWordThumbnailTitle && (
                      <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-telugu font-bold">
                        <span>మూడు పదాల టైటిల్:</span>
                        <span className="text-white font-black">
                          {draft.threeWordThumbnailTitle}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        onSelectStory(draft);
                        onNavigateToTab('writer');
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{language === 'te' ? 'AI స్క్రిప్ట్ చూడండి' : 'AI Scripts'}</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectStory(draft);
                        onNavigateToTab('video');
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      <Video className="w-3.5 h-3.5 text-blue-400" />
                      <span>{language === 'te' ? 'వీడియో స్టూడియో' : 'Video Studio'}</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectStory(draft);
                        onNavigateToTab('facebook');
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-indigo-400 transition-colors cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{language === 'te' ? 'ఫేస్‌బుక్ బ్రాడ్‌కాస్ట్' : 'Broadcast'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
