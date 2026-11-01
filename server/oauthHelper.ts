import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getSettings, getDataDir } from './storage.js';

export function cleanEnv(val?: string | null): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

const OAUTH_SECRET =
  cleanEnv(process.env.OAUTH_SECRET) ||
  cleanEnv(process.env.SESSION_SECRET) ||
  cleanEnv(process.env.X_CLIENT_SECRET) ||
  'as-praja-sanketam-oauth-secret-key-v1';

export interface XOAuthSession {
  isConnected: boolean;
  id?: string;
  username?: string;
  name?: string;
  profileImageUrl?: string;
  followersCount?: number;
  followingCount?: number;
  tokenExpiresAt?: number;
  connectedAt?: string;
  accessToken?: string;
  refreshToken?: string;
  codeVerifier?: string;
}

let inMemorySession: XOAuthSession | null = null;

/**
 * Creates a tamper-proof cryptographically signed token containing session info.
 * This ensures the authenticated state can be persisted across stateless Netlify serverless Lambdas.
 */
export function encodeSessionToken(session: XOAuthSession): string {
  const json = JSON.stringify(session);
  const data = Buffer.from(json).toString('base64url');
  const hmac = crypto.createHmac('sha256', OAUTH_SECRET).update(data).digest('base64url');
  return `${data}.${hmac}`;
}

/**
 * Decodes and verifies a signed session token.
 */
export function decodeSessionToken(token: string): XOAuthSession | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [data, hmac] = parts;
    const expectedHmac = crypto.createHmac('sha256', OAUTH_SECRET).update(data).digest('base64url');
    if (hmac !== expectedHmac) return null;
    const json = Buffer.from(data, 'base64url').toString('utf-8');
    const session: XOAuthSession = JSON.parse(json);
    if (session.tokenExpiresAt && Date.now() > session.tokenExpiresAt) {
      return { ...session, isConnected: false };
    }
    return session;
  } catch (e) {
    return null;
  }
}

/**
 * Extracts a session token from request headers or cookies across Express or Netlify event objects.
 */
export function extractSessionToken(reqOrEvent?: any): string | null {
  if (!reqOrEvent) return null;

  const headers = reqOrEvent.headers || {};
  const headerToken =
    headers['x-oauth-session'] ||
    headers['X-OAuth-Session'] ||
    (reqOrEvent.get ? reqOrEvent.get('x-oauth-session') : undefined);
  if (headerToken && typeof headerToken === 'string') {
    return headerToken.trim();
  }

  const cookieHeader =
    headers['cookie'] ||
    headers['Cookie'] ||
    (reqOrEvent.get ? reqOrEvent.get('cookie') : undefined);
  if (cookieHeader && typeof cookieHeader === 'string') {
    const match = cookieHeader.match(/x_oauth_session=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]).trim();
    }
  }

  if (reqOrEvent.cookies?.x_oauth_session) {
    return String(reqOrEvent.cookies.x_oauth_session).trim();
  }

  return null;
}

export function getOAuthSession(reqOrEvent?: any): XOAuthSession {
  // 1. Try extracting from request header or cookie
  const token = extractSessionToken(reqOrEvent);
  if (token) {
    const decoded = decodeSessionToken(token);
    if (decoded && decoded.isConnected && decoded.username) {
      inMemorySession = decoded;
      // Sync to disk if not exists on this container
      try {
        const file = path.join(getDataDir(), 'connected_accounts.json');
        if (!fs.existsSync(file)) {
          fs.writeFileSync(file, JSON.stringify(decoded, null, 2), 'utf-8');
        }
      } catch (_) {}
      return decoded;
    }
  }

  // 2. Try in-memory cached session
  if (inMemorySession && inMemorySession.isConnected) {
    return inMemorySession;
  }

  // 3. Fallback to reading from connected_accounts.json on disk
  try {
    const file = path.join(getDataDir(), 'connected_accounts.json');
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
      if (data && typeof data === 'object') {
        inMemorySession = data;
        return data;
      }
    }
  } catch (e) {
    // ignore
  }
  return { isConnected: false };
}

export function saveOAuthSession(session: XOAuthSession): string {
  inMemorySession = session;
  try {
    const file = path.join(getDataDir(), 'connected_accounts.json');
    fs.writeFileSync(file, JSON.stringify(session, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[X Automation] Failed to save OAuth session:', e);
  }
  return encodeSessionToken(session);
}

export interface OAuthStatePayload {
  service: 'x' | 'facebook';
  codeVerifier?: string;
  timestamp: number;
  origin?: string;
  csrfToken: string;
}

/**
 * Resolves the application URL dynamically.
 * Prioritizes:
 * 1. process.env.APP_URL (Explicit override)
 * 2. process.env.URL (Netlify default production site URL, e.g. https://as-automatic-video-submitter.netlify.app)
 * 3. process.env.DEPLOY_URL (Netlify deploy specific URL)
 * 4. Request headers (x-forwarded-host / host + x-forwarded-proto / proto)
 * 5. Fallback production URL
 */
export function resolveAppUrl(req?: any): string {
  const envAppUrl = cleanEnv(process.env.APP_URL);
  if (envAppUrl) {
    return envAppUrl.replace(/\/$/, '');
  }
  const netlifyUrl = cleanEnv(process.env.URL);
  if (netlifyUrl) {
    return netlifyUrl.replace(/\/$/, '');
  }
  const deployUrl = cleanEnv(process.env.DEPLOY_URL);
  if (deployUrl) {
    return deployUrl.replace(/\/$/, '');
  }
  if (req) {
    const headers = req.headers || {};
    const forwardedHost = headers['x-forwarded-host'] || (req.get ? req.get('x-forwarded-host') : undefined);
    const host = forwardedHost || headers['host'] || (req.get ? req.get('host') : undefined);
    if (host) {
      const forwardedProto = headers['x-forwarded-proto'] || (req.get ? req.get('x-forwarded-proto') : undefined);
      const proto = forwardedProto || (req.secure ? 'https' : 'http');
      return `${proto}://${host}`;
    }
  }
  return 'https://as-automatic-video-submitter.netlify.app';
}

/**
 * Generates RFC 7636 compliant PKCE code verifier (base64url) and S256 code challenge
 */
export function generatePKCE() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256' as const,
  };
}

