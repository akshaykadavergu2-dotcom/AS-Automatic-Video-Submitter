import { getXOAuthConfig, generatePKCE, generateOAuthState } from '../../server/oauthHelper.js';

export const handler = async (event: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const xConfig = getXOAuthConfig({ headers: event.headers });

    if (!xConfig.isConfigured) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          isConfigured: false,
          url: null,
          redirectUri: xConfig.redirectUri,
          error: 'X Client ID (X_CLIENT_ID) is not configured in Netlify environment variables.',
          missingConfig: ['X_CLIENT_ID'],
          instructions: `In Netlify Site configuration > Environment variables, add X_CLIENT_ID. In X Developer Portal (developer.x.com), set Redirect URI to: ${xConfig.redirectUri}`,
        }),
      };
    }

    const { codeVerifier, codeChallenge, codeChallengeMethod } = generatePKCE();

    // Stateless signed token containing codeVerifier and timestamp
    const state = generateOAuthState({
      service: 'x',
      codeVerifier,
      timestamp: Date.now(),
      origin: xConfig.appUrl,
    });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: xConfig.clientId,
      redirect_uri: xConfig.redirectUri,
      scope: xConfig.scopes,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: codeChallengeMethod,
    });

    const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        isConfigured: true,
        url: authUrl,
        redirectUri: xConfig.redirectUri,
        clientIdMasked: xConfig.clientId.slice(0, 4) + '••••' + xConfig.clientId.slice(-4),
        scopes: xConfig.scopes,
      }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: err.message || 'Server error generating X auth URL' }),
    };
  }
};
