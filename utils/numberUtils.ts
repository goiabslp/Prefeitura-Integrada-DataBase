/**
 * Parses a string formatted as a Brazilian number (dot for thousands, comma for decimals)
 * into a float.
 * @param value The formatted string (e.g., "1.234,56")
 * @returns The parsed float (e.g., 1234.56)
 */
export const parseFormattedNumber = (value: string): number => {
    if (!value) return 0;
    // Remove dots, replace comma with dot
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
};

/**
 * Formats a number for input display with fixed decimal places and thousands separator.
 * @param value The string value from an input
 * @param decimals Number of decimal places
 * @returns Formatted string (e.g., "1.234,56")
 */
export const formatNumberInput = (value: string, decimals: number): string => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';

    // Convert to float based on precision
    const floatVal = parseInt(digits) / Math.pow(10, decimals);

    // Format with thousands separator and correct decimal places
    return floatVal.toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};
