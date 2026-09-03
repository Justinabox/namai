import { readdirSync } from 'node:fs'
import tailwindcss from "@tailwindcss/vite";

/**
 * The waterfall renders inside <ClientOnly>, so the prerender crawler never
 * sees a link to a project page. Enumerate them from the content directory
 * instead of relying on crawling.
 */
const projectRoutes = readdirSync('./content/projects')
  .filter(file => file.endsWith('.md'))
  .map(file => `/projects/${file.replace(/\.md$/, '')}`)

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/content', '@nuxt/image', '@nuxt/ui', '@nuxt/fonts'],
  css: ['~/assets/css/main.css'],
  nitro: {
    prerender: { routes: projectRoutes },
  },
  routeRules: {
    // The old projects index is now the homepage; keep the URL working.
    '/projects': { redirect: { to: '/', statusCode: 301 } },
  },
  fonts: {
    families: [
      { name: 'Pixelify Sans', provider: 'local'},
      { name: 'Yrsa', provider: 'google'}
    ],
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