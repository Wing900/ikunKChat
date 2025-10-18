// src/services/errors/ErrorTypes.ts

export enum ErrorType {
  // API Key Errors
  API_KEY_INVALID = 'API_KEY_INVALID',
  API_KEY_EXPIRED = 'API_KEY_EXPIRED',
  API_KEY_QUOTA_EXCEEDED = 'API_KEY_QUOTA_EXCEEDED',
  API_KEY_PERMISSION_DENIED = 'API_KEY_PERMISSION_DENIED',

  // Network Errors
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CORS_ERROR = 'CORS_ERROR',

  // Gemini API Content Errors
  SAFETY_BLOCKED = 'SAFETY_BLOCKED',
  RECITATION_BLOCKED = 'RECITATION_BLOCKED',
  CONTENT_FILTERED = 'CONTENT_FILTERED',
  MAX_TOKENS_EXCEEDED = 'MAX_TOKENS_EXCEEDED',

  // Response Truncation Errors
  RESPONSE_INCOMPLETE = 'RESPONSE_INCOMPLETE',
  STREAM_INTERRUPTED = 'STREAM_INTERRUPTED',
  FINISH_REASON_ERROR = 'FINISH_REASON_ERROR',
  RESPONSE_BLOCKED = 'RESPONSE_BLOCKED',

  // Rate Limit Errors
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // Other Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  BROWSER_COMPATIBILITY = 'BROWSER_COMPATIBILITY',
}

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly originalError?: any;

  constructor(type: ErrorType, message?: string, originalError?: any) {
    super(message || type);
    this.name = 'AppError';
    this.type = type;
    this.originalError = originalError;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
