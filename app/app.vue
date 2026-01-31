<script setup>
import { SmoothCursor } from '/components/ui/smooth-cursor'
</script>

<template>
  <div>
    <NuxtPage />
    <ClientOnly>
      <SmoothCursor :disable-rotation="true" />
    </ClientOnly>
  </div>
</template>
