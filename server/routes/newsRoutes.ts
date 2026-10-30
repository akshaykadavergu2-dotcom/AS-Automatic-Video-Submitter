import { Router } from 'express';
import { generateTeluguNewsPackage } from '../geminiService.js';
import { getDrafts, saveDraft, deleteDraft, NewsDraft } from '../storage.js';

export const newsRouter = Router();

// Generate Telugu news package using Gemini AI
newsRouter.post('/generate', async (req, res) => {
  try {
    const { rawNews, category, tone, languagePreference } = req.body;
    if (!rawNews || !rawNews.trim()) {
      return res.status(400).json({ error: 'News content (rawNews) is required.' });
    }

    const result = await generateTeluguNewsPackage({
      rawNews,
      category: category || 'Breaking News',
      tone,
      languagePreference,
    });

    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error in /api/news/generate:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate news package with Gemini AI',
    });
  }
});

// Get drafts
newsRouter.get('/drafts', (req, res) => {
  try {
    const drafts = getDrafts();
    return res.json({ drafts });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// Save or update draft
newsRouter.post('/drafts', (req, res) => {
  try {
    const draftData = req.body as Partial<NewsDraft>;
    if (!draftData.headlineTelugu && !draftData.rawNews) {
      return res.status(400).json({ error: 'Headline or raw news is required to save draft' });
    }

    const draft: NewsDraft = {
      id: draftData.id || `draft-${Date.now()}`,
      createdAt: draftData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: draftData.category || 'Breaking News',
      rawNews: draftData.rawNews || '',
      sourceUrl: draftData.sourceUrl || '',
      headlineTelugu: draftData.headlineTelugu || '',
      headlineEnglish: draftData.headlineEnglish || '',
      tickerLineTelugu: draftData.tickerLineTelugu || '',
      threeWordThumbnailTitle: draftData.threeWordThumbnailTitle || '',
      anchorScriptTelugu: draftData.anchorScriptTelugu || '',
      voiceoverScriptTelugu: draftData.voiceoverScriptTelugu || '',
      facebookDescription: draftData.facebookDescription || '',
      verticalHashtags: draftData.verticalHashtags || [],
      bulletSummary: draftData.bulletSummary || [],
      videoAssetUrl: draftData.videoAssetUrl,
      aspectRatio: draftData.aspectRatio || '16:9',
      status: draftData.status || 'draft',
      scheduledTime: draftData.scheduledTime,
      publishedUrl: draftData.publishedUrl,
    };

    const saved = saveDraft(draft);
    return res.json({ success: true, draft: saved });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// Delete draft
newsRouter.delete('/drafts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const ok = deleteDraft(id);
    return res.json({ success: ok });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});
