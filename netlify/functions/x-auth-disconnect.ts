import { saveOAuthSession } from '../../server/oauthHelper.js';

export const handler = async (event: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
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
