import OpenAI from 'openai'
import { readFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import path from 'path'
import 'dotenv/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROMPTS_DIR = path.resolve(__dirname, '../prompts')

let _client = null
function getClient() {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _client
}

export async function analyzeResume(resumeText) {
  const [systemPrompt, userPromptTemplate] = await Promise.all([
    readFile(path.join(PROMPTS_DIR, 'resume-analysis-system.txt'), 'utf-8'),
    readFile(path.join(PROMPTS_DIR, 'resume-analysis-user.txt'), 'utf-8'),
  ])

  const userPrompt = userPromptTemplate.replace('{resumeText}', resumeText)

  console.log(`[GradingService] Starting AI analysis, text length: ${resumeText.length}`)

  const response = await getClient().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 2048,
  })

  const rawResponse = response.choices[0].message.content
  console.log(`[GradingService] AI response received: ${rawResponse.slice(0, 200)}...`)

  return parseResponse(rawResponse)
}

function parseResponse(response) {
  try {
    const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim()
    return JSON.parse(cleaned)
  } catch (e) {
    console.error('[GradingService] Failed to parse JSON, raw response:', response)
    throw new Error('Unexpected AI response format, please try again')
  }
}

export async function analyzeResumeWithJD(resumeText, jobDescription) {
  const [systemPrompt, userPromptTemplate] = await Promise.all([
    readFile(path.join(PROMPTS_DIR, 'jd-match-system.txt'), 'utf-8'),
    readFile(path.join(PROMPTS_DIR, 'jd-match-user.txt'), 'utf-8'),
  ])

  const userPrompt = userPromptTemplate
    .replace('{resumeText}', resumeText)
    .replace('{jobDescription}', jobDescription)

  console.log(`[GradingService] Starting JD match analysis`)

  const response = await getClient().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 2048,
  })

  const rawResponse = response.choices[0].message.content
  return parseResponse(rawResponse)
}