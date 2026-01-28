<script setup>
import SparklesText from '/components/ui/sparkles-text/SparklesText.vue'
import ScrollSnap from '/components/ui/ScrollSnap.vue'
import Waterfall from '/components/ui/Waterfall.vue'
import { PROJECT_CATEGORIES } from '/lib/constants'

const { data: allProjects, pending: projectsPending, error: projectsError } = await useAsyncData(
  'all-projects',
  () => queryCollection('projects').order('weight', 'ASC').all(),
  { timeout: 30000, server: false }
)

const { data: playgrounds, pending: playgroundsPending, error: playgroundsError } = await useAsyncData(
  'all-playgrounds',
  () => queryCollection('playgrounds').order('year', 'DESC').all(),
  { timeout: 30000, server: false }
)

const isLoading = computed(() => projectsPending.value || playgroundsPending.value)
</script>

<template>
    <div class="h-screen overflow-clip flex flex-col">

        <!-- Header -->
        <div class="w-full h-fit py-6 px-8 lg:px-16 flex justify-between sticky top-0">
            <!-- <a class="text-3xl font-pixelify-sans">Justzhu</a> -->
            <NuxtLink to="/">
                <SparklesText text="Justzhu" :colors="{ first: '#9E7AFF', second: '#FE8BBB' }" :sparkles-count="3"
                    class="text-3xl! font-pixelify-sans" />
            </NuxtLink>
            <div class="flex gap-12">
                <NuxtLink to="/about" class="text-3xl font-pixelify-sans hover:text-neutral-600 duration-200">[About]
                </NuxtLink>
                <NuxtLink to="/projects"
                    class="text-3xl font-pixelify-sans text-neutral-500 hover:text-neutral-600 duration-200">[Projects]
                </NuxtLink>
            </div>
        </div>

        <!-- Content -->
        <div class="min-h-0 w-full grow flex px-8 lg:px-16 2xl:px-20 overflow-y-scroll">
            <!-- only visible if >=md -->
            <div class="pt-8 md:pr-8 lg:pr-12 xl:pr-16 2xl:pr-20 text-neutral-600 hidden md:block">
                <!-- For loop all the possible enum values in category -->
                <h1 v-for="category in PROJECT_CATEGORIES" :key="category" 
                    class="md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-pixelify-sans">{{ category }}</h1>
                <h1 class="md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-pixelify-sans text-white">Show All</h1>
            </div>
            
            <div v-if="isLoading" class="flex-1 flex items-center justify-center">
                <div class="text-2xl font-pixelify-sans text-neutral-600">Loading...</div>
            </div>
            <div v-else-if="projectsError || playgroundsError" class="flex-1 flex items-center justify-center">
                <div class="text-2xl font-pixelify-sans text-red-500">Failed to load projects</div>
            </div>
            <ScrollSnap
                v-else
                class="flex-1 min-h-0 px-4 gap-2 lg:gap-4 lg:px-8 my-4 flex flex-col"
                :disable-snap-below-md="true"
            >
                <NuxtLink :to="project.path" v-for="project in allProjects" :key="project.id" :class="[
                    'rounded-md',
                    project.type === 'landscape' ? 'w-full' : 'h-full w-fit'
                ]">
                    <video v-if="project.cover.endsWith('.mp4')" :src="project.cover" :alt="project.title" :class="[
                        'rounded-md object-contain border-2 border-neutral-800',
                        project.type === 'landscape' ? 'w-full sm:max-h-[80vh]' : 'h-[70vh] w-fit'
                    ]" autoplay muted loop></video>
                    <img v-else :src="project.cover" :alt="project.title" :class="[
                        'rounded-md object-contain border-2 border-neutral-800',
                        project.type === 'landscape' ? 'w-full h-auto sm:max-h-[80vh]' : 'h-[70vh] w-auto max-w-full'
                    ]">
                </NuxtLink>


                <Waterfall
                    :items="playgrounds"
                    class="mt-6"
                />
            </ScrollSnap>

        </div>
    </div>
</template>