<script setup>
import SparklesText from '/components/ui/sparkles-text/SparklesText.vue'
const allProjects = (await queryCollection('projects').order('year', 'DESC').all()).sort(
  (a, b) => (b.year - a.year) || a.title.localeCompare(b.title)
)
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
        <NuxtLink to="/about" class="text-3xl font-pixelify-sans hover:text-neutral-600 duration-200">[About]</NuxtLink>
        <NuxtLink to="/projects" class="text-3xl font-pixelify-sans text-neutral-500 hover:text-neutral-600 duration-200">[Projects]</NuxtLink>
      </div>
    </div>

    <!-- Content -->
    <div class="w-full h-screen flex px-12 lg:px-16 xl:px-20">
        <!-- only visible if >=md -->
        <div class="pt-8 md:pr-8 lg:pr-12 xl:pr-16 2xl:pr-20 text-neutral-600 hidden md:block">
            <h1 class="md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-pixelify-sans">Art</h1>
            <h1 class="md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-pixelify-sans">Frontend</h1>
            <h1 class="md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-pixelify-sans">Backend</h1>
            <h1 class="md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-pixelify-sans text-white">Mobile</h1>
            <h1 class="md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-pixelify-sans">Fullstack</h1>
            <h1 class="md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-pixelify-sans">DevOps</h1>
            <h1 class="md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-pixelify-sans">Security</h1>
            <h1 class="md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-pixelify-sans">Concept</h1>
            <h1 class="md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-pixelify-sans">Halo</h1>
        </div>
        <div class="px-4 lg:px-8 flex flex-col sm:flex-row flex-wrap content-start overflow-y-scroll">
            <div
              v-for="project in allProjects"
              :key="project.id"
              class="rounded-md h-fit py-4 sm:p-2 w-full"
              :class="{
                'sm:w-1/3': project.width === 1,
                'sm:w-2/3': project.width === 2,
                'sm:w-full': project.width === 3,
              }"
            >
                <NuxtLink :to="project.path">
                    <video v-if="project.cover.endsWith('.mp4')" :src="project.cover" :alt="project.title" class="rounded-md w-full max-h-[60vh] object-contain" autoplay muted loop></video>
                    <img v-else :src="project.cover" :alt="project.title" class="rounded-md w-full h-auto sm:max-h-[60vh] object-contain">
                </NuxtLink>
            </div>
        </div>
    </div>

  </div>
</template>