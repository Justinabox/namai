<script setup lang="ts">
import { useElementSize } from '@vueuse/core'
import {
  CHARACTER_IDLE,
  CHARACTER_BLINK,
  CHARACTER_WALK_A,
  CHARACTER_WALK_B,
  CHARACTER_WAVE_UP,
  CHARACTER_WAVE_OUT,
  CHARACTER_STRETCH,
  CHARACTER_SIT,
  HOUSE_CLOSED,
  HOUSE_OPEN,
  TREE,
  SMOKE,
  type PixelFrame,
} from '~/lib/pixelFrames'

/**
 * A small pixel person who lives at the bottom of the hero. He wanders on his
 * own, and will walk to wherever you click. Clicking the house sends him
 * inside; the chimney smokes while he is home.
 *
 * The character's x position is deliberately kept out of reactive state and
 * written straight to the element's transform each frame. Only the sprite
 * frame, which changes a few times a second, goes through Vue.
 */

const CHAR_COLS = 16
const HOUSE_COLS = 28
const HOUSE_ROWS = 30

const WALK_SPEED = 62 // px per second
const STEP_MS = 140 // walk frame swap

const root = ref<HTMLElement | null>(null)
const charEl = ref<HTMLElement | null>(null)
const { width: sceneWidth } = useElementSize(root)

/* ------------------------------------------------------------------ sizing */

/**
 * One pixel size for the whole scene. Sprites differ in grid dimensions, not in
 * pixel density, which is what keeps the scene reading as a single drawing.
 */
const unit = computed(() => (sceneWidth.value >= 1024 ? 5 : sceneWidth.value >= 640 ? 4 : 3))

const charWidth = computed(() => CHAR_COLS * unit.value)
const houseHeight = computed(() => HOUSE_ROWS * unit.value)
const sceneHeight = computed(() => houseHeight.value + unit.value * 4)

/** Where things stand, as a fraction of the scene width. */
const houseLeft = computed(() => Math.max(0, sceneWidth.value * 0.7))
const treeLeft = computed(() => Math.max(0, sceneWidth.value * 0.16))
/** Door spans columns 18 to 24, so line the character up with its middle. */
const doorX = computed(() => houseLeft.value + unit.value * 21 - charWidth.value / 2)

const minX = computed(() => sceneWidth.value * 0.02)
const maxX = computed(() => Math.max(minX.value, sceneWidth.value * 0.95 - charWidth.value))

/* ------------------------------------------------------------------- state */

type Activity = 'idle' | 'walk' | 'wave' | 'stretch' | 'sit' | 'inside'

const activity = ref<Activity>('idle')
const frame = ref<PixelFrame>(CHARACTER_IDLE)
const facing = ref(1)
const doorOpen = ref(false)
const smoking = ref(false)
const reduced = ref(false)

let x = 0
let targetX: number | null = null
let onArrive: (() => void) | null = null
let raf = 0
let lastTime = 0
let stepTimer = 0
const timers = new Set<ReturnType<typeof setTimeout>>()

function later(fn: () => void, ms: number) {
  const id = setTimeout(() => {
    timers.delete(id)
    fn()
  }, ms)
  timers.add(id)
  return id
}

function clearTimers() {
  for (const id of timers) clearTimeout(id)
  timers.clear()
}

function paint() {
  if (charEl.value) charEl.value.style.transform = `translateX(${Math.round(x)}px)`
}

function clampX(value: number) {
  return Math.min(maxX.value, Math.max(minX.value, value))
}

/* ---------------------------------------------------------------- movement */

function walkTo(nextX: number, after?: () => void) {
  if (reduced.value) return
  clearTimers()
  targetX = clampX(nextX)
  onArrive = after ?? null
  facing.value = targetX >= x ? 1 : -1
  activity.value = 'walk'
}

function arrive() {
  targetX = null
  activity.value = 'idle'
  frame.value = CHARACTER_IDLE

  const next = onArrive
  onArrive = null

  if (next) next()
  else scheduleIdleAction()
}

/* ------------------------------------------------------------- idle things */

function blink() {
  if (activity.value !== 'idle') return
  frame.value = CHARACTER_BLINK
  later(() => {
    if (activity.value === 'idle') frame.value = CHARACTER_IDLE
  }, 130)
}

function wave() {
  if (activity.value !== 'idle') return
  activity.value = 'wave'

  let flip = false
  const swap = () => {
    if (activity.value !== 'wave') return
    flip = !flip
    frame.value = flip ? CHARACTER_WAVE_UP : CHARACTER_WAVE_OUT
    later(swap, 220)
  }
  swap()

  later(() => {
    if (activity.value !== 'wave') return
    activity.value = 'idle'
    frame.value = CHARACTER_IDLE
    scheduleWander()
  }, 1500)
}

function stretch() {
  activity.value = 'stretch'
  frame.value = CHARACTER_STRETCH
  later(() => {
    if (activity.value !== 'stretch') return
    activity.value = 'idle'
    frame.value = CHARACTER_IDLE
    scheduleWander()
  }, 1100)
}

function sit() {
  activity.value = 'sit'
  frame.value = CHARACTER_SIT
  later(() => {
    if (activity.value !== 'sit') return
    activity.value = 'idle'
    frame.value = CHARACTER_IDLE
    scheduleWander()
  }, 2600)
}

