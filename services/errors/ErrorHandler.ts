// src/services/errors/ErrorHandler.ts

import { AppError, ErrorType } from './ErrorTypes';
import { ErrorMessages } from './ErrorMessages';
import { parseGeminiError } from './GeminiErrorParser';

const DEFAULT_LANGUAGE = 'zh'; // 'en' or 'zh'

/**
 * Main error handler for the application.
 * It logs the error, attempts to parse it as a Gemini API error,
 * and returns a user-friendly error message.
 *
 * @param error The error object to handle.
 * @param apiKeySuffix Optional suffix of the API key for logging.
 * @param lang The language for the error message ('en' or 'zh').
 * @returns A user-friendly error message string.
 */
export const handleError = (
  error: any,
  apiKeySuffix: string = '',
  lang: 'en' | 'zh' = DEFAULT_LANGUAGE
): string => {
  let appError: AppError;

  // 1. Check if it's already an AppError
  if (error instanceof AppError) {
    appError = error;
  } else {
    // 2. Try to parse it as a specific Gemini API error
    const parsedError = parseGeminiError(error);
    if (parsedError) {
      appError = parsedError;
    } else {
      // 3. Fallback to a generic unknown error
      appError = new AppError(
        ErrorType.UNKNOWN_ERROR,
        error?.message || 'An unexpected error occurred.',
        error
      );
    }
  }

  // Log the detailed error for debugging
  console.error('[ErrorHandler]', {
    type: appError.type,
    message: appError.message,
    apiKeySuffix: apiKeySuffix,
    originalError: appError.originalError,
    stack: appError.stack,
  });

  // Return the user-friendly message
  const messageTemplates = ErrorMessages[appError.type] || ErrorMessages[ErrorType.UNKNOWN_ERROR];
  let userMessage = messageTemplates[lang];

  // Append specific details if available in the error message
  if (appError.type === ErrorType.BROWSER_COMPATIBILITY && appError.message) {
      userMessage += ` (${appError.message})`;
  }

  return `[${appError.type}] ${userMessage}`;
};
