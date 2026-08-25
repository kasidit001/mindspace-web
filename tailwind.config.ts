import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

export default <Partial<Config>>{
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Three-tier hierarchy — see nuxt.config.ts for the full rationale.
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Syne"', '"Plus Jakarta Sans"', 'ui-sans-serif', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      colors: {
        // "Codecademy Terminal": a warm cream workbench by day, pure dark
        // slate by night — dot-grid textured either way. `surface` sits one
        // step up from `canvas` for cards floating on that grid (hero media,
        // CTA overlay, reader card).
        canvas: {
          DEFAULT: '#FAF7EE',
          dark: '#0A0B0E'
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#13151C'
        },
        divider: {
          DEFAULT: '#E7E1CD',
          dark: '#232733'
        },
        // Neon Yellow (`accent`) is the primary action color — buttons,
        // links, progress. Terminal Green (`ai`) marks anything AI/code
        // related — badges, highlights, the AI Tutor chrome. 400/500 hold
        // the exact brief hexes (bright, theme-agnostic — used on filled
        // chips/buttons with black text); 700 is a hand-tuned dark shade for
        // legible text/links on a light background.
        accent: {
          50: '#FFFDEF',
          100: '#FFF7C2',
          300: '#FFEB70',
          400: '#FFF066',
          500: '#F5DE2E',
          600: '#E0C300',
          700: '#8A6D00',
          900: '#3D2F00'
        },
        ai: {
          50: '#E9FFF3',
          100: '#BFFFDC',
          300: '#4DFFA0',
          400: '#00FF66',
          500: '#00E676',
          600: '#00C25F',
          700: '#00814A',
          900: '#00341F'
        }
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
            'h1, h2, h3': { marginTop: '2em', marginBottom: '0.75em', letterSpacing: '-0.005em', fontWeight: '600' },
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
            // The shiki-highlighted <pre> is handled by our custom ProsePre
            // component (padding, border, copy button, line numbers) — reset
            // typography's own pre/code chrome so the two don't double up.
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
