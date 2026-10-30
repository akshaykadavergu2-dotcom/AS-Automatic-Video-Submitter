import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  Upload,
  Play,
  Pause,
  Download,
  Sparkles,
  Layers,
  Palette,
  Type,
  Clock,
  Radio,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Share2,
  Tv,
} from 'lucide-react';
import { NewsDraft, VideoRenderJob, StudioSettings } from '../types/news';

interface VideoStudioViewProps {
  currentDraft: NewsDraft | null;
  settings: StudioSettings;
  jobs: VideoRenderJob[];
  onStartRender: (config: any) => Promise<{ success: boolean; jobId: string }>;
  onUploadMedia: (file: File) => Promise<{ success: boolean; file: any }>;
  onNavigateToTab: (tab: any) => void;
  language: 'te' | 'en';
}

export const VideoStudioView: React.FC<VideoStudioViewProps> = ({
  currentDraft,
  settings,
  jobs,
  onStartRender,
  onUploadMedia,
  onNavigateToTab,
  language,
}) => {
  // Studio State
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [headline, setHeadline] = useState(
    currentDraft?.headlineTelugu || 'ప్రజా సంకేతం బ్రేకింగ్ న్యూస్: తాజా పరిణామాలు'
  );
  const [subline, setSubline] = useState(
    currentDraft?.threeWordThumbnailTitle || 'సంచలన తాజా అప్‌డేట్ • ప్రత్యేక కథనం'
  );
  const [tickerText, setTickerText] = useState(
    currentDraft?.tickerLineTelugu ||
      'బ్రేకింగ్: ప్రజా సంకేతం 24x7 న్యూస్ అప్‌డేట్స్.. సరికొత్త సాంకేతికతతో వేగవంతమైన ప్రసారాలు..'
  );
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor || '#dc2626');
  const [fontSize, setFontSize] = useState(aspectRatio === '16:9' ? 32 : 36);
  const [showLogo, setShowLogo] = useState(true);
  const [showDate, setShowDate] = useState(true);
  const [showTicker, setShowTicker] = useState(true);
  const [sourceVideoUrl, setSourceVideoUrl] = useState<string | null>(null);

  // Playback & Canvas Render State
  const [isPlaying, setIsPlaying] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isQueueingRender, setIsQueueingRender] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [localRecording, setLocalRecording] = useState(false);
  const [localDownloadUrl, setLocalDownloadUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoElemRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const tickerOffsetRef = useRef<number>(0);

  // Find active job
  const currentRenderJob = jobs.find((j) => j.id === activeJobId);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await onUploadMedia(file);
      setSourceVideoUrl(res.file.url);
      if (videoElemRef.current) {
        videoElemRef.current.src = res.file.url;
        videoElemRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Sync with current draft if changed
  useEffect(() => {
    if (currentDraft?.headlineTelugu) {
      setHeadline(currentDraft.headlineTelugu);
    }
    if (currentDraft?.tickerLineTelugu) {
      setTickerText(currentDraft.tickerLineTelugu);
    }
    if (currentDraft?.threeWordThumbnailTitle) {
      setSubline(currentDraft.threeWordThumbnailTitle);
    }
  }, [currentDraft]);

  // Canvas drawing loop for live broadcast simulation
  useEffect(() => {
    let animId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const is169 = aspectRatio === '16:9';
    const targetWidth = is169 ? 1280 : 720;
    const targetHeight = is169 ? 720 : 1280;

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    const renderFrame = () => {
      // 1. Draw Background (Video or Newsroom Studio Gradient)
      if (videoElemRef.current && sourceVideoUrl && !videoElemRef.current.paused) {
        ctx.drawImage(videoElemRef.current, 0, 0, targetWidth, targetHeight);
      } else {
        // Draw broadcast studio dark backdrop with subtle motion
        const grad = ctx.createLinearGradient(0, 0, targetWidth, targetHeight);
        grad.addColorStop(0, '#090d16');
        grad.addColorStop(0.5, '#111827');
        grad.addColorStop(1, '#020617');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Studio globe wireframe ring effect
        ctx.strokeStyle = 'rgba(220, 38, 38, 0.12)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(targetWidth / 2, targetHeight / 2, targetWidth * 0.35, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(251, 191, 36, 0.08)';
        ctx.beginPath();
        ctx.arc(targetWidth / 2, targetHeight / 2, targetWidth * 0.45, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 2. Draw Top Bar Overlays
      if (is169) {
        // 16:9 Landscape Layout
        // Subtle top vignette
        const topGrad = ctx.createLinearGradient(0, 0, 0, 120);
        topGrad.addColorStop(0, 'rgba(0,0,0,0.85)');
        topGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, targetWidth, 120);

        // Channel Brand Plate Top Left
        if (showLogo) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.strokeStyle = primaryColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(40, 25, 340, 56, 8);
          ctx.fill();
          ctx.stroke();

          // Logo badge
          ctx.fillStyle = primaryColor;
          ctx.beginPath();
          ctx.roundRect(48, 33, 40, 40, 6);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = "900 22px 'Noto Sans Telugu', sans-serif";
          ctx.textAlign = 'center';
          ctx.fillText('ప్ర', 68, 62);

          // Channel text
          ctx.textAlign = 'left';
          ctx.font = "800 15px 'Outfit', sans-serif";
          ctx.fillText('PRAJA SANKETAM', 100, 50);

          ctx.fillStyle = '#fbbf24';
          ctx.font = "700 13px 'Noto Sans Telugu', sans-serif";
          ctx.fillText('AI న్యూస్ స్టూడియో', 100, 68);
        }

        // Top Right Live & Clock Bug
        if (showDate) {
          // LIVE red badge
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.roundRect(targetWidth - 310, 25, 90, 38, 6);
          ctx.fill();

          // Pulsing dot
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(targetWidth - 292, 44, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = "900 16px 'Outfit', sans-serif";
          ctx.textAlign = 'left';
          ctx.fillText('LIVE', targetWidth - 280, 50);

          // Time pill
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(targetWidth - 210, 25, 170, 38, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#f1f5f9';
          ctx.font = "600 13px 'JetBrains Mono', monospace";
          ctx.textAlign = 'center';
          const now = new Date();
          ctx.fillText(now.toLocaleTimeString('en-US', { hour12: false }) + ' IST', targetWidth - 125, 49);
        }

        // Lower Third News Plate
        const plateY = targetHeight - 210;
        // Breaking News Tag
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.moveTo(40, plateY);
        ctx.lineTo(240, plateY);
        ctx.lineTo(220, plateY + 40);
        ctx.lineTo(40, plateY + 40);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = "900 18px 'Noto Sans Telugu', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText('బ్రేకింగ్ న్యూస్', 130, plateY + 27);

        // Main Headline Container Box
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(40, plateY + 40, targetWidth - 80, 95, 4);
        ctx.fill();
        ctx.stroke();

        // Gold accent vertical strip
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(40, plateY + 40, 10, 95);

        // Headline Text
        ctx.fillStyle = '#ffffff';
        ctx.font = `800 ${fontSize}px 'Noto Sans Telugu', sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(headline.slice(0, 65), 65, plateY + 95);

        // Subline
        ctx.fillStyle = '#fbbf24';
        ctx.font = "600 18px 'Noto Sans Telugu', sans-serif";
        ctx.fillText(subline, 65, plateY + 122);

        // Bottom Scrolling Ticker
        if (showTicker) {
          const tickerY = targetHeight - 60;
          ctx.fillStyle = '#060a14';
          ctx.fillRect(0, tickerY, targetWidth, 60);

          // Ticker Red Lead Badge
          ctx.fillStyle = primaryColor;
          ctx.fillRect(0, tickerY, 180, 60);

          ctx.fillStyle = '#ffffff';
          ctx.font = "900 18px 'Noto Sans Telugu', sans-serif";
          ctx.textAlign = 'center';
          ctx.fillText('తాజా వార్తలు', 90, tickerY + 36);

          // Clip region for scrolling text
          ctx.save();
          ctx.beginPath();
          ctx.rect(190, tickerY, targetWidth - 190, 60);
          ctx.clip();

          tickerOffsetRef.current -= 1.8;
          const fullTicker = `★ ${tickerText} ★ ప్రజా సంకేతం 24x7 న్యూస్ నెట్‌వర్క్ ★ `;
          ctx.fillStyle = '#f3f4f6';
          ctx.font = "600 20px 'Noto Sans Telugu', sans-serif";
          ctx.textAlign = 'left';

          const textWidth = ctx.measureText(fullTicker).width;
          if (tickerOffsetRef.current <= -textWidth) {
            tickerOffsetRef.current = 0;
          }

          ctx.fillText(fullTicker, 200 + tickerOffsetRef.current, tickerY + 37);
          ctx.fillText(fullTicker, 200 + tickerOffsetRef.current + textWidth, tickerY + 37);
          ctx.restore();
        }
      } else {
        // 9:16 Vertical Shorts Layout (720 x 1280)
        // Top Header
        if (showLogo) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
          ctx.strokeStyle = primaryColor;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(40, 50, targetWidth - 80, 80, 16);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = primaryColor;
          ctx.beginPath();
          ctx.arc(85, 90, 26, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = "900 26px 'Noto Sans Telugu', sans-serif";
          ctx.textAlign = 'center';
          ctx.fillText('ప్ర', 85, 100);

          ctx.textAlign = 'left';
          ctx.font = "900 20px 'Outfit', sans-serif";
          ctx.fillText('PRAJA SANKETAM', 125, 84);

          ctx.fillStyle = '#fbbf24';
          ctx.font = "700 16px 'Noto Sans Telugu', sans-serif";
          ctx.fillText('AI న్యూస్ స్టూడియో • SHORTS', 125, 108);
        }

        // Big Breaking Badge Top
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.roundRect(40, 150, 240, 44, 8);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = "900 20px 'Noto Sans Telugu', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText('బిగ్ బ్రేకింగ్', 160, 180);

        // Lower Third News Block for Mobile
        const vPlateY = targetHeight - 380;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(30, vPlateY, targetWidth - 60, 260, 18);
        ctx.fill();
        ctx.stroke();

        // Crimson Top Accent
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.roundRect(30, vPlateY, targetWidth - 60, 8, 4);
        ctx.fill();

        // Main Headline in Vertical Mobile Block
        ctx.fillStyle = '#ffffff';
        ctx.font = `900 ${fontSize}px 'Noto Sans Telugu', sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(headline.slice(0, 48), 50, vPlateY + 65);

        ctx.fillStyle = '#fbbf24';
        ctx.font = "700 22px 'Noto Sans Telugu', sans-serif";
        ctx.fillText(subline, 50, vPlateY + 120);

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(50, vPlateY + 160);
        ctx.lineTo(targetWidth - 50, vPlateY + 160);
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = "600 16px 'Noto Sans Telugu', sans-serif";
        ctx.fillText('🔴 ప్రజా సంకేతం డిజిటల్ నెట్‌వర్క్ | లైక్ & షేర్ చేయండి', 50, vPlateY + 205);

        // Bottom Ticker
        if (showTicker) {
          const vTickerY = targetHeight - 80;
          ctx.fillStyle = '#060a14';
          ctx.fillRect(0, vTickerY, targetWidth, 80);

          ctx.fillStyle = primaryColor;
          ctx.fillRect(0, vTickerY, 150, 80);

          ctx.fillStyle = '#ffffff';
          ctx.font = "900 20px 'Noto Sans Telugu', sans-serif";
          ctx.textAlign = 'center';
          ctx.fillText('అప్‌డేట్స్', 75, vTickerY + 48);

          ctx.save();
          ctx.beginPath();
          ctx.rect(160, vTickerY, targetWidth - 160, 80);
          ctx.clip();

          tickerOffsetRef.current -= 1.8;
          const fullTicker = `★ ${tickerText} ★ `;
          ctx.fillStyle = '#f3f4f6';
          ctx.font = "700 20px 'Noto Sans Telugu', sans-serif";
          ctx.textAlign = 'left';

          const textWidth = ctx.measureText(fullTicker).width;
          if (tickerOffsetRef.current <= -textWidth) {
            tickerOffsetRef.current = 0;
          }
          ctx.fillText(fullTicker, 170 + tickerOffsetRef.current, vTickerY + 48);
          ctx.fillText(fullTicker, 170 + tickerOffsetRef.current + textWidth, vTickerY + 48);
          ctx.restore();
        }
      }

      if (isPlaying) {
        animId = requestAnimationFrame(renderFrame);
      }
    };

    animId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animId);
  }, [
    aspectRatio,
    headline,
    subline,
    tickerText,
    primaryColor,
    fontSize,
    showLogo,
    showDate,
    showTicker,
    sourceVideoUrl,
    isPlaying,
  ]);

  // Queue FFmpeg Render on Backend Worker
  const handleQueueBackendRender = async () => {
    setIsQueueingRender(true);
    try {
      const renderConfig = {
        headline,
        subline,
        tickerText,
        aspectRatio,
        primaryColor,
        fontSize,
        showLogo,
        showDate,
        showTicker,
        sourceVideoUrl,
        newsId: currentDraft?.id,
      };

      const result = await onStartRender(renderConfig);
      setActiveJobId(result.jobId);
    } catch (err: any) {
      alert(`Render error: ${err.message}`);
    } finally {
      setIsQueueingRender(false);
    }
  };

  // Instant Client-side Recording via Canvas MediaRecorder (Immediate Export!)
  const handleStartClientRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
      });
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setLocalDownloadUrl(url);
        setLocalRecording(false);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setLocalRecording(true);
      setLocalDownloadUrl(null);

      // Record 8 seconds bulletin teaser
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 8000);
    } catch (e: any) {
      alert(`Client recording failed: ${e.message}`);
      setLocalRecording(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="bg-gradient-to-r from-[#141d2e] via-[#0f172a] to-[#111927] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-600/30">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg lg:text-xl font-black text-white font-telugu flex items-center gap-2">
                వీడియో ఎడిటింగ్ స్టూడియో &amp; గ్రాఫిక్స్ ఓవర్‌లే
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Landscape 16:9 &amp; Vertical 9:16 • Dedicated FFmpeg Backend Worker &amp; Instant Web Exporter
              </p>
            </div>
          </div>
        </div>

        {/* Aspect Ratio Switcher */}
        <div className="flex items-center bg-slate-900 border border-slate-700/80 p-1 rounded-xl">
          <button
            onClick={() => {
              setAspectRatio('16:9');
              setFontSize(32);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              aspectRatio === '16:9'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            16:9 Landscape (TV/YouTube)
          </button>
          <button
            onClick={() => {
              setAspectRatio('9:16');
              setFontSize(36);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              aspectRatio === '9:16'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            9:16 Vertical (Reels/Shorts)
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Canvas Live Preview Monitor (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 shadow-2xl overflow-hidden flex flex-col items-center">
            {/* Monitor Header */}
            <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                <span className="text-xs font-bold font-mono tracking-wider text-slate-300">
                  PROGRAM MONITOR 1 • {aspectRatio === '16:9' ? '1920x1080 (16:9)' : '1080x1920 (9:16)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1 cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isPlaying ? 'Freeze' : 'Live'}</span>
                </button>
              </div>
            </div>

            {/* Canvas Viewport */}
            <div
              className={`relative rounded-xl overflow-hidden bg-black shadow-inner flex items-center justify-center border border-slate-800 ${
                aspectRatio === '16:9' ? 'w-full aspect-video' : 'w-72 sm:w-80 aspect-[9/16]'
              }`}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
              />

              {/* Hidden video tag used for background decoding */}
              <video
                ref={videoElemRef}
                crossOrigin="anonymous"
                loop
                muted
                playsInline
                className="hidden"
              />

              {/* Local Recording indicator */}
              {localRecording && (
                <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white" />
                  <span>RECORDING BULLETING (8s)...</span>
                </div>
              )}
            </div>

            {/* Video file attachment status */}
            <div className="w-full mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>
                  {sourceVideoUrl
                    ? 'కస్టమ్ వీడియో క్లిప్ కనెక్ట్ చేయబడింది'
                    : 'డిఫాల్ట్ ప్రజా సంకేతం స్టూడియో మోషన్ బ్యాక్‌డ్రాప్'}
                </span>
              </div>

              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>{isUploading ? 'అప్‌లోడ్ అవుతోంది...' : 'వీడియో మార్చండి (Upload Video)'}</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>

          {/* Render Status & Download Card */}
          {currentRenderJob && (
            <div className="bg-[#0f1624] border border-blue-800/60 rounded-2xl p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw
                    className={`w-4 h-4 ${
                      currentRenderJob.status === 'processing'
                        ? 'animate-spin text-blue-400'
                        : 'text-emerald-400'
                    }`}
                  />
                  <span className="text-xs font-bold text-white font-telugu">
                    FFmpeg బ్యాకెండ్ వర్కర్ స్థితి: {currentRenderJob.status.toUpperCase()}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-blue-400">
                  {currentRenderJob.progress}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-300"
                  style={{ width: `${currentRenderJob.progress}%` }}
                />
              </div>

              {currentRenderJob.status === 'completed' && currentRenderJob.outputVideoUrl && (
                <div className="pt-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold font-telugu">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>MP4 వీడియో రెండరింగ్ విజయవంతం!</span>
                  </div>
                  <a
                    href={currentRenderJob.outputVideoUrl}
                    download="praja_sanketam_news.mp4"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow cursor-pointer transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>డౌన్‌లోడ్ MP4 (Download)</span>
                  </a>
                </div>
              )}

              {currentRenderJob.status === 'failed' && (
                <div className="p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-xs">
                  {currentRenderJob.error || 'FFmpeg render failed.'}
                </div>
              )}
            </div>
          )}

          {/* Instant Local Recorded Clip Download */}
          {localDownloadUrl && (
            <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-telugu font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>ఇన్‌స్టంట్ వీడియో క్లిప్ సిద్ధంగా ఉంది (Instant Clip Ready)</span>
              </div>
              <a
                href={localDownloadUrl}
                download={`praja_sanketam_${aspectRatio === '16:9' ? 'landscape' : 'vertical'}.webm`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>ఇప్పుడే డౌన్‌లోడ్ చేయండి</span>
              </a>
            </div>
          )}
        </div>

        {/* Right Column: Customization Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-telugu flex items-center gap-2">
              <Palette className="w-4 h-4 text-red-400" />
              <span>గ్రాఫిక్స్ &amp; టెక్స్ట్ ఎడిటింగ్ కంట్రోల్స్</span>
            </h3>

            {/* Headline Editor */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1 font-telugu">
                ప్రధాన తెలుగు బ్రేకింగ్ హెడ్‌లైన్ (Main Headline)
              </label>
              <textarea
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-telugu focus:outline-none focus:border-red-500 leading-snug"
              />
            </div>

            {/* Subline / Thumbnail Title */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1 font-telugu">
                సబ్‌లైన్ / కిక్కర్ (Subtitle / Kicker)
              </label>
              <input
                type="text"
                value={subline}
                onChange={(e) => setSubline(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-telugu focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Ticker Text */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1 font-telugu">
                స్క్రోలింగ్ న్యూస్ టిక్కర్ టెక్స్ట్ (News Ticker Bar)
              </label>
              <textarea
                value={tickerText}
                onChange={(e) => setTickerText(e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-telugu focus:outline-none focus:border-red-500 leading-snug"
              />
            </div>

            {/* Font Size & Primary Color */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1 font-telugu">
                  ఫాంట్ సైజ్: <span className="font-mono text-amber-400">{fontSize}px</span>
                </label>
                <input
                  type="range"
                  min="20"
                  max="52"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                  className="w-full accent-red-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1 font-telugu">
                  థీమ్ రంగు (Theme Color)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded-lg bg-transparent border border-slate-700 cursor-pointer"
                  />
                  <div className="flex gap-1">
                    {['#dc2626', '#2563eb', '#d97706', '#059669'].map((c) => (
                      <button
                        key={c}
                        onClick={() => setPrimaryColor(c)}
                        style={{ backgroundColor: c }}
                        className="w-5 h-5 rounded-full border border-white/20 cursor-pointer"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                <span className="font-telugu">ప్రజా సంకేతం ఛానల్ లోగో చూపించు</span>
                <input
                  type="checkbox"
                  checked={showLogo}
                  onChange={(e) => setShowLogo(e.target.checked)}
                  className="accent-red-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                <span className="font-telugu">లైవ్ క్లాక్ &amp; తేదీ చూపించు</span>
                <input
                  type="checkbox"
                  checked={showDate}
                  onChange={(e) => setShowDate(e.target.checked)}
                  className="accent-red-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                <span className="font-telugu">దిగువ న్యూస్ టిక్కర్ చూపించు</span>
                <input
                  type="checkbox"
                  checked={showTicker}
                  onChange={(e) => setShowTicker(e.target.checked)}
                  className="accent-red-500 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            {/* Export Action Buttons */}
            <div className="pt-3 space-y-2.5">
              {/* Primary Action: Dedicated FFmpeg Backend Worker */}
              <button
                onClick={handleQueueBackendRender}
                disabled={isQueueingRender}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-red-700 to-rose-700 hover:from-red-500 hover:to-rose-600 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-red-950/60 cursor-pointer transition-all"
              >
                {isQueueingRender ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                    <span>FFmpeg వర్కర్‌కు పంపుతోంది...</span>
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4 text-amber-300" />
                    <span className="font-telugu">FFmpeg బ్యాకెండ్ వర్కర్‌తో రెండర్ చేయండి (MP4)</span>
                  </>
                )}
              </button>

              {/* Instant Browser Recorder */}
              <button
                onClick={handleStartClientRecording}
                disabled={localRecording}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 cursor-pointer transition-colors"
              >
                <Radio className="w-4 h-4 text-emerald-400" />
                <span className="font-telugu">
                  {localRecording ? 'రికార్డ్ అవుతోంది...' : 'ఇన్‌స్టంట్ బ్రౌజర్ ఎక్స్‌పోర్ట్ (8s క్లిప్)'}
                </span>
              </button>

              {/* Publish to Facebook shortcut */}
              <button
                onClick={() => onNavigateToTab('facebook')}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-800/60 text-xs font-semibold text-indigo-300 cursor-pointer transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="font-telugu">ఫేస్‌బుక్ పబ్లిషింగ్ డెస్క్‌కు పంపండి</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
