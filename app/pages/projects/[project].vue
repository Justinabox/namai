<script lang="ts" setup>
import { Icon } from '@iconify/vue'
const route = useRoute()
const { data: project } = await useAsyncData(route.path, () => {
  return queryCollection('projects').path(route.path).first()
})

if (!project.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Project not found',
  })
}
</script>

<template>
  <div class="h-full w-full overflow-y-auto">
    <div class="w-full flex flex-row gap-8 px-8 lg:px-16 xl:px-20 justify-between py-8">
      <!-- Left sidebar -->
      <aside class="sticky top-0 h-full 2xl:w-[300px] mr-4 xl:mr-8 shrink-0 text-neutral-600 text-3xl xl:text-4xl 2xl:text-5xl font-pixelify-sans hidden sm:block">
        <a class="flex flex-row items-center gap-2 text-neutral-600 pb-6">{{ project?.title }}</a>
        <a class="flex flex-row items-center gap-2">· Intro</a>
        <a class="flex flex-row items-center gap-2 text-neutral-200">· Problem</a>
        <a class="flex flex-row items-center gap-2">· Process</a>
        <a class="flex flex-row items-center gap-2">· Iteration</a>
        <a class="flex flex-row items-center gap-2">· Solution</a>
        <a class="flex flex-row items-center gap-2">· Result</a>
        <a class="flex flex-row items-center gap-2">· Reflection</a>
        <!-- <a class="text-sm text-neutral-400">with ❤️ by Justin</a> -->
      </aside>

      <!-- Main content -->
      <div class="flex min-w-0 flex-1 flex-col max-w-[864px]">
        <ContentRenderer :value="project ?? {}" />

        <a class="text-neutral-400 text-xl">Laboris pariatur do eu culpa ipsum velit laboris. Voluptate magna sit
          laborum id sint ut et occaecat magna enim ipsum elit commodo. Eu velit occaecat proident exercitation ad.
          Officia aliqua labore nulla eu. Nulla ea magna est culpa ad mollit amet consequat in non. Qui nulla eiusmod
          minim ea ullamco dolor ea laborum. Amet ullamco qui est ea in est non aute non cupidatat.

          Laboris quis amet aliquip irure occaecat elit. Consequat ex in irure magna velit anim. Aute mollit cupidatat
          do. Excepteur sit esse in in magna Lorem veniam ut consequat sint. In culpa eiusmod sint incididunt aute ut
          fugiat esse incididunt nulla id non. Anim officia laboris cillum tempor reprehenderit duis cupidatat dolor
          pariatur. Eu et excepteur incididunt fugiat ea laborum nisi ad incididunt laborum magna.

          Esse esse proident ex. Tempor veniam veniam sunt. Sint incididunt ullamco anim minim. Eu cupidatat sit sint
          sint cillum dolor culpa consequat magna reprehenderit est. Pariatur ut cillum laboris consectetur nulla labore
          ut exercitation deserunt dolor non commodo.

          Pariatur commodo ut pariatur ad deserunt laboris cupidatat sunt enim. Consequat ea proident laborum deserunt
          eiusmod cillum eu nisi ex ad esse aliquip. Occaecat consectetur eiusmod reprehenderit qui fugiat et irure. Non
          Lorem irure labore in ut reprehenderit exercitation consectetur nisi incididunt enim anim culpa amet. Nisi
          velit reprehenderit exercitation pariatur adipisicing sit minim ea adipisicing consequat reprehenderit. Fugiat
          officia elit occaecat aute occaecat do esse pariatur nisi sunt ullamco.

          Velit consequat velit velit esse esse ullamco. In elit sunt commodo irure duis minim aliquip elit consequat
          elit sunt ad deserunt ullamco. Reprehenderit reprehenderit dolor irure ipsum ut elit id. Labore enim labore
          elit non labore anim. Occaecat deserunt aliqua duis ad ullamco tempor.</a>
      </div>

      <!-- Right sidebar -->
      <aside class="sticky top-0 h-full w-[150px] xl:w-[200px] 2xl:w-[250px] shrink-0 flex-col gap-4 justify-between text-neutral-300 hidden md:flex">

        <div class="flex flex-col" v-if="project?.time">
          <a class="text-xl lg:text-2xl 2xl:text-3xl font-pixelify-sans pb-0.5 flex items-center gap-2">
            <Icon icon="pixelarticons:moon-star" class="w-6 h-6" />Time
          </a>
          <a class="text-lg lg:text-xl 2xl:text-2xl font-serif leading-none text-neutral-500 tracking-tight">{{ project?.time }}</a>
        </div>

        <div class="flex flex-col" v-if="project?.scope">
          <a class="text-xl lg:text-2xl 2xl:text-3xl font-pixelify-sans pb-0.5 flex items-center gap-2">
            <Icon icon="pixelarticons:bullseye-arrow" class="w-6 h-6" />Scope
          </a>
          <a class="text-lg lg:text-xl 2xl:text-2xl font-serif leading-none text-neutral-500 tracking-tight">{{ project?.scope }}</a>
        </div>

        <div class="flex flex-col" v-if="project?.roles">
          <a class="text-xl lg:text-2xl 2xl:text-3xl font-pixelify-sans pb-0.5 flex items-center gap-2">
            <Icon icon="pixelarticons:suitcase" class="w-6 h-6" />Role
          </a>
          <a v-for="role in project?.roles" :key="role"
            class="text-lg lg:text-xl 2xl:text-2xl font-serif leading-none text-neutral-500 tracking-tight">{{ role }}
          </a>
        </div>

        <div class="flex flex-col" v-if="project?.team">
          <div class="text-xl lg:text-2xl 2xl:text-3xl font-pixelify-sans pb-0.5 flex items-center gap-2">
            <Icon icon="pixelarticons:users" class="w-6 h-6" />Team
          </div>
          <a v-for="person in project?.team" :key="person.name" class="flex flex-row items-center gap-1 text-neutral-500 hover:text-neutral-700 duration-200"
            :href="person.link + '?utm_source=justzhu.com&utm_medium=referral&utm_campaign=projects'" target="_blank" rel="noopener noreferrer">
            <span class="text-xs lg:text-sm 2xl:text-md tracking-normal rounded-sm">{{ person.role }}</span>
            <span class="text-lg lg:text-xl 2xl:text-2xl font-serif leading-none tracking-tight">{{ person.name }}</span>
            <Icon class="w-4 h-4 2xl:w-6 2xl:h-6" icon="iconamoon:arrow-top-right-1-bold" />
          </a>
        </div>

        <div class="flex flex-col" v-if="project?.techstack">
          <a class="text-xl lg:text-2xl 2xl:text-3xl font-pixelify-sans pb-0.5 flex items-center gap-2">
            <Icon icon="pixelarticons:radio-tower" class="w-6 h-6" />Stack
          </a>
          <a v-for="techstack in project?.techstack" :key="techstack"
            class="text-lg lg:text-xl 2xl:text-2xl font-serif leading-none text-neutral-500 tracking-tight">{{ techstack }}
          </a>
        </div>

        <div class="flex flex-col" v-if="project?.links && project?.links.length > 0">
          <a class="text-xl lg:text-2xl 2xl:text-3xl font-pixelify-sans pb-0.5 flex items-center gap-2">
            <Icon icon="pixelarticons:external-link" class="w-6 h-6" />Links
          </a>
          <a v-for="link in project?.links" :key="link.url"
            class="text-lg lg:text-xl 2xl:text-2xl font-serif leading-none text-neutral-500 tracking-tight flex items-center gap-1 hover:text-neutral-700 duration-200"
            :href="link.url" target="_blank">{{ link.name }}
            <Icon class="w-4 h-4 2xl:w-6 2xl:h-6" icon="iconamoon:arrow-top-right-1-bold" />
          </a>
        </div>

      </aside>

    </div>
  </div>
</template>
