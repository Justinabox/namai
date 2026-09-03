<script setup lang="ts">
/**
 * Splits a line into per-character spans so each one can nudge independently
 * on hover. The offsets cycle through eight static classes rather than inline
 * styles: same effect, no CSS custom properties in the markup. Decorative
 * only, so the spans are hidden from screen readers and the whole line is
 * exposed once via aria-label.
 */
const props = defineProps<{ text: string }>()

const VARIANTS = 8

const characters = computed(() =>
  Array.from(props.text).map((char, index) => ({
    char,
    key: `${index}-${char}`,
    variant: index % VARIANTS,
  })),
)
</script>

<template>
  <span class="jitter inline-block" role="text" :aria-label="text">
    <span
      v-for="c in characters"
      :key="c.key"
      aria-hidden="true"
      class="jitter__char inline-block"
      :class="`jitter__char--${c.variant}`"
    >{{ c.char }}</span>
  </span>
</template>

<style scoped>
.jitter__char {
  white-space: pre;
  transition: transform 320ms cubic-bezier(0.16, 1, 0.3, 1);
}

.jitter:hover .jitter__char--0 { transform: translateY(-4px) rotate(-5deg); }
.jitter:hover .jitter__char--1 { transform: translateY(3px) rotate(4deg); }
.jitter:hover .jitter__char--2 { transform: translateY(-2px) rotate(7deg); }
.jitter:hover .jitter__char--3 { transform: translateY(5px) rotate(-3deg); }
.jitter:hover .jitter__char--4 { transform: translateY(-5px) rotate(2deg); }
.jitter:hover .jitter__char--5 { transform: translateY(2px) rotate(-7deg); }
.jitter:hover .jitter__char--6 { transform: translateY(-3px) rotate(6deg); }
.jitter:hover .jitter__char--7 { transform: translateY(4px) rotate(-2deg); }

@media (prefers-reduced-motion: reduce) {
  .jitter__char,
  .jitter:hover .jitter__char {
    transform: none;
    transition: none;
  }
}
</style>
