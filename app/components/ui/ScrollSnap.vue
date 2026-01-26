<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    /**
     * When true, snapping is disabled when viewport < md.
     * (md defaults to 768px, matching Tailwind's default breakpoint.)
     */
    disableSnapBelowMd?: boolean
    mdBreakpointPx?: number
  }>(),
  {
    disableSnapBelowMd: true,
    mdBreakpointPx: 768,
  },
)

const scrollSnapEl = ref<HTMLDivElement | null>(null)
const isMdUp = ref(true)

const snapEnabled = computed(() => !(props.disableSnapBelowMd && !isMdUp.value))
const scaleEnabled = computed(() => !(props.disableSnapBelowMd && !isMdUp.value))

let mql: MediaQueryList | null = null
let mqlHandler: ((e: MediaQueryListEvent) => void) | null = null

// Use scroll position to track which item is "active" (centered) for scaling.
// We calculate which item's center is closest to the viewport center.
let scrollHandler: (() => void) | null = null

function updateActiveItem() {
  if (!scrollSnapEl.value) return
  const container = scrollSnapEl.value
  const children = Array.from(container.children).filter(el => el.tagName !== 'STYLE' && el.tagName !== 'SCRIPT') as HTMLElement[]
  if (children.length === 0) return

  const containerRect = container.getBoundingClientRect()
  const center = containerRect.top + container.clientHeight / 2
  
  // If we are at the very top, favor the first item
  // Increase threshold to handle bounce/overscroll or small offsets
  // Only applies if the first item is indeed supposed to be at the top (snap-align-start)
  if (container.scrollTop < 30) {
    children.forEach((child, index) => {
      if (index === 0) child.classList.add('scroll-snap__item--active')
      else child.classList.remove('scroll-snap__item--active')
    })
    return
  }

  let closest: HTMLElement | null = null
  let minDiff = Infinity

  children.forEach(child => {
    const rect = child.getBoundingClientRect()
    
    // Determine target based on alignment
    // If it's start-aligned, we want its top to be at 0
    // If it's center-aligned, we want its center to be at viewport center
    let diff = 0
    if (child.classList.contains('snap-align-start')) {
      diff = Math.abs(rect.top)
    } else {
      const childCenter = rect.top + rect.height / 2
      diff = Math.abs(childCenter - center)
    }

    if (diff < minDiff) {
      minDiff = diff
      closest = child
    }
  })

  if (closest) {
    children.forEach(child => {
      if (child === closest) child.classList.add('scroll-snap__item--active')
      else child.classList.remove('scroll-snap__item--active')
    })
  }
}

// Check if items can be centered in the viewport.
// If an item's center is closer to the top than the viewport center (and cannot be scrolled up further),
// we align it to 'start' so it snaps to the top instead of trying to center (which would be unreachable).
function updateSnapAlignments() {
  if (!scrollSnapEl.value) return
  const container = scrollSnapEl.value
  const viewportHeight = container.clientHeight
  const halfViewport = viewportHeight / 2
  
  // We need offsets relative to the container.
  // Since children are direct descendants, offsetTop is relative to the container (if positioned).
  // The container is overflow-y: auto, so it's an offset parent.
  const children = Array.from(container.children).filter(el => el.tagName !== 'STYLE' && el.tagName !== 'SCRIPT') as HTMLElement[]
  
  children.forEach(child => {
    // Determine the child's center position relative to the start of the scrollable content
    const childCenter = child.offsetTop + child.offsetHeight / 2
    
    // If the center is physically located above the "fold" required for centering
    // (i.e. we can't scroll up enough to bring it to center), force start alignment.
    if (childCenter < halfViewport) {
      child.classList.add('snap-align-start')
    } else {
      child.classList.remove('snap-align-start')
    }
  })
}

let resizeObserver: ResizeObserver | null = null

