<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import {
  Shader,
  Ascii,
  Blob,
  CRTScreen,
  DotGrid,
  GlassTiles,
  Group,
  Liquify,
  WaveDistortion,
  FlowField,
  Swirl,
  FilmGrain
} from 'shaders/vue'

const dotGridDensity = ref(0)

const updateDotGridDensity = () => {
  dotGridDensity.value = window.innerHeight / 6.3
}

onMounted(() => {
  updateDotGridDensity()
  window.addEventListener('resize', updateDotGridDensity)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDotGridDensity)
})
</script>

<template>
  <div class="w-screen grow min-h-0 overflow-clip flex flex-col">
    <div class="w-full h-full absolute top-0 left-0 select-none pointer-events-none">
      <!-- SSR does not correctly render DotGrid density -->
      <ClientOnly>
        <Shader class="w-full h-full">
          <Group :visible="true">
            <DotGrid color="#ffffff" :density="dotGridDensity" :dot-size="0.3" :twinkle="0" />
            <WaveDistortion :angle="30" edges="mirror" :frequency="0.2" :speed="0.1" :strength="0.15"
              wave-type="sine" />
            <Ascii :cell-size="20" characters="@%#*+=-:." font-family="JetBrains Mono" :spacing="1" :visible="true" />
          </Group>
        </Shader>
      </ClientOnly>
    </div>

    <!-- <Shader
      class="w-full grow min-h-0">
      <Group>
        <Swirl
          :blend="50"
          color-a="#2686ff"
          color-b="#ff3de6"
          color-space="oklab"
          :detail="1"
          mask-source="idmkz2m9rvfxg3f3loj"
          mask-type="luminance"
          :speed="1"
          :visible="true"/>
        <FlowField
          :detail="2.5"
          edges="mirror"
          :speed="0.5"
          :strength="0.2"
          :visible="true"/>
        <FlowField
          :detail="2"
          edges="mirror"
          :speed="0.5"
          :strength="0.15"
          :visible="true"/>
        <Liquify
          :decay="0.5"
          edges="mirror"
          :intensity="1"
          :radius="0.4"/>
        <CRTScreen
          :brightness="1.1"
          :color-shift="0.4"
          :contrast="1.2"
          :pixel-size="128"
          :scanline-frequency="200"
          :scanline-intensity="0.3"
          :vignette-intensity="1"
          :vignette-radius="0.5"/>
        <FilmGrain
          :strength="0.4"/>
      </Group>
      <Group
        id="idmkz2m9rvfxg3f3loj"
        :visible="false">
        <Swirl
          :blend="25"
          color-a="#858585ff"
          color-b="#ffffffff"
          color-space="oklab"
          :detail="1.5"
          :speed="0.3"
          :transform="{'scale':1.06}"
          :visible="true"/>
      </Group>
    </Shader> -->

    <Shader class="w-full grow min-h-0">
      <Group :visible="true">
        <Blob :center="{ 'x': 0.5, 'y': 0.5 }" color-a="#ff5cbf" color-b="#42c6e3" color-space="oklab"
          :deformation="0.8" highlight-color="#ffe11a" :highlight-intensity="0.5" :highlight-x="0.3" :highlight-y="-0.3"
          :highlight-z="0.4" :seed="1" :size="0.2" :softness="0.5" :speed="0.5" />
        <Liquify :decay="1" edges="mirror" :intensity="0.5" :radius="1.5" />
        <GlassTiles :intensity="2" :rotation="0" :roundness="0" :tile-count="20" />
      </Group>
      <CRTScreen :brightness="1.1" :color-shift="0.5" :contrast="1.2" :pixel-size="128" :scanline-frequency="200"
        :scanline-intensity="0.4" :vignette-intensity="1" :vignette-radius="0.5" :visible="true" />
    </Shader>

    <div class="w-full h-fit py-6 px-4 md:px-16 flex justify-end">
      <!-- on mouse: and love -->
      <a class="text-3xl font-pixelify-sans text-neutral-800">peace amidst chaos</a>
    </div>


  </div>
</template>