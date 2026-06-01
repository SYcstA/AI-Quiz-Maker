/**
 * File Upload & Text Extraction Handler
 * Handles PDF and DOCX file uploads with robust text extraction
 */

import { showToast } from './components.js';

// ============================================
// PDF TEXT EXTRACTION USING PDF.JS
// ============================================

/**
 * Extract text content from a PDF file using PDF.js
 * @param {File} file - The uploaded PDF file
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractTextFromPDF(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    // Read the file as an ArrayBuffer
    reader.onload = async (event) => {
      try {
        const typedArray = new Uint8Array(event.target.result);
        
        // Load PDF document using PDF.js
        const loadingTask = pdfjsLib.getDocument(typedArray.buffer);
        const pdf = await loadingTask.promise;

        let fullText = '';

        // Iterate through all pages and extract text
        for (let i = 1; i <= pdf.numPages; i++) {
          try {
            const page = await pdf.getPage(i);
            
            // Extract text from the page
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            
            fullText += `${pageText}\n\n`;
          } catch (pageError) {
            console.warn(`Warning: Could not extract text from page ${i}:`, pageError.message);
          }
        }

        // Cleanup
        pdf.cleanup();

        resolve(fullText.trim());
      } catch (error) {
        reject(new Error(`PDF extraction failed: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read PDF file'));
    };

    // Read the file
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Extract text content from a DOCX file using Mammoth.js
 * @param {File} file - The uploaded DOCX file
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractTextFromDOCX(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    // Read the file as a Data URL
    reader.onload = (event) => {
      try {
        const dataUrl = event.target.result;
        
        // Use Mammoth.js to convert DOCX to text
        mammoth.convertToHtml({ path: dataUrl })
          .then(result => {
            // Extract plain text from HTML, removing formatting tags
            let htmlText = result.value;
            
            // Remove all HTML tags except those that preserve meaning
            const cleanRegex = /<[^>]+>/g;
            let plainText = htmlText.replace(cleanRegex, ' ').trim();
            
            // Normalize whitespace
            plainText = plainText.replace(/\s+/g, ' ').trim();
            
            resolve(plainText);
          })
          .catch(error => {
            reject(new Error(`DOCX extraction failed: ${error.message}`));
          });
      } catch (error) {
        reject(new Error(`Failed to read DOCX file: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read DOCX file'));
    };

    // Read the file as Data URL
    reader.readAsDataURL(file);
  });
}

// ============================================
// UNIFIED FILE PROCESSOR
// ============================================

/**
 * Unified function to extract text from any supported document type
 * @param {File} file - The uploaded file
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractTextFromFile(file) {
  const fileName = file.name.toLowerCase();
  
  try {
    console.log(`📄 Processing file: ${file.name}`);
    
    // Route to appropriate extractor based on file type
    if (fileName.endsWith('.pdf')) {
      return await extractTextFromPDF(file);
    } else if (fileName.endsWith('.docx')) {
      return await extractTextFromDOCX(file);
    } else {
      throw new Error(`Unsupported file format: ${file.name}. Supported formats: PDF, DOCX`);
    }
  } catch (error) {
    console.error('❌ Extraction error:', error);
    throw error;
  }
}

/**
 * Process uploaded file and return extracted text with metadata
 * @param {File} file - The uploaded file
 * @returns {Promise<Object>} - Object containing text, success status, and metadata
 */
export async function processUploadedFile(file) {
  const startTime = Date.now();
  
  try {
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error(`File exceeds maximum size of ${maxSize / 1024 / 1024}MB`);
    }

    // Extract text from file
    const extractedText = await extractTextFromFile(file);
    
    const processingTime = Date.now() - startTime;
    
    return {
      success: true,
      text: extractedText,
      wordCount: extractedText.split(/\s+/).filter(word => word.length > 0).length,
      charCount: extractedText.length,
      fileName: file.name,
      fileSize: (file.size / 1024).toFixed(2) + ' KB',
      processingTime: `${processingTime}ms`,
      pageCount: await countPDFPages(file), // Only for PDFs
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      fileName: file.name,
    };
  }
}

/**
 * Count pages in a PDF file (for metadata)
 * @param {File} file - The PDF file
 * @returns {Promise<number>} - Number of pages, or 0 if not a PDF
 */
async function countPDFPages(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const typedArray = new Uint8Array(event.target.result);
        const loadingTask = pdfjsLib.getDocument(typedArray.buffer);
        const pdf = await loadingTask.promise;
        resolve(pdf.numPages);
        pdf.cleanup();
      } catch (error) {
        resolve(0);
      }
    };
    
    reader.readAsArrayBuffer(file);
  });
}

// ============================================
// EXPORT DEFAULTS
// ============================================

export default {
  extractTextFromPDF,
  extractTextFromDOCX,
  extractTextFromFile,
  processUploadedFile,
};