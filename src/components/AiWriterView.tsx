import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Video,
  Share2,
  Tv,
  Save,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Hash,
  MessageSquare,
  Mic,
  AlignLeft,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { NewsCategory, NewsDraft } from '../types/news';

interface AiWriterViewProps {
  currentDraft: NewsDraft | null;
  onUpdateDraft: (draft: NewsDraft) => void;
  onSaveDraft: (draft: NewsDraft) => Promise<void>;
  onGenerateAi: (params: { rawNews: string; category: string; tone?: string }) => Promise<any>;
  onNavigateToTab: (tab: any) => void;
  onOpenTeleprompter: (script: string, title: string) => void;
  language: 'te' | 'en';
}

const SAMPLE_STORIES = [
  {
    label: 'తెలంగాణ: నూతన పారిశ్రామిక పాలసీ',
    category: 'Telangana' as NewsCategory,
    text: 'తెలంగాణలో కొత్త పారిశ్రామిక పాలసీకి కేబినెట్ ఆమోదం తెలిపింది. హైదరాబాద్ చుట్టూ భారీ ఎలక్ట్రానిక్స్ & ఫార్మా క్లస్టర్ల ఏర్పాటుకు నిర్ణయం తీసుకున్నారు. 50 వేల కొత్త ఉద్యోగాలు కల్పించడమే లక్ష్యమని ప్రభుత్వం ప్రకటించింది.',
  },
  {
    label: 'ఆంధ్రప్రదేశ్: అమరావతి పనుల వేగవంతం',
    category: 'Andhra Pradesh' as NewsCategory,
    text: 'ఆంధ్రప్రదేశ్ రాజధాని అమరావతిలో పనుల వేగం పెంచేందుకు సీఆర్డీఏ కీలక సమీక్ష నిర్వహించింది. ప్రధాన రహదారులు, ఐకానిక్ భవనాల నిర్మాణాలు పూర్తి చేసేందుకు టైమ్‌లైన్ ఖరారు చేశారు.',
  },
  {
    label: 'రాజకీయాలు: అసెంబ్లీ బడ్జెట్ సమావేశాలు',
    category: 'Politics' as NewsCategory,
    text: 'రాష్ట్ర అసెంబ్లీ బడ్జెట్ సమావేశాలు వచ్చే వారం నుంచి ప్రారంభం కానున్నాయి. రైతు సంక్షేమం, సంక్షేమ పథకాలు, రుణమాఫీపై ప్రధానంగా చర్చ జరిగే అవకాశం ఉందని రాజకీయ వర్గాలు వెల్లడించాయి.',
  },
  {
    label: 'బ్రేకింగ్: వాతావరణ హెచ్చరిక (ఎల్లో అలర్ట్)',
    category: 'Breaking News' as NewsCategory,
    text: 'వాతావరణ శాఖ తెలంగాణ మరియు కోస్తా ఆంధ్ర జిల్లాలకు ఎల్లో అలర్ట్ జారీ చేసింది. రాగల 48 గంటల్లో భారీ ఉరుములతో కూడిన వర్షాలు కురిసే అవకాశం ఉందని ప్రజలు అప్రమత్తంగా ఉండాలని విపత్తు నిర్వహణ శాఖ సూచించింది.',
  },
];