/**
 * Creates a signed, tamper-proof, stateless OAuth state token.
 * Contains code_verifier for PKCE, timestamp, origin and CSRF token.
 * Guarantees zero reliance on shared filesystem or sticky sessions across serverless Lambdas/Netlify Functions.
 */
export function generateOAuthState(payload: Omit<OAuthStatePayload, 'csrfToken'>): string {
  const fullPayload: OAuthStatePayload = {
    ...payload,
    csrfToken: crypto.randomBytes(12).toString('hex'),
  };
  const json = JSON.stringify(fullPayload);
  const data = Buffer.from(json).toString('base64url');
  const hmac = crypto.createHmac('sha256', OAUTH_SECRET).update(data).digest('base64url');
  return `${data}.${hmac}`;
}

/**
 * Validates and decodes a signed OAuth state token.
 * Rejects expired tokens (> 30 minutes) or tokens with invalid signatures.
 */
export function verifyAndDecodeOAuthState(stateStr: string): OAuthStatePayload | null {
  try {
    if (!stateStr || typeof stateStr !== 'string') return null;
    const parts = stateStr.split('.');
    if (parts.length !== 2) return null;
    const [data, hmac] = parts;
    const expectedHmac = crypto.createHmac('sha256', OAUTH_SECRET).update(data).digest('base64url');
    if (hmac !== expectedHmac) {
      console.warn('[OAuth] State HMAC signature mismatch: potential CSRF attack or invalid secret');
      return null;
    }
    const json = Buffer.from(data, 'base64url').toString('utf-8');
    const payload: OAuthStatePayload = JSON.parse(json);
    // Expire state after 30 minutes
    if (Date.now() - payload.timestamp > 30 * 60 * 1000) {
      console.warn('[OAuth] State has expired (>30 minutes old)');
      return null;
    }
    return payload;
  } catch (e) {
    console.error('[OAuth] Failed to decode state token:', e);
    return null;
  }
}

/**
 * Retrieves normalized X (Twitter) OAuth 2.0 configuration.
 */
export function getXOAuthConfig(req?: any) {
  let settingsConfig = { apiKey: '', apiSecret: '' };
  try {
    const s = getSettings();
    if (s?.xConfig) settingsConfig = s.xConfig;
  } catch (_) {}

  const clientId =
    cleanEnv(process.env.X_CLIENT_ID) ||
    cleanEnv(process.env.TWITTER_CLIENT_ID) ||
    cleanEnv(settingsConfig.apiKey) ||
    '';

  const clientSecret =
    cleanEnv(process.env.X_CLIENT_SECRET) ||
    cleanEnv(process.env.TWITTER_CLIENT_SECRET) ||
    cleanEnv(settingsConfig.apiSecret) ||
    '';

  const appUrl = resolveAppUrl(req);

  const redirectUri =
    cleanEnv(process.env.X_REDIRECT_URI) ||
    cleanEnv(process.env.TWITTER_REDIRECT_URI) ||
    `${appUrl}/auth/callback`;

  // Required scopes: users.read, tweet.read, follows.read, offline.access
  const scopes =
    cleanEnv(process.env.X_SCOPES) ||
    'users.read tweet.read follows.read offline.access';

  return {
    clientId,
    clientSecret,
    redirectUri,
    scopes,
    appUrl,
    isConfigured: Boolean(clientId),
    isClientSecretConfigured: Boolean(clientSecret),
  };
}

/**
 * Retrieves normalized Meta Facebook OAuth configuration.
 */
export function getMetaOAuthConfig(req?: any) {
  let settingsConfig = { appId: '', appSecret: '' };
  try {
    const s = getSettings();
    if (s?.metaConfig) settingsConfig = s.metaConfig;
  } catch (_) {}

  const appId =
    cleanEnv(process.env.META_APP_ID) ||
    cleanEnv(process.env.FACEBOOK_APP_ID) ||
    cleanEnv(settingsConfig.appId) ||
    '';

  const appSecret =
    cleanEnv(process.env.META_APP_SECRET) ||
    cleanEnv(process.env.FACEBOOK_APP_SECRET) ||
    cleanEnv(settingsConfig.appSecret) ||
    '';

  const appUrl = resolveAppUrl(req);

  const redirectUri =
    cleanEnv(process.env.META_REDIRECT_URI) ||
    cleanEnv(process.env.FACEBOOK_REDIRECT_URI) ||
    `${appUrl}/auth/facebook/callback`;

  const graphVersion =
    cleanEnv(process.env.META_GRAPH_API_VERSION) ||
    'v21.0';

  const scopes =
    cleanEnv(process.env.META_SCOPES) ||
    'pages_manage_posts,pages_read_engagement,pages_show_list,publish_video';

  return {
    appId,
    appSecret,
    redirectUri,
    graphVersion,
    scopes,
    appUrl,
    isConfigured: Boolean(appId),
    isSecretConfigured: Boolean(appSecret),
  };
}
