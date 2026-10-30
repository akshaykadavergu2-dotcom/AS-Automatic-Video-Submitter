import crypto from 'crypto';
import { getSettings } from './storage.js';

const OAUTH_SECRET =
  process.env.OAUTH_SECRET ||
  process.env.SESSION_SECRET ||
  'as-praja-sanketam-oauth-secret-key-v1';

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
 * 3. Request headers (x-forwarded-host / host + x-forwarded-proto / proto)
 * 4. Fallback production URL
 */
export function resolveAppUrl(req?: any): string {
  if (process.env.APP_URL && process.env.APP_URL.trim() !== '') {
    return process.env.APP_URL.trim().replace(/\/$/, '');
  }
  if (process.env.URL && process.env.URL.trim() !== '') {
    return process.env.URL.trim().replace(/\/$/, '');
  }
  if (process.env.DEPLOY_URL && process.env.DEPLOY_URL.trim() !== '') {
    return process.env.DEPLOY_URL.trim().replace(/\/$/, '');
  }
  if (req) {
    const forwardedHost = req.headers?.['x-forwarded-host'] || (req.get ? req.get('x-forwarded-host') : undefined);
    const host = forwardedHost || req.headers?.host || (req.get ? req.get('host') : undefined);
    if (host) {
      const forwardedProto = req.headers?.['x-forwarded-proto'] || (req.get ? req.get('x-forwarded-proto') : undefined);
      const proto = forwardedProto || (req.secure ? 'https' : 'http');
      return `${proto}://${host}`;
    }
  }
  return 'https://as-automatic-video-submitter.netlify.app';
}

/**
 * Creates a signed, tamper-proof, stateless OAuth state token.
 * Contains code_verifier for PKCE, timestamp, origin and CSRF token.
 * This guarantees zero reliance on shared filesystem or sticky sessions across serverless Lambdas/Functions.
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
  const settings = getSettings();
  const clientId =
    process.env.X_CLIENT_ID ||
    process.env.TWITTER_CLIENT_ID ||
    settings.xConfig?.apiKey ||
    '';
  const clientSecret =
    process.env.X_CLIENT_SECRET ||
    process.env.TWITTER_CLIENT_SECRET ||
    settings.xConfig?.apiSecret ||
    '';
  const appUrl = resolveAppUrl(req);
  const redirectUri =
    process.env.X_REDIRECT_URI ||
    process.env.TWITTER_REDIRECT_URI ||
    `${appUrl}/auth/callback`;
  const scopes =
    process.env.X_SCOPES ||
    'tweet.read users.read follows.read offline.access';

  return {
    clientId: clientId.trim(),
    clientSecret: clientSecret.trim(),
    redirectUri: redirectUri.trim(),
    scopes: scopes.trim(),
    appUrl,
    isConfigured: Boolean(clientId.trim()),
    isClientSecretConfigured: Boolean(clientSecret.trim()),
  };
}

/**
 * Retrieves normalized Meta Facebook OAuth configuration.
 */
export function getMetaOAuthConfig(req?: any) {
  const settings = getSettings();
  const appId =
    process.env.META_APP_ID ||
    process.env.FACEBOOK_APP_ID ||
    settings.metaConfig?.appId ||
    '';
  const appSecret =
    process.env.META_APP_SECRET ||
    process.env.FACEBOOK_APP_SECRET ||
    settings.metaConfig?.appSecret ||
    '';
  const appUrl = resolveAppUrl(req);
  const redirectUri =
    process.env.META_REDIRECT_URI ||
    process.env.FACEBOOK_REDIRECT_URI ||
    `${appUrl}/auth/facebook/callback`;
  const graphVersion =
    process.env.META_GRAPH_API_VERSION ||
    'v21.0';
  const scopes =
    process.env.META_SCOPES ||
    'pages_manage_posts,pages_read_engagement,pages_show_list,publish_video';

  return {
    appId: appId.trim(),
    appSecret: appSecret.trim(),
    redirectUri: redirectUri.trim(),
    graphVersion: graphVersion.trim(),
    scopes: scopes.trim(),
    appUrl,
    isConfigured: Boolean(appId.trim()),
    isSecretConfigured: Boolean(appSecret.trim()),
  };
}
