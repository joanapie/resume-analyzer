# Resume Analyzer

An AI-powered resume analysis platform built with Node.js, React, PostgreSQL, and Redis. Upload your resume to get multi-dimensional scoring, ATS compatibility checks, JD matching, and shareable result links.

**Live demo:** _deploy and add your URL here_

---

## Features

- **Resume Review** — AI scores your resume across 5 dimensions: project depth, skill match, content, structure, and expression
- **ATS Compatibility Check** — Detects whether your resume is readable by Applicant Tracking Systems used by most companies
- **JD Match Analysis** — Paste a job description to see how well your resume matches the role, including matched/missing keywords
- **Shareable Results** — Generate a public link to share your analysis with mentors or friends
- **Real-time Updates** — WebSocket-based live progress instead of polling
- **Queue Visualization** — See your position in the analysis queue with estimated wait time
- **User Accounts** — All history is tied to your account and accessible across devices

---

## Architecture

```
┌─────────────────┐     HTTP/WS      ┌──────────────────────┐
│   React Client  │ ◄──────────────► │   Express Server     │
│   (Vite)        │                  │   Port 8080          │
└─────────────────┘                  └──────┬───────────────┘
                                            │
                          ┌─────────────────┼─────────────────┐
                          │                 │                 │
                    ┌─────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
                    │ PostgreSQL  │  │    Redis     │  │  OpenAI API │
                    │ Users       │  │   Stream     │  │   GPT-4o    │
                    │ Resumes     │  │   Queue      │  │             │
                    └────────────┘  └─────────────┘  └─────────────┘
```

**Why Redis Stream instead of a simple job queue?**
Redis Streams provide persistent, consumer-group-based message delivery. If the server crashes mid-analysis, the job stays in the stream and gets re-processed on restart — unlike in-memory queues that lose jobs on crash.

**Why WebSocket instead of polling?**
Polling hits the DB every 2 seconds regardless of whether anything changed. WebSocket lets the server push updates exactly when analysis completes, reducing DB load and improving perceived performance.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router, Vite |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Queue | Redis Streams |
| Real-time | WebSocket (ws) |
| Auth | JWT (jsonwebtoken + bcrypt) |
| AI | OpenAI GPT-4o |
| File parsing | pdf-parse, mammoth |
| Testing | Jest, Supertest |

---

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+

### 1. Install dependencies
```bash
npm run install:all
```

### 2. Start PostgreSQL and Redis
```bash
brew install postgresql@16 redis
brew services start postgresql@16
brew services start redis
createdb resume_analyzer
```

### 3. Configure environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=resume_analyzer
DB_USER=your_mac_username
DB_PASSWORD=

REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-...
JWT_SECRET=your-random-secret-string
PORT=8080
```

### 4. Run
```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8080

---

## Running Tests
```bash
npm test
```

---

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Sign in |
| POST | `/api/resumes/upload` | Yes | Upload resume |
| GET | `/api/resumes/:id/status` | Yes | Get result |
| POST | `/api/resumes/:id/share` | Yes | Generate share link |
| GET | `/api/resumes/share/:token` | No | Public shared result |
| GET | `/api/resumes` | Yes | History list |

---

## Project Structure

```
resume-analyzer/
├── src/                    # Backend (Node.js + Express)
├── client/                 # Frontend (React + Vite)
├── prompts/                # AI prompt templates
└── tests/                  # Jest + Supertest tests
```
