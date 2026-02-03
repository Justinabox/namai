<script setup> // mark as global component
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
let visibilityObserver = null
const autoPaused = ref(false)
const userPaused = ref(false)
const visibilityThreshold = 0.5

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
  player.initialize(videoRef.value, props.src, false)
  player.updateSettings({
    streaming: { 
      // cacheInitialSegments: true,
      buffer: {
        fastSwitchEnabled: true,
      },
      abr: {
        maxBitrate: {audio: -1, video: 5000}
      }
    }
  })
}

const pausePlayback = () => {
  if (!videoRef.value) return
  if (player) {
    player.pause()
  } else {
    videoRef.value.pause()
  }
  autoPaused.value = true
}

const resumePlayback = () => {
  if (!videoRef.value) return
  if (!props.autoplay || userPaused.value) return
  if (player) {
    player.play()
  } else {
    videoRef.value.play().catch(() => {})
  }
  autoPaused.value = false
}

const getVisibilityRatio = () => {
  if (!videoRef.value) return 0
  const rect = videoRef.value.getBoundingClientRect()
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight
  if (rect.width <= 0 || rect.height <= 0) return 0
  const intersectionWidth = Math.max(
    0,
    Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0)
  )
  const intersectionHeight = Math.max(
    0,
    Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0)
  )
  const intersectionArea = intersectionWidth * intersectionHeight
  const targetArea = rect.width * rect.height
  if (targetArea <= 0) return 0
  return Math.min(1, Math.max(0, intersectionArea / targetArea))
}

const applyInitialVisibility = () => {
  if (!props.autoplay) return
  const ratio = getVisibilityRatio()
  if (ratio < visibilityThreshold) {
    if (!autoPaused.value) pausePlayback()
  } else if (autoPaused.value) {
    resumePlayback()
  } else {
    resumePlayback()
  }
}

const setupVisibilityObserver = () => {
  if (!videoRef.value || typeof IntersectionObserver === 'undefined') return
  visibilityObserver?.disconnect()
  visibilityObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (!entry) return
      if (!props.autoplay) return
      const ratio = entry.intersectionRatio
      if (ratio < visibilityThreshold) {
        if (!autoPaused.value) pausePlayback()
      } else if (autoPaused.value && props.autoplay && !userPaused.value) {
        resumePlayback()
      }
    },
    {
      threshold: [0, visibilityThreshold, 1]
    }
  )
  visibilityObserver.observe(videoRef.value)
  applyInitialVisibility()
}

onMounted(() => {
  initPlayer()
  setupVisibilityObserver()
})

watch(
  () => props.src,
  async () => {
    if (player) {
      player.reset()
      player = null
    }
    isLoaded.value = false
    autoPaused.value = false
    userPaused.value = false
    await initPlayer()
    applyInitialVisibility()
  }
)

onBeforeUnmount(() => {
  if (player) {
    player.reset()
    player = null
  }
  visibilityObserver?.disconnect()
  visibilityObserver = null
})

const handleVideoLoaded = () => {
  isLoaded.value = true
}

const handleVideoPause = () => {
  if (autoPaused.value) return
  userPaused.value = true
}

const handleVideoPlay = () => {
  userPaused.value = false
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
      :autoplay="autoplay"
      :class="isLoaded ? 'w-full h-auto' : 'w-full h-full'"
      @loadedmetadata="handleVideoLoaded"
      @pause="handleVideoPause"
      @play="handleVideoPlay"
    />
  </div>
</template>
