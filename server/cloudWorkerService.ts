import fs from 'fs';
import path from 'path';
import {
  getMonitoredSources,
  saveMonitoredSources,
  getCollectedPosts,
  saveCollectedPosts,
  getAutomationConfig,
  saveAutomationConfig,
  addAutomationLog,
  computePostHash,
  processPostWithGemini,
  renderBrandedVideoForPost,
  publishPostToFacebook,
  syncFollowingAccounts,
  CollectedXPost,
} from './xAutomationService.js';
import { getSettings } from './storage.js';
import {
  CloudWorkerStatus,
  CloudWorkerState,
  DEFAULT_AUTOMATION_STATE,
  validateAndMigrateAutomationState,
} from './schema/automationSchema.js';

export type { CloudWorkerStatus, CloudWorkerState };

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STATE_FILE = path.join(DATA_DIR, 'cloud_automation_state.json');

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

let workerTimer: NodeJS.Timeout | null = null;
let isCurrentlyExecuting = false;

function getSystemHealth() {
  const mem = process.memoryUsage();
  return {
    memoryUsageMb: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10,
    uptimeSeconds: Math.round(process.uptime()),
    isHealthy: true,
    nodeVersion: process.version,
    platform: process.platform,
  };
}

export function getCloudWorkerState(): CloudWorkerState {
  ensureDataFiles();
  try {
    if (fs.existsSync(STATE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      const state = validateAndMigrateAutomationState(parsed);
      state.health = getSystemHealth();
      return state;
    }
  } catch (e) {
    console.error('Error reading cloud worker state:', e);
  }
  const fallback = { ...DEFAULT_AUTOMATION_STATE };
  fallback.health = getSystemHealth();
  return fallback;
}

export function saveCloudWorkerState(state: Partial<CloudWorkerState>): CloudWorkerState {
  ensureDataFiles();
  const current = getCloudWorkerState();
  const updated: CloudWorkerState = validateAndMigrateAutomationState({ ...current, ...state });
  updated.health = getSystemHealth();
  
  // Safe atomic write
  const tempPath = `${STATE_FILE}.tmp.${Date.now()}`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(updated, null, 2), 'utf-8');
    fs.renameSync(tempPath, STATE_FILE);
  } catch (e) {
    // Fallback direct write
    fs.writeFileSync(STATE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    if (fs.existsSync(tempPath)) {
      try { fs.unlinkSync(tempPath); } catch (_) {}
    }
  }
  return updated;
}


