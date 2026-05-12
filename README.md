# Resume Analyzer

An AI-powered resume analysis platform built with Node.js, React, PostgreSQL, and Redis. Upload your resume to get multi-dimensional scoring, ATS compatibility checks, JD matching, and shareable result links.

**Live demo:** http://136.116.22.135


## Features

- **Resume Review** : AI scores your resume across 5 dimensions: project depth, skill match, content, structure, and expression
- **ATS Compatibility Check** : Detects whether your resume is readable by Applicant Tracking Systems used by most companies
- **JD Match Analysis** : Paste a job description to see how well your resume matches the role, including matched/missing keywords
- **Mock Interview** : Generates 10 role-specific interview questions based on overlapping technologies between your resume and the JD; submit answers and receive real-time AI feedback
- **Shareable Results** : Generate a public link to share your analysis with mentors or friends
- **User Accounts** : All history is tied to your account and accessible across devices

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

## Running Tests
```bash
npm test
```

