// ─── NyraAI Color System — Rich Deep Palette ─────────────────────

export const lightPalette = {
    // Brand — richer royal blue
    primary: '#2563eb',
    primaryLight: '#3b82f6',
    primaryDark: '#1d4ed8',
    primaryForeground: '#ffffff',

    // Backgrounds — warm off-white with depth
    background: '#f8fafc',
    backgroundGradient: ['#eff6ff', '#f0f4ff', '#f5f3ff'],
    foreground: '#0f172a',

    // Cards — clear white with subtle shadow
    card: 'rgba(255,255,255,0.88)',
    cardForeground: '#0f172a',
    cardBorder: 'rgba(226,232,240,0.80)',

    // Text
    mutedForeground: '#64748b',
    secondary: '#e2e8f0',
    secondaryForeground: '#334155',
    muted: '#f1f5f9',
    accentSoft: 'rgba(37,99,235,0.10)',
    accentForeground: '#1d4ed8',

    // Semantic
    destructive: '#dc2626',
    destructiveForeground: '#ffffff',
    border: '#e2e8f0',
    input: '#cbd5e1',
    ring: '#2563eb',

    // Status colours
    success: '#059669',
    warning: '#d97706',
    info: '#2563eb',
    error: '#dc2626',

    // ── Liquid Glass Tokens ──────────────────────────────────────
    glass: {
        bg: 'rgba(255,255,255,0.65)',
        bgStrong: 'rgba(255,255,255,0.85)',
        border: 'rgba(255,255,255,0.80)',
        borderSubtle: 'rgba(203,213,225,0.50)',
        shimmer: 'rgba(255,255,255,0.90)',
        tint: 'light',
        blur: 16,
        blurStrong: 28,
        shadow: 'rgba(15,23,68,0.12)',
    },
};

export const darkPalette = {
    // Brand — electric blue on dark
    primary: '#60a5fa',
    primaryLight: '#93c5fd',
    primaryDark: '#3b82f6',
    primaryForeground: '#0f172a',

    // Backgrounds — dark navy, not pitch black
    background: '#0c111d',
    backgroundGradient: ['#0c111d', '#0f172a', '#131929'],
    foreground: '#f1f5f9',

    // Cards
    card: 'rgba(30,41,59,0.80)',
    cardForeground: '#f1f5f9',
    cardBorder: 'rgba(51,65,85,0.60)',

    // Text
    mutedForeground: '#94a3b8',
    secondary: 'rgba(255,255,255,0.05)',
    secondaryForeground: '#cbd5e1',
    muted: 'rgba(255,255,255,0.06)',
    accentSoft: 'rgba(96,165,250,0.15)',
    accentForeground: '#93c5fd',

    // Semantic
    destructive: '#f87171',
    destructiveForeground: '#1a0505',
    border: 'rgba(51,65,85,0.70)',
    input: 'rgba(71,85,105,0.60)',
    ring: '#60a5fa',

    // Status colours
    success: '#34d399',
    warning: '#fbbf24',
    info: '#60a5fa',
    error: '#f87171',

    // ── Liquid Glass Tokens ──────────────────────────────────────
    glass: {
        bg: 'rgba(15,23,42,0.60)',
        bgStrong: 'rgba(15,23,42,0.85)',
        border: 'rgba(255,255,255,0.10)',
        borderSubtle: 'rgba(255,255,255,0.06)',
        shimmer: 'rgba(255,255,255,0.08)',
        tint: 'dark',
        blur: 24,
        blurStrong: 40,
        shadow: 'rgba(0,0,0,0.60)',
    },
};
