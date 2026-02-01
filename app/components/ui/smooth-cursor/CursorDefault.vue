<script lang="ts" setup>
import { Motion } from "motion-v";
import type { CursorVariantMotion } from "./cursorTypes";

defineProps<{
  motion?: CursorVariantMotion;
}>();
</script>

<template>
  <Motion
    as="div"
    class="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2"
    :initial="motion?.initial ?? { opacity: 0, scale: 0.95, duration: 0.2 }"
    :animate="motion?.animate ?? { opacity: 1, scale: 1 }"
    :exit="motion?.exit ?? { opacity: 0, scale: 0.9, duration: 0.3 }"
    :transition="motion?.transition ?? { type: 'spring', stiffness: 500, damping: 30 }"
  >
    <div class="w-8 h-8 rounded-full bg-neutral-500/50 shadow-lg" />
  </Motion>
</template>