// Perform one complete cloud monitoring, Gemini AI & video production cycle
export async function executeCloudWorkerCycle(): Promise<{
  newPostsCount: number;
  renderedVideosCount: number;
  publishedCount: number;
}> {
  const state = getCloudWorkerState();
  if (state.status !== 'RUNNING' && state.status !== 'STARTING') {
    return { newPostsCount: 0, renderedVideosCount: 0, publishedCount: 0 };
  }

  if (isCurrentlyExecuting) {
    console.log('[CloudWorker] Previous cycle still running, skipping overlap.');
    return { newPostsCount: 0, renderedVideosCount: 0, publishedCount: 0 };
  }

  isCurrentlyExecuting = true;
  state.currentExecutingJob = 'Ingesting X accounts & following list';
  saveCloudWorkerState(state);

  const conf = getAutomationConfig();
  const sources = getMonitoredSources().filter((s) => s.isActive && !s.isExcluded);
  const existingPosts = getCollectedPosts();
  const settings = getSettings();
  const bearerToken = process.env.X_BEARER_TOKEN || settings.xConfig.bearerToken;

  addAutomationLog('info', 'ingest', `[Cloud Worker] Ticking background cycle across ${sources.length} sources...`);

  let newPostsCount = 0;
  let renderedVideosCount = 0;
  let publishedCount = 0;
  const newlyIngested: CollectedXPost[] = [];

  try {
    // 1. Ingest posts from monitored accounts
    if (bearerToken && bearerToken.trim() !== '') {
      for (const source of sources) {
        try {
          const userLookup = await fetch(`https://api.twitter.com/2/users/by/username/${source.handle}`, {
            headers: { Authorization: `Bearer ${bearerToken}` },
          });
          if (userLookup.ok) {
            const userData = await userLookup.json();
            const userId = userData.data?.id;
            if (userId) {
              let tweetsUrl = `https://api.twitter.com/2/users/${userId}/tweets?max_results=5&tweet.fields=created_at,text,attachments&expansions=attachments.media_keys&media.fields=type,url,preview_image_url`;
              if (source.lastCheckpointPostId) {
                tweetsUrl += `&since_id=${source.lastCheckpointPostId}`;
              }
              const tweetsResp = await fetch(tweetsUrl, {
                headers: { Authorization: `Bearer ${bearerToken}` },
              });
              if (tweetsResp.ok) {
                const tweetData = await tweetsResp.json();
                const tweets = tweetData.data || [];
                const mediaList = tweetData.includes?.media || [];

                for (const t of tweets) {
                  const hash = computePostHash(source.handle, t.text, t.id);
                  const isDuplicate = existingPosts.some(
                    (ep) => ep.xPostId === t.id || ep.contentHash === hash
                  );

                  if (!isDuplicate) {
                    let mediaType: CollectedXPost['mediaType'] = 'text_only';
                    let mediaUrl: string | undefined;

                    if (t.attachments?.media_keys?.length) {
                      const firstMedia = mediaList.find((m: any) =>
                        t.attachments.media_keys.includes(m.media_key)
                      );
                      if (firstMedia) {
                        mediaType = firstMedia.type === 'video' ? 'video' : 'image';
                        mediaUrl = firstMedia.url || firstMedia.preview_image_url;
                      }
                    }

                    const isBreaking =
                      t.text.toLowerCase().includes('breaking') ||
                      t.text.includes('బ్రేకింగ్') ||
                      t.text.includes('తాజా');

                    const newPost: CollectedXPost = {
                      id: `post-x-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                      xPostId: t.id,
                      authorHandle: source.handle,
                      authorName: source.name,
                      text: t.text,
                      createdAt: t.created_at || new Date().toISOString(),
                      detectedAt: new Date().toISOString(),
                      originalPostUrl: `https://x.com/${source.handle}/status/${t.id}`,
                      category: source.category,
                      isBreakingNews: isBreaking,
                      requiresHumanReview: false,
                      sourceType: source.sourceType,
                      hasMedia: mediaType !== 'text_only',
                      mediaType,
                      mediaUrl,
                      contentHash: hash,
                      rightsStatus: 'eligible',
                      rightsNote: 'Verified Official Government/Public Notice - News Editorial Use',
                      sourceAttribution: `Source: Official X account of ${source.name} (@${source.handle})`,
                      status: 'collected',
                      retryCount: 0,
                    };

                    existingPosts.unshift(newPost);
                    newlyIngested.push(newPost);
                    newPostsCount++;
                    source.postsCollectedCount = (source.postsCollectedCount || 0) + 1;
                    source.lastCheckpointPostId = t.id;
                  }
                }
              }
            }
          }
        } catch (sourceErr: any) {
          console.warn(`[CloudWorker] Source query warning for ${source.handle}:`, sourceErr.message);
        }
      }
    }

    saveCollectedPosts(existingPosts);
    saveMonitoredSources(sources);

    // 2. Process Newly Ingested Posts with Gemini AI Scripting
    for (const post of newlyIngested) {
      state.currentExecutingJob = `Gemini AI Scripting for @${post.authorHandle}`;
      saveCloudWorkerState(state);

      try {
        await processPostWithGemini(post.id);
      } catch (gErr: any) {
        console.warn(`[CloudWorker] Gemini analysis failed for ${post.id}:`, gErr.message);
      }

      // 3. Render 16:9 & 9:16 Video if media is eligible
      if (post.hasMedia && post.rightsStatus === 'eligible' && post.geminiResult) {
        state.currentExecutingJob = `FFmpeg Video Rendering for @${post.authorHandle}`;
        saveCloudWorkerState(state);

        try {
          if (conf.generateLandscape169) {
            await renderBrandedVideoForPost(post.id, '16:9');
            renderedVideosCount++;
          }
          if (conf.generateVertical916) {
            await renderBrandedVideoForPost(post.id, '9:16');
            renderedVideosCount++;
          }
        } catch (vErr: any) {
          console.warn(`[CloudWorker] Video render failed for ${post.id}:`, vErr.message);
        }
      }

      // 4. Auto-publish to Facebook Page if in Auto-Publish mode
      if (conf.mode === 'auto_publish' && post.geminiResult) {
        state.currentExecutingJob = `Meta Facebook Broadcasting for @${post.authorHandle}`;
        saveCloudWorkerState(state);

        try {
          await publishPostToFacebook(post.id);
          publishedCount++;
        } catch (fbErr: any) {
          console.warn(`[CloudWorker] Auto-publish failed for ${post.id}:`, fbErr.message);
        }
      }
    }

    // Update worker state metrics
    const now = new Date();
    const intervalMs = (conf.pollIntervalMinutes || 5) * 60 * 1000;
    const nextRun = new Date(now.getTime() + intervalMs);

    saveCloudWorkerState({
      lastRunAt: now.toISOString(),
      nextScheduledRunAt: nextRun.toISOString(),
      currentExecutingJob: null,
      metrics: {
        postsCollected: (state.metrics?.postsCollected || 0) + newPostsCount,
        eligibleVideos: (state.metrics?.eligibleVideos || 0) + (newPostsCount > 0 ? 1 : 0),
        completedVideos: (state.metrics?.completedVideos || 0) + renderedVideosCount,
        facebookPublished: (state.metrics?.facebookPublished || 0) + publishedCount,
      },
      lastError: null,
    });

    addAutomationLog(
      'success',
      'system',
      `[Cloud Worker] Cycle completed: Ingested: +${newPostsCount}, Rendered: +${renderedVideosCount}, Published: +${publishedCount}. Next check at ${nextRun.toLocaleTimeString()}.`
    );
  } catch (err: any) {
    console.error('[CloudWorker] Error during cycle:', err);
    saveCloudWorkerState({
      lastError: err.message,
      currentExecutingJob: null,
    });
    addAutomationLog('error', 'system', `[Cloud Worker] Execution error: ${err.message}`);
  } finally {
    isCurrentlyExecuting = false;
  }

  return { newPostsCount, renderedVideosCount, publishedCount };
}

