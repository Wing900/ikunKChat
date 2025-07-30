const KEY_INDEX_KEY = 'kchat-key-index';

/**
 * Gets the last successfully used index from local storage.
 * @returns {number} The last used index, or -1 if not found.
 */
function getLastUsedIndex(): number {
  const indexStr = localStorage.getItem(KEY_INDEX_KEY);
  return indexStr ? parseInt(indexStr, 10) : -1;
}

/**
 * Saves the last successfully used index to local storage.
 * @param {number} index - The index to save.
 */
function saveLastUsedIndex(index: number) {
  localStorage.setItem(KEY_INDEX_KEY, String(index));
}

/**
 * Manages the rotation of API keys in a round-robin fashion.
 */
export class KeyManager {
  private keys: string[];
  private currentIndex: number;

  constructor(keys: string[]) {
    // Filter out any empty strings that might result from user input
    this.keys = (keys || []).filter(k => k && k.trim() !== '');
    // Start from the last known index to continue the rotation
    this.currentIndex = getLastUsedIndex();
  }

  /**
   * Gets the next key in the rotation.
   * @returns {{ key: string | null, index: number }} The next key and its index.
   */
  getNextKey(): { key: string | null, index: number } {
    if (this.keys.length === 0) {
      return { key: null, index: -1 };
    }
    
    // Move to the next index, wrapping around if necessary
    const nextIndex = (this.currentIndex + 1) % this.keys.length;
    this.currentIndex = nextIndex;
    
    return { key: this.keys[this.currentIndex], index: this.currentIndex };
  }

  /**
   * Saves the index of the last key that resulted in a successful API call.
   */
  saveSuccessIndex() {
      saveLastUsedIndex(this.currentIndex);
  }

  /**
   * Returns the total number of available keys.
   * @returns {number}
   */
  getTotalKeys(): number {
    return this.keys.length;
  }
}
