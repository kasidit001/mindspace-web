import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

export default <Partial<Config>>{
  darkMode: 'class',
  theme: {
    extend: {
      /**
       * "Dossier": the site's fourth identity — moving off "Studio
       * Dashboard"'s quiet indigo SaaS look toward a bolder, editorial,
       * benchmark-report aesthetic (reference: a framework's own motion-
       * graphics showreel — stark black/white, one loud accent, big
       * confident display type, monospace used as a deliberate "live
       * telemetry" texture rather than just a code font). Bricolage
       * Grotesque is the new display face — a bold, slightly irregular
       * grotesk with real personality instead of a generic geometric sans
       * — reserved for headlines/wordmark. Instrument Serif is new too: an
       * italic editorial serif used ONLY for short accent phrases inside a
       * headline (the reference's cursive "...humans." treatment), never
       * for UI text or body copy. Plus Jakarta Sans stays as the actual
       * body/UI workhorse — swapping it out everywhere would hurt
       * readability for no aesthetic gain. JetBrains Mono is promoted
       * beyond code: it's now also the "HUD" face for small uppercase
       * meta strips (see `.hud` in tailwind.css) — the reference's
       * BPM/timer counter made literal as a reusable UI pattern.
       *
       * Plus Jakarta Sans/Bricolage Grotesque have no Thai glyphs, so Thai
       * copy was silently falling back to whatever sans-serif the OS
       * ships — inconsistent weight/x-height next to the Latin type. IBM
       * Plex Sans Thai is the Thai fallback in every stack: a loopless,
       * formal, corporate-tech face that pairs better with a geometric
       * grotesk than a more neutral pick like Noto Sans Thai would
       * (@nuxt/fonts' Google provider can't serve its Thai subset
       * correctly, so it's loaded via a direct Google Fonts <link> in
       * nuxt.config.ts instead, same workaround, different font). The
       * browser picks per-character automatically from stack order — no
       * lang-specific CSS needed.
       */
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"IBM Plex Sans Thai"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', '"IBM Plex Sans Thai"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', '"IBM Plex Sans Thai"', 'ui-serif', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Sans Thai"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      colors: {
        // Near-white canvas / pure-white surface by day, near-black by
        // night — pushed closer to true black/white than the old slate-navy
        // dark mode, matching the reference's stark high-contrast scenes.
        // Cards lean on a hairline border as much as shadow now (the old
        // "shadow-only" signal read as too soft/quiet for this identity).
        canvas: {
          DEFAULT: '#FAFAFA',
          dark: '#0A0A0A'
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#141414'
        },
        divider: {
          DEFAULT: '#E5E5E5',
          dark: '#2A2A2A'
        },
        // Hot pink/magenta (`accent`) replaces the old indigo — the
        // reference's one loud accent color against an otherwise
        // black/white/gray palette. Still needs WHITE text on filled
        // chips/buttons (400/500/600 are all mid-to-high saturation).
        accent: {
          50: '#FFF0F6',
          100: '#FFE0EE',
          300: '#FF9AC4',
          400: '#FF5FA0',
          500: '#FF2D7F',
          600: '#EC0063',
          700: '#C2004F',
          900: '#780033'
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
