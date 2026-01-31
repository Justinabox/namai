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
        cover: z.string().url(),
        category: z.enum(PROJECT_CATEGORIES),
        year: z.number(),
        tags: z.array(z.string()),
        weight: z.number().default(999),
        type: z.enum(['video', 'image']),
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
