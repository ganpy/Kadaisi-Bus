// Kadaisi Bus — live riders + lifetime rides odometer.
//
// Real-time: pages hold a WebSocket at /ws; the rider count is simply the
// number of live sockets (plus any old cached pages still polling /beat),
// broadcast to everyone whenever it changes.
//
// Odometer: totalRides increments once per visiting session (client sends
// 'ride' on its first boarding) and persists to a Railway volume at /data
// so restarts and redeploys don't reset it.
const http = require('http');
const fs = require('fs');
const { WebSocketServer } = require('ws');

const DATA_DIR = process.env.DATA_DIR || '/data';
const STATE_FILE = DATA_DIR + '/state.json';
const ALLOWED = ['https://kadaisibus.fun', 'http://localhost:8734'];

let totalRides = 0;
try { totalRides = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')).totalRides || 0; } catch {}
let dirty = false;
setInterval(() => {
  if (!dirty) return;
  dirty = false;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify({ totalRides }));
  } catch {}
}, 5000);

// legacy polling clients (pages cached before the WebSocket era)
const seen = new Map();
const WINDOW_MS = 75_000;
function pruneBeats(){
  const now = Date.now();
  for (const [k, t] of seen) if (now - t > WINDOW_MS) seen.delete(k);
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin || '';
  const headers = {
    'Access-Control-Allow-Origin': ALLOWED.includes(origin) ? origin : ALLOWED[0],
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/beat') {
    const id = (url.searchParams.get('id') || '').slice(0, 40);
    if (id) seen.set(id, Date.now());
    res.writeHead(200, headers);
    res.end(JSON.stringify({ riders: riderCount(), rides: totalRides }));
  } else if (url.pathname === '/ride') {
    totalRides++; dirty = true; broadcast();
    res.writeHead(200, headers);
    res.end(JSON.stringify({ rides: totalRides }));
  } else if (url.pathname === '/stats' || url.pathname === '/health') {
    res.writeHead(200, headers);
    res.end(JSON.stringify({ status: 'ok', riders: riderCount(), rides: totalRides }));
  } else {
    res.writeHead(404, headers);
    res.end('{}');
  }
});

const wss = new WebSocketServer({
  server,
  path: '/ws',
  verifyClient: ({ origin }) => !origin || ALLOWED.includes(origin),
});

function riderCount(){
  pruneBeats();
  let live = 0;
  for (const c of wss.clients) if (c.readyState === 1) live++;
  return live + seen.size;
}

function broadcast(){
  const msg = JSON.stringify({ riders: riderCount(), rides: totalRides });
  for (const c of wss.clients) if (c.readyState === 1) c.send(msg);
}

wss.on('connection', ws => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', m => {
    if (String(m) === 'ride'){ totalRides++; dirty = true; broadcast(); }
  });
  ws.on('close', () => setTimeout(broadcast, 100));
  broadcast();
});

// drop dead sockets, and re-broadcast periodically as legacy beats expire
setInterval(() => {
  for (const ws of wss.clients){
    if (!ws.isAlive){ ws.terminate(); continue; }
    ws.isAlive = false;
    ws.ping();
  }
  broadcast();
}, 30_000);

server.listen(process.env.PORT || 3000);
