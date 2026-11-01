import express from 'express';
import path from 'path';
import fs from 'fs';
import { newsRouter } from './routes/newsRoutes.js';
import { videoRouter } from './routes/videoRoutes.js';
import { trendRouter } from './routes/trendRoutes.js';
import { facebookRouter, saveStoredPages } from './routes/facebookRoutes.js';
import { settingsRouter } from './routes/settingsRoutes.js';
import { xAutomationRouter, getOAuthSession, saveOAuthSession } from './routes/xAutomationRoutes.js';
import { cloudWorkerRouter } from './routes/cloudWorkerRoutes.js';
import { getXOAuthConfig, getMetaOAuthConfig, verifyAndDecodeOAuthState, resolveAppUrl } from './oauthHelper.js';
import { getSettings, saveSettings, getDataDir } from './storage.js';
import { getMonitoredSources, saveMonitoredSources, MonitoredSource, addAutomationLog } from './xAutomationService.js';

export const app = express();

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads & generated renders
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch (_) {}
}
app.use('/uploads', express.static(uploadsDir));

// Static public assets
const publicAssetsDir = path.resolve(process.cwd(), 'public/assets');
if (!fs.existsSync(publicAssetsDir)) {
  try { fs.mkdirSync(publicAssetsDir, { recursive: true }); } catch (_) {}
}
app.use('/assets', express.static(publicAssetsDir));

// ==========================================
// OAuth 2.0 PKCE Popup Callback for X / Twitter
// ==========================================
app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    const safeError = String(error_description || error).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AS - X Authorization Denied</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #070a13; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #0f1624; border: 1px solid #ef4444; padding: 32px; border-radius: 16px; text-align: center; max-width: 440px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            h2 { color: #ef4444; margin-top: 0; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
            .btn { background: #334155; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; margin-top: 16px; font-weight: 600; }
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
    return res.status(400).send('Authorization code is missing from X callback.');
  }

  try {
    const xConfig = getXOAuthConfig(req);
    const session = getOAuthSession();

    // Verify cryptographically signed state token
    let codeVerifier = session.codeVerifier;
    if (state) {
      const statePayload = verifyAndDecodeOAuthState(String(state));
      if (statePayload && statePayload.codeVerifier) {
        codeVerifier = statePayload.codeVerifier;
      }
    }

    if (!codeVerifier) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <body style="font-family:sans-serif;background:#070a13;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;">
            <div style="background:#0f1624;padding:28px;border-radius:12px;border:1px solid #ef4444;text-align:center;max-width:440px;">
              <h3 style="color:#ef4444;">PKCE Verification Failed</h3>
              <p style="color:#94a3b8;font-size:14px;">OAuth code verifier was not found. Please restart the login flow.</p>
              <button onclick="window.close()" style="background:#334155;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;">Close</button>
            </div>
          </body>
        </html>
      `);
    }

    // Exchange authorization code for User Access Token with X API v2
    const tokenParams = new URLSearchParams({
      code: String(code),
      grant_type: 'authorization_code',
      client_id: xConfig.clientId,
      redirect_uri: xConfig.redirectUri,
      code_verifier: codeVerifier,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (xConfig.clientSecret) {
      headers['Authorization'] = `Basic ${Buffer.from(`${xConfig.clientId}:${xConfig.clientSecret}`).toString('base64')}`;
    }

    const tokenResp = await fetch('https://api.x.com/2/oauth2/token', {
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
          <body style="font-family:sans-serif;background:#070a13;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;">
            <div style="background:#0f1624;padding:28px;border-radius:12px;border:1px solid #ef4444;text-align:center;max-width:440px;">
              <h3 style="color:#ef4444;">Token Exchange Failed</h3>
              <p style="color:#94a3b8;font-size:14px;">${safeErrMsg}</p>
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

    // Fetch authenticated user's real profile
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
      console.warn('[OAuth] Could not fetch user profile details:', uErr);
    }

    // Automatically sync accounts the user follows via Twitter API v2
    if (userId) {
      try {
        const followingResp = await fetch(
          `https://api.twitter.com/2/users/${userId}/following?max_results=50&user.fields=profile_image_url,description,public_metrics,verified`,
          { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
        );
        if (followingResp.ok) {
          const followingData = await followingResp.json();
          const followedUsers = followingData.data || [];
          const existingSources = getMonitoredSources();
          let addedCount = 0;

          for (const u of followedUsers) {
            const exists = existingSources.find((s) => s.handle.toLowerCase() === u.username.toLowerCase());
            if (!exists) {
              const newSrc: MonitoredSource = {
                id: `src-follow-${u.id}`,
                handle: u.username,
                name: u.name,
                avatarUrl: u.profile_image_url,
                profileUrl: `https://x.com/${u.username}`,
                category: 'Telangana',
                sourceType: 'following',
                isActive: true,
                isExcluded: false,
                postsCollectedCount: 0,
                addedAt: new Date().toISOString(),
                description: u.description || `Followed by @${username}`,
                isVerified: Boolean(u.verified),
              };
              existingSources.push(newSrc);
              addedCount++;
            }
          }
          if (addedCount > 0) {
            saveMonitoredSources(existingSources);
            addAutomationLog('info', 'following_sync', `Imported ${addedCount} followed accounts from authenticated X profile @${username}.`);
          }
        }
      } catch (fErr) {
        console.warn('[OAuth] Following sync skipped or rate limited:', fErr);
      }
    }

    // Persist real verified session on server
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
    const sessionToken = saveOAuthSession(verifiedSession);

    const safeUsername = String(username).replace(/</g, '&lt;').replace(/>/g, '&gt;');

    res.cookie('x_oauth_session', sessionToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AS - X Account Connected</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #070a13; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #0f1624; border: 1px solid #10b981; padding: 32px; border-radius: 16px; text-align: center; max-width: 440px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            h2 { color: #10b981; margin-top: 0; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
            .badge { display: inline-block; background: #064e3b; color: #34d399; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>✓ X Account Connected</h2>
            <p>Authenticated as <strong>@${safeUsername}</strong>.</p>
            <div class="badge">TOKEN ACTIVE &amp; VERIFIED</div>
            <p style="margin-top:16px;">Syncing news sources to AS Video Submitter...</p>
          </div>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_AUTH_SUCCESS',
                  service: 'x',
                  sessionToken: ${JSON.stringify(sessionToken)},
                  username: ${JSON.stringify(safeUsername)},
                  name: ${JSON.stringify(name)},
                  profileImageUrl: ${JSON.stringify(profileImageUrl)},
                  followersCount: ${followersCount},
                  followingCount: ${followingCount}
                }, '*');
                setTimeout(() => { window.close(); }, 1200);
              } else {
                window.location.href = '/?x_auth_token=' + encodeURIComponent(${JSON.stringify(sessionToken)}) + '&x_connected=1';
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
    return res.status(500).send(`Server OAuth error: ${safeError}`);
  }
});

