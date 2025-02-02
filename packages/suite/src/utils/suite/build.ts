export const isDev = process.env.NODE_ENV !== 'production';

export const normalizeVersion = (version: string) =>
    // remove any zeros that are not preceded by Latin letters, decimal digits, underscores
    version.replace(/\b0+(\d)/g, '$1');
