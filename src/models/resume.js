import { pool } from '../config/db.js';
import { randomUUID } from 'crypto';

export const ResumeModel = {
  async create({ originalFilename, resumeText, jobDescription = null, mode = 'resume', userId = null }) {
    const { rows } = await pool.query(
      `INSERT INTO resumes (original_filename, resume_text, job_description, mode, analyze_status, user_id)
       VALUES ($1, $2, $3, $4, 'PENDING', $5) RETURNING *`,
      [originalFilename, resumeText, jobDescription, mode, userId]
    );
    return rows[0];
  },

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM resumes WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async findByIdForUser(id, userId) {
    const { rows } = await pool.query(
      'SELECT * FROM resumes WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rows[0] || null;
  },

  async findByShareToken(token) {
    const { rows } = await pool.query(
      'SELECT * FROM resumes WHERE share_token = $1 AND analyze_status = $2',
      [token, 'COMPLETED']
    );
    return rows[0] || null;
  },

  async findAllByUser(userId) {
    const { rows } = await pool.query(
      `SELECT id, original_filename, analyze_status, mode, share_token, created_at
       FROM resumes WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  },

  async generateShareToken(id, userId) {
    const token = randomUUID();
    await pool.query(
      'UPDATE resumes SET share_token = $1 WHERE id = $2 AND user_id = $3',
      [token, id, userId]
    );
    return token;
  },

  async getQueuePosition(id) {
    const { rows } = await pool.query(
      `SELECT COUNT(*) as position FROM resumes
       WHERE analyze_status IN ('PENDING','PROCESSING') AND id < $1`,
      [id]
    );
    return parseInt(rows[0].position) + 1;
  },

  async getQueueLength() {
    const { rows } = await pool.query(
      `SELECT COUNT(*) as count FROM resumes WHERE analyze_status IN ('PENDING','PROCESSING')`
    );
    return parseInt(rows[0].count);
  },

  async updateStatus(id, { analyzeStatus, analysisResult = null, errorMessage = null }) {
    await pool.query(
      `UPDATE resumes SET analyze_status = $1, analysis_result = $2, error_message = $3 WHERE id = $4`,
      [analyzeStatus, analysisResult, errorMessage, id]
    );
  },
};
