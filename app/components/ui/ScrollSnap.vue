<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

const props = withDefaults(
  defineProps<{
    disableSnapBelowMd?: boolean
    mdBreakpointPx?: number
  }>(),
  {
    disableSnapBelowMd: true,
    mdBreakpointPx: 768,
  },
)

const CONFIG = {
  SNAP_PAUSE_THRESHOLD: 24,
  TOP_POSITION_THRESHOLD: 30,
  OVERSIZE_THRESHOLD: 2,
  CLASS_NAMES: {
    SCROLL_SNAP: 'scroll-snap',
    SNAP_ENABLED: 'scroll-snap--enabled',
    SNAP_DISABLED: 'scroll-snap--disabled',
    SNAP_SCALE: 'scroll-snap--scale',
    SNAP_SCALE_DISABLED: 'scroll-snap--scale-disabled',
    SNAP_PAUSED: 'scroll-snap--paused',
    SNAP_OVERSIZE: 'snap-oversize',
    SNAP_ALIGN_START: 'snap-align-start',
    SNAP_ITEM_ACTIVE: 'scroll-snap__item--active',
  },
} as const

const scrollSnapEl = ref<HTMLDivElement | null>(null)
const isMdUp = ref(true)
const activeItem = ref<HTMLElement | null>(null)
const childrenCount = ref(0)

const snapEnabled = computed(() => !(props.disableSnapBelowMd && !isMdUp.value))
const scaleEnabled = computed(() => !(props.disableSnapBelowMd && !isMdUp.value))

let mql: MediaQueryList | null = null
let mqlHandler: ((e: MediaQueryListEvent) => void) | null = null
let scrollHandler: (() => void) | null = null
let resizeObserver: ResizeObserver | null = null
let windowResizeHandler: (() => void) | null = null

function getScrollableChildren(container: HTMLElement): HTMLElement[] {
  return Array.from(container.children).filter(
    el => el.tagName !== 'STYLE' && el.tagName !== 'SCRIPT'
  ) as HTMLElement[]
}

function handleTopPosition(container: HTMLElement, children: HTMLElement[]): boolean {
  if (container.scrollTop >= CONFIG.TOP_POSITION_THRESHOLD) return false

  children.forEach((child, index) => {
    if (index === 0) {
      child.classList.add(CONFIG.CLASS_NAMES.SNAP_ITEM_ACTIVE)
    } else {
      child.classList.remove(CONFIG.CLASS_NAMES.SNAP_ITEM_ACTIVE)
    }
  })
  activeItem.value = children[0] ?? null
  return true
}

function findOversizeItem(container: HTMLElement, children: HTMLElement[]): HTMLElement | null {
  return children.find(child => {
    if (!child.classList.contains(CONFIG.CLASS_NAMES.SNAP_OVERSIZE)) return false
    
    const viewTop = container.scrollTop
    const viewBottom = viewTop + container.clientHeight
    const childTop = child.offsetTop
    const childBottom = childTop + child.offsetHeight
    
    return viewTop >= childTop && viewBottom <= childBottom
  }) ?? null
}

function findClosestItem(
  children: HTMLElement[],
  containerRect: DOMRect,
  viewportCenter: number
): HTMLElement | null {
  let closest: HTMLElement | null = null
  let minDiff = Infinity

  children.forEach(child => {
    if (minDiff < 0) return
    
    const rect = child.getBoundingClientRect()
    let diff = 0

    if (child.classList.contains(CONFIG.CLASS_NAMES.SNAP_ALIGN_START)) {
      diff = Math.abs(rect.top)
    } else {
      const childCenter = rect.top + rect.height / 2
      diff = Math.abs(childCenter - viewportCenter)
    }

    if (diff < minDiff) {
      minDiff = diff
      closest = child
    }
  })

  return closest
}

function updateActiveClasses(
  children: HTMLElement[],
  activeChild: HTMLElement | null
): void {
  children.forEach(child => {
    if (child === activeChild) {
      child.classList.add(CONFIG.CLASS_NAMES.SNAP_ITEM_ACTIVE)
    } else {
      child.classList.remove(CONFIG.CLASS_NAMES.SNAP_ITEM_ACTIVE)
    }
  })
}

