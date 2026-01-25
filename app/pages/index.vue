<script setup>
import {
  Shader,
  Ascii,
  Blob,
  CRTScreen,
  DotGrid,
  GlassTiles,
  Group,
  Liquify,
  WaveDistortion
} from 'shaders/vue'
import SparklesText from '/components/ui/sparkles-text/SparklesText.vue'
</script>

<template>
<div class="w-screen h-screen max-h-screen overflow-clip flex flex-col">
    <div class="w-full h-full absolute top-0 left-0 select-none pointer-events-none">
      <Shader class="w-full h-full">
        <Group :visible="true">
          <DotGrid
            color="#ffffff"
            :density="90"
            :dot-size="0.3"
            :twinkle="0"/>
          <WaveDistortion
            :angle="30"
            edges="mirror"
            :frequency="0.2"
            :speed="0.1"
            :strength="0.15"
            wave-type="sine"/>
          <Ascii
            :cell-size="20"
            characters="@%#*+=-:."
            font-family="JetBrains Mono"
            :spacing="1"
            :visible="true"/>
        </Group>
      </Shader>
    </div>

    <div class="w-full h-fit py-6 px-16 flex justify-between">
      <a class="text-3xl font-pixelify-sans">Justzhu</a>
      <!-- <SparklesText
        text="Justzhu"
        :colors="{ first: '#9E7AFF', second: '#FE8BBB' }"
        :sparkles-count="3"
        class="text-3xl! font-pixelify-sans"
      /> -->
      <div class="flex gap-12">
        <NuxtLink to="/about" class="text-3xl font-pixelify-sans hover:text-neutral-600 duration-200">[About]</NuxtLink>
        <NuxtLink to="/projects" class="text-3xl font-pixelify-sans hover:text-neutral-600 duration-200">[Projects]</NuxtLink>
      </div>
    </div>

    <Shader class="w-full grow min-h-0">
      <Group
        :visible="true">
        <Blob
          :center="{'x':0.5,'y':0.5}"
          color-a="#ff5cbf"
          color-b="#42c6e3"
          color-space="oklab"
          :deformation="0.8"
          highlight-color="#ffe11a"
          :highlight-intensity="0.5"
          :highlight-x="0.3"
          :highlight-y="-0.3"
          :highlight-z="0.4"
          :seed="macbookncheese"
          :size="0.2"
          :softness="0.5"
          :speed="0.5"/>
        <Liquify
            :decay="1"
            edges="mirror"
            :intensity="1"
            :radius="2"/>
        <GlassTiles
          :intensity="2"
          :rotation="0"
          :roundness="0"
          :tile-count="20"/>
      </Group>
      <CRTScreen
        :brightness="1.1"
        :color-shift="0.5"
        :contrast="1.2"
        :pixel-size="128"
        :scanline-frequency="200"
        :scanline-intensity="0.4"
        :vignette-intensity="1"
        :vignette-radius="0.5"
        :visible="true"/>
    </Shader>

    <div class="w-full h-fit py-6 px-16 flex justify-end">
      <!-- on mouse: and love -->
      <a class="text-3xl font-pixelify-sans text-neutral-800">peace amidst chaos</a>
    </div>

    
  </div>
</template>