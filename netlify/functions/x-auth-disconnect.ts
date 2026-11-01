import { saveOAuthSession } from '../../server/oauthHelper.js';

export const handler = async (event: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-OAuth-Session, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    'Set-Cookie': 'x_oauth_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    saveOAuthSession({ isConnected: false });
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'X account disconnected.' }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: err.message || 'Failed to disconnect X account' }),
    };
  }
};
