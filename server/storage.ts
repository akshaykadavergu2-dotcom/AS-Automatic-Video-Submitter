import fs from 'fs';
import path from 'path';

export interface NewsDraft {
  id: string;
  createdAt: string;
  updatedAt: string;
  category: 'Politics' | 'Telangana' | 'Andhra Pradesh' | 'National' | 'Breaking News' | 'Local News';
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

export interface StudioSettings {
  channelName: string;
  channelNameTelugu: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  tickerSpeed: number; // seconds to scroll
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

const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const RENDERS_DIR = path.resolve(process.cwd(), 'uploads/renders');

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  if (!fs.existsSync(RENDERS_DIR)) fs.mkdirSync(RENDERS_DIR, { recursive: true });
}

const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const DRAFTS_FILE = path.join(DATA_DIR, 'drafts.json');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');

const defaultSettings: StudioSettings = {
  channelName: 'PRAJA SANKETAM AI NEWS STUDIO',
  channelNameTelugu: 'ప్రజా సంకేతం AI న్యూస్ స్టూడియో',
  tagline: 'ప్రజా పక్షం - నిష్పాక్షిక వార్తా విశ్లేషణ',
  primaryColor: '#dc2626', // Crimson red
  accentColor: '#f59e0b', // Gold amber
  tickerSpeed: 25,
  logoUrl: '/assets/praja_sanketam_logo.svg',
  landscapeFrameUrl: '/assets/frames/landscape_frame.svg',
  verticalFrameUrl: '/assets/frames/vertical_frame.svg',
  metaConfig: {
    isConfigured: false,
    appId: '',
    appSecret: '',
    pageId: '',
    pageName: '',
    pageAccessToken: '',
  },
  xConfig: {
    isConfigured: false,
    apiKey: '',
    apiSecret: '',
    bearerToken: '',
  },
  renderQuality: '1080p',
  fps: 30,
};

// Seed sample drafts so users immediately see a professional newsroom state
const sampleDrafts: NewsDraft[] = [
  {
    id: 'draft-ps-101',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    category: 'Telangana',
    rawNews: 'తెలంగాణలో కొత్త పారిశ్రామిక పాలసీకి కేబినెట్ ఆమోదం తెలిపింది. హైదరాబాద్ చుట్టూ భారీ ఎలక్ట్రానిక్స్ & ఫార్మా క్లస్టర్ల ఏర్పాటుకు నిర్ణయం తీసుకున్నారు. 50 వేల కొత్త ఉద్యోగాలు కల్పించడమే లక్ష్యమని ప్రభుత్వం ప్రకటించింది.',
    sourceUrl: 'https://telangana.gov.in',
    headlineTelugu: 'తెలంగాణలో సరికొత్త ఇండస్ట్రియల్ పాలసీకి మంత్రివర్గం ఆమోదం: 50 వేల ఉద్యోగాలే లక్ష్యం!',
    headlineEnglish: 'Telangana Cabinet Approves New Industrial Policy: Target 50,000 New Jobs!',
    tickerLineTelugu: 'బ్రేకింగ్: తెలంగాణ కేబినెట్ కీలక నిర్ణయాలు.. పరిశ్రమలకు ప్రోత్సాహకాలు, యువతకు భారీగా ఉపాధి అవకాశాలు..',
    threeWordThumbnailTitle: 'కేబినెట్ సంచలన నిర్ణయం!',
    anchorScriptTelugu: 'నమస్కారం.. ప్రజా సంకేతం బ్రేకింగ్ న్యూస్‌కు స్వాగతం. తెలంగాణలో నిరుద్యోగ యువతకు మరియు పారిశ్రామిక వేత్తలకు రాష్ట్ర ప్రభుత్వం భారీ శుభవార్త అందించింది. నేడు జరిగిన మంత్రివర్గ సమావేశంలో సరికొత్త ఇండస్ట్రియల్ పాలసీకి ఆమోద ముద్ర వేశారు.',
    voiceoverScriptTelugu: '[విజువల్స్: సెక్రటేరియట్ భవనం & కేబినెట్ ప్రెస్ మీట్] హైదరాబాద్ చుట్టూ ప్రపంచ స్థాయి మౌలిక వసతులతో కూడిన ఎలక్ట్రానిక్స్ మరియు ఫార్మా క్లస్టర్లు రాబోతున్నాయి. [పాజ్ 2 సెకన్లు] [గ్రాఫిక్స్: ఉద్యోగాల గణాంకాలు] రానున్న మూడేళ్లలో దాదాపు 50,000 ప్రత్యక్ష ఉపాధి అవకాశాలు లభించనున్నాయి.',
    facebookDescription: '🔴 PRAJA SANKETAM EXCLUSIVE | తెలంగాణ కేబినెట్ సంచలన నిర్ణయం! రాష్ట్రంలో సరికొత్త పారిశ్రామిక పాలసీ అమల్లోకి రానుంది.\n\nప్రధానాంశాలు:\n• 50,000 కొత్త ఉద్యోగాల సృష్టి లక్ష్యం\n• ఎలక్ట్రానిక్స్ & ఫార్మా క్లస్టర్ల విస్తరణ\n• పరిశ్రమలకు భారీ ప్రోత్సాహకాలు\n\nపూర్తి వివరాలు మన ప్రజా సంకేతం న్యూస్‌లో చూడండి.',
    verticalHashtags: [
      '#PrajaSanketam',
      '#TelanganaNews',
      '#TelanganaCabinet',
      '#HyderabadJobs',
      '#BreakingNewsTelugu',
      '#TeluguNewsUpdates',
    ],
    bulletSummary: [
      'కొత్త ఇండస్ట్రియల్ పాలసీకి కేబినెట్ ఆమోదం',
      'హైదరాబాద్ చుట్టూ ఫార్మా & ఎలక్ట్రానిక్స్ క్లస్టర్లు',
      '50,000 కొత్త ఉద్యోగాల సృష్టి లక్ష్యం',
      'మౌలిక సదుపాయాల కల్పనకు నిధులు కేటాయింపు',
    ],
    status: 'ai_generated',
  },
  {
    id: 'draft-ps-102',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    category: 'Andhra Pradesh',
    rawNews: 'ఆంధ్రప్రదేశ్ రాజధాని అమరావతిలో పనుల వేగం పెంచేందుకు సీఆర్డీఏ కీలక సమీక్ష నిర్వహించింది. ప్రధాన రహదారులు, ఐకానిక్ భవనాల నిర్మాణాలు పూర్తి చేసేందుకు టైమ్‌లైన్ ఖరారు చేశారు.',
    sourceUrl: 'https://crda.ap.gov.in',
    headlineTelugu: 'అమరావతి నిర్మాణ పనులపై సీఆర్డీఏ హైలెవల్ రివ్యూ: డెడ్‌లైన్ ఖరారు!',
    headlineEnglish: 'CRDA High-Level Review on Amaravati Construction Works: Deadlines Finalized',
    tickerLineTelugu: 'ఏపీ అప్‌డేట్స్: రాజధాని అమరావతిలో శరవేగంగా పనులు.. వచ్చే ఏడాది నాటికి ప్రధాన రోడ్లు పూర్తి..',
    threeWordThumbnailTitle: 'అమరావతి బిగ్ అప్‌డేట్!',
    anchorScriptTelugu: 'ప్రజా సంకేతం ఆంధ్రప్రదేశ్ స్పెషల్ బులెటిన్‌కు స్వాగతం. రాజధాని అమరావతి పనులకు సరికొత్త ఊపు లభించింది. సీఆర్డీఏ ఆధ్వర్యంలో జరిగిన కీలక సమీక్షలో నిర్మాణాల పురోగతిపై సమగ్ర ప్రణాళికను సిద్ధం చేశారు.',
    voiceoverScriptTelugu: '[విజువల్స్: అమరావతి డ్రోన్ షాట్స్] అమరావతిలో నిలిచిపోయిన నిర్మాణాలను వేగవంతం చేయాలని అధికారులకు స్పష్టమైన ఆదేశాలు అందాయి. [పాజ్] వచ్చే ఏడాది నాటికి ప్రభుత్వ కార్యాలయాలు, రహదారుల నిర్మాణం కొలిక్కి రానుంది.',
    facebookDescription: '📢 అమరావతి పనులపై తాజా సమాచారం! సీఆర్డీఏ కీలక ఆదేశాలు జారీ చేసింది. రాజధాని అభివృద్ధి కోసం యుద్ధప్రాతిపదికన చర్యలు.',
    verticalHashtags: [
      '#Amaravati',
      '#APNews',
      '#PrajaSanketam',
      '#AndhraPradesh',
      '#BreakingNews',
    ],
    bulletSummary: [
      'అమరావతి అభివృద్ధి పనులపై సీఆర్డీఏ విస్తృత సమీక్ష',
      'ప్రధాన రహదారుల పూర్తికి డెడ్‌లైన్లు నిర్ధారణ',
      'ప్రభుత్వ భవన సముదాయాల వేగవంత నిర్మాణం',
    ],
    status: 'draft',
  },
];

export function getSettings(): StudioSettings {
  ensureDirectories();
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return { ...defaultSettings, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Error reading settings file:', e);
  }
  return defaultSettings;
}

export function saveSettings(settings: Partial<StudioSettings>): StudioSettings {
  ensureDirectories();
  const current = getSettings();
  const updated = { ...current, ...settings };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

export function getDrafts(): NewsDraft[] {
  ensureDirectories();
  try {
    if (fs.existsSync(DRAFTS_FILE)) {
      const data = fs.readFileSync(DRAFTS_FILE, 'utf-8');
      return JSON.parse(data);
    } else {
      fs.writeFileSync(DRAFTS_FILE, JSON.stringify(sampleDrafts, null, 2), 'utf-8');
      return sampleDrafts;
    }
  } catch (e) {
    console.error('Error reading drafts file:', e);
    return sampleDrafts;
  }
}

export function saveDraft(draft: NewsDraft): NewsDraft {
  ensureDirectories();
  const drafts = getDrafts();
  const index = drafts.findIndex((d) => d.id === draft.id);
  if (index >= 0) {
    drafts[index] = { ...draft, updatedAt: new Date().toISOString() };
  } else {
    drafts.unshift(draft);
  }
  fs.writeFileSync(DRAFTS_FILE, JSON.stringify(drafts, null, 2), 'utf-8');
  return draft;
}

export function deleteDraft(id: string): boolean {
  ensureDirectories();
  const drafts = getDrafts();
  const filtered = drafts.filter((d) => d.id !== id);
  if (filtered.length !== drafts.length) {
    fs.writeFileSync(DRAFTS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    return true;
  }
  return false;
}

export function getJobs(): VideoRenderJob[] {
  ensureDirectories();
  try {
    if (fs.existsSync(JOBS_FILE)) {
      const data = fs.readFileSync(JOBS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading jobs file:', e);
  }
  return [];
}

export function saveJob(job: VideoRenderJob): VideoRenderJob {
  ensureDirectories();
  const jobs = getJobs();
  const index = jobs.findIndex((j) => j.id === job.id);
  if (index >= 0) {
    jobs[index] = job;
  } else {
    jobs.unshift(job);
  }
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2), 'utf-8');
  return job;
}
