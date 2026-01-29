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

const scrollContainer = ref(null)

const selectedCategory = useState('selectedCategory', () => null)

const scrollToTop = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const isFiltering = computed(() => selectedCategory.value !== null)

const filteredProjects = computed(() => {
  if (!isFiltering.value) return unref(allProjects) || []
  return (unref(allProjects) || []).filter(p => p.category === selectedCategory.value)
})

const filteredPlaygrounds = computed(() => {
  if (!isFiltering.value) return unref(playgrounds) || []
  return (unref(playgrounds) || []).filter(p => p.category === selectedCategory.value)
})

const hasFilteredContent = computed(() => filteredProjects.value.length > 0 || filteredPlaygrounds.value.length > 0)

const categoryCounts = computed(() => {
  const counts = {}
  PROJECT_CATEGORIES.forEach(category => {
    const projectsCount = (unref(allProjects) || []).filter(p => p.category === category).length
    const playgroundsCount = (unref(playgrounds) || []).filter(p => p.category === category).length
    counts[category] = projectsCount + playgroundsCount
  })
  return counts
})

const scrollSnapKey = computed(() => selectedCategory.value ? `category-${selectedCategory.value}` : 'all')

const scrollSnapRef = ref(null)

watch(selectedCategory, async () => {
  scrollToTop()
  await nextTick()
  if (scrollSnapRef.value && scrollSnapRef.value.$el) {
    scrollSnapRef.value.$el.scrollTop = 0
  }
}, { flush: 'post' })

const selectCategory = (category) => {
  if (selectedCategory.value === category) {
    selectedCategory.value = null
    if (process.client) {
      localStorage.removeItem('selectedCategory')
    }
  } else {
    selectedCategory.value = category
    if (process.client) {
      localStorage.setItem('selectedCategory', category)
    }
  }
}



onMounted(() => {
  if (process.client) {
    try {
      const savedCategory = localStorage.getItem('selectedCategory')
      if (savedCategory && PROJECT_CATEGORIES.includes(savedCategory)) {
        selectedCategory.value = savedCategory
      }
    } catch (error) {
      console.warn('Failed to read from localStorage:', error)
    }
  }
})
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
        <div ref="scrollContainer" class="min-h-0 w-full grow flex px-8 lg:px-16 2xl:px-20 overflow-y-scroll scrollbar-hide">
            <!-- only visible if >=md -->
            <div class="pt-8 md:pr-8 lg:pr-12 xl:pr-16 2xl:pr-20 hidden md:block">
                <!-- For loop all the possible enum values in category -->
                <div v-for="category in PROJECT_CATEGORIES" :key="category" 
                     @click="selectCategory(category)"
                     class="flex items-baseline gap-2 md:gap-3 lg:gap-4 cursor-pointer transition-all duration-200 hover:scale-105 group"
                >
                    <h1 :class="[
                        'md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-pixelify-sans',
                        selectedCategory === category 
                            ? 'text-white hover:text-neutral-200' 
                            : 'text-neutral-600 hover:text-neutral-400'
                    ]">
                        {{ category }}
                    </h1>
                    <span :class="[
                        'text-sm md:text-base lg:text-lg xl:text-xl font-pixelify-sans',
                        selectedCategory === category 
                            ? 'text-neutral-400' 
                            : 'text-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200'
                    ]">
                        ({{ (categoryCounts[category] || 0) }})
                    </span>
                </div>
                <div @click="selectCategory(null)"
                     class="flex items-baseline gap-2 md:gap-3 lg:gap-4 cursor-pointer transition-all duration-200 hover:scale-105 group"
                >
                    <h1 :class="[
                        'md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-pixelify-sans',
                        !selectedCategory ? 'text-white hover:text-neutral-200' : 'text-neutral-600 hover:text-neutral-400'
                    ]">
                        Show All
                    </h1>
                    <span :class="[
                        'text-sm md:text-base lg:text-lg xl:text-xl font-pixelify-sans',
                        !selectedCategory 
                            ? 'text-neutral-400' 
                            : 'text-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200'
                    ]">
                        ({{ (unref(allProjects) || []).length + (unref(playgrounds) || []).length }})
                    </span>
                </div>
            </div>
            
            <div v-if="isLoading" class="flex-1 flex items-center justify-center">
                <div class="text-2xl font-pixelify-sans text-neutral-600">Loading...</div>
            </div>
            <div v-else-if="projectsError || playgroundsError" class="flex-1 flex items-center justify-center">
                <div class="text-2xl font-pixelify-sans text-red-500">Failed to load projects</div>
            </div>
            <div v-else-if="!hasFilteredContent" class="flex-1 flex items-center justify-center">
                <div class="text-center">
                    <div class="text-2xl font-pixelify-sans text-neutral-600 mb-4">
                        No projects found in {{ selectedCategory }}
                    </div>
                    <div v-if="Object.keys(categoryCounts).filter(k => categoryCounts[k] > 0).length > 0" class="text-lg font-pixelify-sans text-neutral-500">
                        Try switching to:
                        <span v-for="(count, cat) in categoryCounts" :key="cat" class="text-neutral-400">
                            {{ count > 0 ? cat : '' }}{{ count > 0 ? ' (' + count + ')' : '' }}
                        </span>
                    </div>
                </div>
            </div>
            <ScrollSnap
                v-else
                ref="scrollSnapRef"
                :key="scrollSnapKey"
                class="flex-1 min-h-0 px-4 gap-2 lg:gap-4 lg:px-8 my-4 flex flex-col"
                :disable-snap-below-md="true"
            >
                <NuxtLink :to="project.path" v-for="project in filteredProjects" :key="project.id" :class="[
                    'rounded-md',
                    project.type === 'landscape' ? 'w-full' : 'h-full w-fit'
                ]">
                    <video v-if="project.cover.endsWith('.mp4')" :src="project.cover" :alt="project.title" :class="[
                        'rounded-md object-contain border-2 border-neutral-800',
                        project.type === 'landscape' ? 'w-full sm:max-h-[80vh]' : 'h-[70vh] w-fit'
                    ]" autoplay muted loop></video>
                    <NuxtImg v-else :src="project.cover" :alt="project.title" :class="[
                        'rounded-md object-contain border-2 border-neutral-800',
                        project.type === 'landscape' ? 'w-full h-auto sm:max-h-[80vh]' : 'h-[70vh] w-auto max-w-full'
                    ]" loading="lazy" />
                </NuxtLink>

                <Waterfall
                    :items="filteredPlaygrounds"
                    class="mt-6"
                    :key="`playgrounds-${filteredPlaygrounds.length}`"
                />
            </ScrollSnap>

        </div>
    </div>
</template>