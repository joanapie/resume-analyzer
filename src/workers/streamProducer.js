import {
  redis,
  STREAM_KEY,
  STREAM_MAX_LEN,
  FIELD_RESUME_ID,
} from '../config/redis.js';

export async function sendToStream(resumeId) {
  await redis.xadd(
    STREAM_KEY,
    'MAXLEN', '~', String(STREAM_MAX_LEN),
    '*',                         
    FIELD_RESUME_ID, String(resumeId)
  );
  console.log(`[Producer] 任务已入队: resumeId=${resumeId}`);
}
