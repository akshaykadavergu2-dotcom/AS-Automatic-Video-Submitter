import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { getSettings, saveSettings, getDataDir } from '../storage.js';
import { getMetaOAuthConfig, generateOAuthState } from '../oauthHelper.js';

export const facebookRouter = Router();

function getPagesFile(): string {
  return path.join(getDataDir(), 'facebook_pages.json');
}

export interface StoredFacebookPage {
  id: string;
  name: string;
  category: string;
  access_token: string;
  tasks?: string[];
  fan_count?: number;
  picture?: {
    data?: {
      url?: string;
    };
  };
}

export function readStoredPages(): StoredFacebookPage[] {
  try {
    const file = getPagesFile();
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
  } catch (e) {
    console.warn('[Facebook] Failed to read stored pages:', e);
  }
  return [];
}

export function saveStoredPages(pages: StoredFacebookPage[]): void {
  try {
    const file = getPagesFile();
    fs.writeFileSync(file, JSON.stringify(pages, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Facebook] Failed to save stored pages:', e);
  }
}

// 1. Meta Facebook Page Connection Status (Real Handshake with Meta Graph API)
facebookRouter.get('/status', async (req, res) => {
  try {
    const settings = getSettings();
    const { pageId, pageName, pageAccessToken } = settings.metaConfig;

    if (!pageAccessToken || !pageId) {
      return res.json({
        connected: false,
        isConfigured: false,
        status: 'NOT CONFIGURED',
        pageId: null,
        pageName: null,
        requiredPermissions: [
          'pages_manage_posts',
          'pages_read_engagement',
          'pages_show_list',
          'publish_video',
        ],
        notice: 'Facebook Page is not connected. Click "Connect Facebook" to authorize via Meta Login.',
      });
    }

    // Attempt real handshake with Meta Graph API
    try {
      const graphResp = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}?fields=id,name,fan_count,verification_status,category,picture{url}&access_token=${pageAccessToken}`
      );
      if (graphResp.ok) {
        const pageData = await graphResp.json();
        return res.json({
          connected: true,
          isConfigured: true,
          pageId: pageData.id,
          pageName: pageData.name,
          category: pageData.category,
          fanCount: pageData.fan_count,
          pictureUrl: pageData.picture?.data?.url || null,
          status: 'TOKEN ACTIVE (VERIFIED)',
          notice: `Connected to Facebook Page: ${pageData.name}`,
        });
      } else {
        const errorData = await graphResp.json();
        return res.json({
          connected: false,
          isConfigured: true,
          pageId,
          pageName,
          status: 'TOKEN INVALID / EXPIRED',
          error: errorData.error?.message || 'Meta Graph API token validation failed',
          code: errorData.error?.code,
          notice: 'Meta Page Access Token rejected by Facebook. Please click "Reconnect Facebook".',
        });
      }
    } catch (networkErr: any) {
      return res.json({
        connected: false,
        isConfigured: true,
        pageId,
        pageName,
        status: 'NETWORK ERROR',
        error: networkErr.message,
        notice: 'Network connection to Meta Graph API failed.',
      });
    }
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// 2. Meta OAuth Authorization URL Generator (One-Click Connect Facebook)
facebookRouter.get('/auth/url', (req, res) => {
  try {
    const metaConfig = getMetaOAuthConfig(req);

    if (!metaConfig.isConfigured) {
      return res.json({
        success: false,
        isConfigured: false,
        url: null,
        redirectUri: metaConfig.redirectUri,
        error: 'Meta App ID (META_APP_ID or FACEBOOK_APP_ID) is not configured in Netlify environment variables.',
        missingConfig: ['META_APP_ID', 'META_APP_SECRET'],
        notice: 'Meta App ID is missing. Add META_APP_ID and META_APP_SECRET to your Netlify Site Configuration (Environment variables).',
        instructions: `In Meta Developer Portal (developers.facebook.com), set Valid OAuth Redirect URI to: ${metaConfig.redirectUri}`,
      });
    }

    // Generate cryptographically signed state token
    const state = generateOAuthState({
      service: 'facebook',
      timestamp: Date.now(),
      origin: metaConfig.appUrl,
    });

    const authUrl = `https://www.facebook.com/${metaConfig.graphVersion}/dialog/oauth?client_id=${encodeURIComponent(
      metaConfig.appId
    )}&redirect_uri=${encodeURIComponent(metaConfig.redirectUri)}&scope=${encodeURIComponent(
      metaConfig.scopes
    )}&state=${encodeURIComponent(state)}&response_type=code`;

    return res.json({
      success: true,
      isConfigured: true,
      url: authUrl,
      redirectUri: metaConfig.redirectUri,
      appIdMasked: metaConfig.appId.slice(0, 4) + '••••' + metaConfig.appId.slice(-4),
      graphVersion: metaConfig.graphVersion,
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// 3. Get Authorized Facebook Pages (Never exposes raw tokens to client)
facebookRouter.get('/pages', (req, res) => {
  try {
    const storedPages = readStoredPages();
    const settings = getSettings();
    const activePageId = settings.metaConfig.pageId;

    const sanitizedPages = storedPages.map((p) => {
      const canPublish =
        Array.isArray(p.tasks) &&
        (p.tasks.includes('CREATE_CONTENT') ||
          p.tasks.includes('MANAGE') ||
          p.tasks.includes('PUBLISH') ||
          p.tasks.length === 0);

      return {
        id: p.id,
        name: p.name,
        category: p.category || 'Facebook Page',
        fanCount: p.fan_count || 0,
        pictureUrl: p.picture?.data?.url || null,
        tasks: p.tasks || [],
        canPublish,
        isSelected: p.id === activePageId,
      };
    });

    return res.json({
      success: true,
      pages: sanitizedPages,
      activePageId: activePageId || null,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// 4. Select and Connect a Facebook Page (No manual token copying)
facebookRouter.post('/select-page', async (req, res) => {
  try {
    const { pageId } = req.body;
    if (!pageId) {
      return res.status(400).json({ success: false, error: 'pageId is required' });
    }

    const storedPages = readStoredPages();
    const targetPage = storedPages.find((p) => p.id === pageId);

    if (!targetPage || !targetPage.access_token) {
      return res.status(404).json({
        success: false,
        error:
          'Page credentials not found in authorized session. Please click "Connect Facebook" to authorize your account.',
      });
    }

    // Verify token with Meta Graph API
    const verifyResp = await fetch(
      `https://graph.facebook.com/v21.0/${targetPage.id}?fields=id,name,category,fan_count,verification_status,picture{url}&access_token=${targetPage.access_token}`
    );
    const verifyData = await verifyResp.json();

    if (!verifyResp.ok || verifyData.error) {
      return res.status(400).json({
        success: false,
        error: verifyData.error?.message || 'Meta Graph API token verification failed.',
      });
    }

    // Activate the page in settings
    const settings = getSettings();
    saveSettings({
      metaConfig: {
        ...settings.metaConfig,
        isConfigured: true,
        pageId: targetPage.id,
        pageName: verifyData.name || targetPage.name,
        pageAccessToken: targetPage.access_token,
        lastConnected: new Date().toISOString(),
      },
    });

    return res.json({
      success: true,
      message: `Successfully connected Facebook Page: ${verifyData.name || targetPage.name}`,
      page: {
        id: targetPage.id,
        name: verifyData.name || targetPage.name,
        category: verifyData.category || targetPage.category,
        fanCount: verifyData.fan_count || targetPage.fan_count || 0,
        pictureUrl: verifyData.picture?.data?.url || targetPage.picture?.data?.url || null,
      },
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// 5. Disconnect Facebook Page
facebookRouter.post('/disconnect', async (req, res) => {
  try {
    const settings = getSettings();
    saveSettings({
      metaConfig: {
        ...settings.metaConfig,
        isConfigured: false,
        pageId: '',
        pageName: '',
        pageAccessToken: '',
        lastConnected: undefined,
      },
    });

    try {
      const file = getPagesFile();
      if (fs.existsSync(file)) fs.unlinkSync(file);
    } catch (_) {}

    return res.json({ success: true, message: 'Facebook Page disconnected successfully.' });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// 6. Publish directly to Facebook Page using backend-stored access token
facebookRouter.post('/publish', async (req, res) => {
  try {
    const { draftId, message, videoUrl, scheduledTime } = req.body;
    const settings = getSettings();
    const { pageId, pageAccessToken } = settings.metaConfig;

    if (!pageAccessToken || !pageId) {
      return res.status(400).json({
        success: false,
        error:
          'Facebook Page is not connected. Please connect your Facebook account using the "Connect Facebook" button.',
      });
    }

    if (!message && !videoUrl) {
      return res.status(400).json({ error: 'Publish message or video is required.' });
    }

    let scheduledUnixTime: number | undefined;
    if (scheduledTime) {
      const scheduleDate = new Date(scheduledTime);
      scheduledUnixTime = Math.floor(scheduleDate.getTime() / 1000);
      const nowUnix = Math.floor(Date.now() / 1000);
      if (scheduledUnixTime < nowUnix + 600) {
        return res.status(400).json({
          error: 'Scheduled time must be at least 10 minutes in the future according to Meta Graph API rules.',
        });
      }
    }

    let graphEndpoint = `https://graph.facebook.com/v21.0/${pageId}/feed`;
    const postPayload: Record<string, any> = {
      message,
      access_token: pageAccessToken,
    };

    if (scheduledUnixTime) {
      postPayload.published = false;
      postPayload.scheduled_publish_time = scheduledUnixTime;
    }

    if (videoUrl) {
      graphEndpoint = `https://graph.facebook.com/v21.0/${pageId}/videos`;
      postPayload.description = message;
      postPayload.file_url = videoUrl.startsWith('http')
        ? videoUrl
        : `${process.env.APP_URL || 'https://as-automatic-video-submitter.netlify.app'}${videoUrl}`;
    }

    const fbResp = await fetch(graphEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postPayload),
    });

    const fbData = await fbResp.json();

    if (!fbResp.ok || fbData.error) {
      return res.status(400).json({
        success: false,
        error: fbData.error?.message || 'Meta Graph API returned an error',
        details: fbData.error,
      });
    }

    return res.json({
      success: true,
      postId: fbData.id,
      postUrl: `https://facebook.com/${fbData.id}`,
      scheduled: !!scheduledUnixTime,
      scheduledTime,
      message: scheduledUnixTime
        ? 'Post scheduled successfully on Facebook Page.'
        : 'Post published live on Facebook Page.',
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});
