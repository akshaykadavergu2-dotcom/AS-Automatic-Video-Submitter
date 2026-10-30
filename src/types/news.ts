export type NewsCategory =
  | 'Politics'
  | 'Telangana'
  | 'Andhra Pradesh'
  | 'National'
  | 'Breaking News'
  | 'Local News';

export interface NewsDraft {
  id: string;
  createdAt: string;
  updatedAt: string;
  category: NewsCategory;
  rawNews: string;
  sourceUrl?: string;
  headlineTelugu: string;
  headlineEnglish: string;
  tickerLineTelugu: string;
  threeWordThumbnailTitle: string;
  anchorScriptTelugu: string;
  voiceoverScriptTelugu: string;
  facebookDescription: string;
  verticalHashtags: string[];
  bulletSummary: string[];
  videoAssetUrl?: string;
  aspectRatio?: '16:9' | '9:16';
  status: 'draft' | 'ai_generated' | 'video_ready' | 'scheduled' | 'published';
  scheduledTime?: string;
  publishedUrl?: string;
}

export interface VideoRenderJob {
  id: string;
  newsId?: string;
  createdAt: string;
  title: string;
  aspectRatio: '16:9' | '9:16';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  outputVideoUrl?: string;
  durationSeconds?: number;
  error?: string;
  config: {
    headline: string;
    subline?: string;
    tickerText: string;
    aspectRatio: '16:9' | '9:16';
    primaryColor: string;
    fontSize: number;
    showLogo: boolean;
    showDate: boolean;
    showTicker: boolean;
    sourceVideoUrl?: string;
    frameStyle: 'praja_classic' | 'breaking_red' | 'live_gold' | 'custom';
  };
}

export interface TrendingTopic {
  id: string;
  topic: string;
  topicTelugu: string;
  category: string;
  tweetVolume?: string;
  summary: string;
  url: string;
  timeDetected: string;
  source: 'official_x_api' | 'curated_regional_feed';
}

export interface StudioSettings {
  channelName: string;
  channelNameTelugu: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  tickerSpeed: number;
  logoUrl: string;
  landscapeFrameUrl: string;
  verticalFrameUrl: string;
  metaConfig: {
    isConfigured: boolean;
    appId: string;
    appSecret: string;
    pageId: string;
    pageName: string;
    pageAccessToken: string;
    lastConnected?: string;
  };
  xConfig: {
    isConfigured: boolean;
    apiKey: string;
    apiSecret: string;
    bearerToken: string;
    lastChecked?: string;
  };
  renderQuality: '1080p' | '720p';
  fps: 30 | 60;
}

export interface MonitoredSource {
  id: string;
  handle: string;
  name: string;
  avatarUrl?: string;
  profileUrl?: string;
  category: NewsCategory;
  sourceType: 'manual' | 'following' | 'both';
  isActive: boolean;
  isExcluded: boolean;
  lastCheckedAt?: string;
  lastCheckpointPostId?: string;
  postsCollectedCount: number;
  addedAt: string;
  description?: string;
  isVerified?: boolean;
  followingSince?: string;
}

export interface CollectedXPost {
  id: string;
  xPostId: string;
  authorHandle: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt: string;
  detectedAt: string;
  originalPostUrl: string;
  category: string;
  locationTag?: 'Telangana' | 'Andhra Pradesh' | 'Hyderabad' | 'Amaravati' | 'National' | 'General';
  isBreakingNews: boolean;
  requiresHumanReview: boolean;
  unverifiedClaimWarning?: string;
  sourceType: 'manual' | 'following' | 'both';
  hasMedia: boolean;
  mediaType: 'video' | 'image' | 'text_only' | 'article_link';
  mediaUrl?: string;
  mediaThumbnailUrl?: string;
  contentHash: string;
  rightsStatus: 'eligible' | 'requires_permission' | 'restricted';
  rightsNote?: string;
  sourceAttribution: string;
  status:
    | 'collected'
    | 'ai_analyzing'
    | 'ai_ready'
    | 'rendering_video'
    | 'ready_for_review'
    | 'published'
    | 'rejected'
    | 'failed';
  geminiResult?: {
    headlineTelugu: string;
    headlineEnglish: string;
    tickerLineTelugu: string;
    threeWordThumbnailTitle: string;
    anchorScriptTelugu: string;
    voiceoverScriptTelugu: string;
    facebookDescription: string;
    verticalHashtags: string[];
    bulletSummary: string[];
    factCheckDisclaimer?: string;
  };
  renderedVideo169Url?: string;
  renderedVideo916Url?: string;
  facebookPublishResult?: {
    postId?: string;
    postUrl?: string;
    publishedAt?: string;
    error?: string;
  };
  retryCount: number;
  lastError?: string;
}

export interface AutomationConfig {
  isGlobalPaused: boolean;
  mode: 'manual_approval' | 'auto_publish';
  followingSyncIntervalHours: number;
  pollIntervalMinutes: number;
  generateLandscape169: boolean;
  generateVertical916: boolean;
  filterKeywords: string[];
  autoPublishOnlyVerifiedGov: boolean;
  dailyPostBudgetLimit: number;
  lastPolledAt?: string;
  lastFollowingSyncAt?: string;
}

export interface AutomationLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  stage: 'ingest' | 'following_sync' | 'gemini_ai' | 'video_render' | 'meta_publish' | 'system';
  message: string;
  details?: any;
}

export type CloudWorkerStatus = 'RUNNING' | 'STOPPED' | 'STARTING' | 'STOPPING' | 'ERROR';

export interface CloudWorkerState {
  status: CloudWorkerStatus;
  lastRunAt: string | null;
  nextScheduledRunAt: string | null;
  workerStartedAt: string | null;
  workerPid: number | null;
  currentExecutingJob: string | null;
  metrics: {
    postsCollected: number;
    eligibleVideos: number;
    completedVideos: number;
    facebookPublished: number;
  };
  lastError: string | null;
  isCloudRunEnvironment: boolean;
}

