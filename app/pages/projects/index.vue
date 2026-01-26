<script setup>
import SparklesText from '/components/ui/sparkles-text/SparklesText.vue'
import ScrollSnap from '/components/ui/ScrollSnap.vue'
const allProjects = await queryCollection('projects').order('weight', 'ASC').all()
console.log(allProjects)
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
        <div class="min-h-0 w-full grow flex px-8 lg:px-16 2xl:px-20">
            <!-- only visible if >=md -->
            <div class="pt-8 md:pr-8 lg:pr-12 xl:pr-16 2xl:pr-20 text-neutral-600 hidden md:block">
                <h1 class="md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-pixelify-sans">XR</h1>
                <h1 class="md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-pixelify-sans">IoT</h1>
                <h1 class="md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-pixelify-sans">Fullstack</h1>
                <h1 class="md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-pixelify-sans">Frontend</h1>
                <h1 class="md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-pixelify-sans">DevOps</h1>
                <h1 class="md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-pixelify-sans">Mobile</h1>
                <h1 class="md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-pixelify-sans text-white">Show All</h1>
            </div>
            
            <ScrollSnap
                class="flex-1 min-h-0 px-4 gap-2 lg:gap-4 lg:px-8 my-4 flex flex-col overflow-y-scroll"
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
            </ScrollSnap>
        </div>

    </div>
</template>