function updateActiveItem(): void {
  if (!scrollSnapEl.value) return
  const container = scrollSnapEl.value
  const children = getScrollableChildren(container)
  if (children.length === 0) return

  const containerRect = container.getBoundingClientRect()
  const viewportCenter = containerRect.top + container.clientHeight / 2

  if (handleTopPosition(container, children)) return

  const oversizeItem = findOversizeItem(container, children)
  const closestItem = oversizeItem ?? findClosestItem(children, containerRect, viewportCenter)

  if (closestItem) {
    updateActiveClasses(children, closestItem)
    activeItem.value = closestItem
  }
}

function updateChildSnapAlignments(
  child: HTMLElement,
  viewportHeight: number,
  halfViewport: number
): void {
  const isOversize = child.offsetHeight >= viewportHeight - CONFIG.OVERSIZE_THRESHOLD
  child.classList.toggle(CONFIG.CLASS_NAMES.SNAP_OVERSIZE, isOversize)

  const childCenter = child.offsetTop + child.offsetHeight / 2
  const shouldAlignStart = isOversize || childCenter < halfViewport
  child.classList.toggle(CONFIG.CLASS_NAMES.SNAP_ALIGN_START, shouldAlignStart)
}

function updateSnapAlignments(): void {
  if (!scrollSnapEl.value) return
  const container = scrollSnapEl.value
  const viewportHeight = container.clientHeight
  const halfViewport = viewportHeight / 2
  const children = getScrollableChildren(container)

  children.forEach(child => {
    updateChildSnapAlignments(child, viewportHeight, halfViewport)
  })
}

function findOversizeInViewTop(
  children: HTMLElement[],
  viewTop: number
): HTMLElement | null {
  return children.find(child => {
    if (!child.classList.contains(CONFIG.CLASS_NAMES.SNAP_OVERSIZE)) return false
    
    const childTop = child.offsetTop
    const childBottom = childTop + child.offsetHeight
    return viewTop >= childTop && viewTop < childBottom
  }) ?? null
}

function updateSnapPause(): void {
  const container = scrollSnapEl.value
  if (!container) return
  
  if (!snapEnabled.value) {
    container.classList.remove(CONFIG.CLASS_NAMES.SNAP_PAUSED)
    return
  }

  const viewTop = container.scrollTop
  const children = getScrollableChildren(container)
  const oversizeInViewTop = findOversizeInViewTop(children, viewTop)

  if (!oversizeInViewTop) {
    container.classList.remove(CONFIG.CLASS_NAMES.SNAP_PAUSED)
    return
  }

  const childTop = oversizeInViewTop.offsetTop
  const isNearTop = viewTop <= childTop + CONFIG.SNAP_PAUSE_THRESHOLD
  container.classList.toggle(CONFIG.CLASS_NAMES.SNAP_PAUSED, !isNearTop)
}

function setupObserver(): void {
  if (!scrollSnapEl.value || scrollHandler) return

  updateSnapAlignments()

  const debouncedUpdate = debounce(() => {
    updateSnapAlignments()
    updateActiveItem()
  }, 150)

  resizeObserver = new ResizeObserver((entries) => {
    if (entries.some(entry => entry.contentRect.height > 0 || entry.contentRect.width > 0)) {
      debouncedUpdate()
    }
  })
  
  try {
    resizeObserver.observe(scrollSnapEl.value)
    const children = getScrollableChildren(scrollSnapEl.value)
    children.forEach(child => {
      resizeObserver?.observe(child)
    })
    
    if (children.length === 0) {
      setTimeout(() => {
        if (scrollSnapEl.value) {
          const delayedChildren = getScrollableChildren(scrollSnapEl.value)
          delayedChildren.forEach(child => {
            resizeObserver?.observe(child)
          })
          updateSnapAlignments()
          updateActiveItem()
        }
      }, 100)
    }
  } catch (error) {
    console.error('ResizeObserver setup failed:', error)
  }

  let ticking = false
  scrollHandler = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateActiveItem()
        updateSnapPause()
        ticking = false
      })
      ticking = true
    }
  }

  try {
    scrollSnapEl.value.addEventListener('scroll', scrollHandler, { passive: true })
  } catch (error) {
    console.error('Scroll event listener setup failed:', error)
  }

  windowResizeHandler = debounce(() => {
    updateSnapAlignments()
    scrollHandler?.()
  }, 150)

  try {
    window.addEventListener('resize', windowResizeHandler)
  } catch (error) {
    console.error('Resize event listener setup failed:', error)
  }
  
  updateActiveItem()
  updateSnapPause()
}

