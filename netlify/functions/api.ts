import serverless from 'serverless-http';
import { app } from '../../server/app.js';

const serverlessHandler = serverless(app);

export const handler = async (event: any, context: any) => {
  // Normalize path when invoked via Netlify function redirects
  // e.g. "/.netlify/functions/api/api/x-automation/auth/url" -> "/api/x-automation/auth/url"
  // e.g. "/.netlify/functions/api/auth/callback" -> "/auth/callback"
  if (event.path && event.path.startsWith('/.netlify/functions/api')) {
    event.path = event.path.replace('/.netlify/functions/api', '') || '/';
  }
  return serverlessHandler(event, context);
};
