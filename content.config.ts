import { defineContentConfig, defineCollection } from '@nuxt/content'
import { z } from 'zod'
import { PROJECT_CATEGORIES } from './app/lib/constants'

export default defineContentConfig({
  collections: {
    projects: defineCollection({
      type: 'page',
      source: 'projects/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        scope: z.string(),
        techstack: z.array(z.string()),
        roles: z.array(z.string()),
        team: z.array(z.object({
          name: z.string(),
          role: z.string(),
          link: z.string().url(),
        })),
        time: z.string(),
        year: z.number(),

        weight: z.number().default(999),
        cover: z.string().url(),
        type: z.enum(['video', 'image']),
        page: z.enum(['case-study', 'gallery', 'external']),
        external: z.string().url().optional(), // external redirect for the project
        tags: z.array(z.string()),
        category: z.enum(PROJECT_CATEGORIES),
        links: z.array(z.object({
          name: z.string(),
          url: z.string().url(),
        })).default([]),
      })
    }),
    playgrounds: defineCollection({
      type: 'page',
      source: 'playgrounds/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        cover: z.string().url(),
        width: z.number(),
        height: z.number(),
        type: z.enum(['portrait', 'landscape']),
        tags: z.array(z.string()),
        year: z.number(),
        category: z.enum(PROJECT_CATEGORIES),
      })
    })
  }
})
