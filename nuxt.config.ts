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
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
})