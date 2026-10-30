import { Router } from 'express';
import { getSettings, saveDraft, getDrafts } from '../storage.js';

export const facebookRouter = Router();

// Check Meta Facebook Page Connection Status (Real Handshake with Meta Graph API)
facebookRouter.get('/status', async (req, res) => {
  try {
    const settings = getSettings();
    const { isConfigured, pageId, pageName, pageAccessToken } = settings.metaConfig;

    if (!pageAccessToken || !pageId) {
      return res.json({
        connected: false,
        isConfigured: false,
        status: 'NOT CONFIGURED',
        pageId: pageId || null,
        pageName: pageName || null,
        requiredPermissions: [
          'pages_manage_posts',
          'pages_read_engagement',
          'pages_show_list',
          'publish_video',
        ],
        notice:
          'Meta Facebook Page credentials are not configured. Go to Studio Settings to enter your Page ID and Page Access Token (from Meta for Developers / Graph API Explorer).',
      });
    }

    // Attempt real handshake with Meta Graph API
    try {
      const graphResp = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}?fields=id,name,fan_count,verification_status,category&access_token=${pageAccessToken}`
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
          status: 'TOKEN ACTIVE (VERIFIED)',
          notice: `Successfully connected to Facebook Page: ${pageData.name}`,
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
          notice: 'Meta Page Access Token rejected by Facebook. Please generate a fresh token.',
        });
      }
    } catch (networkErr: any) {
      return res.json({
        connected: false,
        isConfigured: true,
        pageId,
        status: 'NETWORK ERROR',
        error: networkErr.message,
        notice: 'Network connection to Meta Graph API failed.',
      });
    }
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// Meta OAuth Authorization URL
facebookRouter.get('/auth/url', (req, res) => {
  try {
    const settings = getSettings();
    const appId = settings.metaConfig.appId || process.env.FACEBOOK_APP_ID;
    const appUrl = process.env.APP_URL || 'https://ais-dev-lmom2hd2oucw6cxokozf4z-886470196514.asia-southeast1.run.app';
    const redirectUri = `${appUrl}/auth/facebook/callback`;

    if (!appId) {
      return res.json({
        isConfigured: false,
        url: null,
        redirectUri,
        notice: 'Meta App ID is not configured. You can either enter your App ID & App Secret in Settings, or directly enter your Page ID and Page Access Token below.',
      });
    }

    const state = Math.random().toString(36).substring(7);
    const scope = 'pages_manage_posts,pages_read_engagement,pages_show_list,publish_video';
    const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}&response_type=code`;

    return res.json({
      isConfigured: true,
      url: authUrl,
      redirectUri,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// Verify & Connect Facebook Page Credentials directly (Real test with Meta Graph API)
facebookRouter.post('/verify-page', async (req, res) => {
  try {
    const { pageId, pageAccessToken, pageName } = req.body;
    if (!pageId || !pageAccessToken) {
      return res.status(400).json({
        success: false,
        error: 'Both Page ID and Page Access Token are required.',
      });
    }

    // Ping Meta Graph API directly
    const verifyResp = await fetch(
      `https://graph.facebook.com/v21.0/${pageId.trim()}?fields=id,name,category,fan_count,verification_status&access_token=${pageAccessToken.trim()}`
    );
    const verifyData = await verifyResp.json();

    if (!verifyResp.ok || verifyData.error) {
      return res.status(400).json({
        success: false,
        error: verifyData.error?.message || 'Meta Graph API token verification failed. Please verify Page ID and Token.',
        details: verifyData.error,
      });
    }

    // Token is valid! Persist to storage
    const { saveSettings } = await import('../storage.js');
    const settings = getSettings();
    const updated = saveSettings({
      metaConfig: {
        ...settings.metaConfig,
        isConfigured: true,
        pageId: verifyData.id,
        pageName: verifyData.name || pageName || 'Facebook Page',
        pageAccessToken: pageAccessToken.trim(),
        lastConnected: new Date().toISOString(),
      },
    });

    return res.json({
      success: true,
      message: `Successfully connected to Facebook Page: ${verifyData.name}`,
      page: {
        id: verifyData.id,
        name: verifyData.name,
        category: verifyData.category,
        fanCount: verifyData.fan_count,
      },
      settings: updated,
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// Get authorized Facebook Pages list
facebookRouter.get('/pages', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const pagesFile = path.resolve(process.cwd(), 'data/facebook_pages.json');
    let pages = [];
    if (fs.existsSync(pagesFile)) {
      try { pages = JSON.parse(fs.readFileSync(pagesFile, 'utf-8')); } catch (_) {}
    }
    const settings = getSettings();
    if (pages.length === 0 && settings.metaConfig.pageId && settings.metaConfig.pageName) {
      pages.push({
        id: settings.metaConfig.pageId,
        name: settings.metaConfig.pageName,
        category: 'Media / News Publishing Page',
        access_token: settings.metaConfig.pageAccessToken,
      });
    }
    return res.json({ success: true, pages });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// Disconnect Facebook Page
facebookRouter.post('/disconnect', async (req, res) => {
  try {
    const { saveSettings } = await import('../storage.js');
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

    const fs = require('fs');
    const path = require('path');
    const pagesFile = path.resolve(process.cwd(), 'data/facebook_pages.json');
    if (fs.existsSync(pagesFile)) {
      try { fs.unlinkSync(pagesFile); } catch (_) {}
    }

    return res.json({ success: true, message: 'Facebook Page disconnected successfully.' });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// Publish directly to Facebook Page
facebookRouter.post('/publish', async (req, res) => {
  try {
    const { draftId, message, videoUrl, scheduledTime } = req.body;
    const settings = getSettings();
    const { pageId, pageAccessToken } = settings.metaConfig;

    if (!pageAccessToken || !pageId) {
      return res.status(400).json({
        success: false,
        error:
          'Meta Facebook Page integration is not configured. Real Page Access Token and Page ID are required to publish. Open Studio Settings > Facebook Publishing to configure.',
      });
    }

    if (!message && !videoUrl) {
      return res.status(400).json({ error: 'Publish message or video is required.' });
    }

    // Check if scheduled publishing requested
    let scheduledUnixTime: number | undefined;
    if (scheduledTime) {
      const scheduleDate = new Date(scheduledTime);
      scheduledUnixTime = Math.floor(scheduleDate.getTime() / 1000);
      const nowUnix = Math.floor(Date.now() / 1000);
      // Meta requires scheduled posts to be at least 10 minutes in the future and maximum 75 days
      if (scheduledUnixTime < nowUnix + 600) {
        return res.status(400).json({
          error: 'Scheduled time must be at least 10 minutes in the future according to Meta Graph API rules.',
        });
      }
    }

    // Call Meta Graph API
    let graphEndpoint = `https://graph.facebook.com/v21.0/${pageId}/feed`;
    const postPayload: Record<string, any> = {
      message,
      access_token: pageAccessToken,
    };

    if (scheduledUnixTime) {
      postPayload.published = false;
      postPayload.scheduled_publish_time = scheduledUnixTime;
    }

    // If video URL exists
    if (videoUrl) {
      graphEndpoint = `https://graph.facebook.com/v21.0/${pageId}/videos`;
      postPayload.description = message;
      postPayload.file_url = videoUrl.startsWith('http')
        ? videoUrl
        : `${process.env.APP_URL || 'https://ais-dev-lmom2hd2oucw6cxokozf4z-886470196514.asia-southeast1.run.app'}${videoUrl}`;
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

    // Update draft status if draftId provided
    if (draftId) {
      const drafts = getDrafts();
      const draft = drafts.find((d) => d.id === draftId);
      if (draft) {
        draft.status = scheduledUnixTime ? 'scheduled' : 'published';
        draft.publishedUrl = `https://facebook.com/${fbData.id || pageId}`;
        if (scheduledTime) draft.scheduledTime = scheduledTime;
        saveDraft(draft);
      }
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
