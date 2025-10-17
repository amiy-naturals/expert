import type { Response } from 'express';

export function sendError(res: Response, err: any, status = 500) {
  try {
    // Detect Postgres permission denied
    const code = err?.code || err?.statusCode || err?.status;
    const msg = err?.message || err?.error || String(err);
    if (code === '42501' || /permission denied/i.test(msg)) {
      // Don't leak DB internals; provide actionable guidance
      return res.status(500).json({ error: 'Database permission denied (42501). Ensure the server is using a Supabase service role key with proper grants.' });
    }

    if (err instanceof Error) {
      return res.status(status).json({ error: err.message });
    }
    if (err && typeof err === 'object') {
      return res.status(status).json({ error: err });
    }
    return res.status(status).json({ error: String(err) });
  } catch (e) {
    return res.status(status).json({ error: String(err) });
  }
}
