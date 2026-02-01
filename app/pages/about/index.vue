<script setup>
import BlurReveal from '/components/ui/BlurReveal.vue'
import Avatar from '/components/ui/Avatar.vue'
import { Motion } from 'motion-v'
</script>

<template>
  <!-- Content -->
  <div class="w-full h-full flex flex-col justify-center px-12 md:px-20 lg:px-28">

    <div class="flex items-center gap-2">
      <h1 class="text-8xl font-pixelify-sans">Hi,</h1>
      <Motion as="div" drag dragSnapToOrigin class="z-1" :initial="{ scale: 0.1 }" :animate="{ scale: 1 }"
        v-cursor="{ clickable: true }" :hover="{ scale: 1.05 }" :whileDrag="{ scale: 0.95 }"
        :whilePress="{ scale: 0.95 }" :transition="{ duration: 1, type: 'spring', damping: 10, stiffness: 100 }">
        <Avatar class="w-16 h-16" />
      </Motion>
    </div>

    <ClientOnly>
      <BlurReveal :delay="1" :duration="0.75">
        <span class="text-xl font-serif text-pretty sm:text-3xl xl:text-4xl/none">I find patterns in chaos,</span>
        <span class="text-xl font-serif text-pretty sm:text-3xl xl:text-4xl/none">then build them into something people
          can feel.</span>
        <!-- <span class="text-xl font-serif tracking-tighter text-pretty sm:text-3xl xl:text-4xl/none">who excels in multiple fields.</span> -->
      </BlurReveal>
    </ClientOnly>
  </div>
</template>