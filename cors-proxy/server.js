/**
 * CORS proxy for Qdrant Cloud — Express version.
 * Deploy to Render.com free tier.
 *
 * Qdrant API key stays server-side (env var QDRANT_API_KEY).
 * Browser calls: POST https://your-app.onrender.com/{qdrant-path}
 */

import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

const QDRANT_URL = (process.env.QDRANT_URL || '').replace(/\/$/, '');
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || '';

// Parse JSON bodies
app.use(express.json());

// CORS headers on all responses
app.use((_, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Max-Age', '86400');
  next();
});

// Handle preflight
app.options('*', (_, res) => res.status(204).end());

// Health check
app.get('/', (_, res) => res.json({ status: 'ok', proxy: 'qdrant-cors' }));

// Proxy all other requests to Qdrant
app.all('*', async (req, res) => {
  if (!QDRANT_URL) {
    return res.status(500).json({ error: 'QDRANT_URL not configured' });
  }

  const target = QDRANT_URL + req.originalUrl;

  const headers = { 'Content-Type': 'application/json' };
  if (QDRANT_API_KEY) headers['api-key'] = QDRANT_API_KEY;

  try {
    const resp = await fetch(target, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
    });

    const data = await resp.text();
    res.status(resp.status).set('Content-Type', 'application/json').send(data);
  } catch (err) {
    res.status(502).json({ error: 'Proxy error', details: err.message });
  }
});

app.listen(PORT, () => console.log(`CORS proxy listening on ${PORT}`));
