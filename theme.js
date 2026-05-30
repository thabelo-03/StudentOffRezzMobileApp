// ThabStay mobile design tokens — aligned with the web app (Tailwind blue-600 +
// slate). Import these instead of hard-coding hex values so the app stays cohesive.

export const colors = {
  // Brand primary (matches web bg-blue-600 / text-blue-600)
  primary: '#2563eb',
  primaryDark: '#1d4ed8',   // pressed / emphasis (blue-700)
  primaryTint: '#eff6ff',   // subtle backgrounds (blue-50)

  // Dark surfaces (headers, splash) — slate
  navy: '#0f172a',          // slate-900 (web header)
  navySoft: '#1e293b',      // slate-800

  // Neutrals
  text: '#1e293b',          // slate-800
  textMuted: '#64748b',     // slate-500
  textFaint: '#94a3b8',     // slate-400
  border: '#e2e8f0',        // slate-200
  surface: '#ffffff',
  surfaceAlt: '#f8fafc',    // slate-50

  // Semantic
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
  star: '#f5b50a',
  white: '#ffffff',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

export const typography = {
  h1: { fontSize: 26, fontWeight: '800', color: colors.navy },
  h2: { fontSize: 20, fontWeight: '700', color: colors.text },
  body: { fontSize: 15, color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted },
};

export default { colors, spacing, radius, typography };
