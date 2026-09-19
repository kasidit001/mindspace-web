import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

export default <Partial<Config>>{
  darkMode: 'class',
  theme: {
    extend: {
      /**
       * "Studio Dashboard": the site's third identity this project — moving
       * off the JetBrains Mono / neon-terminal look entirely in favor of a
       * clean SaaS-product look (white cards, soft shadows, rounded
       * corners, one clean grotesk typeface). Plus Jakarta Sans covers both
       * UI text and headlines (weight does the differentiation, not a
       * second typeface — a dashboard reads as a tool, not an editorial
       * piece). JetBrains Mono is kept, but demoted to actual code only.
       *
       * Plus Jakarta Sans has no Thai glyphs, so Thai copy was silently
       * falling back to whatever sans-serif the OS ships — inconsistent
       * weight/x-height next to the Latin type. Noto Sans Thai is added as
       * the Thai fallback in every stack: a neutral, formal, highly-legible
       * face (tried IBM Plex Sans Thai first, but @nuxt/fonts' Google
       * provider only fetched its Latin/Cyrillic subsets, not Thai — Noto
       * Sans Thai is Thai-only so there's no subset to miss). The browser
       * picks per-character automatically from stack order — no
       * lang-specific CSS needed.
       */
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Noto Sans Thai"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', '"Noto Sans Thai"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Noto Sans Thai"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      colors: {
        // Near-white canvas / pure-white surface by day, deep slate-navy by
        // night — cards are separated from the page mostly by shadow, not a
        // strong border, so `divider` stays a faint hairline.
        canvas: {
          DEFAULT: '#F6F7FB',
          dark: '#0B0E16'
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#12151F'
        },
        divider: {
          DEFAULT: '#E7E9F0',
          dark: '#232838'
        },
        // Indigo (`accent`) is the primary brand/action color — buttons,
        // links, focus rings, primary nav state. Replaces the old neon
        // yellow; needs WHITE text on filled chips/buttons now (400/500/600
        // are all mid-saturation, unlike the old bright-yellow chip that
        // needed black text).
        accent: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          900: '#312E81'
        },
        // Violet (`ai`) marks anything AI/tutor-related — badges, the chat
        // chrome, the "AI Brain" mark — kept a distinct hue from the
        // primary indigo so AI-attributed UI still reads as its own thing.
        ai: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
          700: '#7E22CE',
          900: '#4C1D95'
        },
        // Semantic status colors — new in this pass, for alert/health-style
        // badges (risk levels, form states) the old 2-color terminal
        // palette had no vocabulary for. `400` is the dark-mode text/icon
        // shade, matching the accent/ai convention (bright enough to read
        // on a near-black surface; 500+ are for light-mode text and fills).
        critical: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D'
        },
        warning: { 50: '#FFFBEB', 400: '#FBBF24', 500: '#F59E0B', 600: '#D97706', 700: '#B45309' },
        info: { 50: '#EFF6FF', 400: '#60A5FA', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8' },
        success: { 50: '#ECFDF5', 400: '#34D399', 500: '#10B981', 600: '#059669', 700: '#047857' }
      },
      boxShadow: {
        // A soft, diffuse card shadow — the "this floats" signal now,
        // replacing the old terminal's glow rings and hard offset shadows.
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 8px 24px -8px rgb(15 23 42 / 0.10)',
        'card-dark': '0 1px 2px 0 rgb(0 0 0 / 0.2), 0 8px 24px -8px rgb(0 0 0 / 0.45)'
      },
      typography: ({ theme }: { theme: (path: string) => string }) => ({
        DEFAULT: {
          css: {
            maxWidth: 'none',
            fontSize: '1rem',
            lineHeight: '1.75',
            '--tw-prose-links': theme('colors.accent.700'),
            '--tw-prose-invert-links': theme('colors.accent.400'),
            a: { fontWeight: '500', textDecoration: 'none' },
            'a:hover': { textDecoration: 'underline' },
            p: { marginTop: '1.25em', marginBottom: '1.25em' },
            'h1, h2, h3': { marginTop: '2em', marginBottom: '0.75em', letterSpacing: '-0.005em', fontWeight: '700' },
            'ul, ol': { marginTop: '1.25em', marginBottom: '1.25em' },
            li: { marginTop: '0.35em', marginBottom: '0.35em' },
            blockquote: {
              fontStyle: 'normal',
              fontWeight: '400',
              borderLeftWidth: '3px',
              borderLeftColor: theme('colors.accent.400'),
              color: 'inherit',
              opacity: '0.85'
            },
            /**
             * The shiki-highlighted <pre> is handled by our custom ProsePre
             * component (padding, border, copy button, line numbers) — reset
             * typography's own pre/code chrome so the two don't double up.
             */
            pre: {
              marginTop: '1.5em',
              marginBottom: '1.5em',
              backgroundColor: 'transparent',
              padding: '0'
            },
            code: { fontFamily: theme('fontFamily.mono').join(', '), fontWeight: '500' },
            'code::before': { content: 'none' },
            'code::after': { content: 'none' },
            table: { fontSize: '0.9em' },
            thead: { borderBottomColor: theme('colors.divider.DEFAULT') },
            'thead th': { fontWeight: '600' }
          }
        }
      })
    }
  },
  plugins: [typography]
}
