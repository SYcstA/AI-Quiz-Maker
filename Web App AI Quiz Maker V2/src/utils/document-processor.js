/**
 * Document-to-Markdown Processor (Client-Side)
 * 
 * Converts uploaded PDF and DOCX files into clean Markdown text
 * for improved LLM quiz generation accuracy.
 * 
 * Dependencies:
 *   - mammoth.js (npm) for .docx files
 *   - pdf.js (CDN or npm) for .pdf files
 */

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Detect file type by extension
 * @param {File} file
 * @returns {'pdf' | 'docx' | null}
 */
export function detectFileType(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.docx')) return 'docx';
  return null;
}

/**
 * Validate file before processing
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateFile(file) {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  const type = detectFileType(file);
  if (!type) {
    return { valid: false, error: 'Unsupported file type. Please upload a PDF or DOCX file.' };
  }

  if (file.size > MAX_FILE_BYTES) {
    return {
      valid: false,
      error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum is ${MAX_FILE_SIZE_MB}MB.`
    };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty.' };
  }

  return { valid: true, type };
}

/**
 * Convert a DOCX file buffer/arrayBuffer to Markdown via mammoth.js
 * @param {ArrayBuffer} buffer
 * @returns {Promise<string>} Clean Markdown text
 */
async function convertDOCXToMarkdown(buffer) {
  let mammoth;

  // mammoth may be loaded via npm import or global CDN script
  if (typeof window !== 'undefined' && window.mammoth) {
    mammoth = window.mammoth;
  } else {
    mammoth = await import('mammoth');
  }

  const result = await mammoth.convertToHtml({ arrayBuffer: buffer });

  // Strip HTML tags and convert basic structures to Markdown
  let markdown = htmlToMarkdown(result.value);

  // Clean up excessive whitespace
  markdown = markdown
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return markdown;
}

/**
 * Convert a PDF file to Markdown via pdf.js (loaded from CDN)
 * @param {ArrayBuffer} buffer
 * @returns {Promise<string>} Clean Markdown text
 */
async function convertPDFToMarkdown(buffer) {
  // pdf.js must be loaded via CDN script tag in index.html
  if (typeof window === 'undefined' || !window.pdfjsLib) {
    throw new Error('pdf.js library not found. Make sure the CDN script is loaded in index.html.');
  }
  const pdfjsLib = window.pdfjsLib;
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsLib.GlobalWorkerOptions.workerSrc ||
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

  const data = new Uint8Array(buffer);
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const pages = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();

    // Assemble text items into lines with proper spacing
    let lastY = null;
    let lineText = '';
    const lines = [];

    for (const item of textContent.items) {
      if (item.str === undefined) continue;

      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
        // New line
        if (lineText.trim()) {
          lines.push(lineText.trim());
        }
        lineText = '';
      } else if (lastY !== null && item.transform[4] - (lastX || 0) > 20) {
        // Significant horizontal gap -> add space (likely separate column/word)
        lineText += ' ';
      }

      lineText += item.str;
      lastY = item.transform[5];
      var lastX = item.transform[4];
    }

    if (lineText.trim()) {
      lines.push(lineText.trim());
    }

    // Format as Markdown: use ## heading for each page
    if (doc.numPages > 1) {
      pages.push(`## Page ${i}\n\n${lines.join('\n')}`);
    } else {
      pages.push(lines.join('\n'));
    }
  }

  let markdown = pages.join('\n\n');

  // Clean up
  markdown = markdown
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return markdown;
}

/**
 * Convert simple HTML to Markdown (for mammoth output)
 * This is a lightweight converter focusing on the elements mammoth typically produces.
 * @param {string} html
 * @returns {string} Markdown
 */
function htmlToMarkdown(html) {
  let text = html;

  // Remove everything inside <script> and <style> tags
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Convert <h1>-<h6> to Markdown headings
  text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  text = text.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
  text = text.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
  text = text.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');

  // Convert <strong>/<b> to **bold**
  text = text.replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, '**$2**');

  // Convert <em>/<i> to *italic*
  text = text.replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, '*$2*');

  // Convert <br> to newline
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Convert <p> to double newline (paragraph)
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');

  // Convert <ul> / <li> to Markdown lists
  text = text.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, content) => {
    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n') + '\n';
  });
  text = text.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
    let index = 1;
    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, (liMatch, liContent) => `${index++}. ${liContent}\n`) + '\n';
  });

  // Convert <a href="...">text</a> to [text](url)
  text = text.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Remove any remaining HTML tags
  text = text.replace(/<[^>]*>/g, '');

  // Decode common HTML entities
  text = text.replace(/&/g, '&');
  text = text.replace(/</g, '<');
  text = text.replace(/>/g, '>');
  text = text.replace(/"/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, ' ');

  // Collapse excessive newlines (keep max 2)
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/**
 * Unified entry point: process any supported document file to Markdown
 * @param {File} file - The file to process
 * @returns {Promise<{ success: boolean, markdown?: string, fileName?: string, error?: string }>}
 */
export async function processDocument(file) {
  const validation = validateFile(file);

  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    // Read file as ArrayBuffer
    const buffer = await file.arrayBuffer();

    let markdown;

    switch (validation.type) {
      case 'docx':
        markdown = await convertDOCXToMarkdown(buffer);
        break;
      case 'pdf':
        markdown = await convertPDFToMarkdown(buffer);
        break;
      default:
        return { success: false, error: 'Unsupported file type.' };
    }

    // Guard against empty extraction
    if (!markdown || markdown.length < 10) {
      return {
        success: false,
        error: 'Could not extract meaningful text from the file. The file may be image-based or scanned.'
      };
    }

    return {
      success: true,
      markdown,
      fileName: file.name,
      type: validation.type,
      length: markdown.length,
    };
  } catch (error) {
    console.error('Document processing failed:', error);
    return {
      success: false,
      error: `Failed to process file: ${error.message || 'Unknown error'}`
    };
  }
}

/**
 * Format file size for display
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default {
  detectFileType,
  validateFile,
  processDocument,
  formatFileSize,
};