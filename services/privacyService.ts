const PRIVACY_CONSENT_KEY = 'kchat-privacy-consent';
const LAST_READ_VERSION_KEY = 'kchat-last-read-version';

// --- Privacy Consent ---
export const loadPrivacyConsent = (): { consented: boolean; version: string } | null => {
    try {
        const saved = localStorage.getItem(PRIVACY_CONSENT_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch (error) {
        console.error("Failed to load privacy consent from localStorage", error);
        return null;
    }
};

export const savePrivacyConsent = (version: string) => {
    try {
        const consent = {
            consented: true,
            version: version,
            timestamp: Date.now()
        };
        localStorage.setItem(PRIVACY_CONSENT_KEY, JSON.stringify(consent));
    } catch (error) {
        console.error("Failed to save privacy consent to localStorage", error);
    }
};

// --- Update Notification ---
export const loadLastReadVersion = (): string | null => {
    try {
        return localStorage.getItem(LAST_READ_VERSION_KEY);
    } catch (error) {
        console.error("Failed to load last read version from localStorage", error);
        return null;
    }
};

export const saveLastReadVersion = (version: string) => {
    try {
        localStorage.setItem(LAST_READ_VERSION_KEY, version);
    } catch (error) {
        console.error("Failed to save last read version to localStorage", error);
    }
};