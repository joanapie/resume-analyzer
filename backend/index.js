import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import { initDb } from './config/db.js';
import { redis } from './config/redis.js';
import { initWebSocket } from './config/websocket.js';
import resumeRoutes from './routes/resumes.js';
import authRoutes from './routes/auth.js';
import interviewRoutes from './routes/interview.js';
import { startConsumer } from './workers/streamConsumer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['*'],
  }));

  app.use(express.json());

  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please slow down' },
  }));

  app.use('/api/auth', authRoutes);
  app.use('/api/resumes', resumeRoutes);
  app.use('/api/interview', interviewRoutes);

  app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  // Serve frontend in production
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, '../client/dist');
    app.use(express.static(distPath));
    app.get('*', (_, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.use((err, req, res, _next) => {
    console.error('[Error]', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  });

  return app;
}

async function bootstrap() {
  try {
    await redis.connect();
    console.log('[Redis] Connected');

    await initDb();
    await startConsumer();

    const app = createApp();
    const server = http.createServer(app);
    initWebSocket(server);

    const PORT = process.env.PORT || 8080;
    server.listen(PORT, () => {
      console.log(`[Server] Running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[Bootstrap] Startup failed:', err);
    process.exit(1);
  }
}

bootstrap();