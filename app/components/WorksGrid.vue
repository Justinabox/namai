<script setup lang="ts">
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'
import type { Work } from '~/composables/useWorks'

const props = withDefaults(defineProps<{
  items: Work[]
  /** Columns at < sm / >= sm / >= lg / >= 2xl. */
  columns?: [number, number, number, number]
  gapClass?: string
  captions?: 'always' | 'hover'
  radiusClass?: string
  maxWidthClass?: string
}>(), {
  columns: () => [1, 2, 3, 3],
  gapClass: 'gap-6',
  captions: 'always',
  radiusClass: 'rounded-lg',
  maxWidthClass: 'max-w-[1400px]',
})

const bp = useBreakpoints(breakpointsTailwind)
const isSm = bp.greaterOrEqual('sm')
const isLg = bp.greaterOrEqual('lg')
const is2xl = bp.greaterOrEqual('2xl')

const columnCount = computed(() => {
  const [base, sm, lg, xxl] = props.columns
  if (is2xl.value) return xxl
  if (isLg.value) return lg
  if (isSm.value) return sm
  return base
})

/**
 * Waterfall: walk the items in order and drop each one into whichever column
 * is currently shortest, measured in relative height (h/w). Keeps the leading
 * work near the top of the page instead of stacking it all in column one,
 * which is what CSS multi-column would do.
 */
const columns = computed<Work[][]>(() => {
  const count = columnCount.value
  const buckets: Work[][] = Array.from({ length: count }, () => [])
  const heights = new Array(count).fill(0)

  for (const item of props.items) {
    let target = 0
    for (let i = 1; i < count; i++) {
      if (heights[i] < heights[target]) target = i
    }
    buckets[target]!.push(item)
    // +0.16 approximates the caption block so columns stay level.
    heights[target] += item.height / item.width + (props.captions === 'always' ? 0.16 : 0)
  }

  return buckets
})

const skeletonRatios = [0.66, 1.3, 0.75, 1.1, 0.62, 1.4, 0.8, 1.2, 0.7]
</script>

<template>
  <ClientOnly>
    <template #fallback>
      <div :class="['mx-auto grid w-full grid-cols-2 lg:grid-cols-3', maxWidthClass, gapClass]">
        <div
          v-for="(ratio, i) in skeletonRatios"
          :key="i"
          :class="['w-full animate-pulse bg-neutral-800/60', radiusClass]"
          :style="{ aspectRatio: `1 / ${ratio}` }"
        />
      </div>
    </template>

    <div :class="['mx-auto flex w-full items-start', maxWidthClass, gapClass]">
      <div
        v-for="(column, columnIndex) in columns"
        :key="columnIndex"
        :class="['flex min-w-0 flex-1 flex-col', gapClass]"
      >
        <WorkCard
          v-for="work in column"
          :key="work.id"
          :work="work"
          :captions="captions"
          :radius-class="radiusClass"
        />
      </div>
    </div>
  </ClientOnly>
</template>
