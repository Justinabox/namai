<script lang="ts" setup>
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
  <div class="h-full w-full flex flex-col max-w-[1024px] mx-auto">
    <ContentRenderer :value="project ?? {}" />
  </div>
</template>