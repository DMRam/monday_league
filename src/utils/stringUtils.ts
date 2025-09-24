export const normalizeString = (str: string, options?: { capitalize?: boolean }): string => {
    // Remove accents/diacritics
    let normalized = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Trim and handle multiple spaces
    normalized = normalized.trim().replace(/\s+/g, ' ');
    
    if (options?.capitalize) {
        normalized = normalized.toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    return normalized;
};