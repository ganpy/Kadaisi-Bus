// Kadaisi Bus — riders-on-board counter.
// Each open page sends GET /beat?id=<random session id> every 30s;
// a rider counts while their last beat is inside the sliding window.
// State is in-memory: restarts simply reset the count, which is fine
// for a vibe counter.
const http = require('http');

const seen = new Map(); // session id -> last beat (ms)
const WINDOW_MS = 75_000;
const ALLOWED = ['https://kadaisibus.fun', 'http://localhost:8734'];

http.createServer((req, res) => {
  const origin = req.headers.origin || '';
  const headers = {
    'Access-Control-Allow-Origin': ALLOWED.includes(origin) ? origin : ALLOWED[0],
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/beat') {
    const id = (url.searchParams.get('id') || '').slice(0, 40);
    const now = Date.now();
    if (id) seen.set(id, now);
    for (const [k, t] of seen) if (now - t > WINDOW_MS) seen.delete(k);
    res.writeHead(200, headers);
    res.end(JSON.stringify({ riders: seen.size }));
  } else if (url.pathname === '/health') {
    res.writeHead(200, headers);
    res.end('{"status":"ok"}');
  } else {
    res.writeHead(404, headers);
    res.end('{}');
  }
}).listen(process.env.PORT || 3000);
