import { NewsDraft, VideoRenderJob, TrendingTopic, StudioSettings, CloudWorkerState, AutomationLog } from '../types/news';

export const api = {
  // News Generation & Drafts
  async generateNews(params: {
    rawNews: string;
    category: string;
    tone?: string;
  }): Promise<{ success: boolean; data: any }> {
    const res = await fetch('/api/news/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to generate news' }));
      throw new Error(err.error || 'Server error during news generation');
    }
    return res.json();
  },

  async getDrafts(): Promise<{ drafts: NewsDraft[] }> {
    const res = await fetch('/api/news/drafts');
    if (!res.ok) throw new Error('Failed to fetch news drafts');
    return res.json();
  },

  async saveDraft(draft: Partial<NewsDraft>): Promise<{ success: boolean; draft: NewsDraft }> {
    const res = await fetch('/api/news/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    if (!res.ok) throw new Error('Failed to save draft');
    return res.json();
  },

  async deleteDraft(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/news/drafts/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete draft');
    return res.json();
  },

  // Video Management & FFmpeg Worker
  async uploadMedia(file: File): Promise<{ success: boolean; file: { url: string; originalName: string; size: number } }> {
    const formData = new FormData();
    formData.append('media', file);
    const res = await fetch('/api/video/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Media upload failed' }));
      throw new Error(err.error || 'Upload error');
    }
    return res.json();
  },

  async startRender(config: any): Promise<{ success: boolean; jobId: string; message: string }> {
    const res = await fetch('/api/video/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Video render start failed' }));
      throw new Error(err.error || 'Render failure');
    }
    return res.json();
  },

  async getJobs(): Promise<{ jobs: VideoRenderJob[] }> {
    const res = await fetch('/api/video/jobs');
    if (!res.ok) throw new Error('Failed to get video jobs');
    return res.json();
  },

  async getJob(id: string): Promise<{ job: VideoRenderJob }> {
    const res = await fetch(`/api/video/jobs/${id}`);
    if (!res.ok) throw new Error('Failed to get job status');
    return res.json();
  },

  // Trend Monitor
  async getTrends(): Promise<{
    isConfigured: boolean;
    isLive: boolean;
    provider: string;
    notice?: string;
    trends: TrendingTopic[];
  }> {
    const res = await fetch('/api/trends');
    if (!res.ok) throw new Error('Failed to fetch trending topics');
    return res.json();
  },

  // Facebook Publishing & Account Verification
  async getFacebookStatus(): Promise<{
    connected: boolean;
    isConfigured: boolean;
    status: string;
    pageId?: string;
    pageName?: string;
    category?: string;
    fanCount?: number;
    notice?: string;
    error?: string;
  }> {
    const res = await fetch('/api/facebook/status');
    if (!res.ok) throw new Error('Failed to fetch Facebook status');
    return res.json();
  },

  async getFacebookAuthUrl(): Promise<{ isConfigured: boolean; url: string | null; redirectUri: string; notice?: string }> {
    const res = await fetch('/api/facebook/auth/url');
    if (!res.ok) throw new Error('Failed to get Facebook OAuth URL');
    return res.json();
  },

  async getFacebookPages(): Promise<{ success: boolean; pages: any[] }> {
    const res = await fetch('/api/facebook/pages');
    if (!res.ok) throw new Error('Failed to get Facebook pages');
    return res.json();
  },

  async verifyFacebookPage(params: {
    pageId: string;
    pageAccessToken: string;
    pageName?: string;
  }): Promise<{ success: boolean; message: string; page: any }> {
    const res = await fetch('/api/facebook/verify-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to verify Facebook Page credentials with Meta Graph API');
    }
    return data;
  },

  async disconnectFacebook(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/facebook/disconnect', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to disconnect Facebook Page');
    return res.json();
  },

  async publishToFacebook(payload: {
    draftId?: string;
    message: string;
    videoUrl?: string;
    scheduledTime?: string;
  }): Promise<{ success: boolean; postId?: string; postUrl?: string; message: string }> {
    const res = await fetch('/api/facebook/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to publish to Facebook');
    }
    return data;
  },

  // Settings & Branding
  async getSettings(): Promise<{ settings: StudioSettings }> {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to fetch studio settings');
    return res.json();
  },

  async saveSettings(settings: Partial<StudioSettings>): Promise<{ success: boolean; settings: StudioSettings }> {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save settings');
    return data;
  },

  async uploadBrandAsset(
    file: File,
    type: 'logo' | 'landscape_frame' | 'vertical_frame'
  ): Promise<{ success: boolean; url: string; type: string }> {
    const formData = new FormData();
    formData.append('asset', file);
    formData.append('type', type);
    const res = await fetch('/api/settings/upload-asset', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload brand asset');
    return res.json();
  },

  // X Automation & OAuth Endpoints
  async getXAuthUrl(): Promise<{ url: string; redirectUri: string; clientIdConfigured: boolean }> {
    const res = await fetch('/api/x-automation/auth/url');
    if (!res.ok) throw new Error('Failed to generate X auth URL');
    return res.json();
  },

  async getXAuthStatus(): Promise<{
    isConnected: boolean;
    isConfigured: boolean;
    status: string;
    username: string | null;
    name: string | null;
    profileImageUrl: string | null;
    followersCount?: number | null;
    followingCount?: number | null;
    connectedAt: string | null;
    clientIdConfigured: boolean;
    bearerTokenConfigured: boolean;
  }> {
    const res = await fetch('/api/x-automation/auth/status');
    if (!res.ok) throw new Error('Failed to fetch X auth status');
    return res.json();
  },

  async disconnectXAuth(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/x-automation/auth/disconnect', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to disconnect X account');
    return res.json();
  },

  async getCloudWorkerReadiness(): Promise<{
    success: boolean;
    readiness: { isReady: boolean; errors: string[]; warnings: string[] };
  }> {
    const res = await fetch('/api/cloud-worker/validate');
    if (!res.ok) throw new Error('Failed to validate cloud worker readiness');
    return res.json();
  },

  async getXSources(): Promise<{ sources: any[] }> {
    const res = await fetch('/api/x-automation/sources');
    if (!res.ok) throw new Error('Failed to fetch monitored X sources');
    return res.json();
  },

  async addXSource(source: {
    handle: string;
    name?: string;
    category?: string;
    description?: string;
  }): Promise<{ success: boolean; source: any }> {
    const res = await fetch('/api/x-automation/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(source),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add source');
    return data;
  },

  async toggleXSource(id: string, isActive: boolean): Promise<{ success: boolean; source: any }> {
    const res = await fetch(`/api/x-automation/sources/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    });
    if (!res.ok) throw new Error('Failed to toggle source');
    return res.json();
  },

  async deleteXSource(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/x-automation/sources/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete source');
    return res.json();
  },

  async getXPosts(): Promise<{ posts: any[] }> {
    const res = await fetch('/api/x-automation/posts');
    if (!res.ok) throw new Error('Failed to fetch collected posts');
    return res.json();
  },

  async pollXPosts(): Promise<{
    success: boolean;
    newPostsCount: number;
    newlyAdded: any[];
    polledAt: string;
    paused?: boolean;
    message?: string;
  }> {
    const res = await fetch('/api/x-automation/posts/poll', { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Polling error' }));
      throw new Error(err.error || 'Failed to poll X sources');
    }
    return res.json();
  },

  async processXPost(id: string): Promise<{ success: boolean; post: any }> {
    const res = await fetch(`/api/x-automation/posts/${id}/process`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gemini processing failed');
    return data;
  },

  async renderXPostVideo(
    id: string,
    aspectRatio: '16:9' | '9:16'
  ): Promise<{ success: boolean; videoUrl: string }> {
    const res = await fetch(`/api/x-automation/posts/${id}/render-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aspectRatio }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Video rendering failed');
    return data;
  },

  async approveXPostToFacebook(id: string): Promise<{ success: boolean; result: any }> {
    const res = await fetch(`/api/x-automation/posts/${id}/approve`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to publish to Facebook');
    return data;
  },

  async rejectXPost(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/x-automation/posts/${id}/reject`, { method: 'POST' });
    return res.json();
  },

  async getXAutomationConfig(): Promise<{ config: any }> {
    const res = await fetch('/api/x-automation/config');
    return res.json();
  },

  async saveXAutomationConfig(config: any): Promise<{ success: boolean; config: any }> {
    const res = await fetch('/api/x-automation/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.json();
  },

  async syncXFollowing(paginationToken?: string): Promise<any> {
    const res = await fetch('/api/x-automation/following/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paginationToken }),
    });
    if (!res.ok) throw new Error('Failed to sync X Following accounts');
    return res.json();
  },

  async toggleExcludeXSource(id: string): Promise<{ success: boolean; source: any }> {
    const res = await fetch(`/api/x-automation/sources/${id}/toggle-exclude`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to toggle exclusion');
    return res.json();
  },

  async updateXPostRights(
    id: string,
    rightsStatus: 'eligible' | 'requires_permission' | 'restricted',
    rightsNote?: string
  ): Promise<{ success: boolean; post: any }> {
    const res = await fetch(`/api/x-automation/posts/${id}/rights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rightsStatus, rightsNote }),
    });
    if (!res.ok) throw new Error('Failed to update rights status');
    return res.json();
  },

  async getXUsage(): Promise<{ usage: any }> {
    const res = await fetch('/api/x-automation/usage');
    if (!res.ok) throw new Error('Failed to fetch API usage');
    return res.json();
  },

  async getXAutomationLogs(): Promise<{ logs: any[] }> {
    const res = await fetch('/api/x-automation/logs');
    return res.json();
  },

  // 24/7 Cloud Background Worker Control
  async getCloudWorkerStatus(): Promise<{
    success: boolean;
    state: CloudWorkerState;
    serverTime: string;
    logs: AutomationLog[];
  }> {
    const res = await fetch('/api/cloud-worker/status');
    if (!res.ok) throw new Error('Failed to fetch cloud worker status');
    return res.json();
  },

  async startCloudWorker(): Promise<{
    success: boolean;
    state: CloudWorkerState;
    message: string;
  }> {
    const res = await fetch('/api/cloud-worker/start', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to start cloud background worker');
    return data;
  },

  async stopCloudWorker(): Promise<{
    success: boolean;
    state: CloudWorkerState;
    message: string;
  }> {
    const res = await fetch('/api/cloud-worker/stop', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to stop cloud background worker');
    return data;
  },

  async triggerCloudWorkerCycle(): Promise<{
    success: boolean;
    result: any;
    state: CloudWorkerState;
  }> {
    const res = await fetch('/api/cloud-worker/cron', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to run cloud worker cycle');
    return data;
  },
};

