/**
 * Relay WebSocket pool with parallel racing.
 * Replaces all sequential for-loop relay queries.
 */

/** Open a single relay connection. Returns a promise-based interface. */
function connectRelay(url, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const timer = setTimeout(() => { ws.close(); reject(new Error('timeout')); }, timeoutMs);

    ws.onopen = () => {
      clearTimeout(timer);
      resolve(ws);
    };
    ws.onerror = () => { clearTimeout(timer); reject(new Error('ws error')); };
  });
}

/**
 * Race query: first relay to return an EVENT wins.
 * Returns the event or null if all fail/EOSE without events.
 */
export async function raceQuery(relayUrls, filter, timeoutMs = 8000) {
  const attempts = relayUrls.map(async (url) => {
    const ws = await connectRelay(url, timeoutMs);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { ws.close(); reject(new Error('timeout')); }, timeoutMs);
      ws.onmessage = (msg) => {
        const d = JSON.parse(msg.data);
        if (d[0] === 'EVENT' && d[2]) { clearTimeout(timer); ws.close(); resolve(d[2]); }
        if (d[0] === 'EOSE') { clearTimeout(timer); ws.close(); resolve(null); }
      };
      ws.onerror = () => { clearTimeout(timer); reject(new Error('ws error')); };
      ws.send(JSON.stringify(['REQ', 'rq-' + Date.now(), filter]));
    });
  });

  try { return await Promise.any(attempts); } catch { return null; }
}

/**
 * Collecting query: gather events from ALL relays progressively.
 * Calls onEvent(event) as each event arrives. Returns merged array.
 */
export async function collectQuery(relayUrls, filter, onEvent, timeoutMs = 15000) {
  const subId = 'cq-' + Date.now();
  const results = await Promise.allSettled(
    relayUrls.map(async (url) => {
      const ws = await connectRelay(url, timeoutMs);
      return new Promise((resolve) => {
        const timer = setTimeout(() => { ws.close(); resolve([]); }, timeoutMs);
        const collected = [];
        ws.onmessage = (msg) => {
          const d = JSON.parse(msg.data);
          if (d[0] === 'EVENT' && d[2]) {
            collected.push(d[2]);
            try { onEvent(d[2]); } catch (e) { console.error('[relay] onEvent error:', e); }
          }
          if (d[0] === 'EOSE') { clearTimeout(timer); ws.close(); resolve(collected); }
        };
        ws.onerror = () => { clearTimeout(timer); resolve(collected); };
        ws.send(JSON.stringify(['REQ', subId, filter]));
      });
    })
  );

  // Merge and deduplicate by event.id
  const seen = new Set();
  const all = [];
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const ev of r.value) {
      if (!seen.has(ev.id)) { seen.add(ev.id); all.push(ev); }
    }
  }
  return all;
}

/**
 * Publish event to all relays in parallel.
 * Returns per-relay status array.
 */
export async function publishEvent(event, relayUrls) {
  const results = await Promise.allSettled(
    relayUrls.map(async (url) => {
      const ws = await connectRelay(url, 10000);
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => { ws.close(); reject(new Error('timeout')); }, 10000);
        ws.onmessage = (msg) => {
          const d = JSON.parse(msg.data);
          if (d[0] === 'OK') { clearTimeout(timer); ws.close(); resolve(d[2] === true); }
          if (d[0] === 'NOTICE') { clearTimeout(timer); ws.close(); reject(new Error(d[1])); }
        };
        ws.onerror = () => { clearTimeout(timer); reject(new Error('ws error')); };
        ws.send(JSON.stringify(['EVENT', event]));
      });
    })
  );
  return relayUrls.map((url, i) => ({
    url,
    ok: results[i].status === 'fulfilled' && results[i].value === true,
    message: results[i].status === 'rejected' ? results[i].reason?.message : undefined,
  }));
}
