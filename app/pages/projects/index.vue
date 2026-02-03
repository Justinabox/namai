<script setup>
import ScrollSnap from '/components/ui/scroll-snap'
import DashVideo from '/components/global/DashVideo.vue'
import Waterfall from '/components/global/Masonry.vue'
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

const scrollToTop = (behavior = 'auto') => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTo({ top: 0, behavior })
  }
  scrollSnapRef.value?.scrollToTop({ top: 0, behavior })
  scrollSnapRef.value?.resetActive()
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

const scrollSnapRef = ref(null)

const loadedProjectCovers = ref({})

const markCoverLoaded = (id) => {
  loadedProjectCovers.value = {
    ...loadedProjectCovers.value,
    [id]: true,
  }
}

watch(selectedCategory, async () => {
  await nextTick()
  scrollToTop('auto')
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
  <div class="min-h-0 w-full overflow-hidden flex flex-col">

    <!-- Page Container -->
    <div ref="scrollContainer"
      class="min-h-0 w-full grow flex sm:px-8 lg:px-16 2xl:px-20 overflow-y-scroll scrollbar-hide">

      <!-- Sidebar, only visible if >=md -->
      <div class="py-8 md:pr-8 lg:pr-12 xl:pr-16 2xl:pr-20 hidden md:flex flex-col gap-4 justify-between">
        <!-- Category selection, For loop all the possible enum values in category -->
        <div>
          <div v-for="category in PROJECT_CATEGORIES" :key="category" @click="selectCategory(category)"
            class="flex items-baseline gap-2 md:gap-3 lg:gap-4 cursor-pointer transition-all duration-200 hover:scale-105 group">
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
            class="flex items-baseline gap-2 md:gap-3 lg:gap-4 cursor-pointer transition-all duration-200 hover:scale-105 group">
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

        <!-- <a class="text-neutral-400 text-md">Made with ❤️ by Justin</a> -->
      </div>

      <ClientOnly>
        <!-- Main Content Loading States -->
        <template #fallback>
          <div class="flex-1 flex items-center justify-center">
            <div class="text-2xl font-pixelify-sans text-neutral-600">Loading...</div>
          </div>
        </template>

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
            <div v-if="Object.keys(categoryCounts).filter(k => categoryCounts[k] > 0).length > 0"
              class="text-lg font-pixelify-sans text-neutral-500">
              Try switching to:
              <span v-for="(count, cat) in categoryCounts" :key="cat" class="text-neutral-400">
                {{ count > 0 ? cat : '' }}{{ count > 0 ? ' (' + count + ')' : '' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Main content -->
        <ScrollSnap v-else ref="scrollSnapRef"
          class="flex-1 min-h-0 px-4 gap-4 lg:px-8 flex flex-col scrollbar-hide"
          :disable-snap-below-md="true">

          <NuxtLink
            :to="project.path"
            v-for="project in filteredProjects"
            :key="project.id"
            v-cursor="{
              clickable: true,
              variant: 'descriptive',
              object: {
                title: project.title,
                descp: project.description,
                icon: 'iconamoon:arrow-top-right-1-bold',
              },
            }"
            class="rounded-md w-full h-auto sm:max-h-[80vh] border-2 border-neutral-800"
          >
            <DashVideo v-if="project.type === 'video'" :src="project.cover" placeholder-ratio="16:9" autoplay muted loop
              playsinline preload="metadata" class="w-full h-full pointer-events-none object-cover rounded-sm" />
            <NuxtPicture v-else provider="cloudflare" :src="project.cover" :alt="project.title" :class="[
              'project-cover rounded-sm object-cover w-full h-auto sm:max-h-[80vh]',
              { 'aspect-16/9 bg-crossing': !loadedProjectCovers[project.id] },
            ]" :img-attrs="{ onLoad: () => markCoverLoaded(project.id) }" loading="lazy" preload />

            <figcaption class="p-3 md:hidden block">
              <p class="text-xl font-pixelify-sans text-neutral-100">{{ project.title }}</p>
              <p v-if="project.description" class="text-sm text-neutral-500">{{ project.description }}</p>
            </figcaption>
          </NuxtLink>

          <h1 class="mt-8 md:hidden block text-4xl font-pixelify-sans">Playgrounds</h1>

          <Waterfall class="origin-top mt-2" :items="filteredPlaygrounds" :key="`playgrounds-${filteredPlaygrounds.length}`" />
        </ScrollSnap>
      </ClientOnly>

    </div>

  </div>
</template>

<style scoped>
:deep(picture.project-cover) {
  display: block;
  width: 100%;
}

:deep(picture.project-cover img) {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
  border-radius: 6px;
}
</style>