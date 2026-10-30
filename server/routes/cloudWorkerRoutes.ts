import { Router } from 'express';
import {
  getCloudWorkerState,
  startCloudWorker,
  stopCloudWorker,
  executeCloudWorkerCycle,
} from '../cloudWorkerService.js';
import { getAutomationLogs } from '../xAutomationService.js';

export const cloudWorkerRouter = Router();

// Get live cloud worker status, metrics, and timestamps
cloudWorkerRouter.get('/status', (req, res) => {
  try {
    const state = getCloudWorkerState();
    const logs = getAutomationLogs().slice(0, 20);
    return res.json({
      success: true,
      state,
      serverTime: new Date().toISOString(),
      logs,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// START Cloud Worker (Persists RUNNING state and activates server daemon)
cloudWorkerRouter.post('/start', async (req, res) => {
  try {
    const updatedState = await startCloudWorker();
    return res.json({
      success: true,
      state: updatedState,
      message: 'Cloud Background Worker activated successfully. Monitoring runs 24/7 independently of browser.',
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// STOP Cloud Worker (Stops scheduling and prevents new jobs gracefully)
cloudWorkerRouter.post('/stop', async (req, res) => {
  try {
    const updatedState = await stopCloudWorker();
    return res.json({
      success: true,
      state: updatedState,
      message: 'Cloud Background Worker stopped safely. Active jobs completed, future scheduling halted.',
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// Google Cloud Scheduler Cron Trigger Endpoint
cloudWorkerRouter.post('/cron', async (req, res) => {
  try {
    console.log('[CloudWorker Routes] External Cloud Scheduler cron trigger received.');
    const result = await executeCloudWorkerCycle();
    return res.json({
      success: true,
      triggeredBy: 'Google Cloud Scheduler',
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// Database Schema Metadata Endpoint
cloudWorkerRouter.get('/schema', (req, res) => {
  return res.json({
    success: true,
    schemaName: 'CloudAutomationPersistentState',
    schemaVersion: 1,
    table: 'cloud_automation_state',
    storageFormat: 'atomic_json_wal',
    fields: {
      status: { type: 'enum', values: ['RUNNING', 'STOPPED', 'STARTING', 'STOPPING', 'ERROR'], nullable: false },
      lastRunAt: { type: 'timestamp_iso', nullable: true },
      nextScheduledRunAt: { type: 'timestamp_iso', nullable: true },
      workerStartedAt: { type: 'timestamp_iso', nullable: true },
      workerStoppedAt: { type: 'timestamp_iso', nullable: true },
      workerPid: { type: 'integer', nullable: true },
      currentExecutingJob: { type: 'string', nullable: true },
      metrics: {
        type: 'object',
        properties: {
          postsCollected: 'integer',
          eligibleVideos: 'integer',
          completedVideos: 'integer',
          facebookPublished: 'integer',
          lastCycleDurationMs: 'integer',
          totalCyclesExecuted: 'integer',
        },
      },
      health: {
        type: 'object',
        properties: {
          memoryUsageMb: 'number',
          uptimeSeconds: 'integer',
          isHealthy: 'boolean',
        },
      },
      lastError: { type: 'string', nullable: true },
      isCloudRunEnvironment: { type: 'boolean' },
    },
  });
});

