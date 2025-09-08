export const validate = (text, options = {}) => {
    const defaults = {
        minLength: 15,
        minUniqueChars: 3,
        maxRepeat: 4,
        allowNumbers: true,
        allowSpecialChars: true
    };

    const config = { ...defaults, ...options };
    const cleanText = text?.trim() || '';

    if (cleanText.length === 0) {
        return { isValid: false, reason: 'empty' };
    }

    if (cleanText.length < config.minLength) {
        return { isValid: false, reason: 'length' };
    }

    // Verificar caracteres únicos
    const uniqueChars = new Set(cleanText.replace(/\s/g, ''));
    if (uniqueChars.size < config.minUniqueChars) {
        return { isValid: false, reason: 'repetitive' };
    }

    // Verificar secuencias repetidas
    const repeatPattern = new RegExp(`(.)\\1{${config.maxRepeat},}`);
    if (repeatPattern.test(cleanText)) {
        return { isValid: false, reason: 'sequence' };
    }

    return { isValid: true };
}