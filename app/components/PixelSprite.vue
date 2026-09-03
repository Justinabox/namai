<script setup lang="ts">
import { PIXEL_PALETTE, type PixelFrame } from '~/lib/pixelFrames'

const props = withDefaults(defineProps<{
  frame: PixelFrame
  /** Size of one pixel, in CSS px. */
  unit?: number
  /** Mirror horizontally, for facing direction. */
  flip?: boolean
}>(), {
  unit: 6,
  flip: false,
})

const cols = computed(() => Math.max(...props.frame.map(row => row.length)))
const rows = computed(() => props.frame.length)

/**
 * Merge runs of the same colour along each row into one rect. A 20x16 house
 * drops from 320 nodes to a few dozen, which matters when the sprite swaps
 * frames several times a second.
 */
const rects = computed(() => {
  const out: { x: number, y: number, w: number, fill: string }[] = []

  props.frame.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const key = row[x] as keyof typeof PIXEL_PALETTE
      if (!key || key === '.') {
        x++
        continue
      }
      let run = 1
      while (row[x + run] === key) run++
      out.push({ x, y, w: run, fill: PIXEL_PALETTE[key] })
      x += run
    }
  })

  return out
})
</script>

<template>
  <svg
    :width="cols * unit"
    :height="rows * unit"
    :viewBox="`0 0 ${cols} ${rows}`"
    shape-rendering="crispEdges"
    aria-hidden="true"
    focusable="false"
    :style="{ transform: flip ? 'scaleX(-1)' : undefined }"
    class="block"
  >
    <rect
      v-for="(r, i) in rects"
      :key="i"
      :x="r.x"
      :y="r.y"
      :width="r.w"
      height="1"
      :fill="r.fill"
    />
  </svg>
</template>
