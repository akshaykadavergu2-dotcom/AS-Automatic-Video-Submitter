import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { newsRouter } from './server/routes/newsRoutes.js';
import { videoRouter } from './server/routes/videoRoutes.js';
import { trendRouter } from './server/routes/trendRoutes.js';
import { facebookRouter } from './server/routes/facebookRoutes.js';
import { settingsRouter } from './server/routes/settingsRoutes.js';
import { xAutomationRouter } from './server/routes/xAutomationRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Body parsers with generous payload limit for base64 / heavy drafts
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads & generated renders
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Static public assets
const publicAssetsDir = path.resolve(process.cwd(), 'public/assets');
if (!fs.existsSync(publicAssetsDir)) fs.mkdirSync(publicAssetsDir, { recursive: true });
app.use('/assets', express.static(publicAssetsDir));

// OAuth 2.0 Popup Callback Handler (Complies with oauth-integration skill)
app.get(['/auth/callback', '/auth/callback/'], (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Praja Sanketam - X OAuth Authorization</title>
        <style>
          body { font-family: sans-serif; background: #0b0f19; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #111827; border: 1px solid #374151; padding: 24px; border-radius: 12px; text-align: center; max-width: 400px; }
          h2 { color: #10b981; margin-top: 0; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>✓ Authorization Successful</h2>
          <p>Connecting to Praja Sanketam AI News Studio...</p>
        </div>
        <script>
          try {
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', service: 'x' }, '*');
              setTimeout(() => { window.close(); }, 800);
            } else {
              window.location.href = '/';
            }
          } catch (e) {
            window.close();
          }
        </script>
      </body>
    </html>
  `);
});

import { cloudWorkerRouter } from './server/routes/cloudWorkerRoutes.js';
import { initCloudWorkerOnBoot } from './server/cloudWorkerService.js';

// API Routes
app.use('/api/news', newsRouter);
app.use('/api/video', videoRouter);
app.use('/api/trends', trendRouter);
app.use('/api/facebook', facebookRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/x-automation', xAutomationRouter);
app.use('/api/cloud-worker', cloudWorkerRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    studio: 'PRAJA SANKETAM AI NEWS STUDIO',
    time: new Date().toISOString(),
    geminiKeySet: Boolean(process.env.GEMINI_API_KEY),
  });
});

async function startServer() {
  if (!isProduction) {
    // Development mode: attach Vite middleware
    console.log('[Server] Starting in development mode with Vite middleware...');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve static build output
    console.log('[Server] Starting in production mode serving static dist...');
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Initialize 24/7 Cloud Background Worker on boot
  initCloudWorkerOnBoot();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Praja Sanketam Studio] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
