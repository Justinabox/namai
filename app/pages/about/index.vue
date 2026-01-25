<script setup>
import SparklesText from '/components/ui/sparkles-text/SparklesText.vue'
import BlurReveal from '/components/ui/blur-reveal/BlurReveal.vue'
import Avatar from '/components/ui/Avatar.vue'
import { Motion } from 'motion-v'
</script>

<template>
  <div>

    <!-- Header -->
    <div class="w-full h-fit py-6 px-16 flex justify-between sticky top-0">
      <!-- <a class="text-3xl font-pixelify-sans">Justzhu</a> -->
      <NuxtLink to="/">
        <SparklesText
          text="Justzhu"
          :colors="{ first: '#9E7AFF', second: '#FE8BBB' }"
          :sparkles-count="3"
          class="text-3xl! font-pixelify-sans"
        />
      </NuxtLink>
      <div class="flex gap-12">
        <NuxtLink to="/about" class="text-3xl font-pixelify-sans text-neutral-500 hover:text-neutral-600 duration-200">[About]</NuxtLink>
        <NuxtLink to="/projects" class="text-3xl font-pixelify-sans hover:text-neutral-600 duration-200">[Projects]</NuxtLink>
      </div>
    </div>

    <!-- Content -->
    <div class="w-full h-screen flex flex-col justify-center px-28">

      <div class="flex items-center gap-2">
        <h1 class="text-8xl font-pixelify-sans">Hi,</h1>
        <Motion as="div" drag dragSnapToOrigin class="z-1" :initial="{ scale: 0.1 }" :animate="{ scale: 1 }" :hover="{ scale: 1.05 }" :whileDrag="{ scale: 0.95 }" :whilePress="{ scale: 0.95 }" :transition="{ duration: 1, type: 'spring', damping: 10, stiffness: 100 }">
            <Avatar class="w-16 h-16" />
        </Motion>
      </div>

        <ClientOnly>
          <BlurReveal
            :delay="1"
            :duration="0.75"
          >
            <span class="text-xl font-serif text-pretty sm:text-3xl xl:text-4xl/none">I find patterns in chaos,</span>
            <span class="text-xl font-serif text-pretty sm:text-3xl xl:text-4xl/none">then build them into something people can feel.</span>
            <!-- <span class="text-xl font-serif tracking-tighter text-pretty sm:text-3xl xl:text-4xl/none">who excels in multiple fields.</span> -->
          </BlurReveal>
        </ClientOnly>
    </div>

  </div>
</template>