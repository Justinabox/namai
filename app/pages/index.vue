<script setup>
const { filtered, category, counts, categories, selectCategory, pending, error, works } = useWorks()

useHead({
  title: 'Justzhu',
  meta: [{ name: 'theme-color', content: '#06070f' }],
})
</script>

<template>
  <div>
    <!--
      Hero: the comet scene, with the name held in the sky above the ridge line.
      No copy sits on it: the wordmark lives in the header on every route. The
      pixel scene this replaced is still in the tree (PixelScene.vue,
      lib/pixelFrames.ts), just unmounted.
    -->
    <CometHero>
      <div class="min-h-[86dvh]" />
    </CometHero>

    <!-- Filter row -->
    <section class="px-6 md:px-10 lg:px-16">
      <div class="mx-auto flex max-w-[1500px] flex-wrap items-center justify-center gap-2 py-8">
        <button
          type="button"
          v-cursor="{ clickable: true }"
          class="cursor-pointer rounded-full px-4 py-1.5 font-pixelify-sans text-base leading-none transition-colors duration-200 md:text-lg"
          :class="category === null
            ? 'bg-ink text-paper'
            : 'bg-neutral-800/80 text-neutral-200 hover:bg-neutral-700/80'"
          @click="selectCategory(null)"
        >
          Everything {{ works.length }}
        </button>

        <button
          v-for="name in categories"
          :key="name"
          type="button"
          v-cursor="{ clickable: true }"
          class="cursor-pointer rounded-full px-4 py-1.5 font-pixelify-sans text-base leading-none transition-colors duration-200 md:text-lg"
          :class="category === name
            ? 'bg-ink text-paper'
            : 'bg-neutral-800/80 text-neutral-200 hover:bg-neutral-700/80'"
          @click="selectCategory(name)"
        >
          {{ name }} {{ counts[name] }}
        </button>
      </div>
    </section>

    <!-- One centered waterfall, no sidebars. Captions on hover keep it quiet. -->
    <section id="work" class="px-6 pb-24 md:px-10 md:pb-32 lg:px-16">
      <p v-if="error" class="py-24 text-center font-pixelify-sans text-xl text-neutral-400">
        Could not load the work. Try a refresh.
      </p>

      <p
        v-else-if="!pending && filtered.length === 0"
        class="py-24 text-center font-pixelify-sans text-xl text-neutral-400"
      >
        Nothing filed under {{ category }} yet.
      </p>

      <WorksGrid
        v-else
        :items="filtered"
        :columns="[1, 2, 3, 3]"
        gap-class="gap-3 md:gap-4"
        captions="hover"
        radius-class="rounded-2xl"
        max-width-class="max-w-[1500px]"
      />
    </section>
  </div>
</template>
