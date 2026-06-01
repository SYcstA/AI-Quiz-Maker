// Input Sanitization Utilities
// Prevents prompt injection and other input-based attacks

/**
 * Escape HTML entities to prevent XSS when displaying user content
 */
export const escapeHTML = (str) => {
  if (!str || typeof str !== 'string') return '';
  
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Sanitize user input for AI API calls
 // Removes potential prompt injection patterns while preserving legitimate content
 */
export const sanitizeForAI = (input) => {
  if (!input || typeof input !== 'string') return '';
  
  let sanitized = input.trim();
  
  // Remove null bytes and control characters that could break parsing
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  
  // Limit length to prevent DoS (adjust based on API limits)
  const MAX_INPUT_LENGTH = 50000; // 50KB
  if (sanitized.length > MAX_INPUT_LENGTH) {
    console.warn(`Input truncated from ${input.length} to ${MAX_INPUT_LENGTH} characters`);
    sanitized = sanitized.slice(0, MAX_INPUT_LENGTH);
  }
  
  return sanitized;
};

/**
 * Detect potential prompt injection attempts
 // Returns true if suspicious patterns detected
 */
export const detectPromptInjection = (input) => {
  if (!input || typeof input !== 'string') return false;
  
  const lowerInput = input.toLowerCase();
  
  // Patterns that indicate attempted prompt manipulation
  const injectionPatterns = [
    /\bignore.*instructions?\b/i,
    /\bsystem.*prompt\s*:?/i,
    /\bstop.*sequence\b/i,
    /\boverride.*settings\b/i,
    /\brestart.*model\b/i,
    /\breturn.*raw.*output\b/i,
    /\bignore.*security\b/i,
    /\bpretend.*to.*be\b/i,
    /\bact.*as.*different\b/i,
    /\bformat.*output.*json\b/i, // Common injection technique
    /\bbase64\s*[:=]\s*/i,
    /\b<\?php\b/i,
    /\beval\s*\(/i,
    /\bexec\s*\(/i,
  ];
  
  return injectionPatterns.some(pattern => pattern.test(input));
};

/**
 * Filter adult/inappropriate content (already in main.js, but centralized here)
 */
export const containsAdultContent = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  const patterns = [
    /18\+/i,
    /\bporno\b/i,
    /\bporn\b/i,
    /\bseks\b/i,
    /\bseksual\b/i,
    /\bnude\b/i,
    /\bbugil\b/i,
    /\badult\b/i,
    /\bexplicit\b/i,
    /\berotik\b/i,
    /\bnsfw\b/i,
    /\bxxx\b/i,
    /\btelanjang\b/i
  ];
  
  return patterns.some(pattern => pattern.test(text));
};

/**
 * Validate and clean file names for uploads
 */
export const sanitizeFileName = (filename) => {
  if (!filename || typeof filename !== 'string') return '';
  
  // Remove potentially dangerous characters
  let safeName = filename.replace(/[<>:"/\\|?*]/g, '');
  
  // Limit length
  if (safeName.length > 255) {
    safeName = safeName.slice(0, 255);
  }
  
  return safeName;
};

/**
 * Validate file extension safely
 */
export const validateFileExtension = (filename) => {
  if (!filename || typeof filename !== 'string') return false;
  
  // Get lowercase extension
  const ext = '.' + filename.split('.').pop().toLowerCase();
  
  // Check against allowed extensions
  const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];
  return ALLOWED_EXTENSIONS.includes(ext);
};

/**
 * Main sanitization pipeline for user input before API calls
 */
export const sanitizeInputForAPI = (input) => {
  // Apply all sanitizations in sequence
  let result = input;
  
  if (!result || typeof result !== 'string') {
    throw new Error('Invalid input type');
  }
  
  // Check for injection attempts first
  if (detectPromptInjection(result)) {
    throw new Error('Potentially malicious content detected');
  }
  
  // Sanitize and escape
  result = sanitizeForAI(result);
  result = escapeHTML(result); // Double protection
  
  return result;
};