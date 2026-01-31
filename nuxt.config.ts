import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/content', '@nuxt/image', '@nuxt/ui', '@nuxt/fonts'],
  css: ['./app/assets/css/main.css'],
  fonts: {
    families: [
      { name: 'Pixelify Sans', provider: 'google' }
    ]
  },
  app: {
    // pageTransition: { name: 'page', mode: 'out-in' },
    // layoutTransition: { name: 'layout', mode: 'out-in' },
  },
  image: {
    quality: 85,
    format: ['webp', 'avif', 'jpg'],
    cloudflare: {
      baseURL: 'https://cdn.justzhu.com',
    },
    domains: ['cdn.justzhu.com'],
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
})