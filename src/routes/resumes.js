import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { parseDocument } from '../services/documentParseService.js';
import { ResumeModel } from '../models/resume.js';
import { sendToStream } from '../workers/streamProducer.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many uploads, please try again later' },
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_, file, cb) {
    const allowed = ['.pdf', '.docx', '.doc', '.txt'];
    const ext = '.' + file.originalname.split('.').pop().toLowerCase();
    allowed.includes(ext) ? cb(null, true) : cb(new Error('Unsupported file format. Please upload PDF, DOCX, or TXT.'));
  },
});

// POST /api/resumes/upload
router.post('/upload', authMiddleware, uploadLimiter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const mode = req.body.mode === 'jd' ? 'jd' : 'resume';
    const jobDescription = mode === 'jd' ? (req.body.jobDescription || '').trim() : null;

    if (mode === 'jd' && !jobDescription) {
      return res.status(400).json({ error: 'Please paste a job description' });
    }

    const resumeText = await parseDocument(req.file.buffer, req.file.originalname);
    if (!resumeText.trim()) {
      return res.status(400).json({ error: 'Could not extract text from file.' });
    }

    const entity = await ResumeModel.create({
      originalFilename: req.file.originalname,
      resumeText, jobDescription, mode, userId: req.userId,
    });

    await sendToStream(entity.id);
    const queueLength = await ResumeModel.getQueueLength();

    res.json({
      resumeId: entity.id,
      status: 'PENDING',
      queuePosition: queueLength,
      message: 'Upload successful, analysis in progress...',
    });
  } catch (err) {
    console.error('[Upload] Failed:', err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

// GET /api/resumes/:id/status
router.get('/:id/status', authMiddleware, async (req, res) => {
  try {
    const entity = await ResumeModel.findByIdForUser(req.params.id, req.userId);
    if (!entity) return res.status(404).json({ error: 'Resume not found' });

    if (entity.analyze_status === 'COMPLETED') {
      const analysis = JSON.parse(entity.analysis_result);
      return res.json({ status: 'COMPLETED', analysis, shareToken: entity.share_token });
    }
    if (entity.analyze_status === 'FAILED') {
      return res.json({ status: 'FAILED', error: entity.error_message || 'Analysis failed' });
    }

    const queuePosition = await ResumeModel.getQueuePosition(entity.id);
    res.json({ status: entity.analyze_status, queuePosition, estimatedSeconds: queuePosition * 20 });
  } catch (err) {
    console.error('[Status] Query failed:', err);
    res.status(500).json({ error: 'Query failed' });
  }
});

// POST /api/resumes/:id/share  — generate share link
router.post('/:id/share', authMiddleware, async (req, res) => {
  try {
    const entity = await ResumeModel.findByIdForUser(req.params.id, req.userId);
    if (!entity) return res.status(404).json({ error: 'Resume not found' });
    if (entity.analyze_status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Analysis not completed yet' });
    }

    // Return existing token or generate new one
    const token = entity.share_token || await ResumeModel.generateShareToken(entity.id, req.userId);
    res.json({ shareToken: token });
  } catch (err) {
    console.error('[Share] Failed:', err);
    res.status(500).json({ error: 'Failed to generate share link' });
  }
});

// GET /api/resumes/share/:token  — public, no auth
router.get('/share/:token', async (req, res) => {
  try {
    const entity = await ResumeModel.findByShareToken(req.params.token);
    if (!entity) return res.status(404).json({ error: 'Shared result not found or expired' });

    const analysis = JSON.parse(entity.analysis_result);
    res.json({
      filename: entity.original_filename,
      mode: entity.mode,
      createdAt: entity.created_at,
      analysis,
    });
  } catch (err) {
    console.error('[Share] Fetch failed:', err);
    res.status(500).json({ error: 'Failed to fetch shared result' });
  }
});

// GET /api/resumes
router.get('/', authMiddleware, async (req, res) => {
  try {
    const list = await ResumeModel.findAllByUser(req.userId);
    res.json(list.map(e => ({
      id: e.id,
      filename: e.original_filename,
      status: e.analyze_status,
      mode: e.mode,
      shareToken: e.share_token,
      createdAt: e.created_at,
    })));
  } catch (err) {
    console.error('[List] Query failed:', err);
    res.status(500).json({ error: 'Query failed' });
  }
});

export default router;
