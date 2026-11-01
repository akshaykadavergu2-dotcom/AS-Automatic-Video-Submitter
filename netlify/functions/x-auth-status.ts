import { getOAuthSession, getXOAuthConfig } from '../../server/oauthHelper.js';

export const handler = async (event: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-OAuth-Session, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const session = getOAuthSession(event);
    const xConfig = getXOAuthConfig({ headers: event.headers });

    const isTokenExpired = session.tokenExpiresAt ? Date.now() > session.tokenExpiresAt : false;
    const isReallyConnected = Boolean(session.isConnected && session.username && !isTokenExpired);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        isConnected: isReallyConnected,
        authenticated: isReallyConnected,
        isConfigured: xConfig.isConfigured,
        status: isReallyConnected
          ? 'TOKEN ACTIVE (VERIFIED)'
          : isTokenExpired
          ? 'TOKEN EXPIRED'
          : 'NOT CONFIGURED',
        username: isReallyConnected ? session.username : null,
        name: isReallyConnected ? session.name : null,
        profileImageUrl: isReallyConnected ? session.profileImageUrl : null,
        followersCount: isReallyConnected ? session.followersCount : null,
        followingCount: isReallyConnected ? session.followingCount : null,
        connectedAt: isReallyConnected ? session.connectedAt : null,
        clientIdConfigured: xConfig.isConfigured,
      }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Failed to get X auth status' }),
    };
  }
};
