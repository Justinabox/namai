<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  autoplay: {
    type: Boolean,
    default: true
  },
  placeholderRatio: {
    type: String,
    default: ''
  }
})

const videoRef = ref(null)
let player = null
const isLoaded = ref(false)

const normalizedPlaceholderRatio = computed(() => {
  if (!props.placeholderRatio) return ''
  const rawRatio = String(props.placeholderRatio).trim()
  if (!rawRatio) return ''
  if (rawRatio.includes(':')) {
    const [width, height] = rawRatio.split(':')
    if (width && height) {
      return `${width.trim()} / ${height.trim()}`
    }
  }
  return rawRatio
})

const placeholderAspectRatio = computed(() => normalizedPlaceholderRatio.value || '16 / 9')

const initPlayer = async () => {
  if (!videoRef.value || !props.src) return
  const dashjs = await import('dashjs')
  player = dashjs.MediaPlayer().create()
  player.initialize(videoRef.value, props.src, props.autoplay)
}

onMounted(initPlayer)

watch(
  () => props.src,
  async () => {
    if (player) {
      player.reset()
      player = null
    }
    isLoaded.value = false
    await initPlayer()
  }
)

onBeforeUnmount(() => {
  if (player) {
    player.reset()
    player = null
  }
})

const handleVideoLoaded = () => {
  isLoaded.value = true
}
</script>

<template>
  <div
    class="w-full"
    :class="{ 'bg-crossing': !isLoaded }"
    :style="isLoaded ? {} : { aspectRatio: placeholderAspectRatio }"
  >
    <video
      ref="videoRef"
      v-bind="$attrs"
      :class="isLoaded ? 'w-full h-auto' : 'w-full h-full'"
      @loadedmetadata="handleVideoLoaded"
    />
  </div>
</template>
