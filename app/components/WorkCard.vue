<script setup lang="ts">
import { NuxtLink } from '#components'
import type { Work } from '~/composables/useWorks'

const props = withDefaults(defineProps<{
  work: Work
  /** 'always' prints the caption under the image; 'hover' reveals it on the card. */
  captions?: 'always' | 'hover'
  /** Corner radius comes from one scale, set by the page. */
  radiusClass?: string
}>(), {
  captions: 'always',
  radiusClass: 'rounded-lg',
})

const ratio = computed(() => `${props.work.width} / ${props.work.height}`)
/** Playgrounds have no detail page, so they render as a plain block. */
const isLink = computed(() => Boolean(props.work.path))
const root = computed(() => (isLink.value ? NuxtLink : 'div'))
const loaded = ref(false)

const cursorMeta = computed(() => ({
  clickable: isLink.value,
  variant: isLink.value ? 'descriptive' : 'default',
  object: {
    title: props.work.title,
    descp: props.work.description,
    icon: 'iconamoon:arrow-top-right-1-bold',
  },
}))
</script>

<template>
  <component
    :is="root"
    :to="work.path"
    v-cursor="cursorMeta"
    class="group block w-full"
  >
    <div
      :class="['relative w-full overflow-hidden', radiusClass, { 'bg-crossing': !loaded }]"
      :style="{ aspectRatio: ratio }"
    >
      <DashVideo
        v-if="work.media === 'video'"
        :src="work.cover"
        :placeholder-ratio="ratio"
        class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        muted
        loop
        playsinline
      />
      <NuxtPicture
        v-else
        provider="cloudflare"
        :src="work.cover"
        :alt="work.title"
        :width="work.width"
        :height="work.height"
        class="work-cover h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        :img-attrs="{ onLoad: () => (loaded = true) }"
        loading="lazy"
      />

      <!-- Hover caption sits on a scrim so it stays legible over any cover. -->
      <div
        v-if="captions === 'hover' && (work.title || work.description)"
        class="pointer-events-none absolute inset-x-0 bottom-0 p-5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style="background: linear-gradient(to top, oklch(18% 0 0 / 0.75), transparent)"
      >
        <p class="font-pixelify-sans text-2xl leading-none text-white md:text-3xl">{{ work.title }}</p>
        <p v-if="work.description" class="mt-2 font-serif text-base leading-snug text-white/80 md:text-lg">
          {{ work.description }}
        </p>
      </div>
    </div>

    <div v-if="captions === 'always'" class="flex items-baseline gap-2 pt-2.5">
      <p class="font-pixelify-sans text-lg leading-none">{{ work.title }}</p>
      <span v-if="work.year" class="font-pixelify-sans text-xs text-neutral-400">{{ work.year }}</span>
      <p
        v-if="work.description"
        class="min-w-0 flex-1 truncate font-serif text-sm leading-none text-neutral-400"
      >
        {{ work.description }}
      </p>
    </div>
  </component>
</template>

<style scoped>
:deep(picture.work-cover) {
  display: block;
  height: 100%;
  width: 100%;
}

:deep(picture.work-cover img) {
  display: block;
  height: 100%;
  width: 100%;
  object-fit: cover;
}
</style>
