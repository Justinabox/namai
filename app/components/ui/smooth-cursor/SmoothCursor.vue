<script lang="ts" setup>
import { computed, watchEffect } from "vue";
import { AnimatePresence, Motion, useSpring } from "motion-v";
import CursorDefault from "./CursorDefault.vue";
import CursorDescriptive from "./CursorDescriptive.vue";
import { useSmoothCursor } from "./useSmoothCursor";
import type { CursorVariantMotion, SmoothCursorProps } from "./cursorTypes";

interface CursorVariantConfig {
  scale: {
    hover: number;
    press: number;
    move: number;
  };
  motion?: CursorVariantMotion;
}

const props = withDefaults(defineProps<SmoothCursorProps>(), {
  springConfig: () => ({
    damping: 45,
    stiffness: 500,
    mass: 1,
    restDelta: 0.001,
  }),
  disableRotation: false,
});

const VARIANTS = {
  default: {
    scale: {
      hover: 2,
      press: 0.85,
      move: 0.95,
    },
    motion: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.9 },
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
  },
  descriptive: {
    scale: {
      hover: 1,
      press: 0.9,
      move: 0.98,
    },
    motion: {
      initial: { opacity: 0, scale: 0.98 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.98 },
      transition: { type: "spring", stiffness: 260, damping: 28 },
    },
  },
} satisfies Record<string, CursorVariantConfig>;

const {
  cursorX,
  cursorY,
  rotation,
  isMoving,
  isPressing,
  isHoveringClickable,
  cursorVariant,
  cursorObject,
  hasPointer,
} = useSmoothCursor(props);

const activeVariantName = computed(() => cursorVariant.value ?? "default");
const getVariant = (name: string) =>
  (name in VARIANTS ? VARIANTS[name as keyof typeof VARIANTS] : VARIANTS.default);
const activeVariant = computed<CursorVariantConfig>(() => getVariant(activeVariantName.value));

const scale = useSpring(1, {
  ...props.springConfig,
  stiffness: 500,
  damping: 35,
});
watchEffect(() => {
  const variantScale = activeVariant.value.scale;
  const hoverScale = isHoveringClickable.value ? variantScale.hover : 1;
  const pressScale = isPressing.value ? variantScale.press : 1;
  const moveScale = isMoving.value ? variantScale.move : 1;
  scale.set(hoverScale * pressScale * moveScale);
});

defineExpose({
  isHoveringClickable,
  cursorVariant,
  cursorObject,
});
</script>

<template>
  <Motion
    v-if="hasPointer"
    as="div"
    class="fixed w-0 h-0 pointer-events-none will-change-transform z-[100] md:block hidden"
    :style="{
      left: cursorX,
      top: cursorY,
      rotate: rotation,
      scale,
    }"
    :initial="{ scale: 0 }"
    :animate="{ scale: 1 }"
    :transition="{
      type: 'spring',
      stiffness: 300,
      damping: 30,
    }"
  >
    <AnimatePresence mode="sync">
      <CursorDefault
        v-if="activeVariantName === 'default'"
        :motion="VARIANTS.default.motion"
      />

      <CursorDescriptive
        v-else-if="activeVariantName === 'descriptive' && cursorObject"
        :cursor-object="cursorObject"
        :motion="VARIANTS.descriptive.motion"
      />
    </AnimatePresence>
  </Motion>
</template>

<style scoped>
:global(body),
:global(body *) {
  cursor: none !important;
}
</style>
