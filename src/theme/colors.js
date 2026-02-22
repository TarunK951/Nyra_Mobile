// ─── NyraAI Color System — Rich Deep Palette ─────────────────────

export const lightPalette = {
    // Brand — Apple Royal Blue
    primary: '#0066FF',
    primaryLight: '#3385FF',
    primaryDark: '#0052CC',
    primaryForeground: '#ffffff',

    // Backgrounds — Apple System Grey
    background: '#F2F2f7',
    backgroundGradient: ['#ffffff', '#F2F2f7', '#F2F2f7'],
    foreground: '#1c1c1e',

    // Cards
    card: 'rgba(255,255,255,0.7)',
    cardForeground: '#1c1c1e',
    cardBorder: 'rgba(0,0,0,0.05)',

    // Text
    mutedForeground: '#8e8e93',
    secondary: '#e5e5ea',
    secondaryForeground: '#3a3a3c',
    muted: '#f2f2f7',
    accentSoft: 'rgba(0,102,255,0.08)',
    accentForeground: '#0066FF',

    // Semantic
    destructive: '#FF3B30',
    destructiveForeground: '#ffffff',
    border: '#d1d1d6',
    input: '#c7c7cc',
    ring: '#0066FF',

    // Status colours
    success: '#34C759',
    warning: '#FF9500',
    info: '#007AFF',
    error: '#FF3B30',

    // ── Liquid Glass Tokens ──────────────────────────────────────
    glass: {
        bg: 'rgba(255,255,255,0.75)',
        bgStrong: 'rgba(255,255,255,0.92)',
        border: 'rgba(255,255,255,1.0)',
        borderSubtle: 'rgba(0,0,0,0.04)',
        highlight: 'rgba(255,255,255,0.8)',
        shimmer: 'rgba(255,255,255,0.7)',
        tint: 'light',
        blur: 25,
        blurStrong: 40,
        shadow: 'rgba(0,0,0,0.1)',
        shadowDeep: 'rgba(0,0,0,0.15)',
    },
};

export const darkPalette = {
    // Brand — Apple Royal Blue (Lighter for Dark Mode)
    primary: '#0A84FF',
    primaryLight: '#409CFF',
    primaryDark: '#0066FF',
    primaryForeground: '#ffffff',

    // Backgrounds — Apple Fitness Pure Black
    background: '#000000',
    backgroundGradient: ['#000000', '#0a0a0c', '#000000'],
    foreground: '#ffffff',

    // Cards — iOS Dark Secondary
    card: 'rgba(28,28,30,0.7)',
    cardForeground: '#ffffff',
    cardBorder: 'rgba(255,255,255,0.08)',

    // Text
    mutedForeground: '#8e8e93',
    secondary: 'rgba(255,255,255,0.1)',
    secondaryForeground: '#d1d1d6',
    muted: '#1c1c1e',
    accentSoft: 'rgba(10,132,255,0.12)',
    accentForeground: '#409CFF',

    // Semantic
    destructive: '#FF453A',
    destructiveForeground: '#ffffff',
    border: '#38383a',
    input: '#3a3a3c',
    ring: '#0A84FF',

    // Status colours
    success: '#30D158',
    warning: '#FF9F0a',
    info: '#0A84FF',
    error: '#FF453A',

    // ── Liquid Glass Tokens ──────────────────────────────────────
    glass: {
        bg: 'rgba(28,28,30,0.75)',
        bgStrong: 'rgba(28,28,30,0.95)',
        border: 'rgba(255,255,255,0.12)',
        borderSubtle: 'rgba(255,255,255,0.06)',
        highlight: 'rgba(255,255,255,0.08)',
        shimmer: 'rgba(255,255,255,0.06)',
        tint: 'dark',
        blur: 35,
        blurStrong: 55,
        shadow: 'rgba(0,0,0,0.5)',
        shadowDeep: 'rgba(0,0,0,1.0)',
    },
};
