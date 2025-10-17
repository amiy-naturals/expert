import type { Response } from 'express';

export function sendError(res: Response, err: any, status = 500) {
  try {
    if (err instanceof Error) {
      return res.status(status).json({ error: err.message });
    }
    if (err && typeof err === 'object') {
      // Return the error object directly so clients get structured info
      return res.status(status).json({ error: err });
    }
    return res.status(status).json({ error: String(err) });
  } catch (e) {
    return res.status(status).json({ error: String(err) });
  }
}
