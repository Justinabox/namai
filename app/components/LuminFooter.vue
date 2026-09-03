<script setup lang="ts">
import {
  AmbientLight,
  DirectionalLight,
  Fog,
  PerspectiveCamera,
  Scene,
  Vector2,
  WebGLRenderer,
} from 'three'
import { NoiseTerrain } from '~/lib/noiseTerrain'

/**
 * The Lumin scene from ThreeJSPlayground: pale contour cubes on the dark page,
 * fogged out so the landscape dissolves into it rather than ending at an edge.
 *
 * The camera holds one position and slowly turns on its yaw, so the terrain is
 * generated once around a fixed centre and never streams. Only renders while
 * the footer is on screen, and holds a single frame under reduced motion.
 */

const YAW = 0.012 // radians per second: a full turn in about nine minutes

const host = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const ready = ref(false)

let renderer: WebGLRenderer | null = null
let scene: Scene | null = null
let camera: PerspectiveCamera | null = null
let terrain: NoiseTerrain | null = null
let observer: IntersectionObserver | null = null
let resizeObserver: ResizeObserver | null = null
let raf = 0
let lastTime = 0
let visible = false
let reduced = false

function paperColor() {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-paper-hex')
    .trim()
  return value || '#fbfbfb'
}

function resize() {
  if (!host.value || !renderer || !camera) return
  const { clientWidth: width, clientHeight: height } = host.value
  if (!width || !height) return

  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

function render(now: number) {
  if (!renderer || !scene || !camera || !terrain) return

  const delta = Math.min(0.05, (now - lastTime) / 1000)
  lastTime = now

  if (!reduced) camera.rotation.y += YAW * delta

  terrain.processQueue(1)
  renderer.render(scene, camera)
}

function loop(now: number) {
  raf = requestAnimationFrame(loop)
  if (!visible) return
  render(now)
}

onMounted(() => {
  if (!canvas.value || !host.value) return

  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  try {
    renderer = new WebGLRenderer({
      canvas: canvas.value,
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
    })
  } catch {
    // No WebGL: the footer keeps its text, just without the landscape.
    return
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearAlpha(0)

  const paper = paperColor()

  scene = new Scene()
  scene.fog = new Fog(paper, 2.5, 9)

  camera = new PerspectiveCamera(34, 1, 0.1, 40)
  camera.rotation.order = 'YXZ'
  camera.position.set(0, 2.6, 0)
  camera.rotation.x = -0.34 // a fixed tilt down onto the contours

  scene.add(new AmbientLight(0xffffff, 1.4))
  const key = new DirectionalLight(0xffffff, 1.1)
  key.position.set(2, 6, 3)
  scene.add(key)

  // The camera turns in place, so the terrain has to reach past the fog in
  // every direction, not just ahead.
  terrain = new NoiseTerrain(scene, { seed: 'slow-tide-harbour', range: 9, chunkSize: 48, shade: [0.42, 1] })

  resize()

  // The centre never moves, so this is the only time chunks are chosen. Build
  // the nearest ones up front so the footer never fades in empty.
  terrain.updateCenter(new Vector2(camera.position.x, camera.position.z))
  terrain.processQueue(14)
  ready.value = true

  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(host.value)

  observer = new IntersectionObserver(
    ([entry]) => {
      visible = Boolean(entry?.isIntersecting)
      // Reset the clock so a long time off screen does not jump the camera.
      lastTime = performance.now()
    },
    { rootMargin: '200px' },
  )
  observer.observe(host.value)

  lastTime = performance.now()
  raf = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  observer?.disconnect()
  resizeObserver?.disconnect()
  terrain?.dispose()
  renderer?.dispose()
  renderer = null
  scene = null
  camera = null
  terrain = null
})
</script>

<template>
  <div ref="host" class="relative h-[54vh] min-h-[340px] w-full overflow-hidden">
    <canvas
      ref="canvas"
      aria-hidden="true"
      class="absolute inset-0 h-full w-full transition-opacity duration-1000"
      :class="ready ? 'opacity-100' : 'opacity-0'"
    />

    <!-- Fades the horizon into the page above it. -->
    <div class="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-paper to-transparent" />
    <!-- Holds the footer type legible where cubes pass close to the camera. -->
    <div class="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-paper via-paper/70 to-transparent" />

    <slot />
  </div>
</template>
