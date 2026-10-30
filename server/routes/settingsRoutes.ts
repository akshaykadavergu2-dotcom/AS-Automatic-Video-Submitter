import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getSettings, saveSettings } from '../storage.js';

export const settingsRouter = Router();

const ASSETS_DIR = path.resolve(process.cwd(), 'uploads/assets');
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, ASSETS_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `asset-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// Get settings with masked secrets
settingsRouter.get('/', (req, res) => {
  try {
    const s = getSettings();
    const safeSettings = {
      ...s,
      metaConfig: {
        ...s.metaConfig,
        appSecret: s.metaConfig.appSecret ? '••••••••••••••••' : '',
        pageAccessToken: s.metaConfig.pageAccessToken
          ? `${s.metaConfig.pageAccessToken.slice(0, 8)}••••••••`
          : '',
      },
      xConfig: {
        ...s.xConfig,
        apiKey: s.xConfig.apiKey ? `${s.xConfig.apiKey.slice(0, 4)}••••` : '',
        apiSecret: s.xConfig.apiSecret ? '••••••••••••••••' : '',
        bearerToken: s.xConfig.bearerToken
          ? `${s.xConfig.bearerToken.slice(0, 8)}••••••••`
          : '',
      },
    };
    return res.json({ settings: safeSettings });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// Save settings
settingsRouter.post('/', (req, res) => {
  try {
    const updates = req.body;
    const current = getSettings();

    // Preserve secrets if sent as masked string
    if (updates.metaConfig) {
      if (updates.metaConfig.appSecret && updates.metaConfig.appSecret.includes('••••')) {
        updates.metaConfig.appSecret = current.metaConfig.appSecret;
      }
      if (updates.metaConfig.pageAccessToken && updates.metaConfig.pageAccessToken.includes('••••')) {
        updates.metaConfig.pageAccessToken = current.metaConfig.pageAccessToken;
      }
      updates.metaConfig.isConfigured = Boolean(
        updates.metaConfig.pageId && updates.metaConfig.pageAccessToken
      );
    }

    if (updates.xConfig) {
      if (updates.xConfig.bearerToken && updates.xConfig.bearerToken.includes('••••')) {
        updates.xConfig.bearerToken = current.xConfig.bearerToken;
      }
      if (updates.xConfig.apiKey && updates.xConfig.apiKey.includes('••••')) {
        updates.xConfig.apiKey = current.xConfig.apiKey;
      }
      if (updates.xConfig.apiSecret && updates.xConfig.apiSecret.includes('••••')) {
        updates.xConfig.apiSecret = current.xConfig.apiSecret;
      }
      updates.xConfig.isConfigured = Boolean(updates.xConfig.bearerToken);
    }

    const saved = saveSettings(updates);
    return res.json({ success: true, settings: saved });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// Upload brand asset (Logo, Frame)
settingsRouter.post('/upload-asset', upload.single('asset'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No asset uploaded' });
    }
    const publicUrl = `/uploads/assets/${req.file.filename}`;
    const assetType = req.body.type as 'logo' | 'landscape_frame' | 'vertical_frame' | undefined;

    if (assetType) {
      const s = getSettings();
      if (assetType === 'logo') s.logoUrl = publicUrl;
      if (assetType === 'landscape_frame') s.landscapeFrameUrl = publicUrl;
      if (assetType === 'vertical_frame') s.verticalFrameUrl = publicUrl;
      saveSettings(s);
    }

    return res.json({
      success: true,
      url: publicUrl,
      type: assetType,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});
