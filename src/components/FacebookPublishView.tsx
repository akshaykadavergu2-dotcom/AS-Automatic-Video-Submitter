import React, { useState, useEffect } from 'react';
import {
  Share2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Video,
  Hash,
  ExternalLink,
  ShieldCheck,
  Send,
  Settings,
} from 'lucide-react';
import { NewsDraft, VideoRenderJob, StudioSettings } from '../types/news';
import { api } from '../services/api';

interface FacebookPublishViewProps {
  currentDraft: NewsDraft | null;
  drafts: NewsDraft[];
  jobs: VideoRenderJob[];
  settings: StudioSettings;
  onNavigateToTab: (tab: any) => void;
  language: 'te' | 'en';
}

export const FacebookPublishView: React.FC<FacebookPublishViewProps> = ({
  currentDraft,
  drafts,
  jobs,
  settings,
  onNavigateToTab,
  language,
}) => {
  const [selectedDraftId, setSelectedDraftId] = useState<string>(
    currentDraft?.id || drafts[0]?.id || ''
  );
  const activeDraft = drafts.find((d) => d.id === selectedDraftId) || currentDraft;

  const [postMessage, setPostMessage] = useState('');
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState('');

  // Status & Publishing
  const [fbStatus, setFbStatus] = useState<any>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<any>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Sync active draft into form
  useEffect(() => {
    if (activeDraft) {
      const fullContent = `${activeDraft.headlineTelugu}\n\n${activeDraft.facebookDescription}\n\n${(
        activeDraft.verticalHashtags || []
      ).join('\n')}`;
      setPostMessage(fullContent);
      if (activeDraft.videoAssetUrl) {
        setSelectedVideoUrl(activeDraft.videoAssetUrl);
      }
    }
  }, [activeDraft]);

  // Check Facebook Page Status
  const checkFbStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const status = await api.getFacebookStatus();
      setFbStatus(status);
    } catch (err: any) {
      console.error('FB status check failed:', err);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  useEffect(() => {
    checkFbStatus();
  }, []);

  const handlePublish = async () => {
    setPublishError(null);
    setPublishResult(null);

    if (!postMessage.trim()) {
      setPublishError('దయచేసి పోస్ట్ మేటర్ నమోదు చేయండి (Post message cannot be empty)');
      return;
    }

    setIsPublishing(true);
    try {
      const payload: any = {
        draftId: activeDraft?.id,
        message: postMessage,
        videoUrl: selectedVideoUrl || undefined,
      };

      if (isScheduled && scheduledDateTime) {
        payload.scheduledTime = scheduledDateTime;
      }

      const res = await api.publishToFacebook(payload);
      setPublishResult(res);
    } catch (err: any) {
      setPublishError(err.message || 'Meta Facebook publishing failed.');
    } finally {
      setIsPublishing(false);
    }
  };

  const completedJobs = jobs.filter((j) => j.status === 'completed' && j.outputVideoUrl);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#141d2e] via-[#0f172a] to-[#111927] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-600/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg lg:text-xl font-black text-white font-telugu flex items-center gap-2">
                ఫేస్‌బుక్ పేజీ పబ్లిషింగ్ &amp; షెడ్యూలింగ్ డెస్క్
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Official Meta Graph API v21.0 Integration • Video &amp; Post Broadcast Automation
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={checkFbStatus}
          disabled={isCheckingStatus}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin' : ''}`} />
          <span>కనెక్షన్ చెక్</span>
        </button>
      </div>

      {/* Meta Graph API Credentials State Banner */}
      {fbStatus && !fbStatus.connected ? (
        <div className="bg-amber-950/40 border border-amber-800/80 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-300 font-telugu">
                అధికారిక మెటా ఫేస్‌బుక్ పేజీ క్రెడెన్షియల్స్ అవసరం
              </h4>
              <p className="text-xs text-amber-200/80 mt-1 max-w-xl">
                {fbStatus.notice ||
                  'Meta Page Access Token and Page ID are required to publish live to Facebook. Open Studio Settings > Facebook Publishing to configure your Page token securely.'}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-mono text-amber-300/80">
                <span>Required Permissions:</span>
                <span className="px-1.5 py-0.5 rounded bg-black/40">pages_manage_posts</span>
                <span className="px-1.5 py-0.5 rounded bg-black/40">pages_read_engagement</span>
                <span className="px-1.5 py-0.5 rounded bg-black/40">publish_video</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('settings')}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>సెట్టింగ్స్‌లో కాన్ఫిగర్ చేయండి</span>
          </button>
        </div>
      ) : (
        <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                <span>మెటా ఫేస్‌బుక్ పేజీ కనెక్ట్ చేయబడింది:</span>
                <span className="text-white font-bold">{fbStatus?.pageName || 'Praja Sanketam Page'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900 text-emerald-200">
                  Page ID: {fbStatus?.pageId}
                </span>
              </div>
              <p className="text-[11px] text-emerald-400/80 mt-0.5">
                Official Meta Graph API Permissions Verified &amp; Ready for Broadcast.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Publishing Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Post Composer (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            {/* Story Picker */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-telugu block mb-1.5">
                కథనాన్ని ఎంచుకోండి (Select Newsroom Story)
              </label>
              <select
                value={selectedDraftId}
                onChange={(e) => setSelectedDraftId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 cursor-pointer font-telugu"
              >
                {drafts.map((d) => (
                  <option key={d.id} value={d.id}>
                    [{d.category}] {d.headlineTelugu ? d.headlineTelugu.slice(0, 70) : d.rawNews.slice(0, 50)}...
                  </option>
                ))}
              </select>
            </div>

            {/* Post Description Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-telugu">
                  ఫేస్‌బుక్ పోస్ట్ టెక్స్ట్ &amp; నిలువు హాష్‌ట్యాగ్‌లు
                </label>
                <span className="text-[11px] text-slate-500 font-mono-code">
                  {postMessage.length} characters
                </span>
              </div>
              <textarea
                value={postMessage}
                onChange={(e) => setPostMessage(e.target.value)}
                rows={9}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 font-telugu leading-relaxed focus:outline-none focus:border-indigo-500"
                placeholder="ఫేస్‌బుక్ పోస్ట్ వివరాలు మరియు హాష్‌ట్యాగ్‌లు..."
              />
            </div>

            {/* Video Attachment Picker */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-telugu block mb-1.5">
                వీడియోను జతచేయండి (Attach Video from Studio)
              </label>
              <select
                value={selectedVideoUrl}
                onChange={(e) => setSelectedVideoUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="">వీడియో లేకుండా (Text Post Only)</option>
                {completedJobs.map((j) => (
                  <option key={j.id} value={j.outputVideoUrl}>
                    🎬 {j.title.slice(0, 50)} ({j.aspectRatio} MP4)
                  </option>
                ))}
              </select>
            </div>

            {/* Scheduled Publishing Option */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <label className="flex items-center justify-between text-xs font-bold text-slate-300 cursor-pointer">
                <span className="flex items-center gap-2 font-telugu">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  షెడ్యూల్డ్ పబ్లిషింగ్ (Schedule for Later)
                </span>
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="accent-indigo-500 w-4 h-4 cursor-pointer"
                />
              </label>

              {isScheduled && (
                <div className="pt-2 border-t border-slate-800">
                  <label className="text-[11px] text-slate-400 block mb-1 font-telugu">
                    తేదీ &amp; సమయం (కనీసం 10 నిమిషాల భవిష్యత్తు సమయం ఉండాలి):
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledDateTime}
                    onChange={(e) => setScheduledDateTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* Error or Success notification */}
            {publishError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{publishError}</span>
              </div>
            )}

            {publishResult && (
              <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{publishResult.message}</span>
                </div>
                {publishResult.postUrl && (
                  <a
                    href={publishResult.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-amber-300 underline font-mono text-[11px] mt-1"
                  >
                    <span>ఫేస్‌బుక్ పోస్ట్ చూడండి</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {/* Publish Action Button */}
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 hover:from-indigo-500 hover:to-blue-600 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-indigo-950/60 cursor-pointer transition-all"
            >
              {isPublishing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                  <span className="font-telugu">మెటా గ్రాఫ్ API కి పంపుతోంది...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-amber-300" />
                  <span className="font-telugu">
                    {isScheduled
                      ? 'ఫేస్‌బుక్‌లో షెడ్యూల్ చేయండి (Schedule Post)'
                      : 'ఇప్పుడే ఫేస్‌బుక్‌లో పబ్లిష్ చేయండి (Publish Live)'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Facebook Feed Card Mockup Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#18191a] border border-[#3a3b3c] rounded-2xl overflow-hidden shadow-2xl">
            {/* Facebook Post Header Preview */}
            <div className="p-4 border-b border-[#3a3b3c]/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-600 border border-amber-400 flex items-center justify-center text-white font-telugu font-black text-xl">
                  ప్ర
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-[#e4e6eb]">
                      {settings.channelName || 'Praja Sanketam News'}
                    </span>
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center text-[9px] text-white font-bold">
                      ✓
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[#b0b3b8]">
                    <span>Just now</span>
                    <span>•</span>
                    <span>Public 🌐</span>
                  </div>
                </div>
              </div>

              {/* Text content */}
              <div className="mt-3 text-xs text-[#e4e6eb] font-telugu leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto">
                {postMessage || 'పోస్ట్ ప్రివ్యూ ఇక్కడ కనిపిస్తుంది...'}
              </div>
            </div>

            {/* Video or Graphic preview slot */}
            <div className="bg-[#242526] aspect-video flex items-center justify-center text-[#b0b3b8] p-4 text-center">
              {selectedVideoUrl ? (
                <div className="flex flex-col items-center gap-2">
                  <Video className="w-8 h-8 text-indigo-400" />
                  <span className="text-xs text-slate-300 font-semibold truncate max-w-xs">
                    {selectedVideoUrl}
                  </span>
                  <span className="text-[10px] text-emerald-400">వీడియో జతచేయబడింది (Attached)</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <Share2 className="w-8 h-8 text-slate-600" />
                  <span className="text-xs text-slate-500 font-telugu">
                    స్టూడియో వీడియో లేదా గ్రాఫిక్ ప్రివ్యూ
                  </span>
                </div>
              )}
            </div>

            {/* Facebook Action bar mock */}
            <div className="p-3 bg-[#242526] border-t border-[#3a3b3c] flex items-center justify-around text-xs text-[#b0b3b8] font-semibold">
              <span className="hover:text-white cursor-pointer">👍 Like</span>
              <span className="hover:text-white cursor-pointer">💬 Comment</span>
              <span className="hover:text-white cursor-pointer">↗ Share</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
