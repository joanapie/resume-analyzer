import { WebSocketServer } from 'ws';

// Map of resumeId -> Set of WebSocket clients
const subscribers = new Map();

let wss = null;

export function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    // Extract resumeId from URL: /ws?resumeId=123
    const url = new URL(req.url, 'http://localhost');
    const resumeId = url.searchParams.get('resumeId');

    if (!resumeId) {
      ws.close(1008, 'resumeId required');
      return;
    }

    // Register subscriber
    if (!subscribers.has(resumeId)) {
      subscribers.set(resumeId, new Set());
    }
    subscribers.get(resumeId).add(ws);
    console.log(`[WS] Client subscribed to resumeId=${resumeId}`);

    ws.on('close', () => {
      const subs = subscribers.get(resumeId);
      if (subs) {
        subs.delete(ws);
        if (subs.size === 0) subscribers.delete(resumeId);
      }
      console.log(`[WS] Client unsubscribed from resumeId=${resumeId}`);
    });

    ws.on('error', () => {});
  });

  console.log('[WS] WebSocket server ready at /ws');
}

// Called by streamConsumer when analysis status changes
export function notifyClients(resumeId, payload) {
  const subs = subscribers.get(String(resumeId));
  if (!subs || subs.size === 0) return;

  const msg = JSON.stringify(payload);
  for (const ws of subs) {
    if (ws.readyState === 1) { // OPEN
      ws.send(msg);
    }
  }
}
