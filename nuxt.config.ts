// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss', '@nuxtjs/mdc', '@nuxt/fonts'],
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css'
  },
  fonts: {
    // `global: true` forces eager injection into nuxt-fonts-global.css.
    // Without it, @nuxt/fonts only provisions a family once it scans literal
    // `font-family` text in compiled CSS — which never reliably sees fonts
    // referenced only via Tailwind's JS config (tailwind.config.ts).
    //
    // Note: Apercu Pro (the brief's first choice) is a commercial face with
    // no license in this repo and no files under public/fonts — falling
    // back to its open-source-alternatives option instead. Three-tier
    // hierarchy: Plus Jakarta Sans (UI/body — warm, geometric, comfortable
    // at paragraph sizes, unlike Apercu's narrower default line-height),
    // Syne (display — a bold, unusual geometric face for hero/headline
    // text; picked over the brief's other option, Space Grotesk, since
    // Syne's wider, more idiosyncratic letterforms read as more
    // "Codecademy voice" and less like the default AI-generated choice),
    // and JetBrains Mono, unchanged, reserved for code/badges/terminal UI.
    families: [
      { name: 'Plus Jakarta Sans', provider: 'google', weights: [400, 500, 600, 700], global: true },
      { name: 'Syne', provider: 'google', weights: [600, 700, 800], global: true },
      { name: 'JetBrains Mono', provider: 'google', weights: [400, 500, 600], global: true }
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
      langs: ['ts', 'typescript', 'js', 'javascript', 'json', 'bash', 'html', 'css', 'vue', 'md']
    }
  }
})
