<script lang="ts" setup>
import { Motion } from "motion-v";
import { Icon } from "@iconify/vue";
import type { CursorObject, CursorVariantMotion } from "./cursorTypes";

defineProps<{
  motion?: CursorVariantMotion;
  cursorObject: CursorObject;
}>();
</script>

<template>
  <Motion
    as="div"
    class="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2"
    :initial="motion?.initial ?? { opacity: 0, scale: 0.98, duration: 0.2 }"
    :animate="motion?.animate ?? { opacity: 1, scale: 1 }"
    :exit="motion?.exit ?? { opacity: 0, scale: 0.98, duration: 0.1 }"
    :transition="motion?.transition ?? { type: 'spring', stiffness: 260, damping: 28 }"
  >
    <div class="inline-flex flex-col w-min min-w-64 bg-neutral-950/50 rounded-md p-4 gap-2">
      <div class="flex flex-row gap-4 justify-between">
        <h1 v-if="cursorObject.title" class="text-5xl font-pixelify-sans">
          {{ cursorObject.title }}
        </h1>
        <Icon v-if="cursorObject.icon" :icon="cursorObject.icon" class="w-12 h-12" />
      </div>
      <p v-if="cursorObject.descp" class="text-md text-neutral-300 text-wrap">
        {{ cursorObject.descp }}
      </p>
    </div>
  </Motion>
</template>
