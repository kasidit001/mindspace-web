import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

export default <Partial<Config>>{
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      colors: {
        // Exact JetBrains-style neutrals: clean white / dark gray canvas,
        // contrasted with subtle divider lines. Used instead of the zinc
        // scale wherever the spec calls for a precise tone.
        canvas: {
          DEFAULT: '#FFFFFF',
          dark: '#1E1F22'
        },
        divider: {
          DEFAULT: '#E6E6E6',
          dark: '#2B2D30'
        },
        // JetBrains-authentic brand accents, replacing the old emerald/indigo
        // pair. `accent` (Kotlin/JetBrains purple) is primary — learning,
        // progress, links. `ai` (JetBrains cyan) marks anything AI-Assistant
        // related, keeping the same two-accent semantic split as before.
        // 600 is the exact requested hex in both scales; the rest are a
        // hand-tuned scale around it.
        accent: {
          50: '#F3EFFF',
          100: '#E7DFFF',
          300: '#B49AFF',
          400: '#9B7BFF',
          500: '#8B65FF',
          600: '#7F52FF',
          700: '#6B3FE0',
          900: '#3D2280'
        },
        ai: {
          50: '#E6FBFB',
          100: '#CCF7F8',
          300: '#66E3E5',
          400: '#33D9DC',
          500: '#1AD1D5',
          600: '#00CDD1',
          700: '#00A5A8',
          900: '#005557'
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
