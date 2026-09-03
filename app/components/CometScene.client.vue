<template>
  <canvas ref="canvasEl" class="absolute inset-0 h-full w-full" aria-hidden="true" />
</template>

<!--
  Ported from the Invitation-v2 project. The only change is sizing: the original
  filled the window, this one fills whatever element it is placed in, so it can
  sit inside a hero section rather than owning the viewport.
-->

<script setup lang="ts">
import * as THREE from 'three'

const canvasEl = ref<HTMLCanvasElement | null>(null)

const STAR_VERT = /* glsl */ `
attribute float aSize;
attribute float aPhase;
attribute vec3 aColor;
uniform float uTime;
uniform float uPx;
varying vec3 vColor;
varying float vTwinkle;
void main() {
  vColor = aColor;
  float tw = 0.72 + 0.28 * sin(uTime * (0.35 + aPhase * 0.3) + aPhase * 43.0);
  vTwinkle = tw;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * tw * uPx * (340.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}`

const STAR_FRAG = /* glsl */ `
varying vec3 vColor;
varying float vTwinkle;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = pow(smoothstep(0.5, 0.0, d), 1.7);
  gl_FragColor = vec4(vColor, a * vTwinkle);
}`

const HAZE_FRAG = /* glsl */ `
varying vec3 vColor;
varying float vTwinkle;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = pow(smoothstep(0.5, 0.0, d), 2.6) * 0.09;
  gl_FragColor = vec4(vColor, a);
}`

const PARTICLE_VERT = /* glsl */ `
attribute float aSize;
attribute float aAlpha;
uniform float uPx;
varying float vAlpha;
void main() {
  vAlpha = aAlpha;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * (0.55 + 0.45 * aAlpha) * uPx * (340.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}`

