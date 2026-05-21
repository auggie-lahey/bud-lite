/**
 * CORS proxy for Qdrant Cloud — Deno Deploy version.
 * Deploy at https://dash.deno.com
 *
 * Set env vars in Deno Deploy dashboard:
 *   QDRANT_URL, QDRANT_API_KEY
 */

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const url = new URL(req.url);
  const qdrantBase = (Deno.env.get('QDRANT_URL') || '').replace(/\/$/, '');
  const apiKey = Deno.env.get('QDRANT_API_KEY') || '';

  if (!qdrantBase) {
    return new Response(JSON.stringify({ error: 'QDRANT_URL not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // Health check
  if (url.pathname === '/') {
    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const target = qdrantBase + url.pathname + url.search;
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['api-key'] = apiKey;

  const resp = await fetch(target, {
    method: req.method,
    headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.text(),
  });

  const respHeaders = new Headers(resp.headers);
  respHeaders.set('Access-Control-Allow-Origin', '*');

  return new Response(resp.body, {
    status: resp.status,
    headers: respHeaders,
  });
});
