import { getXOAuthConfig, verifyAndDecodeOAuthState, saveOAuthSession, type XOAuthSession } from '../../server/oauthHelper.js';
import { getMonitoredSources, saveMonitoredSources, MonitoredSource, addAutomationLog } from '../../server/xAutomationService.js';

export const handler = async (event: any) => {
  const query = event.queryStringParameters || {};
  const code = query.code;
  const state = query.state;
  const error = query.error;
  const errorDescription = query.error_description;

  const htmlHeaders: Record<string, string> = {
    'Content-Type': 'text/html; charset=utf-8',
  };

  if (error) {
    const safeError = String(errorDescription || error).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return {
      statusCode: 400,
      headers: htmlHeaders,
      body: `<!DOCTYPE html>
<html>
  <head>
    <title>AS - X Authorization Denied</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #070a13; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
      .card { background: #0f1624; border: 1px solid #ef4444; padding: 32px; border-radius: 16px; text-align: center; max-width: 440px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
      h2 { color: #ef4444; margin-top: 0; }
      p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
      .btn { background: #334155; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; margin-top: 16px; font-weight: 600; }
    </style>
  </head>
  <body>
    <div class="card">
      <h2>✕ X Authorization Denied</h2>
      <p>${safeError}</p>
      <button class="btn" onclick="window.close()">Close Window</button>
    </div>
    <script>
      if (window.opener) {
        window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', service: 'x', error: ${JSON.stringify(safeError)} }, '*');
      }
    </script>
  </body>
</html>`,
    };
  }

  if (!code) {
    return {
      statusCode: 400,
      headers: htmlHeaders,
      body: `<h3>Authorization code is missing from X callback.</h3><button onclick="window.close()">Close</button>`,
    };
  }

  try {
    const xConfig = getXOAuthConfig({ headers: event.headers });

    // Validate signed state token & extract PKCE code_verifier
    let codeVerifier = '';
    if (state) {
      const statePayload = verifyAndDecodeOAuthState(String(state));
      if (statePayload && statePayload.codeVerifier) {
        codeVerifier = statePayload.codeVerifier;
      }
    }

    if (!codeVerifier) {
      return {
        statusCode: 400,
        headers: htmlHeaders,
        body: `<!DOCTYPE html>
<html>
  <body style="font-family:sans-serif;background:#070a13;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;">
    <div style="background:#0f1624;padding:28px;border-radius:12px;border:1px solid #ef4444;text-align:center;max-width:440px;">
      <h3 style="color:#ef4444;">PKCE Verification Failed</h3>
      <p style="color:#94a3b8;font-size:14px;">OAuth state was invalid or expired. Please restart the login process.</p>
      <button onclick="window.close()" style="background:#334155;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;">Close</button>
    </div>
  </body>
</html>`,
      };
    }

    // Exchange authorization code for token with X API v2
    const tokenParams = new URLSearchParams({
      code: String(code),
      grant_type: 'authorization_code',
      client_id: xConfig.clientId,
      redirect_uri: xConfig.redirectUri,
      code_verifier: codeVerifier,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (xConfig.clientSecret) {
      headers['Authorization'] = `Basic ${Buffer.from(`${xConfig.clientId}:${xConfig.clientSecret}`).toString('base64')}`;
    }

    const tokenResp = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers,
      body: tokenParams.toString(),
    });

    const tokenData = await tokenResp.json();

    if (!tokenResp.ok || tokenData.error) {
      const errMsg = tokenData.error_description || tokenData.error || 'Token exchange failed with Twitter API';
      const safeErrMsg = String(errMsg).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return {
        statusCode: 400,
        headers: htmlHeaders,
        body: `<!DOCTYPE html>
<html>
  <body style="font-family:sans-serif;background:#070a13;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;">
    <div style="background:#0f1624;padding:28px;border-radius:12px;border:1px solid #ef4444;text-align:center;max-width:440px;">
      <h3 style="color:#ef4444;">Token Exchange Failed</h3>
      <p style="color:#94a3b8;font-size:14px;">${safeErrMsg}</p>
      <button onclick="window.close()" style="background:#334155;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;">Close</button>
    </div>
    <script>
      if (window.opener) {
        window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', service: 'x', error: ${JSON.stringify(safeErrMsg)} }, '*');
      }
    </script>
  </body>
</html>`,
      };
    }

    // Retrieve authenticated user's real profile
    let username = 'AuthenticatedUser';
    let name = 'X Connected Account';
    let profileImageUrl = '';
    let followersCount = 0;
    let followingCount = 0;
    let userId = '';

    try {
      const userResp = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,description,public_metrics,verified', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (userResp.ok) {
        const userData = await userResp.json();
        if (userData.data) {
          userId = userData.data.id;
          username = userData.data.username;
          name = userData.data.name;
          profileImageUrl = userData.data.profile_image_url || '';
          followersCount = userData.data.public_metrics?.followers_count || 0;
          followingCount = userData.data.public_metrics?.following_count || 0;
        }
      }
    } catch (uErr) {
      console.warn('[Netlify Function] Could not fetch user profile details:', uErr);
    }

    // Automatically sync accounts the user follows via Twitter API v2
    if (userId) {
      try {
        const followingResp = await fetch(
          `https://api.twitter.com/2/users/${userId}/following?max_results=50&user.fields=profile_image_url,description,public_metrics,verified`,
          { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
        );
        if (followingResp.ok) {
          const followingData = await followingResp.json();
          const followedUsers = followingData.data || [];
          const existingSources = getMonitoredSources();
          let addedCount = 0;

          for (const u of followedUsers) {
            const exists = existingSources.find((s) => s.handle.toLowerCase() === u.username.toLowerCase());
            if (!exists) {
              const newSrc: MonitoredSource = {
                id: `src-follow-${u.id}`,
                handle: u.username,
                name: u.name,
                avatarUrl: u.profile_image_url,
                profileUrl: `https://x.com/${u.username}`,
                category: 'Telangana',
                sourceType: 'following',
                isActive: true,
                isExcluded: false,
                postsCollectedCount: 0,
                addedAt: new Date().toISOString(),
                description: u.description || `Followed by @${username}`,
                isVerified: Boolean(u.verified),
              };
              existingSources.push(newSrc);
              addedCount++;
            }
          }
          if (addedCount > 0) {
            saveMonitoredSources(existingSources);
            addAutomationLog('info', 'following_sync', `Imported ${addedCount} followed accounts from authenticated X profile @${username}.`);
          }
        }
      } catch (fErr) {
        console.warn('[Netlify Function] Following sync error:', fErr);
      }
    }

    // Save session in serverless persistent storage and generate cryptographically signed session token
    const verifiedSession: XOAuthSession = {
      isConnected: true,
      id: userId,
      username,
      name,
      profileImageUrl,
      followersCount,
      followingCount,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiresAt: Date.now() + (tokenData.expires_in || 7200) * 1000,
      connectedAt: new Date().toISOString(),
    };
    const sessionToken = saveOAuthSession(verifiedSession);

    const safeUsername = String(username).replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Attach Set-Cookie so subsequent Lambda invocations inherit the session automatically
    htmlHeaders['Set-Cookie'] = `x_oauth_session=${encodeURIComponent(sessionToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`;

    return {
      statusCode: 200,
      headers: htmlHeaders,
      body: `<!DOCTYPE html>
<html>
  <head>
    <title>AS - X Account Connected</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #070a13; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
      .card { background: #0f1624; border: 1px solid #10b981; padding: 32px; border-radius: 16px; text-align: center; max-width: 440px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
      h2 { color: #10b981; margin-top: 0; }
      p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
      .badge { display: inline-block; background: #064e3b; color: #34d399; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-top: 8px; }
    </style>
  </head>
  <body>
    <div class="card">
      <h2>✓ X Account Connected</h2>
      <p>Authenticated as <strong>@${safeUsername}</strong>.</p>
      <div class="badge">TOKEN ACTIVE &amp; VERIFIED</div>
      <p style="margin-top:16px;">Syncing sources with AS Video Submitter...</p>
    </div>
    <script>
      try {
        if (window.opener) {
          window.opener.postMessage({
            type: 'OAUTH_AUTH_SUCCESS',
            service: 'x',
            sessionToken: ${JSON.stringify(sessionToken)},
            username: ${JSON.stringify(safeUsername)},
            name: ${JSON.stringify(name)},
            profileImageUrl: ${JSON.stringify(profileImageUrl)},
            followersCount: ${followersCount},
            followingCount: ${followingCount}
          }, '*');
          setTimeout(() => { window.close(); }, 1200);
        } else {
          window.location.href = '/?x_auth_token=' + encodeURIComponent(${JSON.stringify(sessionToken)}) + '&x_connected=1';
        }
      } catch (e) {
        window.close();
      }
    </script>
  </body>
</html>`,
    };
  } catch (err: any) {
    const safeError = String(err.message || 'Server error during X authorization').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return {
      statusCode: 500,
      headers: htmlHeaders,
      body: `<h3>Server Error</h3><p>${safeError}</p>`,
    };
  }
};
