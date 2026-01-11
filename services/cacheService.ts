
import { AppState } from '../types';

const CACHE_PREFIX = 'cached_img_';

// Mapping of AppState paths to unique cache keys
export const IMAGE_KEYS = {
    logoUrl: 'branding_logo',
    watermarkUrl: 'branding_watermark',
    headerLogoUrl: 'ui_header_logo',
    loginLogoUrl: 'ui_login_logo'
} as const;

/**
 * Downloads an image and converts it to Base64
 */
const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error(`Failed to fetch and cache image from ${url}`, error);
        return null;
    }
};

/**
 * Main routine to sync remote URLs with LocalStorage cache.
 * Call this whenever global settings are loaded or updated.
 */
export const syncImageCache = async (state: AppState) => {
    const targets = [
        { key: IMAGE_KEYS.logoUrl, url: state.branding.logoUrl },
        { key: IMAGE_KEYS.watermarkUrl, url: state.branding.watermark.imageUrl },
        { key: IMAGE_KEYS.headerLogoUrl, url: state.ui.headerLogoUrl },
        { key: IMAGE_KEYS.loginLogoUrl, url: state.ui.loginLogoUrl }
    ];

    for (const target of targets) {
        const cacheKey = CACHE_PREFIX + target.key;
        const urlKey = CACHE_PREFIX + target.key + '_url';

        const storedUrl = localStorage.getItem(urlKey);
        const storedData = localStorage.getItem(cacheKey);

        // If there is no URL in settings, clear cache for this item
        if (!target.url) {
            if (storedData) {
                localStorage.removeItem(cacheKey);
                localStorage.removeItem(urlKey);
            }
            continue;
        }

        // If URL changed or data missing, fetch and cache
        if (storedUrl !== target.url || !storedData) {
            // Clear old potential conflict
            localStorage.removeItem(cacheKey);

            console.log(`Caching new image for ${target.key}...`);
            const base64 = await fetchImageAsBase64(target.url);

            if (base64) {
                try {
                    localStorage.setItem(cacheKey, base64);
                    localStorage.setItem(urlKey, target.url);
                    console.log(`Cached ${target.key} successfully.`);
                } catch (e) {
                    console.warn('LocalStorage limit exceeded or error saving image.', e);
                }
            }
        }
    }
};

/**
 * Retrieves the cached base64 image if available and valid.
 * Fallbacks to the original URL if not cached.
 */
export const getCachedImage = (originalUrl: string | undefined | null, key: string): string | undefined => {
    if (!originalUrl) return undefined;

    // Find which specific key matches if we want strict verification, 
    // but simpler to just lookup by key name passed by component
    const cacheKey = CACHE_PREFIX + key;
    const urlKey = CACHE_PREFIX + key + '_url';

    const storedUrl = localStorage.getItem(urlKey);
    const storedData = localStorage.getItem(cacheKey);

    // If the cached URL matches the current requested URL, return the Base64 data
    if (storedUrl === originalUrl && storedData) {
        return storedData;
    }

    return originalUrl;
};
