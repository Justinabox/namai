<script setup lang="ts">
import { computed } from 'vue'

type WaterfallItem = {
  id?: string
  path?: string
  title: string
  description?: string
  cover: string
  width: number
  height: number
}

const props = defineProps<{
  items: WaterfallItem[]
  columnsClass?: string
  itemClass?: string
}>()

const resolvedColumnsClass = computed(() =>
  props.columnsClass ?? 'columns-1 md:columns-2 xl:columns-3'
)

const getItemKey = (item: WaterfallItem, index: number) =>
  item.path ?? item.id ?? item.title ?? index

const getAspectRatio = (item: WaterfallItem) => {
  const width = Number(item.width) || 1
  const height = Number(item.height) || 1
  return `${width} / ${height}`
}
</script>

<template>
  <div :class="['w-full gap-4 [column-fill:_balance]', resolvedColumnsClass]">
    <div
      v-for="(item, index) in items"
      :key="getItemKey(item, index)"
      :class="['mb-4 break-inside-avoid', itemClass]"
    >
      <slot name="item" :item="item">
        <figure class="rounded-md border-2 border-neutral-800 bg-neutral-950/40 overflow-hidden group">
          <div class="w-full" :style="{ aspectRatio: getAspectRatio(item) }">
            <img
              :src="item.cover"
              :alt="item.title"
              :width="item.width"
              :height="item.height"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            >
          </div>
          <figcaption class="p-3">
            <p class="text-lg font-pixelify-sans text-neutral-100">{{ item.title }}</p>
            <p v-if="item.description" class="text-sm text-neutral-500">{{ item.description }}</p>
          </figcaption>
        </figure>
      </slot>
    </div>
  </div>
</template>
