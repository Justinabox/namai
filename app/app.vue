<script setup>
import { SmoothCursor } from '/components/ui/smooth-cursor'
import SparklesText from '/components/ui/SparklesText.vue'
import { Shader, Swirl, FilmGrain } from 'shaders/vue'

const route = useRoute()

const isAboutActive = computed(() => route.path.startsWith('/about'))
const isProjectsActive = computed(() => route.path.startsWith('/projects'))
const isHomePage = computed(() => route.path === '/')
</script>

<template>
  <div class="relative z-1 flex flex-col h-screen max-h-screen">

    <teleport to="body">
      <div
        class="fixed inset-0 z-0 pointer-events-none transition-opacity duration-200"
        :class="isHomePage ? 'opacity-0' : 'opacity-100'">
        <Shader class="absolute inset-0 w-full h-full opacity-75">
          <Swirl
            :blend="50"
            color-a="#000000"
            color-b="#0f0f0f"
            color-space="oklab"
            :detail="2"
            :speed="0.4"/>
          <FilmGrain
            :strength="0.2"
            :visible="true"/>
        </Shader>
      </div>
    </teleport>

    <!-- Header -->
    <header class="w-full h-fit py-4 md:py-6 px-8 lg:px-16 flex sm:justify-between justify-center sticky top-0">
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
    </header>

    <NuxtPage />

    <!-- Footer -->
    <footer class="w-full h-fit gap-12 justify-center flex py-4 sm:hidden absolute bottom-[-1px] bg-black" id="footer">
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
    </footer>

    <ClientOnly>
      <SmoothCursor :disable-rotation="true" />
    </ClientOnly>
  </div>
</template>
