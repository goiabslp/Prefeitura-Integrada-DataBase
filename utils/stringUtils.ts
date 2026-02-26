
/**
 * Normalizes text for searching by:
 * 1. Removing accents
 * 2. Converting to lowercase
 * 3. Removing special characters
 */
export const normalizeText = (text: string): string => {
    return text
        .normalize('NFD') // Decompose combined characters into base + accent
        .replace(/[\u0300-\u036f]/g, '') // Remove the accent marks
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .trim();
};

/**
 * Checks if a haystack contains a needle, ignoring accents and case.
 */
export const fuzzyMatch = (haystack: string, needle: string): boolean => {
    if (!needle) return true;
    if (!haystack) return false;

    const normalizedHaystack = normalizeText(haystack);
    const normalizedNeedle = normalizeText(needle);

    return normalizedHaystack.includes(normalizedNeedle);
};