// ==========================================
// Meta Facebook OAuth Callback Handler
// ==========================================
app.get(['/auth/facebook/callback', '/auth/facebook/callback/'], async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    const safeError = String(error_description || error).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AS - Facebook Authorization Denied</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #070a13; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #0f1624; border: 1px solid #ef4444; padding: 32px; border-radius: 16px; text-align: center; max-width: 440px; }
            h2 { color: #ef4444; margin-top: 0; }
            p { color: #94a3b8; font-size: 14px; }
            .btn { background: #334155; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; margin-top: 16px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>✕ Facebook Authorization Failed</h2>
            <p>${safeError}</p>
            <button class="btn" onclick="window.close()">Close Window</button>
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
    const metaConfig = getMetaOAuthConfig(req);

    if (!metaConfig.appId || !metaConfig.appSecret) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <body style="font-family:sans-serif;background:#070a13;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;">
            <div style="background:#0f1624;padding:28px;border-radius:12px;border:1px solid #ef4444;text-align:center;max-width:440px;">
              <h3 style="color:#ef4444;">Meta App Credentials Missing</h3>
              <p style="color:#94a3b8;font-size:14px;">META_APP_ID or META_APP_SECRET is not configured in Netlify environment variables.</p>
              <button onclick="window.close()" style="background:#334155;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;">Close</button>
            </div>
          </body>
        </html>
      `);
    }

    // Exchange code for User Access Token with Meta Graph API
    const tokenUrl = `https://graph.facebook.com/${metaConfig.graphVersion}/oauth/access_token?client_id=${metaConfig.appId}&redirect_uri=${encodeURIComponent(
      metaConfig.redirectUri
    )}&client_secret=${metaConfig.appSecret}&code=${encodeURIComponent(String(code))}`;

    const tokenResp = await fetch(tokenUrl);
    const tokenData = await tokenResp.json();

    if (!tokenResp.ok || tokenData.error) {
      const errMsg = tokenData.error?.message || 'Failed to exchange Meta authorization code';
      const safeErrMsg = String(errMsg).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <body style="font-family:sans-serif;background:#070a13;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;">
            <div style="background:#0f1624;padding:28px;border-radius:12px;border:1px solid #ef4444;text-align:center;max-width:440px;">
              <h3 style="color:#ef4444;">Meta Token Exchange Error</h3>
              <p style="color:#94a3b8;font-size:14px;">${safeErrMsg}</p>
              <button onclick="window.close()" style="background:#334155;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;">Close</button>
            </div>
          </body>
        </html>
      `);
    }

    const userAccessToken = tokenData.access_token;

    // Fetch user's real authorized Facebook Pages with picture and permissions
    const accountsUrl = `https://graph.facebook.com/${metaConfig.graphVersion}/me/accounts?fields=id,name,category,access_token,tasks,fan_count,picture{url}&access_token=${userAccessToken}`;
    const accountsResp = await fetch(accountsUrl);
    const accountsData = await accountsResp.json();

    const rawPages = accountsData.data || [];
    saveStoredPages(rawPages);

    let selectedPageName = '';
    const settings = getSettings();

    // Auto-select first page if none currently selected
    if (rawPages.length > 0) {
      const primaryPage = rawPages[0];
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

    const safePageCount = rawPages.length;
    const safeSelectedName = String(selectedPageName || `${safePageCount} Pages retrieved`).replace(/</g, '&lt;').replace(/>/g, '&gt;');

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AS - Facebook Pages Retrieved</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #070a13; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #0f1624; border: 1px solid #10b981; padding: 32px; border-radius: 16px; text-align: center; max-width: 440px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            h2 { color: #10b981; margin-top: 0; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
            .badge { display: inline-block; background: #064e3b; color: #34d399; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>✓ Facebook Login Successful</h2>
            <p>Retrieved <strong>${safePageCount}</strong> manageable Facebook Page(s).</p>
            <div class="badge">PAGES LOADED</div>
            <p style="margin-top:16px;">Returning to studio to select your target publishing Page...</p>
          </div>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({
                  type: 'FACEBOOK_OAUTH_PAGES_LOADED',
                  service: 'facebook',
                  pagesCount: ${safePageCount},
                  selectedPageName: ${JSON.stringify(safeSelectedName)}
                }, '*');
                setTimeout(() => { window.close(); }, 1200);
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
    return res.status(500).send(`Server Facebook OAuth error: ${safeError}`);
  }
});

