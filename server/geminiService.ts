import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[Gemini] GEMINI_API_KEY is not set in environment.');
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

export interface NewsGenerationInput {
  rawNews: string;
  category: 'Politics' | 'Telangana' | 'Andhra Pradesh' | 'National' | 'Breaking News' | 'Local News';
  tone?: 'breaking' | 'analytical' | 'bulletin' | 'investigative';
  languagePreference?: 'telugu_primary' | 'bilingual';
}

export interface NewsGenerationResult {
  headlineTelugu: string;
  headlineEnglish: string;
  tickerLineTelugu: string;
  threeWordThumbnailTitle: string;
  anchorScriptTelugu: string;
  voiceoverScriptTelugu: string;
  facebookDescription: string;
  verticalHashtags: string[];
  bulletSummary: string[];
  category: string;
  factCheckDisclaimer: string;
}

export async function generateTeluguNewsPackage(input: NewsGenerationInput): Promise<NewsGenerationResult> {
  const ai = getAiClient();

  const systemInstruction = `You are the Lead Telugu News Editor and Senior Anchor Scriptwriter for "ప్రజా సంకేతం" (Praja Sanketam AI News Studio) - a premier Telugu television news network broadcasting across Telangana, Andhra Pradesh, and National regions.

Strict Journalistic Integrity Rules:
1. NEVER invent facts, unverified names, numbers, or fictitious events.
2. Rely strictly on the given input news context. If details are missing, state what is known accurately without embellishment.
3. Use high-impact, authentic Telugu television newsroom vocabulary (ఉదాహరణ: సంచలనం, తాజా సమాచారం, ఉత్కంఠ, కీలక పరిణామం, ప్రజా సంకేతం ప్రత్యేక కథనం, బ్రేకింగ్ అప్‌డేట్).
4. Strictly generate the 3-word thumbnail title in Telugu (మూడు పదాల థంబ్‌నైల్ టైటిల్) that is punchy, high-CTR, and exactly 3 Telugu words (e.g., "భారీ రాజకీయ ట్విస్ట్!", "కేబినెట్ సంచలన నిర్ణయం!", "తీవ్ర ఉద్రిక్తత.. ఏం జరిగింది?").
5. Format vertical hashtags one per line with relevant Telugu & English tags (#PrajaSanketam #ప్రజాసంకేతం #TelanganaNews #AndhraNews #BreakingNews).`;

  const prompt = `Process the following news item for Praja Sanketam News Studio:
News Category: ${input.category}
Tone: ${input.tone || 'breaking'}
Raw News Content:
"""
${input.rawNews}
"""

Generate a complete newsroom production package in JSON matching the exact schema.`;

  let lastError: any = null;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Gemini Service] Sending prompt to gemini-3.8-flash (attempt ${attempt}/${maxRetries})...`);
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headlineTelugu: {
                type: Type.STRING,
                description: 'Crisp, impactful main Telugu breaking news headline (10-15 words).',
              },
              headlineEnglish: {
                type: Type.STRING,
                description: 'English translation of the main headline.',
              },
              tickerLineTelugu: {
                type: Type.STRING,
                description: 'Fast-scrolling ticker text line in Telugu for the lower-third news ribbon.',
              },
              threeWordThumbnailTitle: {
                type: Type.STRING,
                description: 'Exactly 3 powerful Telugu words for YouTube/Facebook video thumbnail punchline.',
              },
              anchorScriptTelugu: {
                type: Type.STRING,
                description: 'Full Telugu TV anchor studio reading intro script with dramatic television pacing and broadcast opening.',
              },
              voiceoverScriptTelugu: {
                type: Type.STRING,
                description: 'Detailed Telugu voiceover narration script with audio cues for video editor [విజువల్స్: / పాజ్: / గ్రాఫిక్స్:].',
              },
              facebookDescription: {
                type: Type.STRING,
                description: 'Engaging Facebook & Social media post description with Telugu summary, key highlights, and call to action.',
              },
              verticalHashtags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Relevant hashtags formatted as vertical list items (#PrajaSanketam, etc.).',
              },
              bulletSummary: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 to 5 verified key factual takeaway points in Telugu.',
              },
              category: {
                type: Type.STRING,
                description: 'Assigned category.',
              },
              factCheckDisclaimer: {
                type: Type.STRING,
                description: 'A factual newsroom verification note.',
              },
            },
            required: [
              'headlineTelugu',
              'headlineEnglish',
              'tickerLineTelugu',
              'threeWordThumbnailTitle',
              'anchorScriptTelugu',
              'voiceoverScriptTelugu',
              'facebookDescription',
              'verticalHashtags',
              'bulletSummary',
            ],
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('Gemini API returned an empty response.');
      }

      const parsed: NewsGenerationResult = JSON.parse(text);
      return parsed;
    } catch (error: any) {
      lastError = error;
      const isTransient =
        error.message?.includes('503') ||
        error.message?.includes('UNAVAILABLE') ||
        error.message?.includes('429') ||
        error.message?.includes('RESOURCE_EXHAUSTED');

      if (isTransient && attempt < maxRetries) {
        const delay = attempt * 1500;
        console.warn(`[Gemini Service] Transient error (${error.message}). Retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      break;
    }
  }

  console.error('[Gemini Service] Error generating news package after retries:', lastError);
  throw lastError;
}
