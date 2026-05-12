import request from 'supertest';
import { createApp } from '../backend/index.js';
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

jest.mock('../src/config/db.js', () => ({
  pool: { query: jest.fn() },
  initDb: jest.fn(),
}));

jest.mock('../src/config/redis.js', () => ({
  redis: { connect: jest.fn(), xadd: jest.fn(), xgroup: jest.fn(), xreadgroup: jest.fn(), xack: jest.fn() },
  STREAM_KEY: 'test', GROUP_NAME: 'test', CONSUMER_NAME: 'test', STREAM_MAX_LEN: 100, FIELD_RESUME_ID: 'resumeId',
}));

jest.mock('../src/config/websocket.js', () => ({
  initWebSocket: jest.fn(), notifyClients: jest.fn(),
}));

jest.mock('../src/workers/streamConsumer.js', () => ({
  startConsumer: jest.fn(),
}));

jest.mock('../src/workers/streamProducer.js', () => ({
  sendToStream: jest.fn(),
}));

jest.mock('../src/models/resume.js', () => ({
  ResumeModel: {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdForUser: jest.fn(),
    findByShareToken: jest.fn(),
    findAllByUser: jest.fn(),
    generateShareToken: jest.fn(),
    getQueuePosition: jest.fn(),
    getQueueLength: jest.fn(),
    updateStatus: jest.fn(),
  },
}));

jest.mock('../src/services/documentParseService.js', () => ({
  parseDocument: jest.fn(),
}));

import { ResumeModel } from '../src/models/resume.js';
import { parseDocument } from '../src/services/documentParseService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const token = jwt.sign({ userId: 1 }, JWT_SECRET);
const authHeader = `Bearer ${token}`;

const app = createApp();

describe('GET /api/resumes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/resumes');
    expect(res.status).toBe(401);
  });

  it('returns resume list for authenticated user', async () => {
    ResumeModel.findAllByUser.mockResolvedValue([
      { id: 1, original_filename: 'cv.pdf', analyze_status: 'COMPLETED', mode: 'resume', share_token: null, created_at: new Date() },
    ]);
    const res = await request(app).get('/api/resumes').set('Authorization', authHeader);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].filename).toBe('cv.pdf');
  });
});

describe('GET /api/resumes/:id/status', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 404 if resume not found', async () => {
    ResumeModel.findByIdForUser.mockResolvedValue(null);
    const res = await request(app).get('/api/resumes/999/status').set('Authorization', authHeader);
    expect(res.status).toBe(404);
  });

  it('returns COMPLETED status with analysis', async () => {
    ResumeModel.findByIdForUser.mockResolvedValue({
      id: 1, analyze_status: 'COMPLETED',
      analysis_result: JSON.stringify({ overallScore: 85 }),
      share_token: 'abc-token',
    });
    const res = await request(app).get('/api/resumes/1/status').set('Authorization', authHeader);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('COMPLETED');
    expect(res.body.analysis.overallScore).toBe(85);
  });

  it('returns queue position when PENDING', async () => {
    ResumeModel.findByIdForUser.mockResolvedValue({ id: 1, analyze_status: 'PENDING' });
    ResumeModel.getQueuePosition.mockResolvedValue(3);
    const res = await request(app).get('/api/resumes/1/status').set('Authorization', authHeader);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('PENDING');
    expect(res.body.queuePosition).toBe(3);
  });
});

describe('GET /api/resumes/share/:token', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 404 for invalid token', async () => {
    ResumeModel.findByShareToken.mockResolvedValue(null);
    const res = await request(app).get('/api/resumes/share/bad-token');
    expect(res.status).toBe(404);
  });

  it('returns shared result without auth', async () => {
    ResumeModel.findByShareToken.mockResolvedValue({
      original_filename: 'resume.pdf',
      mode: 'resume',
      created_at: new Date(),
      analysis_result: JSON.stringify({ overallScore: 90 }),
    });
    const res = await request(app).get('/api/resumes/share/valid-token');
    expect(res.status).toBe(200);
    expect(res.body.analysis.overallScore).toBe(90);
    expect(res.body.filename).toBe('resume.pdf');
  });
});