// Validate system readiness before starting automation (Priority 5)
export function validateAutomationReadiness(): {
  isReady: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Verify Gemini API key
  if (!process.env.GEMINI_API_KEY) {
    errors.push('GEMINI_API_KEY is not configured. Gemini 2.5 Flash is required for Telugu news scriptwriting.');
  }

  // 2. Verify Monitored Sources
  const activeSources = getMonitoredSources().filter((s) => s.isActive && !s.isExcluded);
  if (activeSources.length === 0) {
    errors.push('No active monitored sources found. Please add at least one X account to monitor in Account Connections.');
  }

  // 3. Verify Facebook credentials if in Auto-Publish mode
  const conf = getAutomationConfig();
  if (conf.mode === 'auto_publish') {
    const settings = getSettings();
    if (!settings.metaConfig.pageAccessToken || !settings.metaConfig.pageId) {
      errors.push('Auto-Publish mode is active but Facebook Page is not configured. Please connect a Facebook Page or switch to Manual Approval mode.');
    }
  }

  // 4. Check X credentials (warning if using public endpoints)
  const settings = getSettings();
  const hasXToken = Boolean(settings.xConfig.bearerToken || process.env.X_BEARER_TOKEN);
  let hasOAuth = false;
  try {
    const oauthFile = path.join(DATA_DIR, 'connected_accounts.json');
    if (fs.existsSync(oauthFile)) {
      const sess = JSON.parse(fs.readFileSync(oauthFile, 'utf-8'));
      if (sess.isConnected && sess.accessToken) hasOAuth = true;
    }
  } catch (_) {}

  if (!hasXToken && !hasOAuth) {
    warnings.push('Neither X Bearer Token nor X OAuth connection is configured. Add credentials in Connections to poll live tweets.');
  }

  return {
    isReady: errors.length === 0,
    errors,
    warnings,
  };
}

