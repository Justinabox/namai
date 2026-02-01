<script setup lang="ts">
import { ref } from "vue";
import { useScrollSnap } from "./useScrollSnap";

const props = withDefaults(
  defineProps<{
    disableSnapBelowMd?: boolean;
    mdBreakpointPx?: number;
  }>(),
  {
    disableSnapBelowMd: true,
    mdBreakpointPx: 768,
  }
);

const scrollSnapEl = ref<HTMLDivElement | null>(null);
const { CONFIG, snapEnabled, scaleEnabled, resetActive, scrollToTop } = useScrollSnap(scrollSnapEl, props);

defineExpose({
  resetActive,
  scrollToTop,
});
</script>

<template>
  <div
    ref="scrollSnapEl"
    v-bind="$attrs"
    :class="[
      CONFIG.CLASS_NAMES.SCROLL_SNAP,
      snapEnabled ? CONFIG.CLASS_NAMES.SNAP_ENABLED : CONFIG.CLASS_NAMES.SNAP_DISABLED,
      scaleEnabled ? CONFIG.CLASS_NAMES.SNAP_SCALE : CONFIG.CLASS_NAMES.SNAP_SCALE_DISABLED,
    ]"
  >
    <slot />
  </div>
</template>

<style scoped>
.scroll-snap--enabled {
  scroll-snap-type: y mandatory;
}

.scroll-snap--paused {
  scroll-snap-type: none !important;
}

.scroll-snap--enabled :deep(> *) {
  scroll-snap-align: center;
  scroll-snap-stop: always;
}

.scroll-snap--disabled {
  scroll-snap-type: none;
}


.scroll-snap--scale :deep(> *) {
  transform: scale(0.9);
  opacity: 0.3;
  transition: transform 300ms cubic-bezier(0.25, 0.1, 0.25, 1.0), opacity 300ms cubic-bezier(0.25, 0.1, 0.25, 1.0);
}

.scroll-snap--scale :deep(> .snap-align-start) {
  scroll-snap-align: start !important;
  scroll-margin-top: 10vh;
}

.scroll-snap--scale :deep(> .snap-align-start:first-child) {
  scroll-margin-top: 0;
}

.scroll-snap--scale :deep(> .scroll-snap__item--active) {
  transform: scale(1);
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .scroll-snap--scale :deep(> *) {
    transition: none;
  }
}
</style>