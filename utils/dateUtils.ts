
/**
 * Utility to handle date conversion and formatting, avoiding timezone shifts.
 */

/**
 * Safely parses a date string or Date object into a Date object representing the 
 * LOCAL time, avoiding the UTC shift common with 'YYYY-MM-DD' strings.
 */
export const safelyParseDate = (dateSource: string | Date | null | undefined): Date | null => {
    if (!dateSource) return null;
    if (dateSource instanceof Date) return isNaN(dateSource.getTime()) ? null : dateSource;

    try {
        // If it's a date-only string (YYYY-MM-DD)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateSource)) {
            const [year, month, day] = dateSource.split('-').map(Number);
            return new Date(year, month - 1, day);
        }

        // If it's an ISO string with T, but we want to treat the date part as local if no Z or offset is present
        // Actually, if it has a T, it usually comes from the database with Z or is already an ISO string.
        // If it's "2023-10-27T10:00:00", new Date() treats it as LOCAL.
        // If it's "2023-10-27T10:00:00Z", new Date() treats it as UTC.
        const date = new Date(dateSource);
        if (isNaN(date.getTime())) return null;

        // Check if the source was a simple date string WITHOUT time that got shifted
        // (Postgres might return "2023-10-27 10:00:00" which browsers might treat as UTC)
        if (typeof dateSource === 'string' && !dateSource.includes('T') && dateSource.includes(':')) {
            // Try parsing with space as local
            const spaceSplit = dateSource.split(' ');
            if (spaceSplit.length === 2 && /^\d{4}-\d{2}-\d{2}$/.test(spaceSplit[0])) {
                const [year, month, day] = spaceSplit[0].split('-').map(Number);
                const [hours, minutes, seconds] = spaceSplit[1].split(':').map(Number);
                return new Date(year, month - 1, day, hours, minutes || 0, seconds || 0);
            }
        }

        return date;
    } catch (e) {
        return null;
    }
};

/**
 * Formats a date string to pt-BR local format (DD/MM/YYYY).
 */
export const formatLocalDate = (dateStr: string | null | undefined): string => {
    const date = safelyParseDate(dateStr);
    if (!date) return '---';
    return date.toLocaleDateString('pt-BR');
};

/**
 * Formats a date or string to pt-BR Locale string (with time).
 */
export const formatLocalDateTime = (dateStr: string | null | undefined): string => {
    const date = safelyParseDate(dateStr);
    if (!date) return '---';
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Returns an object with local date (YYYY-MM-DD) and local time (HH:mm)
 * from a Date object or ISO string, avoiding timezone shifts.
 */
export const getLocalISOData = (dateSource: string | Date | null | undefined) => {
    const d = safelyParseDate(dateSource);
    if (!d) return { date: '', time: '' };

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

/**
 * Returns current date/time in YYYY-MM-DDTHH:mm format for datetime-local inputs.
 */
export const currentLocalISO = (date: Date = new Date()): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};
