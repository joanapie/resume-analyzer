import request from 'supertest';
import { createApp } from '../backend/index.js';

// Mock DB and Redis so tests don't need real services
import { jest } from '@jest/globals';

jest.mock('../src/config/db.js', () => ({
  pool: {
    query: jest.fn(),
  },
  initDb: jest.fn(),
}));

jest.mock('../src/config/redis.js', () => ({
  redis: { connect: jest.fn(), xadd: jest.fn(), xgroup: jest.fn(), xreadgroup: jest.fn(), xack: jest.fn() },
  STREAM_KEY: 'test-stream',
  GROUP_NAME: 'test-group',
  CONSUMER_NAME: 'test-consumer',
  STREAM_MAX_LEN: 100,
  FIELD_RESUME_ID: 'resumeId',
}));

jest.mock('../src/config/websocket.js', () => ({
  initWebSocket: jest.fn(),
  notifyClients: jest.fn(),
}));

jest.mock('../src/workers/streamConsumer.js', () => ({
  startConsumer: jest.fn(),
}));

jest.mock('../src/models/user.js', () => ({
  UserModel: {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  },
}));

import { UserModel } from '../src/models/user.js';
import bcrypt from 'bcrypt';

const app = createApp();

describe('POST /api/auth/register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 if fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'test@test.com' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 409 if email already registered', async () => {
    UserModel.findByEmail.mockResolvedValue({ id: 1, email: 'test@test.com' });
    const res = await request(app).post('/api/auth/register').send({
      email: 'test@test.com', password: 'password123', name: 'Test User',
    });
    expect(res.status).toBe(409);
  });

  it('returns 400 if password too short', async () => {
    UserModel.findByEmail.mockResolvedValue(null);
    const res = await request(app).post('/api/auth/register').send({
      email: 'new@test.com', password: '123', name: 'Test User',
    });
    expect(res.status).toBe(400);
  });

  it('returns token on successful registration', async () => {
    UserModel.findByEmail.mockResolvedValue(null);
    UserModel.create.mockResolvedValue({ id: 1, email: 'new@test.com', name: 'Test User' });
    const res = await request(app).post('/api/auth/register').send({
      email: 'new@test.com', password: 'password123', name: 'Test User',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('new@test.com');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 if fields are missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'test@test.com' });
    expect(res.status).toBe(400);
  });

  it('returns 401 if user not found', async () => {
    UserModel.findByEmail.mockResolvedValue(null);
    const res = await request(app).post('/api/auth/login').send({
      email: 'notexist@test.com', password: 'password123',
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 if password is wrong', async () => {
    const hashed = await bcrypt.hash('correctpassword', 10);
    UserModel.findByEmail.mockResolvedValue({ id: 1, email: 'test@test.com', password: hashed });
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@test.com', password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  it('returns token on successful login', async () => {
    const hashed = await bcrypt.hash('password123', 10);
    UserModel.findByEmail.mockResolvedValue({ id: 1, email: 'test@test.com', name: 'Test', password: hashed });
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@test.com', password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
