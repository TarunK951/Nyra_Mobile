// ─── NyraAI iOS 26 Liquid Glass Color System ───────────────────────
// Primary palette stays brand-true; glass tokens overlay on top.

export const lightPalette = {
    // Brand
    primary: '#1a6db5',
    primaryLight: '#2d8fd6',
    primaryDark: '#0f4d8a',
    primaryForeground: '#ffffff',

    // Backgrounds
    background: '#f0f4ff',
    backgroundGradient: ['#e8f4fd', '#dbeafe', '#ede9fe'],
    foreground: '#0f172a',

    // Cards / Surfaces
    card: 'rgba(255,255,255,0.72)',
    cardForeground: '#0f172a',
    cardBorder: 'rgba(255,255,255,0.50)',

    // Text
    mutedForeground: '#64748b',
    secondary: '#e2e8f0',
    secondaryForeground: '#1e293b',
    muted: '#f1f5f9',
    accentSoft: 'rgba(99, 179, 237, 0.15)',
    accentForeground: '#1a6db5',

    // Status
    destructive: '#dc2626',
    destructiveForeground: '#ffffff',
    border: 'rgba(148,163,184,0.3)',
    input: 'rgba(148,163,184,0.4)',
    ring: '#1a6db5',

    // ── Liquid Glass Tokens ──
    glass: {
        bg: 'rgba(255,255,255,0.18)',
        bgStrong: 'rgba(255,255,255,0.40)',
        border: 'rgba(255,255,255,0.55)',
        borderSubtle: 'rgba(255,255,255,0.28)',
        shimmer: 'rgba(255,255,255,0.60)',
        tint: 'light',
        blur: 20,
        blurStrong: 35,
        shadow: 'rgba(15, 23, 68, 0.14)',
    },

    // Status colours
    success: '#10b981',
    warning: '#f59e0b',
    info: '#3b82f6',
    error: '#ef4444',
};

export const darkPalette = {
    // Brand
    primary: '#4db8ff',
    primaryLight: '#7ecfff',
    primaryDark: '#1a8cd8',
    primaryForeground: '#ffffff',

    // Backgrounds
    background: '#050914',
    backgroundGradient: ['#050914', '#080d24', '#0e0820'],
    foreground: '#f1f5f9',

    // Cards / Surfaces
    card: 'rgba(20,24,46,0.80)',
    cardForeground: '#f1f5f9',
    cardBorder: 'rgba(255,255,255,0.08)',

    // Text
    mutedForeground: '#94a3b8',
    secondary: 'rgba(255,255,255,0.06)',
    secondaryForeground: '#cbd5e1',
    muted: 'rgba(255,255,255,0.07)',
    accentSoft: 'rgba(77, 184, 255, 0.12)',
    accentForeground: '#7ecfff',

    // Status
    destructive: '#f87171',
    destructiveForeground: '#ffffff',
    border: 'rgba(255,255,255,0.10)',
    input: 'rgba(255,255,255,0.12)',
    ring: '#4db8ff',

    // ── Liquid Glass Tokens ──
    glass: {
        bg: 'rgba(255,255,255,0.05)',
        bgStrong: 'rgba(255,255,255,0.10)',
        border: 'rgba(255,255,255,0.14)',
        borderSubtle: 'rgba(255,255,255,0.07)',
        shimmer: 'rgba(255,255,255,0.12)',
        tint: 'dark',
        blur: 28,
        blurStrong: 40,
        shadow: 'rgba(0,0,0,0.55)',
    },

    // Status colours
    success: '#34d399',
    warning: '#fbbf24',
    info: '#60a5fa',
    error: '#f87171',
};
