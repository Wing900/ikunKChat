
export const checkBrowserCompatibility = (): { isCompatible: boolean; reason: string } => {
  // 检查 Fetch API
  if (typeof fetch === 'undefined') {
    return { isCompatible: false, reason: 'Fetch API is not supported.' };
  }

  // 检查 ReadableStream
  if (typeof ReadableStream === 'undefined') {
    return { isCompatible: false, reason: 'ReadableStream is not supported.' };
  }

  // 检查 URL API
  if (typeof URL === 'undefined') {
    return { isCompatible: false, reason: 'URL API is not supported.' };
  }
  
  // 检查 TextEncoder 和 TextDecoder
  if (typeof TextEncoder === 'undefined' || typeof TextDecoder === 'undefined') {
    return { isCompatible: false, reason: 'TextEncoder or TextDecoder is not supported.' };
  }

  return { isCompatible: true, reason: 'Browser is compatible.' };
};
