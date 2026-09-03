<script setup>
const route = useRoute()
const isHome = computed(() => route.path === '/')
</script>

<template>
  <div class="relative flex min-h-dvh flex-col">
    <header
      class="sticky top-0 z-30 flex h-16 w-full items-center justify-between bg-paper/80 px-6 backdrop-blur-md md:px-10 lg:px-16"
    >
      <NuxtLink to="/" class="font-pixelify-sans text-2xl leading-none md:text-3xl">
        Justzhu
      </NuxtLink>

      <nav class="flex items-baseline gap-5 md:gap-7">
        <NuxtLink
          v-if="!isHome"
          to="/"
          class="font-pixelify-sans text-xl leading-none text-neutral-400 transition-colors duration-200 hover:text-ink md:text-2xl"
        >
          [Index]
        </NuxtLink>

        <a
          href="/Resume.pdf"
          target="_blank"
          rel="noopener"
          class="font-pixelify-sans text-xl leading-none text-neutral-400 transition-colors duration-200 hover:text-ink md:text-2xl"
        >
          [Resume]
        </a>
      </nav>
    </header>

    <main class="flex-1">
      <NuxtPage />
    </main>

    <!-- Every page ends by turning slowly over the landscape. -->
    <ClientOnly>
      <LuminFooter />
    </ClientOnly>
  </div>
</template>
