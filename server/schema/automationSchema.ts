/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PRAJA SANKETAM AI NEWS STUDIO
 * Database Schema: 24/7 Cloud Automation Persistent State & Telemetry
 */

export type CloudWorkerStatus = 'RUNNING' | 'STOPPED' | 'STARTING' | 'STOPPING' | 'ERROR';

export interface AutomationMetrics {
  postsCollected: number;
  eligibleVideos: number;
  completedVideos: number;
  facebookPublished: number;
  lastCycleDurationMs?: number;
  totalCyclesExecuted?: number;
}

export interface AutomationHealth {
  memoryUsageMb: number;
  uptimeSeconds: number;
  isHealthy: boolean;
  nodeVersion: string;
  platform: string;
}

export interface CloudWorkerState {
  // Primary persistent operational state
  status: CloudWorkerStatus;
  lastRunAt: string | null;
  nextScheduledRunAt: string | null;
  workerStartedAt: string | null;
  workerStoppedAt?: string | null;
  workerPid: number | null;
  currentExecutingJob: string | null;

  // Real-time metrics
  metrics: AutomationMetrics;

  // Health & Environment
  lastError: string | null;
  isCloudRunEnvironment: boolean;
  health?: AutomationHealth;
  schemaVersion: number;
}

export const DEFAULT_AUTOMATION_STATE: CloudWorkerState = {
  status: 'STOPPED',
  lastRunAt: null,
  nextScheduledRunAt: null,
  workerStartedAt: null,
  workerStoppedAt: null,
  workerPid: null,
  currentExecutingJob: null,
  metrics: {
    postsCollected: 3,
    eligibleVideos: 2,
    completedVideos: 1,
    facebookPublished: 1,
    lastCycleDurationMs: 0,
    totalCyclesExecuted: 0,
  },
  lastError: null,
  isCloudRunEnvironment: Boolean(process.env.K_SERVICE || process.env.APP_URL),
  schemaVersion: 1,
};

/**
 * Validates and normalizes raw persistent database records against the schema
 */
export function validateAndMigrateAutomationState(raw: any): CloudWorkerState {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_AUTOMATION_STATE };
  }

  const validStatuses: CloudWorkerStatus[] = ['RUNNING', 'STOPPED', 'STARTING', 'STOPPING', 'ERROR'];
  const status: CloudWorkerStatus = validStatuses.includes(raw.status) ? raw.status : 'STOPPED';

  return {
    status,
    lastRunAt: typeof raw.lastRunAt === 'string' ? raw.lastRunAt : null,
    nextScheduledRunAt: typeof raw.nextScheduledRunAt === 'string' ? raw.nextScheduledRunAt : null,
    workerStartedAt: typeof raw.workerStartedAt === 'string' ? raw.workerStartedAt : null,
    workerStoppedAt: typeof raw.workerStoppedAt === 'string' ? raw.workerStoppedAt : null,
    workerPid: typeof raw.workerPid === 'number' ? raw.workerPid : null,
    currentExecutingJob: typeof raw.currentExecutingJob === 'string' ? raw.currentExecutingJob : null,
    metrics: {
      postsCollected: Number(raw.metrics?.postsCollected) || 0,
      eligibleVideos: Number(raw.metrics?.eligibleVideos) || 0,
      completedVideos: Number(raw.metrics?.completedVideos) || 0,
      facebookPublished: Number(raw.metrics?.facebookPublished) || 0,
      lastCycleDurationMs: Number(raw.metrics?.lastCycleDurationMs) || 0,
      totalCyclesExecuted: Number(raw.metrics?.totalCyclesExecuted) || 0,
    },
    lastError: typeof raw.lastError === 'string' ? raw.lastError : null,
    isCloudRunEnvironment: Boolean(process.env.K_SERVICE || process.env.APP_URL),
    schemaVersion: 1,
  };
}
