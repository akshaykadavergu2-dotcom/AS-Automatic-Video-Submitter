import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getJobs, saveJob, VideoRenderJob } from '../storage.js';
import { processVideoRenderJob, createSVGOverlay } from '../videoRenderer.js';

export const videoRouter = Router();

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    // accept video or image
    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video and image files are supported'));
    }
  },
});

// Upload media asset
videoRouter.post('/upload', upload.single('media'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No media file provided.' });
    }
    const publicUrl = `/uploads/${req.file.filename}`;
    return res.json({
      success: true,
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: publicUrl,
      },
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// Queue a new FFmpeg video render job
videoRouter.post('/render', async (req, res) => {
  try {
    const {
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
      frameStyle,
      newsId,
    } = req.body;

    const jobId = `job-${Date.now()}`;
    const job: VideoRenderJob = {
      id: jobId,
      newsId,
      createdAt: new Date().toISOString(),
      title: headline || 'Praja Sanketam News Bulletin',
      aspectRatio: aspectRatio || '16:9',
      status: 'pending',
      progress: 0,
      config: {
        headline: headline || 'ప్రజా సంకేతం బ్రేకింగ్ న్యూస్',
        subline: subline || 'తాజా సమాచారం & ప్రత్యక్ష ప్రసారం',
        tickerText: tickerText || 'ప్రజా సంకేతం 24x7 న్యూస్ అప్‌డేట్స్..',
        aspectRatio: aspectRatio || '16:9',
        primaryColor: primaryColor || '#dc2626',
        fontSize: Number(fontSize) || 32,
        showLogo: showLogo !== false,
        showDate: showDate !== false,
        showTicker: showTicker !== false,
        sourceVideoUrl,
        frameStyle: frameStyle || 'praja_classic',
      },
    };

    saveJob(job);

    // Trigger background processing with FFmpeg worker asynchronously
    processVideoRenderJob(job).catch((err) => {
      console.error(`Error in render job ${job.id}:`, err);
    });

    return res.json({
      success: true,
      jobId: job.id,
      status: job.status,
      message: 'Video render job queued in background FFmpeg worker',
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// Get all jobs
videoRouter.get('/jobs', (req, res) => {
  try {
    const jobs = getJobs();
    return res.json({ jobs });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// Get single job status
videoRouter.get('/jobs/:id', (req, res) => {
  try {
    const jobs = getJobs();
    const job = jobs.find((j) => j.id === req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    return res.json({ job });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// Real-time SVG preview endpoint
videoRouter.post('/preview-svg', (req, res) => {
  try {
    const config = req.body;
    const isLandscape = config.aspectRatio === '16:9';
    const width = isLandscape ? 1280 : 720;
    const height = isLandscape ? 720 : 1280;
    const svg = createSVGOverlay(width, height, config);
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.send(svg);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});