function setupObserver() {
  if (scrollHandler) return

  // Run alignment check initially
  updateSnapAlignments()

  // Observe resizing of container and children to handle dynamic content (e.g. images loading)
  // This ensures snap alignments are updated if items grow/shrink
  resizeObserver = new ResizeObserver(() => {
    // Debounce or just run? RAF in scrollHandler handles active item, 
    // but alignments need immediate update or next RAF.
    // We can just run it.
    updateSnapAlignments()
    // Re-check active item
    updateActiveItem()
  })
  
  if (scrollSnapEl.value) {
    resizeObserver.observe(scrollSnapEl.value)
    Array.from(scrollSnapEl.value.children).forEach(child => resizeObserver?.observe(child))
  }

  let ticking = false
  scrollHandler = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateActiveItem()
        ticking = false
      })
      ticking = true
    }
  }

  scrollSnapEl.value?.addEventListener('scroll', scrollHandler, { passive: true })
  
  // Handle resize for both alignments and active item calculation
  // Window resize is separate from element resize (which ResizeObserver handles)
  // but good to keep for viewport changes
  window.addEventListener('resize', () => {
    updateSnapAlignments()
    scrollHandler?.()
  })
  
  // Initial check
  updateActiveItem()
}

function cleanupObserver() {
  if (scrollSnapEl.value && scrollHandler) {
    scrollSnapEl.value.removeEventListener('scroll', scrollHandler)
  }
  window.removeEventListener('resize', scrollHandler as EventListener)
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  scrollHandler = null
}

// Re-run observer attachment when children might have changed or component updates
// Simple way: re-attach on mounted/updated hooks if needed, but for static lists mounted is ok.
// If the slot content is dynamic, we might need a MutationObserver or a watcher.
// For now, we'll assume the list is stable or re-renders trigger updates.

onMounted(async () => {
  if (typeof window !== 'undefined') {
    mql = window.matchMedia(`(min-width: ${props.mdBreakpointPx}px)`)
    isMdUp.value = mql.matches
    mqlHandler = (e) => {
      isMdUp.value = e.matches
    }
    mql.addEventListener?.('change', mqlHandler) ?? mql.addListener(mqlHandler)
  }

  await nextTick()
  setupObserver()
})

onBeforeUnmount(() => {
  cleanupObserver()
  if (mql && mqlHandler) {
    mql.removeEventListener?.('change', mqlHandler) ?? mql.removeListener(mqlHandler)
  }
})

// If snapping toggles, we might want to refresh the observer or active states
watch(scaleEnabled, async (enabled) => {
  if (enabled) {
    await nextTick()
    setupObserver()
  } else {
    cleanupObserver()
    // Clear active classes
    if (scrollSnapEl.value) {
      Array.from(scrollSnapEl.value.children).forEach(c => c.classList.remove('scroll-snap__item--active'))
    }
  }
})
</script>

<template>
  <div
    ref="scrollSnapEl"
    v-bind="$attrs"
    :class="[
      'scroll-snap',
      snapEnabled ? 'scroll-snap--enabled' : 'scroll-snap--disabled',
      scaleEnabled ? 'scroll-snap--scale' : 'scroll-snap--scale-disabled',
    ]"
  >
    <slot />
  </div>
</template>

<style scoped>
.scroll-snap {
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  /* Ensure the container itself can scroll */
  overflow-y: auto;
  overflow-x: hidden;
  /* Ensure offsetTop calculations are relative to this container */
  position: relative;
  /* Improve touch handling */
  touch-action: pan-y;
}

.scroll-snap--enabled {
  /* Native CSS Scroll Snap */
  scroll-snap-type: y mandatory;
}

/* 
  Deep selector to target slot content (the items).
  Using :deep() or just child selector depending on scoped vs global.
  Since we are in scoped style, we need ::v-deep or :deep() for slotted content in Vue 3.
*/
.scroll-snap--enabled :deep(> *) {
  scroll-snap-align: center;
  /* Crucial for 'one gesture per item' feel */
  scroll-snap-stop: always;
}

.scroll-snap--disabled {
  scroll-snap-type: none;
}

/* Scaling effects tracked by IntersectionObserver class */
.scroll-snap--scale::after {
  content: '';
  display: block;
  min-height: 50vh;
  /* Ensure it takes up space in flex container */
  flex: 0 0 50vh; 
}

.scroll-snap--scale :deep(> *) {
  transform: scale(0.9);
  opacity: 0.3;
  transition: transform 300ms cubic-bezier(0.25, 0.1, 0.25, 1.0), opacity 300ms cubic-bezier(0.25, 0.1, 0.25, 1.0);
  /* Ensure items have block layout for proper spacing/snapping */
  display: block; 
}

.scroll-snap--scale :deep(> .snap-align-start) {
  scroll-snap-align: start !important;
}

.scroll-snap--scale :deep(> .scroll-snap__item--active) {
  transform: scale(1);
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .scroll-snap--scale :deep(> *) {
    transition: none;
  }
}
</style>
