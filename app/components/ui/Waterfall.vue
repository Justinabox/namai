<script setup lang="ts">
import { computed, ref } from 'vue'

const CONFIG = {
  DEFAULT_WIDTH: 1,
  DEFAULT_HEIGHT: 1,
  DEFAULT_COLUMNS: 'columns-1 md:columns-2 xl:columns-3',
  DEFAULT_ASPECT_RATIO: '16 / 9',
  ITEM_KEY_FALLBACKS: ['path', 'id', 'title', 'index'],
  VALIDATION: {
    REQUIRED_FIELDS: ['title', 'cover', 'width', 'height'] as const,
    MIN_WIDTH_HEIGHT: 1,
  },
} as const

type WaterfallItem = {
  id?: string
  path?: string
  title: string
  description?: string
  cover: string
  width: number
  height: number
}

type ValidationWarning = {
  item: WaterfallItem
  index: number
  message: string
}

const props = defineProps<{
  items: WaterfallItem[]
  columnsClass?: string
  itemClass?: string
  aspectRatioFallback?: string
}>()

const errors = ref<ValidationWarning[]>([])

const resolvedColumnsClass = computed(() =>
  props.columnsClass ?? CONFIG.DEFAULT_COLUMNS
)

function isValidItem(item: WaterfallItem): item is WaterfallItem {
  if (!item || typeof item !== 'object') return false
  
  const requiredFields = CONFIG.VALIDATION.REQUIRED_FIELDS
  return requiredFields.every(field => {
    if (!(field in item)) return false
    const value = item[field]
    return value !== undefined && value !== null && value !== ''
  })
}

function validateDimensions(width: number, height: number): boolean {
  const validWidth = Number.isFinite(width) && width >= CONFIG.VALIDATION.MIN_WIDTH_HEIGHT
  const validHeight = Number.isFinite(height) && height >= CONFIG.VALIDATION.MIN_WIDTH_HEIGHT
  return validWidth && validHeight
}

function validateItem(item: WaterfallItem, index: number): void {
  if (!isValidItem(item)) {
    errors.value.push({
      item,
      index,
      message: `Item at index ${index} is missing required fields: ${CONFIG.VALIDATION.REQUIRED_FIELDS.join(', ')}`,
    })
    return
  }

  if (!validateDimensions(item.width, item.height)) {
    errors.value.push({
      item,
      index,
      message: `Item "${item.title}" has invalid dimensions: ${item.width}x${item.height}`,
    })
  }

  if ( typeof item.cover !== 'string' || !item.cover.trim()) {
    errors.value.push({
      item,
      index,
      message: `Item "${item.title}" has invalid cover URL`,
    })
  }
}

function getItemKey(item: WaterfallItem, index: number): string {
  const fallbackChain = CONFIG.ITEM_KEY_FALLBACKS
  for (const field of fallbackChain) {
    if (field === 'index') return index.toString()
    
    const value = item[field as keyof WaterfallItem]
    if (value !== undefined && value !== null && value !== '') {
      return value.toString()
    }
  }
  
  return `item-${index}`
}

function normalizeDimension(value: number): number {
  const num = Number(value)
  return Number.isFinite(num) && num > 0 ? num : CONFIG.DEFAULT_WIDTH
}

function getAspectRatio(item: WaterfallItem): string {
  if (!validateDimensions(item.width, item.height)) {
    return props.aspectRatioFallback ?? CONFIG.DEFAULT_ASPECT_RATIO
  }
  
  const width = normalizeDimension(item.width)
  const height = normalizeDimension(item.height)
  return `${width} / ${height}`
}

function getImageWidth(item: WaterfallItem): number {
  return normalizeDimension(item.width)
}

function getImageHeight(item: WaterfallItem): number {
  return normalizeDimension(item.height)
}

const validatedItems = computed(() => {
  errors.value = []
  
  const items = props.items ?? []
  if (!Array.isArray(items)) {
    errors.value.push({
      item: {} as WaterfallItem,
      index: 0,
      message: 'items prop must be an array',
    })
    return []
  }
  
  return items.map((item, index) => {
    validateItem(item, index)
    return item
  })
})

if (import.meta.env.DEV && errors.value.length > 0) {
  errors.value.forEach(({ message }) => {
    console.warn(`[Waterfall]: ${message}`)
  })
}
</script>

<template>
  <div :class="['w-full gap-4 [column-fill:_balance]', resolvedColumnsClass]">
    <div
      v-for="(item, index) in validatedItems"
      :key="getItemKey(item, index)"
      :class="['mb-4 break-inside-avoid', itemClass]"
    >
      <slot name="item" :item="item" :index="index">
        <figure class="rounded-md border-2 border-neutral-800 bg-neutral-950/40 overflow-hidden group">
          <div class="w-full bg-crossing" :style="{ aspectRatio: getAspectRatio(item) }">
            <NuxtPicture
              provider="cloudflare"
              :src="item.cover"
              :alt="item.title"
              :width="getImageWidth(item)"
              :height="getImageHeight(item)"
              :aria-label="item.title"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
            <!-- <NuxtPicture v-else provider="cloudflare" :src="project.cover" :alt="project.title" class="rounded-sm object-contain w-full h-auto sm:max-h-[80vh]" loading="lazy" preload/> -->
          </div>
          <figcaption class="p-3">
            <p class="text-xl font-pixelify-sans text-neutral-100">{{ item.title }}</p>
            <p v-if="item.description" class="text-sm text-neutral-500">{{ item.description }}</p>
          </figcaption>
        </figure>
      </slot>
    </div>
  </div>
</template>