function cleanupObserver(): void {
  if (!scrollSnapEl.value) return

  if (scrollHandler) {
    scrollSnapEl.value.removeEventListener('scroll', scrollHandler)
    scrollHandler = null
  }

  if (windowResizeHandler) {
    try {
      window.removeEventListener('resize', windowResizeHandler)
      windowResizeHandler = null
    } catch (error) {
      console.error('Failed to remove resize listener:', error)
    }
  }

  scrollSnapEl.value.classList.remove(CONFIG.CLASS_NAMES.SNAP_PAUSED)

  if (resizeObserver) {
    try {
      resizeObserver.disconnect()
    } catch (error) {
      console.error('Failed to disconnect ResizeObserver:', error)
    }
    resizeObserver = null
  }
}

onMounted(async () => {
  if (typeof window === 'undefined') return

  try {
    mql = window.matchMedia(`(min-width: ${props.mdBreakpointPx}px)`)
    isMdUp.value = mql.matches
    
    mqlHandler = (e) => {
      isMdUp.value = e.matches
    }
    
    if (mql.addEventListener) {
      mql.addEventListener('change', mqlHandler)
    } else if (mql.addListener) {
      mql.addListener(mqlHandler)
    }
  } catch (error) {
    console.error('Media query setup failed:', error)
  }

  await nextTick()
  setupObserver()
})

onBeforeUnmount(() => {
  cleanupObserver()
  
  if (mql && mqlHandler) {
    if (mql.removeEventListener) {
      mql.removeEventListener('change', mqlHandler)
    } else if (mql.removeListener) {
      mql.removeListener(mqlHandler)
    }
  }
})

watch(scaleEnabled, async (enabled) => {
  if (enabled) {
    await nextTick()
    setupObserver()
  } else {
    cleanupObserver()
    if (scrollSnapEl.value) {
      getScrollableChildren(scrollSnapEl.value).forEach(c => {
        c.classList.remove(CONFIG.CLASS_NAMES.SNAP_ITEM_ACTIVE)
      })
    }
  }
})

watch(() => scrollSnapEl.value?.children.length, async (newCount, oldCount) => {
  if (newCount !== undefined && oldCount !== undefined && newCount !== oldCount) {
    childrenCount.value = newCount
    if (resizeObserver) {
      cleanupObserver()
      await nextTick()
      setupObserver()
    }
  }
})
</script>

<template>
  <div
    ref="scrollSnapEl"
    v-bind="$attrs"
    :class="[
      CONFIG.CLASS_NAMES.SCROLL_SNAP,
      snapEnabled ? CONFIG.CLASS_NAMES.SNAP_ENABLED : CONFIG.CLASS_NAMES.SNAP_DISABLED,
      scaleEnabled ? CONFIG.CLASS_NAMES.SNAP_SCALE : CONFIG.CLASS_NAMES.SNAP_SCALE_DISABLED,
    ]"
  >
    <slot />
  </div>
</template>

<style scoped>
.scroll-snap {
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  touch-action: pan-y;
}

.scroll-snap--enabled {
  scroll-snap-type: y mandatory;
}

.scroll-snap--paused {
  scroll-snap-type: none !important;
}

.scroll-snap--enabled :deep(> *) {
  scroll-snap-align: center;
  scroll-snap-stop: always;
}

.scroll-snap--disabled {
  scroll-snap-type: none;
}

.scroll-snap--scale::after {
  content: '';
  display: block;
  min-height: 50vh;
  flex: 0 0 50vh;
}

.scroll-snap--scale :deep(> *) {
  transform: scale(0.9);
  opacity: 0.3;
  transition: transform 300ms cubic-bezier(0.25, 0.1, 0.25, 1.0), opacity 300ms cubic-bezier(0.25, 0.1, 0.25, 1.0);
}

.scroll-snap--scale :deep(> .snap-align-start) {
  scroll-snap-align: start !important;
  scroll-margin-top: 10vh;
}

.scroll-snap--scale :deep(> .snap-align-start:first-child) {
  scroll-margin-top: 0;
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