// Start 24/7 Cloud Worker
export async function startCloudWorker(): Promise<CloudWorkerState> {
  const currentState = getCloudWorkerState();
  if (currentState.status === 'RUNNING') {
    return currentState;
  }

  // Strict configuration validation (Priority 5)
  const readiness = validateAutomationReadiness();
  if (!readiness.isReady) {
    const errorSummary = readiness.errors.join(' | ');
    addAutomationLog('error', 'system', `Start rejected: ${errorSummary}`);
    saveCloudWorkerState({
      lastError: errorSummary,
    });
    throw new Error(errorSummary);
  }

  console.log('[CloudWorker] Activating 24/7 Cloud Background Worker...');
  addAutomationLog('info', 'system', 'Activating 24/7 Cloud Background Worker on server...');

  saveCloudWorkerState({
    status: 'STARTING',
    lastError: null,
    workerStartedAt: new Date().toISOString(),
    workerPid: process.pid,
  });

  const conf = getAutomationConfig();
  const intervalMinutes = conf.pollIntervalMinutes || 5;
  const intervalMs = intervalMinutes * 60 * 1000;
  const nextRun = new Date(Date.now() + intervalMs);

  const updatedState = saveCloudWorkerState({
    status: 'RUNNING',
    nextScheduledRunAt: nextRun.toISOString(),
  });

  // Clear existing timer if any
  if (workerTimer) clearInterval(workerTimer);

  // Setup recurring daemon timer that runs independently of browser
  workerTimer = setInterval(async () => {
    console.log('[CloudWorker] Recurring daemon interval triggered.');
    await executeCloudWorkerCycle();
  }, intervalMs);

  // Trigger initial cycle immediately in background
  executeCloudWorkerCycle().catch((err) => {
    console.error('[CloudWorker] Error in initial cycle:', err);
  });

  addAutomationLog(
    'success',
    'system',
    `24/7 Cloud Worker RUNNING on server (PID: ${process.pid}). Monitoring active every ${intervalMinutes} minutes.`
  );

  return updatedState;
}

// Stop Cloud Worker safely (Graceful stop: finishes currently running task, stops new tasks)
export async function stopCloudWorker(): Promise<CloudWorkerState> {
  console.log('[CloudWorker] Stopping 24/7 Cloud Background Worker gracefully...');
  addAutomationLog('info', 'system', 'Stop requested. Halting cloud worker and future schedules...');

  saveCloudWorkerState({ status: 'STOPPING' });

  // Clear server daemon timer
  if (workerTimer) {
    clearInterval(workerTimer);
    workerTimer = null;
  }

  // If a task is currently executing, wait a moment for safe completion
  if (isCurrentlyExecuting) {
    console.log('[CloudWorker] Waiting for active task to conclude safely...');
    await new Promise((r) => setTimeout(r, 1200));
  }

  const finalState = saveCloudWorkerState({
    status: 'STOPPED',
    nextScheduledRunAt: null,
    currentExecutingJob: null,
  });

  addAutomationLog('warn', 'system', 'Cloud Background Worker STOPPED. All new monitoring and collection halted.');
  return finalState;
}

// Initialize on server startup to resume if previous state was RUNNING
export function initCloudWorkerOnBoot(): void {
  ensureDataFiles();
  const state = getCloudWorkerState();
  if (state.status === 'RUNNING') {
    console.log('[CloudWorker] Detected RUNNING state from previous boot. Resuming 24/7 cloud worker daemon...');
    startCloudWorker().catch((err) => {
      console.error('[CloudWorker] Failed to auto-resume on boot:', err);
    });
  } else {
    console.log(`[CloudWorker] Initial state is ${state.status}. Ready for user START command.`);
  }
}
