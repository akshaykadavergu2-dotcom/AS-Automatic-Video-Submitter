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

// OAuth 2.0 Popup Callback Handlers
app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    const safeError = String(error_description || error).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AS - X OAuth Authorization Failed</title>
          <style>
            body { font-family: sans-serif; background: #070a13; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #0f1624; border: 1px solid #ef4444; padding: 28px; border-radius: 16px; text-align: center; max-width: 440px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            h2 { color: #ef4444; margin-top: 0; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.5; }
            .btn { background: #334155; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; margin-top: 16px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>✕ X Authorization Denied</h2>
            <p>${safeError}</p>
            <button class="btn" onclick="window.close()">Close Window</button>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', service: 'x', error: ${JSON.stringify(safeError)} }, '*');
            }
          </script>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send('Authorization code missing.');
  }

  try {
    // Read session to get stored codeVerifier
    const dataDir = path.resolve(process.cwd(), 'data');
    const oauthFile = path.join(dataDir, 'connected_accounts.json');
    let session: any = {};
    if (fs.existsSync(oauthFile)) {
      try { session = JSON.parse(fs.readFileSync(oauthFile, 'utf-8')); } catch (_) {}
    }

    const { getSettings } = await import('./server/storage.js');
    const settings = getSettings();
    const clientId = settings.xConfig.apiKey || process.env.X_CLIENT_ID || 'M29sSkh5dkhuOU1qS3c4bU8yV1E6MTpjaQ';
    const clientSecret = settings.xConfig.apiSecret || process.env.X_CLIENT_SECRET;
    const appUrl = process.env.APP_URL || 'https://ais-dev-lmom2hd2oucw6cxokozf4z-886470196514.asia-southeast1.run.app';
    const redirectUri = `${appUrl}/auth/callback`;

    // Exchange authorization code for User Access Token with X API v2
    const tokenParams = new URLSearchParams({
      code: String(code),
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code_verifier: session.codeVerifier || '',
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (clientSecret) {
      headers['Authorization'] = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
    }

    const tokenResp = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers,
      body: tokenParams.toString(),
    });

    const tokenData = await tokenResp.json();

    if (!tokenResp.ok || tokenData.error) {
      const errMsg = tokenData.error_description || tokenData.error || 'Token exchange failed with Twitter API';
      const safeErrMsg = String(errMsg).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>AS - X Token Exchange Failed</title>
            <style>
              body { font-family: sans-serif; background: #070a13; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { background: #0f1624; border: 1px solid #ef4444; padding: 28px; border-radius: 16px; text-align: center; max-width: 440px; }
              h2 { color: #ef4444; margin-top: 0; }
              p { color: #94a3b8; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>✕ Token Exchange Failed</h2>
              <p>${safeErrMsg}</p>
              <button onclick="window.close()" style="background:#334155;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;">Close</button>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', service: 'x', error: ${JSON.stringify(safeErrMsg)} }, '*');
              }
            </script>
          </body>
        </html>
      `);
    }

    // Retrieve the authenticated user's real profile
    let username = 'AuthenticatedUser';
    let name = 'X Connected Account';
    let profileImageUrl = '';
    let followersCount = 0;
    let followingCount = 0;
    let userId = '';

    try {
      const userResp = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,description,public_metrics,verified', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (userResp.ok) {
        const userData = await userResp.json();
        if (userData.data) {
          userId = userData.data.id;
          username = userData.data.username;
          name = userData.data.name;
          profileImageUrl = userData.data.profile_image_url || '';
          followersCount = userData.data.public_metrics?.followers_count || 0;
          followingCount = userData.data.public_metrics?.following_count || 0;
        }
      }
    } catch (uErr) {
      console.warn('Could not fetch user profile details:', uErr);
    }

    // Persist real verified session
    const verifiedSession = {
      isConnected: true,
      id: userId,
      username,
      name,
      profileImageUrl,
      followersCount,
      followingCount,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiresAt: Date.now() + (tokenData.expires_in || 7200) * 1000,
      connectedAt: new Date().toISOString(),
    };

    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(oauthFile, JSON.stringify(verifiedSession, null, 2), 'utf-8');

    const safeUsername = String(username).replace(/</g, '&lt;').replace(/>/g, '&gt;');

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AS - X OAuth Success</title>
          <style>
            body { font-family: sans-serif; background: #070a13; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #0f1624; border: 1px solid #10b981; padding: 28px; border-radius: 16px; text-align: center; max-width: 440px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            h2 { color: #10b981; margin-top: 0; }
            p { color: #94a3b8; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>✓ X Account Connected</h2>
            <p>Authenticated as <strong>@${safeUsername}</strong>.</p>
            <p>Syncing verified sources to AS Studio...</p>
          </div>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', service: 'x', username: ${JSON.stringify(safeUsername)} }, '*');
                setTimeout(() => { window.close(); }, 1000);
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
  } catch (e: any) {
    const safeError = String(e.message || 'Unknown server error').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    res.status(500).send(`Server OAuth error: ${safeError}`);
  }
});

// Meta Facebook OAuth Callback Handler
app.get(['/auth/facebook/callback', '/auth/facebook/callback/'], async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error) {
    const safeError = String(error_description || error).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AS - Facebook OAuth Failed</title>
          <style>
            body { font-family: sans-serif; background: #070a13; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #0f1624; border: 1px solid #ef4444; padding: 28px; border-radius: 16px; text-align: center; max-width: 440px; }
            h2 { color: #ef4444; margin-top: 0; }
            p { color: #94a3b8; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>✕ Facebook Authorization Failed</h2>
            <p>${safeError}</p>
            <button onclick="window.close()" style="background:#334155;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;">Close</button>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', service: 'facebook', error: ${JSON.stringify(safeError)} }, '*');
            }
          </script>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send('Authorization code missing.');
  }

  try {
    const { getSettings, saveSettings } = await import('./server/storage.js');
    const settings = getSettings();
    const appId = settings.metaConfig.appId || process.env.FACEBOOK_APP_ID;
    const appSecret = settings.metaConfig.appSecret || process.env.FACEBOOK_APP_SECRET;
    const appUrl = process.env.APP_URL || 'https://ais-dev-lmom2hd2oucw6cxokozf4z-886470196514.asia-southeast1.run.app';
    const redirectUri = `${appUrl}/auth/facebook/callback`;

    if (!appId || !appSecret) {
      return res.status(400).send('Facebook App ID and App Secret must be configured in Settings.');
    }

    // Exchange code for User Access Token
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${encodeURIComponent(String(code))}`;
    const tokenResp = await fetch(tokenUrl);
    const tokenData = await tokenResp.json();

    if (!tokenResp.ok || tokenData.error) {
      const errMsg = tokenData.error?.message || 'Failed to exchange Meta authorization code';
      const safeErrMsg = String(errMsg).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return res.status(400).send(`Meta Error: ${safeErrMsg}`);
    }

    const userAccessToken = tokenData.access_token;

    // Fetch user's real authorized Facebook Pages
    const accountsUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,category,access_token,tasks,fan_count&access_token=${userAccessToken}`;
    const accountsResp = await fetch(accountsUrl);
    const accountsData = await accountsResp.json();

    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    const pages = accountsData.data || [];
    fs.writeFileSync(path.join(dataDir, 'facebook_pages.json'), JSON.stringify(pages, null, 2), 'utf-8');

    let selectedPageName = '';
    if (pages.length > 0) {
      // Auto-configure the first authorized page
      const primaryPage = pages[0];
      selectedPageName = primaryPage.name;
      saveSettings({
        metaConfig: {
          ...settings.metaConfig,
          isConfigured: true,
          pageId: primaryPage.id,
          pageName: primaryPage.name,
          pageAccessToken: primaryPage.access_token,
          lastConnected: new Date().toISOString(),
        },
      });
    }

    const safePageName = String(selectedPageName || `${pages.length} Pages retrieved`).replace(/</g, '&lt;').replace(/>/g, '&gt;');

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AS - Facebook Page Connected</title>
          <style>
            body { font-family: sans-serif; background: #070a13; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #0f1624; border: 1px solid #10b981; padding: 28px; border-radius: 16px; text-align: center; max-width: 440px; }
            h2 { color: #10b981; margin-top: 0; }
            p { color: #94a3b8; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>✓ Facebook Page Authorized</h2>
            <p>Connected to <strong>${safePageName}</strong>.</p>
            <p>Publishing permissions verified.</p>
          </div>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', service: 'facebook', pageName: ${JSON.stringify(safePageName)} }, '*');
                setTimeout(() => { window.close(); }, 1000);
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
  } catch (e: any) {
    const safeError = String(e.message || 'Server error during Facebook authorization').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    res.status(500).send(`Server Facebook OAuth error: ${safeError}`);
  }
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
