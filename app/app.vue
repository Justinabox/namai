<script setup>
import { SmoothCursor } from '/components/ui/smooth-cursor'
import SparklesText from '/components/ui/sparkles-text/SparklesText.vue'

const route = useRoute()

const isAboutActive = computed(() => route.path.startsWith('/about'))
const isProjectsActive = computed(() => route.path.startsWith('/projects'))
</script>

<template>
  <div class="flex flex-col h-screen max-h-screen">
    <!-- Header -->
    <div class="w-full h-fit py-4 md:py-6 px-8 lg:px-16 flex sm:justify-between justify-center sticky top-0">
      <NuxtLink to="/">
        <SparklesText text="Justzhu" :colors="{ first: '#9E7AFF', second: '#FE8BBB' }" :sparkles-count="3"
          class="text-3xl! font-pixelify-sans" />
      </NuxtLink>

      <div class="flex sm:gap-6 md:gap-12 sm:flex hidden">
        <NuxtLink to="/about" :class="[
          'text-3xl font-pixelify-sans hover:text-neutral-600 duration-200',
          isAboutActive ? 'text-neutral-500' : '',
        ]">[About]
        </NuxtLink>
        <NuxtLink to="/projects" :class="[
          'text-3xl font-pixelify-sans hover:text-neutral-600 duration-200',
          isProjectsActive ? 'text-neutral-500' : '',
        ]">[Projects]
        </NuxtLink>
      </div>
    </div>

    <NuxtPage />

    <!-- Footer -->
    <div class="w-full h-fit gap-12 justify-center flex py-4 sm:hidden absolute bottom-[-1px] bg-black" id="footer">
      <NuxtLink to="/about" :class="[
        'text-3xl font-pixelify-sans hover:text-neutral-600 duration-200',
        isAboutActive ? 'text-neutral-500' : '',
      ]">[About]
      </NuxtLink>
      <NuxtLink to="/projects" :class="[
        'text-3xl font-pixelify-sans hover:text-neutral-600 duration-200',
        isProjectsActive ? 'text-neutral-500' : '',
      ]">
        [Projects]
      </NuxtLink>
    </div>

    <ClientOnly>
      <SmoothCursor :disable-rotation="true" />
    </ClientOnly>
  </div>
</template>
