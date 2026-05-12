import OpenAI from 'openai';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = path.resolve(__dirname, '../prompts');

let _client = null
function getClient() {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _client
};

/**
 * Generate interview questions based on JD + resume text
 */
export async function generateInterviewQuestions(jobDescription, resumeText) {
  const systemPrompt = await readFile(
    path.join(PROMPTS_DIR, 'interview-generate.txt'), 'utf-8'
  );

  const userPrompt = `
## Job Description
${jobDescription}

## Candidate Resume
${resumeText}
  `.trim();

  console.log('[InterviewService] Generating interview questions');

  const response = await getClient().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 2048,
  });

  const raw = response.choices[0].message.content;
  try {
    const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse interview questions from AI');
  }
}

/**
 * Stream AI evaluation of a candidate's answer
 * Calls onChunk(text) for each streamed token, calls onDone() when finished
 */
export async function evaluateAnswerStream(question, answer, onChunk, onDone) {
  const systemPrompt = await readFile(
    path.join(PROMPTS_DIR, 'interview-evaluate.txt'), 'utf-8'
  );

  const userPrompt = `
## Interview Question
Category: ${question.category}
Question: ${question.question}

## Candidate's Answer
${answer}
  `.trim();

  console.log('[InterviewService] Streaming answer evaluation');

  const stream = await getClient().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 600,
    stream: true,
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || '';
    if (text) onChunk(text);
  }

  onDone();
}
