import { defineContentConfig, defineCollection } from '@nuxt/content'
import { z } from 'zod'

export default defineContentConfig({
  collections: {
    projects: defineCollection({
      type: 'page',
      source: 'projects/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        year: z.number(),
        cover: z.string().url(),
        weight: z.number().default(999),
        type: z.enum(['portrait', 'landscape']),
      })
    })
  }
})
