/** @see https://nuxt.com/docs/api/configuration/nuxt-config */
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'alternate icon', href: '/favicon.ico' },
        // IBM Plex Sans Thai loaded directly from Google, not via `fonts:`
        // below — @nuxt/fonts' self-hosting provider only recognizes a
        // hardcoded list of Latin/Cyrillic/Greek/Vietnamese subsets (see
        // module.mjs `subsets` array); it has no notion of a "thai" subset,
        // so it mislabels the Thai-glyph file as "latin" and drops it in a
        // collision with the real latin file (confirmed by inspecting the
        // generated @font-face rules — no `unicode-range` ever covered
        // U+0E00). Fetching Google's own CSS here sidesteps that bug.
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap' }
      ]
    }
  },
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss', '@nuxtjs/mdc', '@nuxt/fonts'],
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css'
  },
  /**
   * `global: true` forces eager injection into nuxt-fonts-global.css.
   * Without it, @nuxt/fonts only provisions a family once it scans literal
   * `font-family` text in compiled CSS — which never reliably sees fonts
   * referenced only via Tailwind's JS config (tailwind.config.ts).
   *
   * "Studio Dashboard": Plus Jakarta Sans covers sans + display (see
   * tailwind.config.ts) — a clean, warm grotesk instead of the previous
   * all-monospace terminal look. JetBrains Mono stays, but only for `mono`
   * (code blocks, inline code). IBM Plex Sans Thai is the Thai fallback in
   * every stack (see tailwind.config.ts) — Plus Jakarta Sans/JetBrains Mono
   * have no Thai glyphs on their own — but it's loaded via the `<link>` in
   * `app.head` above, not listed here (see the comment there for why).
   * Picked over Noto Sans Thai for a more formal/corporate look (loopless,
   * closer to the geometric-grotesk character of Plus Jakarta Sans) —
   * matches the reference typography brief.
   */
  fonts: {
    families: [
      { name: 'Plus Jakarta Sans', provider: 'google', weights: [400, 500, 600, 700, 800], global: true },
      { name: 'JetBrains Mono', provider: 'google', weights: [400, 500, 600, 700], global: true }
    ]
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8080'
    }
  },
  mdc: {
    highlight: {
      theme: {
        default: 'vitesse-light',
        dark: 'vitesse-dark'
      },
      langs: ['ts', 'typescript', 'js', 'javascript', 'json', 'bash', 'html', 'css', 'vue', 'md', 'java', 'mermaid']
    }
  }
})
