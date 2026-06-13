import type { VercelRequest, VercelResponse } from '@vercel/node';
import { app, ensureDbReady } from '../backend/src/server';

// Ensure database is initialized before handling any request
export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureDbReady();
  // Delegate to Express
  return app(req as any, res as any);
}
