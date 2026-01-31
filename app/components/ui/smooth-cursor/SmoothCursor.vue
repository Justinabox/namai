<script lang="ts" setup>
import { useEventListener, useTimeout } from "@vueuse/core";
import { AnimatePresence, Motion, useSpring } from "motion-v";
import type { Transition } from "motion-v";
import { Icon } from '@iconify/vue'

interface Position {
  x: number;
  y: number;
}

/** Parsed object from data-cursor-object (title, descp, icon, image, etc.) */
export interface CursorObject {
  title?: string;
  descp?: string;
  icon?: string;
  image?: string;
  [key: string]: unknown;
}

interface HoverMetadata {
  isClickable: boolean;
  variant: string | null;
  object: CursorObject | null;
}

interface SmoothCursorProps {
  springConfig?: {
    damping: number;
    stiffness: number;
    mass: number;
    restDelta: number;
  };
  disableRotation?: boolean;
}

interface CursorVariantConfig {
  scale: {
    hover: number;
    press: number;
    move: number;
  };
  motion?: {
    initial?: Record<string, number>;
    animate?: Record<string, number>;
    exit?: Record<string, number>;
    transition?: Transition;
  };
}

const props = withDefaults(defineProps<SmoothCursorProps>(), {
  springConfig: () => ({
    damping: 45,
    stiffness: 400,
    mass: 1,
    restDelta: 0.001,
  }),
  disableRotation: false,
});

const isMoving = ref(false);
const isPressing = ref(false);
const isHoveringClickable = ref(false);
const cursorVariant = ref<string | null>(null);
const cursorObject = ref<CursorObject | null>(null);
const lastMousePos = ref<Position>({ x: 0, y: 0 });
const velocity = ref<Position>({ x: 0, y: 0 });
const lastUpdateTime = ref(Date.now());
const previousAngle = ref(0);
const accumulatedRotation = ref(0);

const VARIANTS = {
  default: {
    scale: {
      hover: 1.5,
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

const activeVariantName = computed(() => cursorVariant.value ?? "default");
const getVariant = (name: string) =>
  (name in VARIANTS ? VARIANTS[name as keyof typeof VARIANTS] : VARIANTS.default);
const activeVariant = computed<CursorVariantConfig>(() => getVariant(activeVariantName.value));

const cursorX = useSpring(0, props.springConfig);
const cursorY = useSpring(0, props.springConfig);
const rotation = useSpring(0, {
  ...props.springConfig,
  damping: 60,
  stiffness: 300,
});
const scale = useSpring(1, {
  ...props.springConfig,
  stiffness: 500,
  damping: 35,
});

function updateVelocity(currentPos: Position) {
  const currentTime = Date.now();
  const deltaTime = currentTime - lastUpdateTime.value;

  if (deltaTime > 0) {
    velocity.value = {
      x: (currentPos.x - lastMousePos.value.x) / deltaTime,
      y: (currentPos.y - lastMousePos.value.y) / deltaTime,
    };
  }

  lastUpdateTime.value = currentTime;
  lastMousePos.value = currentPos;
}

/** Walk up DOM from element at (x,y) and extract cursor metadata for future morph variants. */
function getHoverMetadata(x: number, y: number): HoverMetadata {
  const el = document.elementFromPoint(x, y);
  if (!el) return { isClickable: false, variant: null, object: null };

  let isClickable = false;
  let variant: string | null = null;
  let object: CursorObject | null = null;

  for (let node: Element | null = el; node; node = node.parentElement) {
    if (node === document.body) break;

    const style = window.getComputedStyle(node);
    if (style.cursor === "pointer") isClickable = true;

    const v = node.getAttribute("data-cursor-variant");
    if (v && !variant) variant = v;

    const raw = node.getAttribute("data-cursor-object");
    if (raw && !object) {
      try {
        object = JSON.parse(raw) as CursorObject;
      } catch {
        // ignore invalid JSON
      }
    }
  }

  return { isClickable, variant, object };
}

function updateScale() {
  const variantScale = activeVariant.value.scale;
  const hoverScale = isHoveringClickable.value ? variantScale.hover : 1;
  const pressScale = isPressing.value ? variantScale.press : 1;
  const moveScale = isMoving.value ? variantScale.move : 1;
  const effectiveScale = hoverScale * pressScale * moveScale;
  scale.set(effectiveScale);
}

function resetRotationState() {
  rotation.set(0);
  previousAngle.value = 0;
  accumulatedRotation.value = 0;
}

function updateRotation(speed: number) {
  if (props.disableRotation) {
    resetRotationState();
    return;
  }

  if (speed <= 0.1) return;

  const currentAngle = Math.atan2(velocity.value.y, velocity.value.x) * (180 / Math.PI) + 90;
  let angleDiff = currentAngle - previousAngle.value;
  if (angleDiff > 180) angleDiff -= 360;
  if (angleDiff < -180) angleDiff += 360;
  accumulatedRotation.value += angleDiff;
  rotation.set(accumulatedRotation.value);
  previousAngle.value = currentAngle;
}

function smoothMouseMove(e: MouseEvent) {
  const currentPos = { x: e.clientX, y: e.clientY };
  updateVelocity(currentPos);

  const meta = getHoverMetadata(currentPos.x, currentPos.y);
  isHoveringClickable.value = meta.isClickable;
  cursorVariant.value = meta.variant;
  cursorObject.value = meta.object;

  const speed = Math.sqrt(velocity.value.x ** 2 + velocity.value.y ** 2);

  cursorX.set(currentPos.x);
  cursorY.set(currentPos.y);

  updateRotation(speed);

  if (speed > 0.1) {
    isMoving.value = true;
    updateScale();

    useTimeout(150, {
      callback: () => {
        isMoving.value = false;
        updateScale();
      },
    });
  } else {
    updateScale();
  }
}

let rafId: number;

function throttledMouseMove(e: MouseEvent) {
  if (rafId) return;

  rafId = requestAnimationFrame(() => {
    smoothMouseMove(e);
    rafId = 0;
  });
}

document.body.style.cursor = "none";
useEventListener(window, "mousemove", throttledMouseMove);
useEventListener(window, "mousedown", () => {
  isPressing.value = true;
  updateScale();
});
useEventListener(window, "mouseup", () => {
  isPressing.value = false;
  updateScale();
});
useEventListener(window, "blur", () => {
  isPressing.value = false;
  isHoveringClickable.value = false;
  cursorVariant.value = null;
  cursorObject.value = null;
  updateScale();
});

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId);
  document.body.style.cursor = "default";
});

