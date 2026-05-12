import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import path from 'path';

/**
 * Parses uploaded resume files into plain text.
 * Supports PDF / DOCX / TXT using pdf-parse + mammoth.
 */
export async function parseDocument(buffer, originalFilename) {
  const ext = path.extname(originalFilename).toLowerCase();

  let rawText = '';

  if (ext === '.pdf') {
    const data = await pdfParse(buffer);
    rawText = data.text;
  } else if (ext === '.docx' || ext === '.doc') {
    const result = await mammoth.extractRawText({ buffer });
    rawText = result.value;
  } else if (ext === '.txt') {
    rawText = buffer.toString('utf-8');
  } else {
    throw new Error(`Unsupported file format: ${ext}. Please upload a PDF, DOCX, or TXT file.`);
  }

  return cleanText(rawText);
}

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}