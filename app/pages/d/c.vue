<script setup>
const { filtered, category, counts, categories, selectCategory, pending, error, works } = useWorks()

useHead({ title: 'Justzhu' })

/**
 * The headline swaps its last word on a slow cycle. It is the one moving thing
 * above the fold, so it carries the "playful" read on its own.
 */
const ROTATING = ['chaos', 'noise', 'the mess', 'a deadline', 'nothing']
const wordIndex = ref(0)
let timer

onMounted(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) return
  timer = setInterval(() => {
    wordIndex.value = (wordIndex.value + 1) % ROTATING.length
  }, 2200)
})

onBeforeUnmount(() => clearInterval(timer))

/** Titles run twice through the band so the loop has no visible seam. */
const bandTitles = computed(() => {
  const titles = works.value.map(w => w.title)
  return titles.length ? [...titles, ...titles] : []
})
</script>

<template>
  <div>
    <!-- Hero: one centered statement, one moving word. -->
    <section class="flex min-h-[78dvh] flex-col justify-center px-6 md:px-10 lg:px-16">
      <div class="mx-auto w-full max-w-[1400px]">
        <h1 class="font-pixelify-sans text-[15vw] leading-[0.86] md:text-[11vw] lg:text-[8.5vw] xl:text-[7.5rem]">
          <span class="block">I find patterns</span>
          <span class="flex flex-wrap items-baseline gap-x-[0.3em]">
            <span>in</span>
            <span class="relative inline-block overflow-hidden pb-[0.12em] align-bottom">
              <Transition name="word" mode="out-in">
                <span :key="wordIndex" class="inline-block text-neutral-400">
                  {{ ROTATING[wordIndex] }}
                </span>
              </Transition>
            </span>
          </span>
        </h1>
        <p class="mt-8 max-w-[40ch] font-serif text-xl leading-snug text-neutral-400 md:text-2xl">
          then build them into something people can feel.
        </p>
      </div>
    </section>

    <!-- Full-bleed title band: the whole index, read as one line. -->
    <section class="rule overflow-hidden py-4">
      <div class="band flex w-max gap-8 whitespace-nowrap">
        <span
          v-for="(title, i) in bandTitles"
          :key="`${title}-${i}`"
          class="font-pixelify-sans text-2xl leading-none text-neutral-700 md:text-3xl"
          aria-hidden="true"
        >
          {{ title }}
        </span>
      </div>
    </section>

    <!-- Filter row -->
    <section class="rule px-6 md:px-10 lg:px-16">
      <div class="mx-auto flex max-w-[1400px] flex-wrap items-baseline gap-x-6 gap-y-2 py-4">
        <button
          type="button"
          v-cursor="{ clickable: true }"
          class="cursor-pointer font-pixelify-sans text-lg leading-none transition-colors duration-200 md:text-xl"
          :class="category === null
            ? 'text-ink underline decoration-2 underline-offset-[6px]'
            : 'text-neutral-400 hover:text-ink'"
          @click="selectCategory(null)"
        >
          Everything ({{ works.length }})
        </button>

        <button
          v-for="name in categories"
          :key="name"
          type="button"
          v-cursor="{ clickable: true }"
          class="cursor-pointer font-pixelify-sans text-lg leading-none transition-colors duration-200 md:text-xl"
          :class="category === name
            ? 'text-ink underline decoration-2 underline-offset-[6px]'
            : 'text-neutral-400 hover:text-ink'"
          @click="selectCategory(name)"
        >
          {{ name }} ({{ counts[name] }})
        </button>
      </div>
    </section>

    <section class="px-6 pb-24 pt-8 md:px-10 md:pb-32 lg:px-16">
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
        gap-class="gap-5 md:gap-6"
        captions="hover"
        radius-class="rounded-none"
      />
    </section>
  </div>
</template>

<style scoped>
.band {
  animation: band-scroll 48s linear infinite;
}

@keyframes band-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

.word-enter-active,
.word-leave-active {
  transition: transform 320ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms ease;
}

.word-enter-from {
  opacity: 0;
  transform: translateY(0.5em);
}

.word-leave-to {
  opacity: 0;
  transform: translateY(-0.5em);
}

@media (prefers-reduced-motion: reduce) {
  .band {
    animation: none;
  }

  .word-enter-active,
  .word-leave-active {
    transition: none;
  }
}
</style>
