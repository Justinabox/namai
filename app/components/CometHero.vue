<script setup lang="ts">
/**
 * The dusk-sky composition from the Invitation-v2 project, reused as this
 * site's hero: a CSS blue-hour gradient, the WebGL comet scene over it, then
 * two procedural ridge lines and a ground plane to close the bottom.
 *
 * Whatever is slotted in sits above the whole stack.
 */

/**
 * Folded value noise: crests come to sharp creases while valleys stay smooth,
 * the way real mountain profiles carry detail at every scale. Seeded, so the
 * server and client draw the identical range.
 */
function makeRidgePath(seed: number, width: number, height: number, baseY: number, amp: number) {
  let s = seed
  const rand = () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
  const octaves = [
    { wl: 340, amp: 1.0 },
    { wl: 120, amp: 0.5 },
    { wl: 42, amp: 0.22 },
    { wl: 13, amp: 0.08 },
  ]
  const grids = octaves.map(o => Array.from({ length: Math.ceil(width / o.wl) + 2 }, rand))
  const ampSum = octaves.reduce((total, o) => total + o.amp, 0)

  const crestAt = (x: number) => {
    let v = 0
    for (let i = 0; i < octaves.length; i++) {
      const p = x / octaves[i]!.wl
      const i0 = Math.floor(p)
      const t = p - i0
      const g = grids[i]!
      const n = g[i0]! + (g[i0 + 1]! - g[i0]!) * (t * t * (3 - 2 * t))
      v += octaves[i]!.amp * (1 - Math.abs(2 * n - 1))
    }
    return baseY - (v / ampSum) * amp
  }

  let d = `M0,${height} L0,${crestAt(0).toFixed(1)}`
  for (let x = 6; x <= width; x += 6) d += ` L${x},${crestAt(x).toFixed(1)}`
  return `${d} L${width},${height} Z`
}

const farRidge = makeRidgePath(90211, 1440, 240, 200, 150)
const nearRidge = makeRidgePath(48757, 1440, 160, 138, 110)
// Narrower paths for small screens so the detail is not squeezed into needles.
const farRidgeSm = makeRidgePath(90211, 480, 240, 200, 150)
const nearRidgeSm = makeRidgePath(48757, 480, 160, 138, 110)
</script>

<template>
  <section class="relative w-full overflow-hidden" aria-label="Comet over a dusk horizon">
    <!-- Blue hour: deep night above, violet dusk at the horizon. -->
    <div class="absolute inset-0 bg-[linear-gradient(180deg,#020310_0%,#060b22_36%,#101538_58%,#1e2150_74%,#33305f_85%,#4d3d63_93%,#644a60_100%)]" />
    <!-- Afterglow, strongest bottom left where the sun went down. -->
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_115%_55%_at_16%_103%,rgba(255,176,110,0.46)_0%,rgba(228,124,106,0.24)_36%,rgba(115,72,118,0.12)_58%,transparent_75%)]" />

    <ClientOnly>
      <CometScene />
    </ClientOnly>

    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_58%,rgba(0,2,10,0.5)_100%)]" />

    <!-- A far hazy ridge, then a near black one. -->
    <svg
      class="pointer-events-none absolute inset-x-0 bottom-[5vh] hidden h-[24vh] w-full sm:block"
      viewBox="0 0 1440 240"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path fill="#151537" fill-opacity="0.8" :d="farRidge" />
    </svg>
    <svg
      class="pointer-events-none absolute inset-x-0 bottom-[5vh] hidden h-[16vh] w-full sm:block"
      viewBox="0 0 1440 160"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path fill="#03040c" :d="nearRidge" />
    </svg>
    <svg
      class="pointer-events-none absolute inset-x-0 bottom-[5vh] h-[24vh] w-full sm:hidden"
      viewBox="0 0 480 240"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path fill="#151537" fill-opacity="0.8" :d="farRidgeSm" />
    </svg>
    <svg
      class="pointer-events-none absolute inset-x-0 bottom-[5vh] h-[16vh] w-full sm:hidden"
      viewBox="0 0 480 160"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path fill="#03040c" :d="nearRidgeSm" />
    </svg>

    <!-- Ground under the raised ridges; overlaps them slightly to avoid a seam. -->
    <div class="pointer-events-none absolute inset-x-0 bottom-0 h-[5.5vh] bg-[#03040c]" />

    <slot />
  </section>
</template>
