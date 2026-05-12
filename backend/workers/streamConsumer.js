import { redis, STREAM_KEY, GROUP_NAME, CONSUMER_NAME, FIELD_RESUME_ID } from '../config/redis.js';
import { ResumeModel } from '../models/resume.js';
import { analyzeResume, analyzeResumeWithJD } from '../services/resumeGradingService.js';
import { notifyClients } from '../config/websocket.js';

const POLL_INTERVAL_MS = 500;
const BLOCK_MS = 100;

export async function startConsumer() {
  await ensureGroup();
  console.log('[Consumer] Listening to Redis Stream...');
  const poll = async () => {
    try { await consume(); } catch (err) { console.error('[Consumer] Error:', err); }
    finally { setTimeout(poll, POLL_INTERVAL_MS); }
  };
  poll();
}

async function ensureGroup() {
  try {
    await redis.xgroup('CREATE', STREAM_KEY, GROUP_NAME, '$', 'MKSTREAM');
    console.log('[Consumer] Consumer group created');
  } catch (err) {
    if (!err.message.includes('BUSYGROUP')) throw err;
  }
}

async function consume() {
  const results = await redis.xreadgroup(
    'GROUP', GROUP_NAME, CONSUMER_NAME,
    'COUNT', '1', 'BLOCK', String(BLOCK_MS),
    'STREAMS', STREAM_KEY, '>'
  );
  if (!results || results.length === 0) return;
  const [, messages] = results[0];
  for (const [msgId, fields] of messages) {
    await processMessage(msgId, fields);
  }
}

async function processMessage(msgId, fields) {
  const fieldMap = {};
  for (let i = 0; i < fields.length; i += 2) fieldMap[fields[i]] = fields[i + 1];

  const resumeId = parseInt(fieldMap[FIELD_RESUME_ID]);
  console.log(`[Consumer] Processing resumeId=${resumeId}`);

  const resume = await ResumeModel.findById(resumeId);
  if (!resume) {
    console.warn(`[Consumer] Resume not found: resumeId=${resumeId}`);
    await ack(msgId);
    return;
  }

  await ResumeModel.updateStatus(resumeId, { analyzeStatus: 'PROCESSING' });
  notifyClients(resumeId, { status: 'PROCESSING' });

  try {
    const result = resume.mode === 'jd'
      ? await analyzeResumeWithJD(resume.resume_text, resume.job_description)
      : await analyzeResume(resume.resume_text);

    await ResumeModel.updateStatus(resumeId, {
      analyzeStatus: 'COMPLETED',
      analysisResult: JSON.stringify(result),
    });

    // Push result directly via WebSocket so frontend doesn't need to poll
    notifyClients(resumeId, { status: 'COMPLETED', analysis: result });
    console.log(`[Consumer] Done resumeId=${resumeId}, score=${result.overallScore ?? result.overallMatch}`);
  } catch (err) {
    console.error(`[Consumer] Failed resumeId=${resumeId}`, err);
    await ResumeModel.updateStatus(resumeId, { analyzeStatus: 'FAILED', errorMessage: err.message });
    notifyClients(resumeId, { status: 'FAILED', error: err.message });
  }

  await ack(msgId);
}

async function ack(msgId) {
  await redis.xack(STREAM_KEY, GROUP_NAME, msgId);
}
