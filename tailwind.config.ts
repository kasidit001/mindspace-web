import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

export default <Partial<Config>>{
  darkMode: 'class',
  theme: {
    extend: {
      /**
       * "Constructor": the site's sixth identity — a dark-mode-first,
       * developer-focused SaaS dashboard look (reference: Spline.one's
       * "Constructor UI System"), replacing "Atelier"'s quiet editorial
       * calm with a structured, high-density bento-grid aesthetic. One
       * clean geometric sans (Inter) for every role — display, body, UI —
       * rather than splitting the job across a display face and a body
       * face; this identity reads as a developer tool, not an editorial
       * site, and a single consistent face is more legible at the small
       * sizes a data-dense dashboard needs. JetBrains Mono stays for real
       * code only, same as the last few identities. Electric Indigo
       * (`accent`) is the primary action/active-status color; a new
       * neon-lime family (`lime`) marks positive metrics/sparkline trends
       * specifically, so "this number is up" has its own color distinct
       * from "click this button."
       *
       * Inter has no Thai glyphs, so Thai copy still falls back to Sarabun
       * in every stack (see nuxt.config.ts's app.head comment for why it's
       * loaded via a direct Google Fonts <link> rather than through
       * @nuxt/fonts like Inter/JetBrains Mono).
       */
      fontFamily: {
        sans: ['"Inter"', '"Sarabun"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Inter"', '"Sarabun"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Inter"', '"Sarabun"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Sarabun"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      colors: {
        // Clean near-white canvas by day; a near-black, very slightly
        // blue-tinted `#0B0C10` by night — the dashboard's primary,
        // highest-visibility surface. Cards are a step up in luminance
        // (`surface`) from the canvas they sit on, with a razor-thin
        // white/10 border doing the separation, not a heavy shadow.
        canvas: {
          DEFAULT: '#F7F8FA',
          dark: '#0B0C10'
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#1A1C23'
        },
        divider: {
          DEFAULT: '#E5E7EB',
          dark: 'rgba(255, 255, 255, 0.08)'
        },
        // Electric Indigo (`accent`) — the primary action color: CTAs,
        // active/selected status, key metrics. Used sparingly against an
        // otherwise near-monochrome dashboard, per the reference's "one
        // loud color" rule. Still needs WHITE text on filled chips/buttons
        // (400/500/600 are all mid-to-high saturation).
        accent: {
          50: '#EEF0FF',
          100: '#E0E3FF',
          300: '#A5ADFB',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          900: '#312E81'
        },
        // Neon lime (`lime`) — positive metrics and upward sparkline
        // trends specifically, kept distinct from the indigo accent so
        // "this number is up" never gets confused with "click this."
        lime: {
          50: '#F7FEE7',
          100: '#ECFCCB',
          300: '#BEF264',
          400: '#A3E635',
          500: '#84CC16',
          600: '#65A30D',
          700: '#4D7C0F',
          900: '#365314'
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