// ==========================================
// Central API Mounts
// ==========================================
app.use('/api/news', newsRouter);
app.use('/api/video', videoRouter);
app.use('/api/trends', trendRouter);
app.use('/api/facebook', facebookRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/x-automation', xAutomationRouter);
app.use('/api/cloud-worker', cloudWorkerRouter);

// Backend Diagnostics Endpoint for Netlify & OAuth Verification
app.get('/api/oauth/diagnostics', (req, res) => {
  const xConfig = getXOAuthConfig(req);
  const metaConfig = getMetaOAuthConfig(req);

  res.json({
    status: 'ok',
    environment: process.env.NETLIFY ? 'Netlify Functions' : 'Node Server',
    appUrl: resolveAppUrl(req),
    xOAuth: {
      isConfigured: xConfig.isConfigured,
      clientIdMasked: xConfig.clientId ? `${xConfig.clientId.slice(0, 4)}••••${xConfig.clientId.slice(-4)}` : null,
      clientSecretConfigured: xConfig.isClientSecretConfigured,
      redirectUri: xConfig.redirectUri,
      scopes: xConfig.scopes,
    },
    metaOAuth: {
      isConfigured: metaConfig.isConfigured,
      appIdMasked: metaConfig.appId ? `${metaConfig.appId.slice(0, 4)}••••${metaConfig.appId.slice(-4)}` : null,
      appSecretConfigured: metaConfig.isSecretConfigured,
      redirectUri: metaConfig.redirectUri,
      graphVersion: metaConfig.graphVersion,
      scopes: metaConfig.scopes,
    },
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    studio: 'AS AUTOMATIC VIDEO SUBMITTER',
    time: new Date().toISOString(),
    geminiKeySet: Boolean(process.env.GEMINI_API_KEY),
  });
});
