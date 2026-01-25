<script setup>
import SparklesText from '/components/ui/sparkles-text/SparklesText.vue'
const allProjects = await queryCollection('projects').order('year', 'DESC').all()
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
        <div class="pt-8 md:pr-6 lg:pr-16 xl:pr-24 2xl:pr-32 text-neutral-600 hidden md:block">
            <h1 class="md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-pixelify-sans">Art</h1>
            <h1 class="md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-pixelify-sans">Frontend</h1>
            <h1 class="md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-pixelify-sans">Backend</h1>
            <h1 class="md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-pixelify-sans text-white">Mobile</h1>
            <h1 class="md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-pixelify-sans">Love</h1>
        </div>
        <div class="px-4 lg:px-8 flex flex-col sm:flex-row gap-8 sm:gap-4">
            <div v-for="project in allProjects" :key="project.id" class="rounded-md h-fit">
                <NuxtLink :to="project.path">
                    <video v-if="project.cover.endsWith('.mp4')" :src="project.cover" :alt="project.title" class="rounded-md w-full max-h-[60vh] object-contain" autoplay muted loop></video>
                    <img v-else :src="project.cover" :alt="project.title" class="rounded-md w-full h-auto max-h-[60vh] object-contain">
                </NuxtLink>
            </div>
        </div>
    </div>

  </div>
</template>