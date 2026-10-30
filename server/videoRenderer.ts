import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { VideoRenderJob, saveJob } from './storage.js';

const RENDERS_DIR = path.resolve(process.cwd(), 'uploads/renders');
const TEMP_DIR = path.resolve(process.cwd(), 'uploads/temp');

function ensureDirectories() {
  if (!fs.existsSync(RENDERS_DIR)) fs.mkdirSync(RENDERS_DIR, { recursive: true });
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
}

export function createSVGOverlay(
  width: number,
  height: number,
  config: VideoRenderJob['config']
): string {
  const isLandscape = config.aspectRatio === '16:9';
  const primaryColor = config.primaryColor || '#dc2626';
  const headline = escapeXml(config.headline || 'ప్రజా సంకేతం బ్రేకింగ్ న్యూస్');
  const subline = escapeXml(config.subline || 'తాజా సమాచారం & ప్రత్యేక కథనం');
  const ticker = escapeXml(config.tickerText || 'ప్రజా సంకేతం 24x7 న్యూస్ అప్‌డేట్స్..');
  const dateStr = new Date().toLocaleDateString('te-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isLandscape) {
    // 1920 x 1080 Landscape TV Broadcast layout
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradTop" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="gradRed" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${primaryColor}"/>
      <stop offset="100%" stop-color="#991b1b"/>
    </linearGradient>
    <linearGradient id="gradGold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="2" dy="3" stdDeviation="4" flood-color="#000000" flood-opacity="0.8"/>
    </filter>
  </defs>

  <!-- Top bar subtle shade -->
  <rect x="0" y="0" width="${width}" height="140" fill="url(#gradTop)"/>

  <!-- Top Left: Channel Brand Pill -->
  <g transform="translate(40, 30)">
    <rect x="0" y="0" width="340" height="56" rx="8" fill="#111827" stroke="${primaryColor}" stroke-width="2" filter="url(#shadow)"/>
    <rect x="6" y="6" width="44" height="44" rx="6" fill="${primaryColor}"/>
    <text x="28" y="36" font-family="'Noto Sans Telugu', sans-serif" font-weight="900" font-size="24" fill="#ffffff" text-anchor="middle">ప్ర</text>
    <text x="62" y="27" font-family="'Outfit', sans-serif" font-weight="800" font-size="16" fill="#ffffff" letter-spacing="1">PRAJA SANKETAM</text>
    <text x="62" y="44" font-family="'Noto Sans Telugu', sans-serif" font-weight="700" font-size="14" fill="#fbbf24">AI న్యూస్ స్టూడియో</text>
  </g>

  <!-- Top Right: LIVE & Timestamp -->
  <g transform="translate(${width - 320}, 30)">
    <rect x="0" y="0" width="100" height="40" rx="6" fill="#dc2626" filter="url(#shadow)"/>
    <circle cx="20" cy="20" r="5" fill="#ffffff"/>
    <text x="56" y="26" font-family="'Outfit', sans-serif" font-weight="800" font-size="18" fill="#ffffff" text-anchor="middle">LIVE</text>
    <rect x="110" y="0" width="170" height="40" rx="6" fill="rgba(17,24,39,0.85)" stroke="#374151" stroke-width="1"/>
    <text x="195" y="25" font-family="'JetBrains Mono', sans-serif" font-weight="600" font-size="14" fill="#e5e7eb" text-anchor="middle">${escapeXml(dateStr)}</text>
  </g>

  <!-- Lower Third Headline Plate -->
  <g transform="translate(0, ${height - 230})">
    <!-- Breaking News Tag -->
    <path d="M 40 0 L 260 0 L 240 45 L 40 45 Z" fill="${primaryColor}" filter="url(#shadow)"/>
    <text x="140" y="30" font-family="'Noto Sans Telugu', sans-serif" font-weight="900" font-size="22" fill="#ffffff" text-anchor="middle">బ్రేకింగ్ న్యూస్</text>

    <!-- Main Headline Box -->
    <rect x="40" y="45" width="${width - 80}" height="100" rx="4" fill="rgba(15, 23, 42, 0.95)" stroke="${primaryColor}" stroke-width="2" filter="url(#shadow)"/>
    
    <!-- Left Accent Strip -->
    <rect x="40" y="45" width="12" height="100" fill="url(#gradGold)"/>
    
    <!-- Headline Text -->
    <text x="75" y="105" font-family="'Noto Sans Telugu', sans-serif" font-weight="800" font-size="34" fill="#ffffff">${headline}</text>
    <text x="75" y="133" font-family="'Noto Sans Telugu', sans-serif" font-weight="600" font-size="20" fill="#fbbf24">${subline}</text>
  </g>

  <!-- Scrolling News Ticker at Bottom -->
  <g transform="translate(0, ${height - 65})">
    <rect x="0" y="0" width="${width}" height="65" fill="#0b0f19" stroke-top="#374151"/>
    
    <!-- Ticker Label -->
    <rect x="0" y="0" width="190" height="65" fill="${primaryColor}"/>
    <text x="95" y="40" font-family="'Noto Sans Telugu', sans-serif" font-weight="900" font-size="20" fill="#ffffff" text-anchor="middle">తాజా వార్తలు</text>
    <polygon points="190,0 210,32 190,65" fill="${primaryColor}"/>
    
    <!-- Ticker Text Content -->
    <text x="240" y="40" font-family="'Noto Sans Telugu', sans-serif" font-weight="600" font-size="22" fill="#f3f4f6">
      ★ ${ticker} ★ ప్రజా సంకేతం ప్రత్యేక కథనం ★ నిష్పాక్షిక విశ్లేషణ ★
    </text>
  </g>
</svg>`;
  } else {
    // 1080 x 1920 Vertical Shorts / Reels layout
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="vGradTop" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="vGradBottom" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.95"/>
    </linearGradient>
    <filter id="vShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="3" dy="4" stdDeviation="5" flood-color="#000000" flood-opacity="0.9"/>
    </filter>
  </defs>

  <!-- Top Dark Gradient for readability -->
  <rect x="0" y="0" width="${width}" height="350" fill="url(#vGradTop)"/>
  
  <!-- Top Channel Header -->
  <g transform="translate(60, 80)">
    <rect x="0" y="0" width="${width - 120}" height="100" rx="16" fill="rgba(17, 24, 39, 0.9)" stroke="${primaryColor}" stroke-width="3" filter="url(#vShadow)"/>
    <circle cx="55" cy="50" r="32" fill="${primaryColor}"/>
    <text x="55" y="62" font-family="'Noto Sans Telugu', sans-serif" font-weight="900" font-size="34" fill="#ffffff" text-anchor="middle">ప్ర</text>
    <text x="110" y="45" font-family="'Outfit', sans-serif" font-weight="900" font-size="28" fill="#ffffff">PRAJA SANKETAM</text>
    <text x="110" y="78" font-family="'Noto Sans Telugu', sans-serif" font-weight="700" font-size="22" fill="#fbbf24">AI న్యూస్ స్టూడియో • SPECIAL</text>
  </g>

  <!-- Top Big Punch Headline Pill for Mobile Shorts -->
  <g transform="translate(60, 210)">
    <rect x="0" y="0" width="340" height="54" rx="10" fill="#dc2626"/>
    <text x="170" y="36" font-family="'Noto Sans Telugu', sans-serif" font-weight="900" font-size="26" fill="#ffffff" text-anchor="middle">బిగ్ బ్రేకింగ్</text>
  </g>

  <!-- Bottom Dark Gradient -->
  <rect x="0" y="${height - 600}" width="${width}" height="600" fill="url(#vGradBottom)"/>

  <!-- Vertical Lower Third News Block -->
  <g transform="translate(50, ${height - 520})">
    <rect x="0" y="0" width="${width - 100}" height="340" rx="20" fill="rgba(15, 23, 42, 0.95)" stroke="#374151" stroke-width="2" filter="url(#vShadow)"/>
    <rect x="0" y="0" width="${width - 100}" height="12" rx="6" fill="${primaryColor}"/>
    
    <!-- Main Headline in Telugu -->
    <text x="35" y="80" font-family="'Noto Sans Telugu', sans-serif" font-weight="900" font-size="44" fill="#ffffff">${headline}</text>
    
    <!-- Subtitle -->
    <text x="35" y="160" font-family="'Noto Sans Telugu', sans-serif" font-weight="700" font-size="30" fill="#fbbf24">${subline}</text>
    
    <!-- Info bar inside box -->
    <line x1="35" y1="220" x2="${width - 135}" y2="220" stroke="#334155" stroke-width="2"/>
    <text x="35" y="270" font-family="'Noto Sans Telugu', sans-serif" font-weight="600" font-size="24" fill="#cbd5e1">
      🔴 ప్రజా సంకేతం డిజిటల్ నెట్‌వర్క్ | లైక్ &amp; షేర్ చేయండి
    </text>
  </g>

  <!-- Bottom Fast Ticker -->
  <g transform="translate(0, ${height - 110})">
    <rect x="0" y="0" width="${width}" height="110" fill="#0b0f19"/>
    <rect x="0" y="0" width="220" height="110" fill="${primaryColor}"/>
    <text x="110" y="65" font-family="'Noto Sans Telugu', sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle">అప్‌డేట్స్</text>
    <text x="250" y="65" font-family="'Noto Sans Telugu', sans-serif" font-weight="700" font-size="30" fill="#f3f4f6">
      ★ ${ticker} ★
    </text>
  </g>
</svg>`;
  }
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function processVideoRenderJob(job: VideoRenderJob): Promise<void> {
  ensureDirectories();
  console.log(`[VideoRenderer] Starting render job ${job.id}`);
  job.status = 'processing';
  job.progress = 10;
  saveJob(job);

  const isLandscape = job.aspectRatio === '16:9';
  const width = isLandscape ? 1280 : 720;
  const height = isLandscape ? 720 : 1280;
  const duration = 10; // 10 seconds default teaser/news bulletin

  const svgContent = createSVGOverlay(width, height, job.config);
  const svgPath = path.join(TEMP_DIR, `overlay_${job.id}.svg`);
  const outputFileName = `render_${job.id}.mp4`;
  const outputPath = path.join(RENDERS_DIR, outputFileName);
  const outputPublicUrl = `/uploads/renders/${outputFileName}`;

  fs.writeFileSync(svgPath, svgContent, 'utf-8');

  // Check if source video is provided or generate professional background motion
  const sourceVideo = job.config.sourceVideoUrl
    ? path.resolve(process.cwd(), job.config.sourceVideoUrl.replace(/^\//, ''))
    : null;

  const hasValidSource = sourceVideo && fs.existsSync(sourceVideo);

  // Construct FFmpeg command
  // If we have a source video: scale and pad to target resolution, then overlay SVG
  // If not: create an animated news gradient canvas loop with audio sine beep/tone
  let args: string[] = [];

  if (hasValidSource) {
    args = [
      '-y',
      '-i', sourceVideo,
      '-i', svgPath,
      '-filter_complex',
      `[0:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1[bg];[bg][1:v]overlay=0:0[outv]`,
      '-map', '[outv]',
      '-map', '0:a?',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-pix_fmt', 'yuv420p',
      '-t', `${duration}`,
      outputPath,
    ];
  } else {
    // Generate a sleek broadcast studio gradient with pulsing newsroom energy
    args = [
      '-y',
      '-f', 'lavfi',
      '-i', `color=c=#0f172a:s=${width}x${height}:d=${duration}:r=30`,
      '-i', svgPath,
      '-f', 'lavfi',
      '-i', `anullsrc=r=44100:cl=stereo`,
      '-filter_complex',
      `[0:v][1:v]overlay=0:0[outv]`,
      '-map', '[outv]',
      '-map', '2:a',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-shortest',
      '-t', `${duration}`,
      outputPath,
    ];
  }

  job.progress = 35;
  saveJob(job);

  return new Promise((resolve) => {
    const ffmpeg = spawn('/usr/bin/ffmpeg', args);

    ffmpeg.stderr.on('data', (data) => {
      const msg = data.toString();
      // Parse progress if possible
      if (job.progress < 85) {
        job.progress = Math.min(85, job.progress + 5);
        saveJob(job);
      }
    });

    ffmpeg.on('close', (code) => {
      // Clean temp svg
      try {
        if (fs.existsSync(svgPath)) fs.unlinkSync(svgPath);
      } catch (e) {
        // ignore
      }

      if (code === 0 && fs.existsSync(outputPath)) {
        console.log(`[VideoRenderer] Job ${job.id} completed successfully`);
        job.status = 'completed';
        job.progress = 100;
        job.outputVideoUrl = outputPublicUrl;
        job.durationSeconds = duration;
        saveJob(job);
        resolve();
      } else {
        console.error(`[VideoRenderer] FFmpeg exited with code ${code}`);
        job.status = 'failed';
        job.error = `FFmpeg processing ended with exit code ${code}`;
        saveJob(job);
        resolve();
      }
    });

    ffmpeg.on('error', (err) => {
      console.error(`[VideoRenderer] Error spawning FFmpeg:`, err);
      job.status = 'failed';
      job.error = err.message;
      saveJob(job);
      resolve();
    });
  });
}