const PARTICLE_FRAG = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = pow(smoothstep(0.5, 0.0, d), 2.1);
  vec3 col = mix(uColorB, uColorA, vAlpha);
  gl_FragColor = vec4(col, a * vAlpha);
}`

// device pixel ratio, shared by every point material (set once the renderer exists)
const PX = { value: 1 }

interface ParticleSystem {
  points: THREE.Points
  pos: Float32Array
  vel: Float32Array
  alpha: Float32Array
  size: Float32Array
  life: Float32Array
  maxLife: Float32Array
  head: number
  count: number
  emitCarry: number
  alphaScale: number
}

function gauss() {
  return Math.random() + Math.random() + Math.random() - 1.5
}

function makeParticleSystem(count: number, colorA: string, colorB: string, alphaScale = 1): ParticleSystem {
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const alpha = new Float32Array(count)
  const size = new Float32Array(count)
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1))
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uColorA: { value: new THREE.Color(colorA) },
      uColorB: { value: new THREE.Color(colorB) },
      uPx: PX,
    },
    vertexShader: PARTICLE_VERT,
    fragmentShader: PARTICLE_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const points = new THREE.Points(geo, mat)
  points.frustumCulled = false
  return {
    points,
    pos,
    vel: new Float32Array(count * 3),
    alpha,
    size,
    life: new Float32Array(count),
    maxLife: new Float32Array(count),
    head: 0,
    count,
    emitCarry: 0,
    alphaScale,
  }
}

function emitParticle(
  sys: ParticleSystem,
  origin: THREE.Vector3,
  velocity: THREE.Vector3,
  life: number,
  size: number,
) {
  const i = sys.head
  sys.head = (sys.head + 1) % sys.count
  sys.pos[i * 3] = origin.x
  sys.pos[i * 3 + 1] = origin.y
  sys.pos[i * 3 + 2] = origin.z
  sys.vel[i * 3] = velocity.x
  sys.vel[i * 3 + 1] = velocity.y
  sys.vel[i * 3 + 2] = velocity.z
  sys.life[i] = life
  sys.maxLife[i] = life
  sys.size[i] = size
}

function updateParticles(sys: ParticleSystem, dt: number, accel: THREE.Vector3) {
  for (let i = 0; i < sys.count; i++) {
    if (sys.life[i]! <= 0) continue
    sys.life[i]! -= dt
    if (sys.life[i]! <= 0) {
      sys.alpha[i] = 0
      continue
    }
    sys.vel[i * 3]! += accel.x * dt
    sys.vel[i * 3 + 1]! += accel.y * dt
    sys.vel[i * 3 + 2]! += accel.z * dt
    sys.pos[i * 3]! += sys.vel[i * 3]! * dt
    sys.pos[i * 3 + 1]! += sys.vel[i * 3 + 1]! * dt
    sys.pos[i * 3 + 2]! += sys.vel[i * 3 + 2]! * dt
    const t = sys.life[i]! / sys.maxLife[i]!
    const age = 1 - t
    sys.alpha[i] = sys.alphaScale * Math.min(1, age * 10) * Math.pow(t, 1.4)
  }
  const geo = sys.points.geometry
  geo.attributes.position!.needsUpdate = true
  geo.attributes.aAlpha!.needsUpdate = true
  geo.attributes.aSize!.needsUpdate = true
}

function makeGlowTexture(inner: string, outer: string) {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, inner)
  g.addColorStop(0.25, outer)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

let cleanup: (() => void) | null = null

onMounted(async () => {
  // .client components swap their placeholder for the real DOM one tick after mount
  await nextTick()
  const canvas = canvasEl.value
  if (!canvas) return
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const viewport = () => ({
    width: canvas.clientWidth || window.innerWidth,
    height: canvas.clientHeight || window.innerHeight,
  })

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
  {
    const { width, height } = viewport()
    renderer.setSize(width, height, false)
  }
  PX.value = renderer.getPixelRatio()

  const scene = new THREE.Scene()
  const sky = new THREE.Group()
  scene.add(sky)
  const camera = new THREE.PerspectiveCamera(55, viewport().width / viewport().height, 1, 2000)

  // ---- star field -------------------------------------------------------
  const STAR_COUNT = 7800
  const BAND_COUNT = 3200
  const HAZE_COUNT = 1500

  // Milky Way band basis: a tilted great circle across the view
  const bandNormal = new THREE.Vector3(0.5, 1.0, 0.28).normalize()
  const bandU = new THREE.Vector3(1, 0, 0).cross(bandNormal).normalize()
  const bandV = new THREE.Vector3().crossVectors(bandNormal, bandU)

  function starColor(out: THREE.Color) {
    const r = Math.random()
    if (r < 0.62) out.setHSL(0.62, 0.35 * Math.random(), 0.82 + Math.random() * 0.18)
    else if (r < 0.88) out.set('#ffffff')
    else if (r < 0.97) out.set('#ffe3c4')
    else out.set('#ffc9a0')
  }

  function buildStars(count: number, onBand: boolean, sizeMin: number, sizeMax: number) {
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const size = new Float32Array(count)
    const phase = new Float32Array(count)
    const color = new Float32Array(count * 3)
    const col = new THREE.Color()
    const dir = new THREE.Vector3()
    for (let i = 0; i < count; i++) {
      if (onBand) {
        const theta = Math.random() * Math.PI * 2
        dir
          .copy(bandU).multiplyScalar(Math.cos(theta))
          .addScaledVector(bandV, Math.sin(theta))
          .addScaledVector(bandNormal, gauss() * 0.14)
          .normalize()
      } else {
        dir.set(gauss(), gauss(), gauss()).normalize()
      }
      const r = 650 + Math.random() * 300
      pos[i * 3] = dir.x * r
      pos[i * 3 + 1] = dir.y * r
      pos[i * 3 + 2] = dir.z * r
      // weight toward small stars, keep a few bright ones
      size[i] = sizeMin + Math.pow(Math.random(), 2.6) * (sizeMax - sizeMin)
      phase[i] = Math.random()
      starColor(col)
      color[i * 3] = col.r
      color[i * 3 + 1] = col.g
      color[i * 3 + 2] = col.b
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
    geo.setAttribute('aColor', new THREE.BufferAttribute(color, 3))
    return geo
  }

  const starUniforms = { uTime: { value: 0 }, uPx: PX }
  const starMat = new THREE.ShaderMaterial({
    uniforms: starUniforms,
    vertexShader: STAR_VERT,
    fragmentShader: STAR_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const stars = new THREE.Points(buildStars(STAR_COUNT, false, 2.3, 7.6), starMat)
  const bandStars = new THREE.Points(buildStars(BAND_COUNT, true, 1.7, 4.6), starMat)
  sky.add(stars, bandStars)

  // Faint interstellar haze along the same band
  const hazeMat = new THREE.ShaderMaterial({
    uniforms: starUniforms,
    vertexShader: STAR_VERT,
    fragmentShader: HAZE_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const hazeGeo = buildStars(HAZE_COUNT, true, 30, 100)
  {
    const c = hazeGeo.attributes.aColor as THREE.BufferAttribute
    const palette = [new THREE.Color('#8fa8ff'), new THREE.Color('#b9a8ff'), new THREE.Color('#ffd9c0')]
    for (let i = 0; i < HAZE_COUNT; i++) {
      const col = palette[Math.floor(Math.random() * palette.length)]!
      c.setXYZ(i, col.r, col.g, col.b)
    }
  }
  const haze = new THREE.Points(hazeGeo, hazeMat)
  sky.add(haze)

  // ---- the comet --------------------------------------------------------
  const comet = new THREE.Group()
  sky.add(comet)

  // Post-sunset composition: implied sun sits below the left horizon,
  // so both tails stream up and to the right, away from it.
  const antiSun = new THREE.Vector3(0.62, 0.62, 0.18).normalize()

  const glowTex = makeGlowTexture('rgba(255,255,255,1)', 'rgba(190,222,255,0.55)')
  const comaTex = makeGlowTexture('rgba(232,255,242,0.9)', 'rgba(150,235,190,0.30)')
  const coma = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: comaTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.75 }),
  )
  coma.scale.setScalar(42)
  const core = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  )
  core.scale.setScalar(11)
  comet.add(coma, core)

  const ionTail = makeParticleSystem(1900, '#dceaff', '#5f8fe8', 0.62)
  const dustTail = makeParticleSystem(3200, '#fff3df', '#caa06a', 0.58)
  comet.add(ionTail.points, dustTail.points)

  const cometBase = new THREE.Vector3()
  function placeComet() {
    const dist = 260
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist
    const halfW = halfH * camera.aspect
    cometBase.set(halfW * 0.42, halfH * 0.34, -dist)
    comet.position.copy(cometBase)
  }
  placeComet()

  const _v = new THREE.Vector3()
  const _o = new THREE.Vector3()

  function emitTails(dt: number) {
    // ion tail: fast, straight, narrow
    ionTail.emitCarry += 320 * dt
    while (ionTail.emitCarry >= 1) {
      ionTail.emitCarry -= 1
      _o.set(gauss() * 1.2, gauss() * 1.2, gauss() * 1.2)
      _v.copy(antiSun)
        .multiplyScalar(56 + Math.random() * 40)
        .add(_o.clone().multiplyScalar(1.0))
      emitParticle(ionTail, _o, _v, 2.4 + Math.random() * 1.6, 3.6 + Math.random() * 3.4)
    }
    // dust tail: slower, broader, curved by the accel below
    dustTail.emitCarry += 470 * dt
    while (dustTail.emitCarry >= 1) {
      dustTail.emitCarry -= 1
      _o.set(gauss() * 2.6, gauss() * 2.6, gauss() * 2.6)
      _v.copy(antiSun)
        .multiplyScalar(15 + Math.random() * 16)
        .add(_o.clone().multiplyScalar(2.2))
      emitParticle(dustTail, _o, _v, 3.6 + Math.random() * 2.6, 5.0 + Math.random() * 4.6)
    }
  }
  const ionAccel = new THREE.Vector3(0, 0, 0)
  const dustAccel = new THREE.Vector3(-4.4, -2.4, 0) // gentle arc away from the ion tail

  // ---- lantern flotilla --------------------------------------------------
  // Paper sky lanterns (saucer, rocket, biplane) drifting up from behind the
  // ridge line. They live outside the `sky` group so the celestial rotation
  // doesn't carry them; camera parallax still does.
  const texLoader = new THREE.TextureLoader()
  const lanternTex = ['/lanterns/saucer.png', '/lanterns/rocket.png', '/lanterns/biplane.png'].map((url) => {
    const t = texLoader.load(url)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  })

  const lanternGlowTex = makeGlowTexture('rgba(255,196,130,0.85)', 'rgba(255,142,74,0.32)')

  interface Lantern {
    sprite: THREE.Sprite
    glow: THREE.Sprite
    baseX: number
    y: number
    depth: number
    halfH: number
    halfW: number
    speed: number
    swayAmp: number
    swayF: number
    phase: number
    baseOpacity: number
  }
  const lanterns: Lantern[] = []
  const LANTERN_COUNT = 8

  for (let i = 0; i < LANTERN_COUNT; i++) {
    const depth = 140 + Math.random() * 200 // 140..340
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * depth
    const halfW = halfH * camera.aspect
    const size = (26 + Math.random() * 10) * (depth / 340) + 6 // near ones larger
    const mat = new THREE.SpriteMaterial({
      map: lanternTex[i % lanternTex.length],
      transparent: true,
      depthWrite: false,
      opacity: 0,
    })
    const sprite = new THREE.Sprite(mat)
    sprite.scale.set(size, size, 1)
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: lanternGlowTex,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0,
      }),
    )
    glow.scale.set(size * 1.5, size * 1.5, 1)
    const lantern: Lantern = {
      sprite,
      glow,
      baseX: (Math.random() * 1.7 - 0.85) * halfW,
      // stagger the flotilla from below the horizon up through the view
      y: -halfH * 1.3 + (i / LANTERN_COUNT) * halfH * 2.4 + gauss() * 6,
      depth,
      halfH,
      halfW,
      speed: (1.4 + Math.random() * 1.2) * (170 / depth),
      swayAmp: 2 + Math.random() * 4.5,
      swayF: 0.14 + Math.random() * 0.22,
      phase: Math.random() * Math.PI * 2,
      baseOpacity: Math.min(0.95, Math.max(0.5, 1.25 - depth / 380)),
    }
    lanterns.push(lantern)
    scene.add(glow, sprite)
  }

  function updateLanterns(dt: number, t: number) {
    for (const L of lanterns) {
      L.y += L.speed * dt
      if (L.y > L.halfH * 1.35) {
        L.y = -L.halfH * 1.45
        L.baseX = (Math.random() * 1.7 - 0.85) * L.halfW
        L.phase = Math.random() * Math.PI * 2
      }
      L.sprite.position.set(
        L.baseX + Math.sin(t * L.swayF + L.phase) * L.swayAmp,
        L.y,
        -L.depth,
      )
      L.sprite.material.rotation = Math.sin(t * L.swayF * 0.7 + L.phase) * 0.08
      // candle flicker, shared by the paper and its halo
      const flicker = 0.9 + 0.1 * Math.sin(t * 1.8 + L.phase * 3.1)
      L.sprite.material.opacity = L.baseOpacity * flicker
      L.glow.position.copy(L.sprite.position)
      L.glow.position.y -= L.sprite.scale.y * 0.08 // candle sits low in the paper shell
      L.glow.material.opacity = 0.4 * L.baseOpacity * flicker
    }
  }

  // ---- meteors ----------------------------------------------------------
  const meteors = makeParticleSystem(500, '#ffffff', '#9fc2ff')
  sky.add(meteors.points)
  const meteor = { active: false, tLeft: 0, pos: new THREE.Vector3(), vel: new THREE.Vector3(), carry: 0 }
  let nextMeteorIn = 4 + Math.random() * 6

  function spawnMeteor() {
    const dist = 420
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist
    const halfW = halfH * camera.aspect
    meteor.pos.set((Math.random() * 1.6 - 0.8) * halfW, halfH * (0.6 + Math.random() * 0.5), -dist)
    const side = Math.random() < 0.5 ? -1 : 1
    meteor.vel.set(side * (220 + Math.random() * 160), -(260 + Math.random() * 160), 0)
    meteor.tLeft = 0.55 + Math.random() * 0.3
    meteor.active = true
  }

  function updateMeteor(dt: number) {
    if (!meteor.active) {
      nextMeteorIn -= dt
      if (nextMeteorIn <= 0) {
        spawnMeteor()
        nextMeteorIn = 5 + Math.random() * 8
      }
      return
    }
    meteor.tLeft -= dt
    if (meteor.tLeft <= 0) {
      meteor.active = false
      return
    }
    meteor.pos.addScaledVector(meteor.vel, dt)
    meteor.carry += 260 * dt
    while (meteor.carry >= 1) {
      meteor.carry -= 1
      _o.copy(meteor.pos)
      _v.set(gauss() * 3, gauss() * 3, 0)
      emitParticle(meteors, _o, _v, 0.5 + Math.random() * 0.3, 1.6 + Math.random() * 1.8)
    }
    // bright head
    emitParticle(meteors, meteor.pos, meteor.vel.clone().multiplyScalar(0.12), 0.12, 7)
  }

  // ---- interaction & loop -----------------------------------------------
  const pointerTarget = { x: 0, y: 0 }
  function onPointerMove(e: PointerEvent) {
    pointerTarget.x = e.clientX / window.innerWidth - 0.5
    pointerTarget.y = e.clientY / window.innerHeight - 0.5
  }
  window.addEventListener('pointermove', onPointerMove, { passive: true })

  function onResize() {
    const { width, height } = viewport()
    if (!width || !height) return
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, false)
    placeComet()
  }
  const resizeObserver = new ResizeObserver(onResize)
  resizeObserver.observe(canvas)

  const zero = new THREE.Vector3()
  let elapsed = 0
  function step(dt: number) {
    elapsed += dt
    starUniforms.uTime.value = elapsed
    sky.rotation.z += dt * 0.0025 // the slow turn of the sky itself

    comet.position.set(
      cometBase.x + Math.sin(elapsed * 0.07) * 4,
      cometBase.y + Math.sin(elapsed * 0.11 + 1.7) * 3,
      cometBase.z,
    )
    coma.material.opacity = 0.62 + 0.13 * Math.sin(elapsed * 0.8)

    emitTails(dt)
    updateParticles(ionTail, dt, ionAccel)
    updateParticles(dustTail, dt, dustAccel)
    updateLanterns(dt, elapsed)
    updateMeteor(dt)
    updateParticles(meteors, dt, zero)

    camera.rotation.y += (-pointerTarget.x * 0.045 - camera.rotation.y) * 0.04
    camera.rotation.x += (-pointerTarget.y * 0.03 - camera.rotation.x) * 0.04
    renderer.render(scene, camera)
  }

  // let both tails stream to full length before the first paint
  for (let i = 0; i < 210; i++) {
    const dt = 1 / 30
    elapsed += dt
    emitTails(dt)
    updateParticles(ionTail, dt, ionAccel)
    updateParticles(dustTail, dt, dustAccel)
    updateLanterns(dt, elapsed)
  }

  let raf = 0
  if (reducedMotion) {
    starUniforms.uTime.value = elapsed
    renderer.render(scene, camera)
  } else {
    const clock = new THREE.Clock()
    const loop = () => {
      raf = requestAnimationFrame(loop)
      step(Math.min(0.05, clock.getDelta()))
    }
    loop()
  }

  cleanup = () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('pointermove', onPointerMove)
    resizeObserver.disconnect()
    scene.traverse((obj) => {
      if (obj instanceof THREE.Points || obj instanceof THREE.Sprite) {
        ;(obj as THREE.Points).geometry?.dispose?.()
        const m = (obj as THREE.Points).material as THREE.Material
        m.dispose()
      }
    })
    glowTex.dispose()
    comaTex.dispose()
    lanternTex.forEach((t) => t.dispose())
    lanternGlowTex.dispose()
    renderer.dispose()
  }
})

onBeforeUnmount(() => cleanup?.())
</script>
