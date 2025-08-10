/**
 * Validation service for preventing code generation during registration
 * Provides input sanitization and security validation
 */

// Common code patterns to detect and block
const CODE_PATTERNS = [
  // JavaScript patterns
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /eval\s*\(/gi,
  /function\s*\(/gi,
  /document\.write/gi,
  /document\.cookie/gi,
  /window\./gi,
  /alert\s*\(/gi,
  /console\./gi,
  
  // SQL injection patterns
  /union\s+select/gi,
  /drop\s+table/gi,
  /insert\s+into/gi,
  /delete\s+from/gi,
  /update\s+set/gi,
  /select\s+\*/gi,
  
  // PHP patterns
  /<\?php/gi,
  /<\?=/gi,
  /phpinfo\s*\(/gi,
  /system\s*\(/gi,
  /exec\s*\(/gi,
  
  // General executable patterns
  /<\?/gi,
  /<%/gi,
  /<\?xml/gi,
  /<!--/gi,
  /\$\{.*\}/gi, // Template literals
  /`.*`/gi, // Backticks for template strings
];

// Characters that might indicate code injection
// Note: These are implicitly handled by the validation patterns above

/**
 * Sanitizes input by removing potentially dangerous characters and patterns
 * @param {string} input - The input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input.trim();
  
  // Remove code patterns
  CODE_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  // Escape HTML entities
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#x27;');
  
  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
};

/**
 * Validates if input contains code-like patterns
 * @param {string} input - The input to validate
 * @returns {object} - Validation result with isValid flag and error message
 */
export const validateNoCode = (input) => {
  if (typeof input !== 'string') {
    return { isValid: false, error: 'Input must be a string' };
  }

  const trimmedInput = input.trim();
  
  if (!trimmedInput) {
    return { isValid: false, error: 'Input cannot be empty' };
  }

  // Check for code patterns
  for (const pattern of CODE_PATTERNS) {
    if (pattern.test(trimmedInput)) {
      return { 
        isValid: false, 
        error: 'Input contains potentially dangerous code patterns' 
      };
    }
  }

  // Check for suspicious character sequences
  const suspiciousSequence = /[<>\\&;|]{2,}/;
  if (suspiciousSequence.test(trimmedInput)) {
    return { 
      isValid: false, 
      error: 'Input contains suspicious character sequences' 
    };
  }

  // Check for excessive special characters
  const specialCharRatio = (trimmedInput.match(/[^a-zA-Z0-9\s]/g) || []).length / trimmedInput.length;
  if (specialCharRatio > 0.3) {
    return { 
      isValid: false, 
      error: 'Input contains too many special characters' 
    };
  }

  return { isValid: true, error: null };
};

/**
 * Validates and sanitizes full name input
 * @param {string} fullName - The full name to validate
 * @returns {object} - Validation result with sanitized name and any errors
 */
export const validateFullName = (fullName) => {
  const validation = validateNoCode(fullName);
  
  if (!validation.isValid) {
    return { ...validation, sanitizedName: '' };
  }

  const sanitizedName = sanitizeInput(fullName);
  
  // Additional name-specific validation
  if (sanitizedName.length < 2 || sanitizedName.length > 100) {
    return { 
      isValid: false, 
      error: 'Name must be between 2 and 100 characters',
      sanitizedName: '' 
    };
  }

  // Check for valid name characters (letters, spaces, hyphens, apostrophes)
  const namePattern = /^[a-zA-Z\s\-'’]+$/;
  if (!namePattern.test(sanitizedName)) {
    return { 
      isValid: false, 
      error: 'Name can only contain letters, spaces, hyphens, and apostrophes',
      sanitizedName: '' 
    };
  }

  return { 
    isValid: true, 
    error: null, 
    sanitizedName 
  };
};

/**
 * Validates Excel file content for bulk upload
 * @param {Array} rows - Excel rows data
 * @returns {object} - Validation result with valid rows and errors
 */
export const validateExcelContent = (rows) => {
  const validRows = [];
  const errors = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // +2 to account for header and 0-based index
    
    if (!row[0] && !row[1]) {
      errors.push(`Row ${rowNumber}: Missing full name`);
      return;
    }

    const fullName = row[0] || row[1];
    const nameValidation = validateFullName(fullName);
    
    if (!nameValidation.isValid) {
      errors.push(`Row ${rowNumber}: ${nameValidation.error}`);
      return;
    }

    validRows.push({
      fullName: nameValidation.sanitizedName,
      originalIndex: index
    });
  });

  return {
    validRows,
    errors,
    isValid: errors.length === 0
  };
};

/**
 * Checks for potential SQL injection attempts
 * @param {string} input - The input to check
 * @returns {boolean} - True if SQL injection detected
 */
export const detectSQLInjection = (input) => {
  const sqlKeywords = [
    'select', 'insert', 'update', 'delete', 'drop', 'create', 'alter',
    'exec', 'execute', 'union', 'where', 'or', 'and', 'like', 'having'
  ];
  
  const lowerInput = input.toLowerCase();
  
  // Check for SQL keywords followed by special characters
  const sqlPattern = new RegExp(
    `\\b(${sqlKeywords.join('|')})\\s*['"\\-;()]`,
    'gi'
  );
  
  return sqlPattern.test(lowerInput);
};

/**
 * Comprehensive security check for all registration inputs
 * @param {object} inputs - Object containing all registration inputs
 * @returns {object} - Security validation result
 */
export const securityCheck = (inputs) => {
  const results = {
    isSecure: true,
    errors: [],
    sanitizedInputs: {}
  };

  // Validate fullName
  if (inputs.fullName) {
    const nameValidation = validateFullName(inputs.fullName);
    if (!nameValidation.isValid) {
      results.isSecure = false;
      results.errors.push(`Full Name: ${nameValidation.error}`);
    } else {
      results.sanitizedInputs.fullName = nameValidation.sanitizedName;
    }
  }

  // Validate indexNumber (should be numeric only)
  if (inputs.indexNumber) {
    const indexStr = inputs.indexNumber.toString();
    if (!/^\d+$/.test(indexStr)) {
      results.isSecure = false;
      results.errors.push('Index Number must contain only digits');
    } else {
      results.sanitizedInputs.indexNumber = indexStr;
    }
  }

  // Validate code (should be numeric only)
  if (inputs.code) {
    const codeStr = inputs.code.toString();
    if (!/^\d{6}$/.test(codeStr)) {
      results.isSecure = false;
      results.errors.push('Code must be exactly 6 digits');
    } else {
      results.sanitizedInputs.code = codeStr;
    }
  }

  return results;
};
