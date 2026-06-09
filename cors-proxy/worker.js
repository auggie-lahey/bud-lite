/**
 * CORS proxy for Qdrant Cloud.
 * Deploy to Cloudflare Workers (free tier: 100k req/day).
 *
 * The Qdrant API key stays server-side — browser never sees it.
 * Browser calls: POST https://your-worker.workers.dev/{qdrant-path}
 * Body: same JSON you'd send to Qdrant (vector, limit, filter, etc.)
 */

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
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

    const url = new URL(request.url);
    const target = env.QDRANT_URL + url.pathname + url.search;

    // Build server-side request with the secret API key
    const headers = { 'Content-Type': 'application/json' };
    if (env.QDRANT_API_KEY) headers['api-key'] = env.QDRANT_API_KEY;

    const resp = await fetch(target, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    });

    // Return with CORS headers
    const respHeaders = new Headers(resp.headers);
    respHeaders.set('Access-Control-Allow-Origin', '*');
    respHeaders.delete('content-encoding');

    return new Response(resp.body, {
      status: resp.status,
      headers: respHeaders,
    });
  },
};