defineExpose({
  isHoveringClickable,
  cursorVariant,
  cursorObject,
});
</script>

<template>
  <Motion
    as="div"
    class="fixed w-0 h-0 pointer-events-none will-change-transform z-[100]"
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
      stiffness: 400,
      damping: 30,
    }"
  >
    <AnimatePresence mode="sync">
      <Motion
        v-if="activeVariantName === 'default'"
        as="div"
        class="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2"
        :initial="VARIANTS.default.motion?.initial ?? { opacity: 0, scale: 0.95, duration: 0.2 }"
        :animate="VARIANTS.default.motion?.animate ?? { opacity: 1, scale: 1 }"
        :exit="VARIANTS.default.motion?.exit ?? { opacity: 0, scale: 0.9, duration: 0.3 }"
        :transition="VARIANTS.default.motion?.transition ?? { type: 'spring', stiffness: 300, damping: 30 }"
      >
        <!-- Variant: default -->
        <div class="w-8 h-8 rounded-full bg-neutral-500/50 shadow-lg" />
      </Motion>

      <Motion
        v-else-if="activeVariantName === 'descriptive' && cursorObject"
        as="div"
        class="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2"
        :initial="VARIANTS.descriptive.motion?.initial ?? { opacity: 0, scale: 0.98, duration: 0.2 }"
        :animate="VARIANTS.descriptive.motion?.animate ?? { opacity: 1, scale: 1 }"
        :exit="VARIANTS.descriptive.motion?.exit ?? { opacity: 0, scale: 0.98, duration: 0.1 }"
        :transition="VARIANTS.descriptive.motion?.transition ?? { type: 'spring', stiffness: 260, damping: 28 }"
      >
        <!-- Variant: descriptive -->
        <div class="inline-flex flex-col w-min min-w-64 bg-neutral-950/50 rounded-md p-4 gap-2">
          <div class="flex flex-row gap-4 justify-between">
            <h1 v-if="cursorObject.title" class="text-5xl font-pixelify-sans">
              {{ cursorObject.title }}
            </h1>
            <Icon
              v-if="cursorObject.icon"
              :icon="cursorObject.icon"
              class="w-12 h-12"
            />
          </div>
          <p v-if="cursorObject.descp" class="text-md text-neutral-300 text-wrap">
            {{ cursorObject.descp }}
          </p>
        </div>
      </Motion>
    </AnimatePresence>
  </Motion>
</template>

<style scoped>
:global(body),
:global(body *) {
  cursor: none !important;
}
</style>