export const AiWriterView: React.FC<AiWriterViewProps> = ({
  currentDraft,
  onUpdateDraft,
  onSaveDraft,
  onGenerateAi,
  onNavigateToTab,
  onOpenTeleprompter,
  language,
}) => {
  const [rawNews, setRawNews] = useState(currentDraft?.rawNews || '');
  const [category, setCategory] = useState<NewsCategory>(
    currentDraft?.category || 'Breaking News'
  );
  const [tone, setTone] = useState<'breaking' | 'analytical' | 'bulletin' | 'investigative'>(
    'breaking'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Keep local fields in sync with currentDraft
  const headlineTelugu = currentDraft?.headlineTelugu || '';
  const headlineEnglish = currentDraft?.headlineEnglish || '';
  const tickerLineTelugu = currentDraft?.tickerLineTelugu || '';
  const threeWordThumbnailTitle = currentDraft?.threeWordThumbnailTitle || '';
  const anchorScriptTelugu = currentDraft?.anchorScriptTelugu || '';
  const voiceoverScriptTelugu = currentDraft?.voiceoverScriptTelugu || '';
  const facebookDescription = currentDraft?.facebookDescription || '';
  const verticalHashtags = currentDraft?.verticalHashtags || [];
  const bulletSummary = currentDraft?.bulletSummary || [];

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGenerate = async () => {
    if (!rawNews.trim()) {
      setErrorMsg('దయచేసి వార్తా సమాచారాన్ని నమోదు చేయండి (Please enter news content)');
      return;
    }
    setErrorMsg('');
    setIsGenerating(true);

    try {
      const response = await onGenerateAi({
        rawNews,
        category,
        tone,
      });

      if (response && response.data) {
        const d = response.data;
        const updated: NewsDraft = {
          id: currentDraft?.id || `draft-${Date.now()}`,
          createdAt: currentDraft?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          category,
          rawNews,
          headlineTelugu: d.headlineTelugu,
          headlineEnglish: d.headlineEnglish,
          tickerLineTelugu: d.tickerLineTelugu,
          threeWordThumbnailTitle: d.threeWordThumbnailTitle,
          anchorScriptTelugu: d.anchorScriptTelugu,
          voiceoverScriptTelugu: d.voiceoverScriptTelugu,
          facebookDescription: d.facebookDescription,
          verticalHashtags: d.verticalHashtags || [],
          bulletSummary: d.bulletSummary || [],
          status: 'ai_generated',
        };
        onUpdateDraft(updated);
        await onSaveDraft(updated);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gemini AI generation failed. Verify API configuration.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualSave = async () => {
    if (!currentDraft) return;
    setIsSaving(true);
    try {
      await onSaveDraft({
        ...currentDraft,
        rawNews,
        category,
      });
      alert('కథనం విజయవంతంగా సేవ్ చేయబడింది (Draft saved successfully)');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const loadSample = (s: typeof SAMPLE_STORIES[0]) => {
    setRawNews(s.text);
    setCategory(s.category);
  };

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="bg-gradient-to-r from-[#141d2e] via-[#0f172a] to-[#111927] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg lg:text-xl font-black text-white font-telugu flex items-center gap-2">
                జెమిని AI న్యూస్ రైటర్ &amp; స్క్రిప్టింగ్ డెస్క్
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Powered by Google Gemini 3.8 Flash • Authentic Telugu TV News Broadcast Formatter
              </p>
            </div>
          </div>
        </div>

        {/* Fact check guarantee pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-telugu">జర్నలిస్టిక్ ప్రమాణాలు: కల్పిత వార్తలు అనుమతించబడవు</span>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input and Generation Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-4 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-telugu">
                వార్తా సమాచారం నమోదు (Raw News Input)
              </label>
              <span className="text-[11px] text-slate-500 font-mono-code">
                {rawNews.length} characters
              </span>
            </div>

            {/* Quick Sample story buttons */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 font-telugu block">
                శాంపిల్ కథనాన్ని ఎంచుకోండి (Quick Preset):
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {SAMPLE_STORIES.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => loadSample(s)}
                    className="text-left text-[11px] font-telugu px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 truncate cursor-pointer transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category and Tone Selectors */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1 font-telugu">
                  కేటగిరీ (Category)
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as NewsCategory)}
                  className="w-full bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 rounded-lg px-3 py-2 outline-none focus:border-red-500 cursor-pointer"
                >
                  <option value="Breaking News">బ్రేకింగ్ న్యూస్</option>
                  <option value="Telangana">తెలంగాణ</option>
                  <option value="Andhra Pradesh">ఆంధ్రప్రదేశ్</option>
                  <option value="Politics">రాజకీయాలు</option>
                  <option value="National">జాతీయం</option>
                  <option value="Local News">స్థానిక వార్తలు</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1 font-telugu">
                  టోన్ / శైలి (Tone)
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 rounded-lg px-3 py-2 outline-none focus:border-red-500 cursor-pointer"
                >
                  <option value="breaking">బ్రేకింగ్ ఇంపాక్ట్ (Breaking)</option>
                  <option value="analytical">సమగ్ర విశ్లేషణ (Analytical)</option>
                  <option value="bulletin">వార్తా బులెటిన్ (Bulletin)</option>
                  <option value="investigative">ప్రత్యేక పరిశోధన (Investigative)</option>
                </select>
              </div>
            </div>

            {/* Textarea */}
            <textarea
              value={rawNews}
              onChange={(e) => setRawNews(e.target.value)}
              placeholder="రిపోర్టర్ నోట్స్, ప్రెస్ నోట్ లేదా తాజా వార్తా విశేషాలను ఇక్కడ నమోదు చేయండి..."
              rows={8}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500 font-telugu leading-relaxed"
            />

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Generate Action Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !rawNews.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-red-700 to-rose-700 hover:from-red-500 hover:to-rose-600 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-red-950/60 cursor-pointer transition-all transform active:scale-[0.99]"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                  <span className="font-telugu">జెమిని AI తెలుగు స్క్రిప్ట్ రచిస్తోంది...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span className="font-telugu">AI న్యూస్ ప్యాకేజ్ రూపొందించండి</span>
                </>
              )}
            </button>

            {currentDraft && (
              <button
                onClick={handleManualSave}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 cursor-pointer transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span className="font-telugu">డ్రాఫ్ట్‌గా భద్రపరచండి (Save Draft)</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Structured AI Generated Output (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {!headlineTelugu && !anchorScriptTelugu ? (
            <div className="bg-[#0f1624] border border-slate-800/80 rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[440px]">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-white font-telugu">
                AI స్క్రిప్ట్ అవుట్‌పుట్ డెస్క్
              </h3>
              <p className="text-xs text-slate-400 max-w-md mt-1 font-telugu">
                ఎడమవైపు వార్తా సమాచారాన్ని నమోదు చేసి &quot;AI న్యూస్ ప్యాకేజ్ రూపొందించండి&quot; బటన్‌ను క్లిక్ చేయండి. క్రిస్ప్ హెడ్‌లైన్లు, యాంకర్ స్క్రిప్ట్, వాయిస్ ఓవర్, ఫేస్‌బుక్ డిస్క్రిప్షన్ &amp; హాష్‌ట్యాగ్‌లు క్షణాల్లో సిద్ధమవుతాయి.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Output 1: Crisp Telugu Headline & English Translation */}
              <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-4 shadow-md relative group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider font-telugu">
                      ప్రధాన తెలుగు హెడ్‌లైన్ (Main Headline)
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(headlineTelugu, 'headline')}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-900 border border-slate-800 cursor-pointer"
                  >
                    {copiedField === 'headline' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedField === 'headline' ? 'కాపీ చేయబడింది' : 'కాపీ'}</span>
                  </button>
                </div>
                <h3 className="text-lg font-black text-white font-telugu leading-snug">
                  {headlineTelugu}
                </h3>
                {headlineEnglish && (
                  <p className="text-xs text-slate-400 mt-1 italic">{headlineEnglish}</p>
                )}
                {tickerLineTelugu && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-2 text-xs text-amber-300 font-telugu">
                    <span className="font-bold text-[10px] bg-red-950 px-1.5 py-0.5 rounded text-red-400 uppercase">
                      టిక్కర్
                    </span>
                    <span>{tickerLineTelugu}</span>
                  </div>
                )}
              </div>

              {/* Output 2: 3-Word Thumbnail Title */}
              <div className="bg-gradient-to-r from-amber-950/40 via-[#101827] to-[#0f1624] border border-amber-600/40 rounded-2xl p-4 shadow-md flex items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider font-telugu block">
                    మూడు పదాల థంబ్‌నైల్ టైటిల్ (3-Word High CTR Title)
                  </span>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-xl font-black text-white font-telugu tracking-wide drop-shadow">
                      {threeWordThumbnailTitle}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white uppercase">
                      VIRAL CTR
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(threeWordThumbnailTitle, 'thumbTitle')}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer"
                >
                  {copiedField === 'thumbTitle' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>కాపీ</span>
                </button>
              </div>

              {/* Output 3: Anchor Teleprompter Script */}
              <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-4 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-telugu">
                      టీవీ యాంకర్ ప్రసార స్క్రిప్ట్ (TV Anchor Script)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenTeleprompter(anchorScriptTelugu, headlineTelugu)}
                      className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 px-3 py-1 rounded-lg shadow cursor-pointer transition-colors"
                    >
                      <Tv className="w-3.5 h-3.5 text-amber-300" />
                      <span>టెలిప్రాంప్టర్ మోడ్</span>
                    </button>
                    <button
                      onClick={() => handleCopy(anchorScriptTelugu, 'anchorScript')}
                      className="p-1.5 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800 cursor-pointer"
                      title="Copy script"
                    >
                      {copiedField === 'anchorScript' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800/80 max-h-48 overflow-y-auto font-telugu text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                  {anchorScriptTelugu}
                </div>
              </div>

              {/* Output 4: Voiceover Script with Visual Cues */}
              <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-4 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlignLeft className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-telugu">
                      వాయిస్ ఓవర్ &amp; విజువల్ క్యూస్ (Voiceover Script)
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(voiceoverScriptTelugu, 'voScript')}
                    className="p-1.5 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800 cursor-pointer"
                  >
                    {copiedField === 'voScript' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800/80 max-h-40 overflow-y-auto font-telugu text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {voiceoverScriptTelugu}
                </div>
              </div>

              {/* Output 5: Facebook Post & Vertical Hashtags */}
              <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-4 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-telugu">
                      ఫేస్‌బుక్ డిస్క్రిప్షన్ &amp; నిలువు హాష్‌ట్యాగ్‌లు (Social Post)
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      handleCopy(
                        `${facebookDescription}\n\n${verticalHashtags.join('\n')}`,
                        'fbPost'
                      )
                    }
                    className="p-1.5 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800 cursor-pointer"
                  >
                    {copiedField === 'fbPost' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-xs font-telugu text-slate-200 leading-relaxed whitespace-pre-line max-h-36 overflow-y-auto">
                    {facebookDescription}
                  </div>
                  <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-xs font-mono text-amber-300 max-h-36 overflow-y-auto">
                    <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">
                      Vertical Tags:
                    </span>
                    {verticalHashtags.map((h, i) => (
                      <div key={i} className="py-0.5 truncate">
                        {h}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fast Action Transfer Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigateToTab('video')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950/50 cursor-pointer transition-all"
                  >
                    <Video className="w-4 h-4" />
                    <span>{language === 'te' ? 'వీడియో ఎడిటర్‌కు పంపండి' : 'Send to Video Studio'}</span>
                  </button>

                  <button
                    onClick={() => onNavigateToTab('facebook')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/50 cursor-pointer transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{language === 'te' ? 'ఫేస్‌బుక్ పబ్లిషింగ్' : 'Publish to Facebook'}</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    const fullText = `【ప్రజా సంకేతం బ్రేకింగ్】\n${headlineTelugu}\n\n[మూడు పదాల టైటిల్]: ${threeWordThumbnailTitle}\n\n[యాంకర్ స్క్రిప్ట్]:\n${anchorScriptTelugu}\n\n[వాయిస్ ఓవర్]:\n${voiceoverScriptTelugu}\n\n[ఫేస్‌బుక్ డిస్క్రిప్షన్]:\n${facebookDescription}\n\n${verticalHashtags.join('\n')}`;
                    handleCopy(fullText, 'fullPackage');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 cursor-pointer transition-colors"
                >
                  {copiedField === 'fullPackage' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>పూర్తి ప్యాకేజ్ కాపీ</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