function scheduleIdleAction() {
  const roll = Math.random()
  if (roll < 0.28) later(wave, 350)
  else if (roll < 0.5) later(stretch, 350)
  else if (roll < 0.66) later(sit, 350)
  else {
    later(blink, 900 + Math.random() * 1400)
    scheduleWander()
  }
}

function scheduleWander() {
  later(() => {
    if (activity.value !== 'idle') return
    walkTo(minX.value + Math.random() * (maxX.value - minX.value))
  }, 2600 + Math.random() * 3600)
}

/* -------------------------------------------------------------- the  house */

function goHome() {
  walkTo(doorX.value, () => {
    doorOpen.value = true
    later(() => {
      activity.value = 'inside'
      smoking.value = true
      later(comeBackOut, 2400 + Math.random() * 2000)
    }, 420)
  })
}

function comeBackOut() {
  activity.value = 'idle'
  frame.value = CHARACTER_IDLE
  smoking.value = false
  facing.value = -1
  later(() => {
    doorOpen.value = false
    walkTo(x - 90 - Math.random() * 120)
  }, 500)
}

/* ------------------------------------------------------------ interactions */

function onSceneClick(event: MouseEvent) {
  if (reduced.value || !root.value) return
  const bounds = root.value.getBoundingClientRect()
  walkTo(event.clientX - bounds.left - charWidth.value / 2)
}

function onHouseClick(event: MouseEvent) {
  event.stopPropagation()
  if (reduced.value || activity.value === 'inside') return
  goHome()
}

function onCharacterEnter() {
  if (activity.value === 'idle') {
    clearTimers()
    wave()
  }
}

/* ------------------------------------------------------------------- frame */

function tick(now: number) {
  raf = requestAnimationFrame(tick)

  const dt = Math.min(0.05, (now - lastTime) / 1000)
  lastTime = now

  if (activity.value === 'walk' && targetX !== null) {
    const delta = targetX - x
    const step = WALK_SPEED * dt * Math.sign(delta)

    if (Math.abs(delta) <= Math.abs(step) || Math.abs(delta) < 1) {
      x = targetX
      paint()
      arrive()
      return
    }

    x += step
    paint()

    if (now - stepTimer > STEP_MS) {
      stepTimer = now
      frame.value = frame.value === CHARACTER_WALK_A ? CHARACTER_WALK_B : CHARACTER_WALK_A
    }
  }
}

onMounted(() => {
  reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  x = clampX(sceneWidth.value * 0.38)
  paint()

  if (reduced.value) return

  lastTime = performance.now()
  stepTimer = lastTime
  raf = requestAnimationFrame(tick)
  scheduleWander()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  clearTimers()
})
</script>

<template>
  <div
    ref="root"
    class="pixel-scene relative w-full select-none overflow-hidden"
    :style="{ height: `${sceneHeight}px` }"
    v-cursor="{ clickable: !reduced }"
    role="presentation"
    @click="onSceneClick"
  >
    <!-- Ground -->
    <div class="absolute inset-x-0 bottom-0 h-px bg-ink/15" />

    <!-- House -->
    <div
      class="absolute bottom-0"
      :style="{ left: `${houseLeft}px` }"
      v-cursor="{
        clickable: true,
        variant: 'descriptive',
        object: { title: 'Home', descp: 'Knock and he will go inside' },
      }"
      @click="onHouseClick"
    >
      <!-- Chimney smoke, only while somebody is home. -->
      <Transition name="puff">
        <div
          v-if="smoking"
          class="puff absolute"
          :style="{
            left: `${unit * 20}px`,
            bottom: `${houseHeight}px`,
          }"
        >
          <PixelSprite :frame="SMOKE" :unit="unit" />
        </div>
      </Transition>

      <PixelSprite :frame="doorOpen ? HOUSE_OPEN : HOUSE_CLOSED" :unit="unit" />
    </div>

    <!-- Tree -->
    <div
      class="tree absolute bottom-0 origin-bottom"
      :style="{ left: `${treeLeft}px` }"
    >
      <PixelSprite :frame="TREE" :unit="unit" />
    </div>

    <!-- Character -->
    <div
      v-show="activity !== 'inside'"
      ref="charEl"
      class="absolute bottom-0 left-0 will-change-transform"
      @mouseenter="onCharacterEnter"
    >
      <PixelSprite :frame="frame" :unit="unit" :flip="facing === -1" />
    </div>
  </div>
</template>

<style scoped>
.pixel-scene {
  --px-ink: oklch(22% 0 0);
  --px-dark: oklch(45% 0 0);
  --px-mid: oklch(66% 0 0);
  --px-light: oklch(84% 0 0);
  --px-white: oklch(95% 0 0);
}

.tree {
  animation: sway 7s ease-in-out infinite;
}

@keyframes sway {
  0%, 100% { transform: rotate(-1deg); }
  50% { transform: rotate(1deg); }
}

.puff {
  animation: rise 2.6s ease-out infinite;
}

@keyframes rise {
  0% { opacity: 0; transform: translateY(6px) scale(0.7); }
  25% { opacity: 0.75; }
  100% { opacity: 0; transform: translateY(-34px) scale(1.25); }
}

.puff-enter-active,
.puff-leave-active {
  transition: opacity 300ms ease;
}

.puff-enter-from,
.puff-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .tree,
  .puff {
    animation: none;
  }
}
</style>
