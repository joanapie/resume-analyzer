import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { ResumeModel } from '../models/resume.js';
import { InterviewModel } from '../models/interview.js';
import { generateInterviewQuestions, evaluateAnswerStream } from '../services/interviewService.js';

const router = Router();

/**
 * POST /api/interview/generate
 * Generate interview questions from a completed JD-mode resume analysis.
 * Body: { resumeId }
 */
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { resumeId } = req.body;
    if (!resumeId) return res.status(400).json({ error: 'resumeId is required' });

    const resume = await ResumeModel.findByIdForUser(resumeId, req.userId);
    if (!resume) return res.status(404).json({ error: 'Resume not found' });
    if (resume.analyze_status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Resume analysis not completed yet' });
    }
    if (!resume.job_description) {
      return res.status(400).json({ error: 'No job description found. Please use JD Match mode.' });
    }

    const result = await generateInterviewQuestions(
      resume.job_description,
      resume.resume_text
    );

    // Save session to DB
    const session = await InterviewModel.create({
      userId: req.userId,
      resumeId: resume.id,
      role: result.role,
      questions: result.questions,
    });

    res.json({
      sessionId: session.id,
      role: result.role,
      questions: result.questions,
    });
  } catch (err) {
    console.error('[Interview] Generate failed:', err);
    res.status(500).json({ error: err.message || 'Failed to generate questions' });
  }
});

/**
 * POST /api/interview/:sessionId/evaluate
 * Stream AI evaluation for one answer.
 * Body: { questionId, question: { category, question }, answer }
 */
router.post('/:sessionId/evaluate', authMiddleware, async (req, res) => {
  try {
    const session = await InterviewModel.findByIdForUser(req.params.sessionId, req.userId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const { question, answer } = req.body;
    if (!question || !answer?.trim()) {
      return res.status(400).json({ error: 'question and answer are required' });
    }

    // Set up SSE (Server-Sent Events) for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    await evaluateAnswerStream(
      question,
      answer,
      (chunk) => {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      },
      () => {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      }
    );
  } catch (err) {
    console.error('[Interview] Evaluate failed:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Evaluation failed' });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
});

/**
 * GET /api/interview
 * List user's past interview sessions
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const sessions = await InterviewModel.findAllByUser(req.userId);
    res.json(sessions);
  } catch (err) {
    console.error('[Interview] List failed:', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

/**
 * GET /api/interview/:sessionId
 * Get a specific session with all questions
 */
router.get('/:sessionId', authMiddleware, async (req, res) => {
  try {
    const session = await InterviewModel.findByIdForUser(req.params.sessionId, req.userId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({
      id: session.id,
      role: session.role,
      questions: JSON.parse(session.questions),
      createdAt: session.created_at,
    });
  } catch (err) {
    console.error('[Interview] Get session failed:', err);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

export default router;
