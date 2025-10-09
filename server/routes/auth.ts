import { Router } from 'express';

const router = Router();

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
