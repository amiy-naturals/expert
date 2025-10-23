import { Router, RequestHandler } from 'express';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';

const router = Router();

function base64UrlEncode(input: string | Buffer) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwt(payload: Record<string, any>, secret: string, expiresInSeconds = 60 * 60 * 24) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { iat: now, exp: now + expiresInSeconds, ...payload };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const bodyB64 = base64UrlEncode(JSON.stringify(body));
  const toSign = `${headerB64}.${bodyB64}`;
  const signature = crypto.createHmac('sha256', secret).update(toSign).digest('base64');
  const signatureB64 = signature.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${toSign}.${signatureB64}`;
}

// POST /api/auth/google - Google OAuth verification
const handleGoogleAuth: RequestHandler = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    res.status(400).json({ message: 'Missing credential' });
    return;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    res.status(500).json({ message: 'Google client ID not configured on server' });
    return;
  }

  try {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();

    if (!payload) {
      res.status(401).json({ message: 'Invalid token payload' });
      return;
    }

    if (!payload.email_verified) {
      res.status(401).json({ message: 'Email not verified by Google' });
      return;
    }

    const user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      issuer: payload.iss,
    };

    // Sign a simple JWT for the application using SUPABASE_JWT_SECRET or fallback
    const secret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || process.env.TEST_PASSWORD || 'dev_secret';
    const token = signJwt({ sub: user.id, email: user.email }, secret, 60 * 60 * 24 * 7); // 7 days

    // NOTE: In production you should persist the user in your DB and issue a proper session
    res.json({ user, token });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ message: 'Invalid token' });
  }
};

router.post('/google', handleGoogleAuth);

// GET /api/auth/callback?access_token=...&refresh_token=...&redirect=/
router.get('/callback', (req, res) => {
  const access = String(req.query.access_token ?? '');
  const refresh = String(req.query.refresh_token ?? '');
  const error = String(req.query.error_description ?? req.query.error ?? '');
  const redirectTo = String(req.query.redirect ?? '/');

  if (!access && !error) {
    res.status(400).send('Missing access_token');
    return;
  }

  if (error) {
    const escaped = JSON.stringify(error);
    const redirect = JSON.stringify(redirectTo);
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Auth Error</title></head><body><script>/* eslint-disable */(function(){
      const msg = ${escaped};
      alert('Authentication error: ' + msg);
      window.location.replace(${redirect});
    })();</script></body></html>`;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
    return;
  }

  const redirect = JSON.stringify(redirectTo);
  const a = JSON.stringify(access);
  const r = JSON.stringify(refresh);

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Auth Callback</title></head><body><script>/* eslint-disable */(function(){
    const access = ${a};
    const refresh = ${r};
    const redirectTo = ${redirect};
    const hash = '#access_token=' + encodeURIComponent(access) + '&refresh_token=' + encodeURIComponent(refresh);
    // Replace location with tokens in hash so the SPA can process and set session
    window.location.replace(redirectTo + hash);
  })();</script></body></html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// POST /api/auth/callback with JSON { access_token, refresh_token, redirect }
router.post('/callback', (req, res) => {
  const access = String(req.body.access_token ?? '');
  const refresh = String(req.body.refresh_token ?? '');
  const redirectTo = String(req.body.redirect ?? '/');

  if (!access) {
    res.status(400).json({ error: 'missing access_token' });
    return;
  }

  const redirect = JSON.stringify(redirectTo);
  const a = JSON.stringify(access);
  const r = JSON.stringify(refresh);

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Auth Callback</title></head><body><script>/* eslint-disable */(function(){
    const access = ${a};
    const refresh = ${r};
    const redirectTo = ${redirect};
    const hash = '#access_token=' + encodeURIComponent(access) + '&refresh_token=' + encodeURIComponent(refresh);
    window.location.replace(redirectTo + hash);
  })();</script></body></html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export default router;
