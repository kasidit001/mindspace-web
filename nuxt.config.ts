/** @see https://nuxt.com/docs/api/configuration/nuxt-config */
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
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
   * Single-family site: JetBrains Mono covers sans, display, and mono
   * (tailwind.config.ts) — the previous Plus Jakarta Sans / Syne pairing
   * read as too generic/AI-generated; going all-monospace leans into the
   * terminal/code-editor identity instead.
   */
  fonts: {
    families: [
      { name: 'JetBrains Mono', provider: 'google', weights: [400, 500, 600, 700, 800], global: true }
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
