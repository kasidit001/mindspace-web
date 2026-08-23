import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

export default <Partial<Config>>{
  darkMode: 'class',
  theme: {
    extend: {
      typography: ({ theme }: { theme: (path: string) => string }) => ({
        DEFAULT: {
          css: {
            maxWidth: 'none',
            fontSize: '1.0625rem',
            lineHeight: '1.75',
            '--tw-prose-links': theme('colors.emerald.600'),
            '--tw-prose-invert-links': theme('colors.emerald.400'),
            a: { fontWeight: '500', textDecoration: 'none' },
            'a:hover': { textDecoration: 'underline' },
            p: { marginTop: '1.35em', marginBottom: '1.35em' },
            'h1, h2, h3': { marginTop: '2.2em', marginBottom: '0.8em', letterSpacing: '-0.01em' },
            'ul, ol': { marginTop: '1.35em', marginBottom: '1.35em' },
            li: { marginTop: '0.4em', marginBottom: '0.4em' },
            blockquote: {
              fontStyle: 'normal',
              fontWeight: '400',
              borderLeftWidth: '3px',
              borderLeftColor: theme('colors.emerald.400'),
              color: 'inherit',
              opacity: '0.85'
            },
            // The shiki-highlighted <pre> is handled by our custom ProsePre
            // component (padding, border, copy button) — reset typography's
            // own pre/code chrome so the two don't double up.
            pre: {
              marginTop: '1.75em',
              marginBottom: '1.75em',
              backgroundColor: 'transparent',
              padding: '0'
            },
            code: { fontWeight: '500' },
            'code::before': { content: 'none' },
            'code::after': { content: 'none' },
            table: { fontSize: '0.9em' },
            thead: { borderBottomColor: theme('colors.slate.300') },
            'thead th': { fontWeight: '600' }
          }
        }
      })
    }
  },
  plugins: [typography]
}
