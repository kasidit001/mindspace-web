import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

export default <Partial<Config>>{
  darkMode: 'class',
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            lineHeight: '1.75',
            p: { marginTop: '1.35em', marginBottom: '1.35em' },
            'h1, h2, h3': { marginTop: '2.2em', marginBottom: '0.8em' },
            'ul, ol': { marginTop: '1.35em', marginBottom: '1.35em' },
            li: { marginTop: '0.4em', marginBottom: '0.4em' },
            // The shiki-highlighted <pre> is handled by our custom ProsePre
            // component (padding, border, copy button) — reset typography's
            // own pre/code chrome so the two don't double up.
            pre: {
              marginTop: '1.75em',
              marginBottom: '1.75em',
              backgroundColor: 'transparent',
              padding: '0'
            },
            code: {
              fontWeight: '500'
            },
            'code::before': { content: 'none' },
            'code::after': { content: 'none' }
          }
        }
      }
    }
  },
  plugins: [typography]
}
