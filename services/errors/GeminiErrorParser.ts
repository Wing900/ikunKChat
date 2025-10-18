// src/services/errors/GeminiErrorParser.ts

import { AppError, ErrorType } from './ErrorTypes';

// Based on Google's documentation and observed errors
// https://ai.google.dev/api/rest/v1beta/ErrorCode
// https://ai.google.dev/api/rest/v1beta/GenerateContentResponse#FinishReason

/**
 * Parses errors from the Google Gemini API.
 * @param error The error object, which can be of any type.
 * @returns An AppError with a specific ErrorType, or null if the error is not recognized.
 */
export const parseGeminiError = (error: any): AppError | null => {
  if (!error) return null;

  const message = error.message || '';
  const status = error.httpStatus || error.code || (error.e?.code);
  const finishReason = error.finishReason;

  // 1. Check for API Key related errors
  if (status === 403 || message.includes('API_KEY_INVALID') || message.includes('permission denied')) {
    return new AppError(ErrorType.API_KEY_PERMISSION_DENIED, message, error);
  }
  if (status === 400 && message.includes('api-key')) {
      return new AppError(ErrorType.API_KEY_INVALID, message, error);
  }
  if (status === 429 || message.includes('QUOTA_EXCEEDED')) {
    return new AppError(ErrorType.API_KEY_QUOTA_EXCEEDED, message, error);
  }

  // 2. Check for Rate Limit errors
  if (status === 429 || message.includes('rate limit')) {
    return new AppError(ErrorType.RATE_LIMIT_EXCEEDED, message, error);
  }
  
  // 3. Check for Content safety and finish reasons
  if (finishReason) {
    switch (finishReason) {
      case 'SAFETY':
        return new AppError(ErrorType.SAFETY_BLOCKED, 'Response blocked due to safety settings.', error);
      case 'RECITATION':
        return new AppError(ErrorType.RECITATION_BLOCKED, 'Response blocked due to recitation policy.', error);
      case 'MAX_TOKENS':
        return new AppError(ErrorType.MAX_TOKENS_EXCEEDED, 'Maximum tokens exceeded.', error);
      case 'OTHER':
        return new AppError(ErrorType.FINISH_REASON_ERROR, 'The model stopped for an unspecified reason.', error);
    }
  }
  // Check within the response content as well
  if(message.includes('SAFETY')) {
      return new AppError(ErrorType.SAFETY_BLOCKED, 'Response may be blocked due to safety settings.', error);
  }


  // 4. Check for Network and server-side issues
  if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch failed')) {
      return new AppError(ErrorType.NETWORK_ERROR, message, error);
  }
   if (status === 503 || status === 504 || message.includes('timeout')) {
      return new AppError(ErrorType.NETWORK_TIMEOUT, message, error);
  }
  if (status === 500) {
      return new AppError(ErrorType.UNKNOWN_ERROR, 'Google API is unavailable (500)', error);
  }
  
  // 5. Check for invalid arguments (could be malformed requests)
  if (status === 400) {
    // This is a broad category. Could be invalid JSON, malformed content, etc.
    // Let the generic handler classify it, or add more specific checks if needed.
    return new AppError(ErrorType.PARSING_ERROR, `Invalid request: ${message}`, error);
  }

  return null; // Error not recognized as a specific Gemini API error
};
