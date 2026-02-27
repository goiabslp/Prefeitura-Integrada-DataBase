
/**
 * Utility to handle date conversion and formatting, avoiding timezone shifts.
 */

/**
 * Formats a date string to pt-BR local format (DD/MM/YYYY).
 * Prevents timezone shifts by parsing the string relative to local time.
 */
export const formatLocalDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '---';

    try {
        // Handle YYYY-MM-DD format directly
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const [year, month, day] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
        }

        // Handle ISO strings (YYYY-MM-DDTHH:mm...)
        // We take the date part and parse it as local midnight to ensure the day remains correct
        // regardless of the UTC shift if the time part is near midnight.
        if (dateStr.includes('T')) {
            const datePart = dateStr.split('T')[0];
            const [year, month, day] = datePart.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString('pt-BR');
            }
        }

        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '---';
        return date.toLocaleDateString('pt-BR');
    } catch (e) {
        console.error('Error formatting date:', e);
        return '---';
    }
};

/**
 * Formats a date or string to pt-BR Locale string (with time).
 * Robustly handles YYYY-MM-DD as local date instead of UTC.
 */
export const formatLocalDateTime = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '---';

    try {
        // If it's a date-only string (YYYY-MM-DD), parse it as local
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const [year, month, day] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day).toLocaleString('pt-BR');
        }

        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '---';
        return date.toLocaleString('pt-BR');
    } catch (e) {
        console.error('Error formatting datetime:', e);
        return '---';
    }
};

/**
 * Returns an object with local date (YYYY-MM-DD) and local time (HH:mm)
 * from a Date object or ISO string, avoiding timezone shifts.
 */
export const getLocalISOData = (dateSource: string | Date | null | undefined) => {
    if (!dateSource) return { date: '', time: '' };

    const d = typeof dateSource === 'string' ? new Date(dateSource) : dateSource;
    if (isNaN(d.getTime())) return { date: '', time: '' };

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return {
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`
    };
};
