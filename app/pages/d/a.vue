<script setup>
import { Motion } from 'motion-v'
import Avatar from '~/components/ui/Avatar.vue'

const { filtered, category, counts, categories, selectCategory, pending, error, works } = useWorks()

useHead({ title: 'Justzhu' })
</script>

<template>
  <div>
    <!-- Hero: statement left, blob right, nothing centered. -->
    <section class="px-6 pb-16 pt-14 md:px-10 md:pb-24 md:pt-20 lg:px-16">
      <div class="mx-auto flex max-w-[1400px] flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <div class="min-w-0">
          <h1
            class="font-pixelify-sans text-[13vw] leading-[0.88] tracking-tight md:text-[8.5vw] lg:text-[7vw] xl:text-[6.4rem]"
          >
            <JitterText text="I find patterns" />
            <br />
            <JitterText text="in chaos" />
          </h1>
          <p class="mt-6 max-w-[36ch] font-serif text-xl leading-snug text-neutral-400 md:text-2xl">
            then build them into something people can feel.
          </p>
        </div>

        <ClientOnly>
          <Motion
            as="div"
            drag
            drag-snap-to-origin
            v-cursor="{ clickable: true }"
            class="shrink-0 self-start md:self-end"
            :initial="{ scale: 0.4, rotate: -12 }"
            :animate="{ scale: 1, rotate: 0 }"
            :hover="{ scale: 1.06 }"
            :while-drag="{ scale: 0.94 }"
            :transition="{ type: 'spring', damping: 11, stiffness: 110 }"
          >
            <Avatar class="h-24 w-24 overflow-hidden rounded-full md:h-32 md:w-32" />
          </Motion>
        </ClientOnly>
      </div>
    </section>

    <!-- Filter row: text only, sits on the rule that opens the grid. -->
    <section class="px-6 md:px-10 lg:px-16">
      <div class="mx-auto max-w-[1400px] rule flex flex-wrap items-baseline gap-x-5 gap-y-2 py-4">
        <button
          type="button"
          v-cursor="{ clickable: true }"
          class="cursor-pointer font-pixelify-sans text-lg leading-none transition-colors duration-200 md:text-xl"
          :class="category === null ? 'text-ink' : 'text-neutral-400 hover:text-ink'"
          @click="selectCategory(null)"
        >
          Everything
          <span class="align-super text-[0.65em] text-neutral-400">{{ works.length }}</span>
        </button>

        <button
          v-for="name in categories"
          :key="name"
          type="button"
          v-cursor="{ clickable: true }"
          class="cursor-pointer font-pixelify-sans text-lg leading-none transition-colors duration-200 md:text-xl"
          :class="category === name ? 'text-ink' : 'text-neutral-400 hover:text-ink'"
          @click="selectCategory(name)"
        >
          {{ name }}
          <span class="align-super text-[0.65em] text-neutral-400">{{ counts[name] }}</span>
        </button>
      </div>
    </section>

    <!-- One centered waterfall, no sidebars. -->
    <section class="px-6 pb-24 pt-6 md:px-10 md:pb-32 lg:px-16">
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
        gap-class="gap-6 md:gap-8"
        captions="always"
        radius-class="rounded-lg"
      />
    </section>
  </div>
</template>
