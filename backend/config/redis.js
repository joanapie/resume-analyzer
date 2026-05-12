import Redis from 'ioredis';
import 'dotenv/config';

// 主连接（读写）
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  lazyConnect: true,
  maxRetriesPerRequest: null, // BullMQ 要求
});

// Stream 常量（对应 Java StreamConstants）
export const STREAM_KEY    = 'resume:analyze:stream';
export const GROUP_NAME    = 'resume-analyze-group';
export const CONSUMER_NAME = 'consumer-1';
export const STREAM_MAX_LEN = 1000;
export const FIELD_RESUME_ID = 'resumeId';
