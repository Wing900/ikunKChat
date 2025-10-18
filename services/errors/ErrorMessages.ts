// src/services/errors/ErrorMessages.ts

import { ErrorType } from './ErrorTypes';

export const ErrorMessages: Record<ErrorType, { en: string; zh: string }> = {
  [ErrorType.API_KEY_INVALID]: {
    en: 'Invalid API key. Please check your key and try again.',
    zh: 'API 密钥无效。请检查您的密钥后重试。',
  },
  [ErrorType.API_KEY_EXPIRED]: {
    en: 'API key has expired. Please get a new one.',
    zh: 'API 密钥已过期。请获取新的密钥。',
  },
  [ErrorType.API_KEY_QUOTA_EXCEEDED]: {
    en: 'API key quota exceeded. Please check your usage or get a new key.',
    zh: 'API 密钥配额已用尽。请检查您的用量或更换密钥。',
  },
  [ErrorType.API_KEY_PERMISSION_DENIED]: {
    en: 'Permission denied for this API key. Please check its permissions.',
    zh: 'API 密钥权限不足。请检查其权限设置。',
  },
  [ErrorType.NETWORK_TIMEOUT]: {
    en: 'Request timed out. Please check your network and try again.',
    zh: '请求超时。请检查您的网络并稍后重试。',
  },
  [ErrorType.NETWORK_ERROR]: {
    en: 'Network error. Please check your connection and try again.',
    zh: '网络连接失败。请检查您的网络连接后重试。',
  },
  [ErrorType.CORS_ERROR]: {
    en: 'CORS error. This might be a configuration issue with the proxy.',
    zh: '跨域请求错误。这可能是代理服务器的配置问题。',
  },
  [ErrorType.SAFETY_BLOCKED]: {
    en: 'Content blocked due to safety settings. Adjust safety settings if possible.',
    zh: '由于安全设置，内容已被屏蔽。如果可能，请调整安全设置。',
  },
  [ErrorType.RECITATION_BLOCKED]: {
    en: 'Content blocked due to recitation policy. The model cited a source too heavily.',
    zh: '因引用问题，内容已被屏蔽。模型可能过度引用了某些来源。',
  },
  [ErrorType.CONTENT_FILTERED]: {
    en: 'Content was filtered. The response may be incomplete.',
    zh: '内容已被过滤，响应可能不完整。',
  },
  [ErrorType.MAX_TOKENS_EXCEEDED]: {
    en: 'Maximum tokens exceeded. The request or response is too long.',
    zh: '超过最大令牌数。您的请求或模型的响应过长。',
  },
  [ErrorType.RESPONSE_INCOMPLETE]: {
    en: 'Response is incomplete. This might be due to network issues or service interruptions.',
    zh: '响应不完整。这可能是由于网络问题或服务中断造成的。',
  },
  [ErrorType.STREAM_INTERRUPTED]: {
    en: 'Stream was interrupted. Please try generating the response again.',
    zh: '流式响应中断。请尝试重新生成回答。',
  },
  [ErrorType.FINISH_REASON_ERROR]: {
    en: 'The model stopped for an unusual reason. Please try again.',
    zh: '模型因异常原因停止生成。请重试。',
  },
  [ErrorType.RESPONSE_BLOCKED]: {
    en: 'Response was blocked. This is often due to safety or policy reasons.',
    zh: '响应被阻止。通常是由于安全或政策原因。',
  },
  [ErrorType.RATE_LIMIT_EXCEEDED]: {
    en: 'Rate limit exceeded. Please wait and try again later.',
    zh: '已达到速率限制。请稍后重试。',
  },
  [ErrorType.TOO_MANY_REQUESTS]: {
    en: 'Too many requests. Please slow down and try again later.',
    zh: '请求过于频繁。请降低请求频率后重试。',
  },
  [ErrorType.UNKNOWN_ERROR]: {
    en: 'An unknown error occurred. Please try again or contact support.',
    zh: '发生未知错误。请重试或联系技术支持。',
  },
  [ErrorType.PARSING_ERROR]: {
    en: 'Error parsing the response from the server.',
    zh: '解析服务器响应时出错。',
  },
  [ErrorType.BROWSER_COMPATIBILITY]: {
    en: 'Your browser is not fully compatible. Please use a modern browser like Chrome, Firefox, or Edge for the best experience.',
    zh: '您的浏览器不完全兼容。为了获得最佳体验，请使用最新版本的 Chrome、Firefox 或 Edge 浏览器。',
  },
};
