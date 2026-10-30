import { Router } from 'express';
import { getSettings, saveDraft, getDrafts } from '../storage.js';

export const facebookRouter = Router();

// Check Meta Facebook Page Connection Status
facebookRouter.get('/status', async (req, res) => {
  try {
    const settings = getSettings();
    const { isConfigured, pageId, pageName, pageAccessToken } = settings.metaConfig;

    if (!pageAccessToken || !pageId) {
      return res.json({
        connected: false,
        isConfigured: false,
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
        `https://graph.facebook.com/v21.0/${pageId}?fields=id,name,fan_count,verification_status&access_token=${pageAccessToken}`
      );
      if (graphResp.ok) {
        const pageData = await graphResp.json();
        return res.json({
          connected: true,
          isConfigured: true,
          pageId: pageData.id,
          pageName: pageData.name,
          fanCount: pageData.fan_count,
          status: 'verified_active',
          notice: `Successfully connected to Facebook Page: ${pageData.name}`,
        });
      } else {
        const errorData = await graphResp.json();
        return res.json({
          connected: false,
          isConfigured: true,
          pageId,
          pageName,
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
        error: networkErr.message,
        notice: 'Network connection to Meta Graph API failed.',
      });
    }
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
