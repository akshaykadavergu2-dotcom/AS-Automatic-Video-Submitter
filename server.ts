import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { app } from './server/app.js';
import { initCloudWorkerOnBoot } from './server/cloudWorkerService.js';

dotenv.config();

let PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
let HOST = '0.0.0.0';

const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i + 1]) {
    const parsed = parseInt(args[i + 1], 10);
    if (!isNaN(parsed)) PORT = parsed;
    i++;
  } else if (args[i] === '--host' && args[i + 1]) {
    HOST = args[i + 1];
    i++;
  }
}

const isProduction = process.env.NODE_ENV === 'production';

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

  app.listen(PORT, HOST, () => {
    console.log(`[AS Studio] Server running on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
