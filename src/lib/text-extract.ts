import { readFile } from 'fs/promises';
import { extname } from 'path';
import { log } from './logger';

const logger = log('text-extract').c('extract');

export interface ExtractResult {
  text: string | null;
  error?: string;
}

/**
 * Extract text content from a file based on its extension/mimetype.
 * Supports: .txt, .md, .csv, .json, .xml, .html, .pdf, .docx, .xlsx
 */
export async function extractTextContent(
  filePath: string,
  mimetype: string,
  maxSize: number = 1_000_000, // 1MB max text
): Promise<ExtractResult> {
  const ext = extname(filePath).toLowerCase();

  // Plain text formats
  if (
    mimetype.startsWith('text/') ||
    ['.txt', '.md', '.csv', '.json', '.xml', '.html', '.yml', '.yaml', '.log'].includes(ext)
  ) {
    try {
      const buffer = await readFile(filePath);
      if (buffer.length > maxSize) {
        return { text: null, error: 'file too large for text extraction' };
      }
      return { text: buffer.toString('utf-8') };
    } catch (err) {
      return { text: null, error: String(err) };
    }
  }

  // PDF
  if (ext === '.pdf' || mimetype === 'application/pdf') {
    try {
      const { extractText } = await import('unpdf');
      const buffer = await readFile(filePath);
      if (buffer.length > 10 * 1024 * 1024) {
        // 10MB limit for PDFs
        return { text: null, error: 'PDF too large for text extraction' };
      }
      const result = await extractText(buffer);
      const text = Array.isArray(result?.text) ? result.text.join('\n') : (result?.text ?? '');
      if (text.length > 0) {
        return { text: text.slice(0, maxSize) };
      }
      return { text: null, error: 'no text found in PDF' };
    } catch (err) {
      logger.warn('PDF extraction failed', { error: String(err) });
      return { text: null, error: String(err) };
    }
  }

  // DOCX
  if (
    ext === '.docx' ||
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    try {
      const { extractRawText } = await import('mammoth');
      const buffer = await readFile(filePath);
      const result = await extractRawText({ buffer });
      if (result.value && result.value.length > 0) {
        return { text: result.value.slice(0, maxSize) };
      }
      return { text: null, error: 'no text found in DOCX' };
    } catch (err) {
      logger.warn('DOCX extraction failed', { error: String(err) });
      return { text: null, error: String(err) };
    }
  }

  // XLSX
  if (ext === '.xlsx' || mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    try {
      const XLSX = await import('xlsx');
      const buffer = await readFile(filePath);
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      let text = '';
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        text += csv + '\n';
      }
      if (text.length > 0) {
        return { text: text.slice(0, maxSize) };
      }
      return { text: null, error: 'no text found in XLSX' };
    } catch (err) {
      logger.warn('XLSX extraction failed', { error: String(err) });
      return { text: null, error: String(err) };
    }
  }

  // CSV
  if (ext === '.csv' || mimetype === 'text/csv') {
    try {
      const buffer = await readFile(filePath);
      if (buffer.length > maxSize) {
        return { text: null, error: 'file too large for text extraction' };
      }
      return { text: buffer.toString('utf-8') };
    } catch (err) {
      return { text: null, error: String(err) };
    }
  }

  return { text: null, error: 'unsupported file type for text extraction' };
}
