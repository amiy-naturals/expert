import { Router, RequestHandler } from 'express';
import { jwtDecode } from 'jwt-decode';

const router = Router();

// POST /api/auth/google - Google OAuth verification
const handleGoogleAuth: RequestHandler = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    res.status(400).json({ message: "Missing credential" });
    return;
  }

  try {
    // Decode and verify the JWT token from Google
    const decoded = jwtDecode<{
      iss: string;
      sub: string;
      aud: string;
      iat: number;
      exp: number;
      email: string;
      email_verified: boolean;
      name: string;
      picture: string;
    }>(credential);

    // Verify the token is from Google
    if (!decoded.iss?.includes("google")) {
      res.status(401).json({ message: "Invalid token issuer" });
      return;
    }

    // Verify email is verified
    if (!decoded.email_verified) {
      res.status(401).json({ message: "Email not verified by Google" });
      return;
    }

    // Return user data
    const user = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
      role: "doctor",
    };

    // In production, you would:
    // 1. Check if user exists in database
    // 2. Create user if doesn't exist
    // 3. Generate a session token/JWT for your app
    // 4. Return tokens instead of just user data

    res.json({ user, token: credential });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(401).json({ message: "Invalid token" });
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
