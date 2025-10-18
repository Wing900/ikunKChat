const DEFAULT_ERROR_MESSAGE = '发生未知错误，请稍后再试。';

const NETWORK_ERROR_MESSAGES = [
  'Failed to fetch',
  'NetworkError when attempting to fetch resource.',
  'Network request failed',
  'Load failed',
  'fetch failed'
];

export interface NormalizedError {
  message: string;
  name: string;
  stack?: string;
  statusCode?: number;
  isNetworkError?: boolean;
  isAbortError?: boolean;
  raw: unknown;
}

const safeStringify = (value: unknown): string | undefined => {
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
};

const pickStatusCode = (value: unknown): number | undefined => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

export const isAbortError = (error: unknown): boolean => {
  if (!error) {
    return false;
  }

  if (error instanceof Error) {
    return error.name === 'AbortError' || (typeof (error as any).code === 'number' && (error as any).code === 20);
  }

  if (typeof error === 'object') {
    const maybeError = error as { name?: string; code?: unknown };
    if (maybeError?.name === 'AbortError') {
      return true;
    }
    if (typeof maybeError?.code === 'number' && maybeError.code === 20) {
      return true;
    }
  }

  return false;
};

export function normalizeError(error: unknown): NormalizedError {
  if (error instanceof Error) {
    const statusCode = pickStatusCode((error as any).status ?? (error as any).statusCode ?? (error as any).code);
    const normalized: NormalizedError = {
      message: error.message || DEFAULT_ERROR_MESSAGE,
      name: error.name || 'Error',
      stack: error.stack,
      statusCode,
      raw: error
    };

    const normalizedMessage = normalized.message.toLowerCase();
    normalized.isAbortError = isAbortError(error);
    normalized.isNetworkError =
      NETWORK_ERROR_MESSAGES.some(msg => msg.toLowerCase() === normalizedMessage) ||
      error.name === 'TypeError';

    return normalized;
  }

  if (typeof error === 'string') {
    const message = error.trim();
    return {
      message: message || DEFAULT_ERROR_MESSAGE,
      name: 'Error',
      raw: error
    };
  }

  if (typeof error === 'object' && error !== null) {
    const maybeMessage = typeof (error as any).message === 'string' ? (error as any).message : undefined;
    const maybeName = typeof (error as any).name === 'string' ? (error as any).name : 'Error';
    const statusCode = pickStatusCode((error as any).status ?? (error as any).statusCode ?? (error as any).code);

    const message = maybeMessage || safeStringify(error) || DEFAULT_ERROR_MESSAGE;
    const normalized: NormalizedError = {
      message,
      name: maybeName,
      statusCode,
      raw: error
    };

    const lowerMessage = message.toLowerCase();
    normalized.isAbortError = isAbortError(error);
    normalized.isNetworkError = NETWORK_ERROR_MESSAGES.some(msg => msg.toLowerCase() === lowerMessage);

    return normalized;
  }

  return {
    message: DEFAULT_ERROR_MESSAGE,
    name: 'Error',
    raw: error
  };
}

export function getUserFacingMessage(error: unknown, fallback: string = DEFAULT_ERROR_MESSAGE): string {
  const normalized = normalizeError(error);
  const trimmedMessage = normalized.message?.trim();

  if (normalized.isAbortError) {
    return '请求已取消。';
  }

  if (normalized.isNetworkError) {
    return '网络连接出现问题，请检查网络后再试。';
  }

  if (/timeout|time-out|timed\s*out/i.test(trimmedMessage)) {
    return '请求超时，请稍后重试。';
  }

  switch (normalized.statusCode) {
    case 401:
      return '认证失败，请检查 API 密钥。';
    case 403:
      return '没有权限执行此操作。';
    case 404:
      return '请求的资源不存在。';
    case 408:
      return '请求超时，请稍后重试。';
    case 429:
      return '请求过于频繁，请稍后再试。';
    default:
      break;
  }

  if (normalized.statusCode && normalized.statusCode >= 500) {
    return '服务暂时不可用，请稍后再试。';
  }

  if (!trimmedMessage || trimmedMessage === '[object Object]') {
    return fallback;
  }

  return trimmedMessage;
}

export function logError(error: unknown, context?: string, extra?: Record<string, unknown>): void {
  const normalized = normalizeError(error);
  const prefix = context ? `[${context}]` : '[Error]';

  const payload = {
    message: normalized.message,
    name: normalized.name,
    statusCode: normalized.statusCode,
    isNetworkError: normalized.isNetworkError,
    isAbortError: normalized.isAbortError,
    stack: normalized.stack,
    extra,
    raw: normalized.raw
  };

  console.error(prefix, payload);
}
