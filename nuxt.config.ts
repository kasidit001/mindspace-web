/** @see https://nuxt.com/docs/api/configuration/nuxt-config */
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'alternate icon', href: '/favicon.ico' },
        // Sarabun loaded directly from Google, not via `fonts:` below —
        // @nuxt/fonts' self-hosting provider only recognizes a hardcoded
        // list of Latin/Cyrillic/Greek/Vietnamese subsets (see module.mjs
        // `subsets` array); it has no notion of a "thai" subset, so it
        // mislabels the Thai-glyph file as "latin" and drops it in a
        // collision with the real latin file (confirmed by inspecting the
        // generated @font-face rules — no `unicode-range` ever covered
        // U+0E00). Fetching Google's own CSS here sidesteps that bug.
        // (Was IBM Plex Sans Thai — switched after real readability
        // feedback: its loopless letterforms read as harder to scan than a
        // looped Thai face at body-text sizes. Sarabun is the standard for
        // long-form/formal Thai reading, so it also addresses the "more
        // formal" half of the same feedback.)
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap' }
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
   * "Dossier": Plus Jakarta Sans stays as `sans` (body/UI text). Bricolage
   * Grotesque is new — the bold, slightly irregular display grotesk used
   * for headlines/wordmark (see tailwind.config.ts for the full rationale).
   * Instrument Serif is also new — an italic editorial serif reserved for
   * short accent phrases inside a headline, never body copy. JetBrains
   * Mono stays for `mono` — both real code AND the new small-caps "HUD"
   * meta-strip treatment (see `.hud` in tailwind.css). Sarabun is the Thai
   * fallback in every stack (see tailwind.config.ts) — none of the four
   * Latin faces above have Thai glyphs of their own — but it's loaded via
   * the `<link>` in `app.head` above, not listed here (see the comment
   * there for why).
   */
  fonts: {
    families: [
      { name: 'Plus Jakarta Sans', provider: 'google', weights: [400, 500, 600, 700, 800], global: true },
      { name: 'Bricolage Grotesque', provider: 'google', weights: [500, 600, 700, 800], global: true },
      { name: 'Instrument Serif', provider: 'google', weights: [400], styles: ['italic'], global: true },
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
