import { pool } from '../config/db.js';

export const InterviewModel = {
  async create({ userId, resumeId, role, questions }) {
    const { rows } = await pool.query(
      `INSERT INTO interview_sessions (user_id, resume_id, role, questions)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, resumeId, role, JSON.stringify(questions)]
    );
    return rows[0];
  },

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT * FROM interview_sessions WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async findByIdForUser(id, userId) {
    const { rows } = await pool.query(
      'SELECT * FROM interview_sessions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rows[0] || null;
  },

  async findAllByUser(userId) {
    const { rows } = await pool.query(
      `SELECT id, role, resume_id, created_at
       FROM interview_sessions WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  },
};
