<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core'

/**
 * The homepage wordmark. It starts large over the hero sky and, as the page
 * scrolls, shrinks and settles into the header's own wordmark slot, which is
 * why the header hides its copy on this route.
 *
 * Scroll drives a single custom property; every size and position is derived
 * from it in CSS, so a scroll frame writes one value and never re-renders the
 * component. It is left-aligned on the same padding as the header, so only the
 * vertical position and the scale actually travel.
 */

const mark = ref<HTMLElement | null>(null)
const { y } = useWindowScroll()

/** How far you scroll before the mark is fully docked. */
const DOCK_DISTANCE = 0.42

let reduced = false

onMounted(() => {
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
})

watchEffect(() => {
  const el = mark.value
  if (!el || !import.meta.client) return

  const distance = Math.max(1, window.innerHeight * DOCK_DISTANCE)
  const raw = Math.min(1, Math.max(0, y.value / distance))
  // Reduced motion gets the two end states rather than a travelling mark.
  const progress = reduced ? (raw > 0.5 ? 1 : 0) : raw

  el.style.setProperty('--p', progress.toFixed(4))
})
</script>

<template>
  <h1
    ref="mark"
    class="wordmark pointer-events-none fixed left-6 top-0 z-40 font-pixelify-sans leading-none md:left-10 lg:left-16"
  >
    Justzhu
  </h1>
</template>

<style scoped>
.wordmark {
  --p: 0;

  /* Hero size, the size it docks to as a fraction of it, and the two tops. */
  --size: 3rem;
  --ratio: 0.5;
  --from: 38vh;
  --to: 20px;

  font-size: var(--size);
  transform-origin: left top;
  transform:
    translateY(calc(var(--from) + var(--p) * (var(--to) - var(--from))))
    scale(calc(1 + var(--p) * (var(--ratio) - 1)));
  will-change: transform;
}

@media (min-width: 768px) {
  .wordmark {
    --size: 5rem;
    --ratio: 0.375; /* docks to the header's 1.875rem */
    --to: 17px;
  }
}

@media (min-width: 1024px) {
  .wordmark {
    --size: 7rem;
    --ratio: 0.2679; /* 1.875rem / 7rem */
  }
}
</style>
