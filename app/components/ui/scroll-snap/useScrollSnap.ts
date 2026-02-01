import type { Ref } from "vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";

const CONFIG = {
  SNAP_PAUSE_THRESHOLD: 24,
  TOP_POSITION_THRESHOLD: 30,
  OVERSIZE_THRESHOLD: 2,
  CLASS_NAMES: {
    SCROLL_SNAP: "scroll-snap",
    SNAP_ENABLED: "scroll-snap--enabled",
    SNAP_DISABLED: "scroll-snap--disabled",
    SNAP_SCALE: "scroll-snap--scale",
    SNAP_SCALE_DISABLED: "scroll-snap--scale-disabled",
    SNAP_PAUSED: "scroll-snap--paused",
    SNAP_OVERSIZE: "snap-oversize",
    SNAP_ALIGN_START: "snap-align-start",
    SNAP_ITEM_ACTIVE: "scroll-snap__item--active",
  },
} as const;

interface ScrollSnapOptions {
  disableSnapBelowMd?: boolean;
  mdBreakpointPx?: number;
}

export function useScrollSnap(containerRef: Ref<HTMLDivElement | null>, options: ScrollSnapOptions) {
  const isMdUp = ref(true);
  const activeItem = ref<HTMLElement | null>(null);
  const children = shallowRef<HTMLElement[]>([]);

  const snapEnabled = computed(() => !(options.disableSnapBelowMd && !isMdUp.value));
  const scaleEnabled = computed(() => !(options.disableSnapBelowMd && !isMdUp.value));

  let mql: MediaQueryList | null = null;
  let mqlHandler: ((e: MediaQueryListEvent) => void) | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let mutationObserver: MutationObserver | null = null;
  let measureRaf = 0;
  let scrollRaf = 0;
  let isObserving = false;

  function getScrollableChildren(container: HTMLElement): HTMLElement[] {
    return Array.from(container.children).filter((el) => {
      const element = el as HTMLElement;
      if (element.tagName === "STYLE" || element.tagName === "SCRIPT") return false;
      if (typeof window === "undefined") return true;
      const style = window.getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") return false;
      if (element.offsetHeight === 0 || element.offsetWidth === 0) return false;
      return true;
    }) as HTMLElement[];
  }

  function refreshChildren() {
    if (!containerRef.value) {
      children.value = [];
      return;
    }
    children.value = getScrollableChildren(containerRef.value);
  }

  function updateActiveClasses(activeChild: HTMLElement | null): void {
    children.value.forEach((child) => {
      if (child === activeChild) {
        child.classList.add(CONFIG.CLASS_NAMES.SNAP_ITEM_ACTIVE);
      } else {
        child.classList.remove(CONFIG.CLASS_NAMES.SNAP_ITEM_ACTIVE);
      }
    });
  }

  function handleTopPosition(container: HTMLElement): boolean {
    if (container.scrollTop >= CONFIG.TOP_POSITION_THRESHOLD) return false;
    children.value.forEach((child, index) => {
      if (index === 0) {
        child.classList.add(CONFIG.CLASS_NAMES.SNAP_ITEM_ACTIVE);
      } else {
        child.classList.remove(CONFIG.CLASS_NAMES.SNAP_ITEM_ACTIVE);
      }
    });
    activeItem.value = children.value[0] ?? null;
    return true;
  }

  function findOversizeItem(container: HTMLElement): HTMLElement | null {
    return (
      children.value.find((child) => {
        if (!child.classList.contains(CONFIG.CLASS_NAMES.SNAP_OVERSIZE)) return false;

        const viewTop = container.scrollTop;
        const viewBottom = viewTop + container.clientHeight;
        const childTop = child.offsetTop;
        const childBottom = childTop + child.offsetHeight;

        return viewTop >= childTop && viewBottom <= childBottom;
      }) ?? null
    );
  }

  function findClosestItem(containerRect: DOMRect, viewportCenter: number): HTMLElement | null {
    let closest: HTMLElement | null = null;
    let minDiff = Infinity;

    children.value.forEach((child) => {
      if (minDiff < 0) return;

      const rect = child.getBoundingClientRect();
      let diff = 0;

      if (child.classList.contains(CONFIG.CLASS_NAMES.SNAP_ALIGN_START)) {
        diff = Math.abs(rect.top);
      } else {
        const childCenter = rect.top + rect.height / 2;
        diff = Math.abs(childCenter - viewportCenter);
      }

      if (diff < minDiff) {
        minDiff = diff;
        closest = child;
      }
    });

    return closest;
  }

  function updateActiveItem(): void {
    const container = containerRef.value;
    if (!container || children.value.length === 0) return;

    const containerRect = container.getBoundingClientRect();
    const viewportCenter = containerRect.top + container.clientHeight / 2;

    if (handleTopPosition(container)) return;

    const oversizeItem = findOversizeItem(container);
    const closestItem = oversizeItem ?? findClosestItem(containerRect, viewportCenter);

    if (closestItem) {
      updateActiveClasses(closestItem);
      activeItem.value = closestItem;
    }
  }

  function updateChildSnapAlignments(child: HTMLElement, viewportHeight: number, halfViewport: number): void {
    const isOversize = child.offsetHeight >= viewportHeight - CONFIG.OVERSIZE_THRESHOLD;
    child.classList.toggle(CONFIG.CLASS_NAMES.SNAP_OVERSIZE, isOversize);

    const childCenter = child.offsetTop + child.offsetHeight / 2;
    const shouldAlignStart = isOversize || childCenter < halfViewport;
    child.classList.toggle(CONFIG.CLASS_NAMES.SNAP_ALIGN_START, shouldAlignStart);
  }

  function getEffectiveChildHeight(child: HTMLElement): number {
    if (typeof window === "undefined") return child.offsetHeight;
    const styles = window.getComputedStyle(child);
    const marginBottom = Number.parseFloat(styles.marginBottom || "0");
    return child.offsetHeight + (Number.isNaN(marginBottom) ? 0 : marginBottom);
  }

  function updateEndGap(container: HTMLElement, viewportHeight: number): void {
    if (!scaleEnabled.value) {
      container.style.setProperty("--scroll-snap-end-gap", "0px");
      return;
    }

    if (children.value.length === 0 || viewportHeight <= 0) {
      container.style.setProperty("--scroll-snap-end-gap", "0px");
      return;
    }

    const lastChild = children.value.at(-1);
    if (!lastChild) {
      container.style.setProperty("--scroll-snap-end-gap", "0px");
      return;
    }
    const isOversize = lastChild.classList.contains(CONFIG.CLASS_NAMES.SNAP_OVERSIZE);
    const isAlignStart = lastChild.classList.contains(CONFIG.CLASS_NAMES.SNAP_ALIGN_START);

    if (isOversize || isAlignStart) {
      container.style.setProperty("--scroll-snap-end-gap", "0px");
      return;
    }

    const effectiveHeight = getEffectiveChildHeight(lastChild);
    const gap = Math.max(0, (viewportHeight - effectiveHeight) / 2);
    container.style.setProperty("--scroll-snap-end-gap", `${gap}px`);
  }

  function updateSnapAlignments(): void {
    const container = containerRef.value;
    if (!container) return;
    const viewportHeight = container.clientHeight;
    const halfViewport = viewportHeight / 2;

    children.value.forEach((child) => {
      updateChildSnapAlignments(child, viewportHeight, halfViewport);
    });

    updateEndGap(container, viewportHeight);
  }

  function findOversizeInViewTop(viewTop: number): HTMLElement | null {
    return (
      children.value.find((child) => {
        if (!child.classList.contains(CONFIG.CLASS_NAMES.SNAP_OVERSIZE)) return false;

        const childTop = child.offsetTop;
        const childBottom = childTop + child.offsetHeight;
        return viewTop >= childTop && viewTop < childBottom;
      }) ?? null
    );
  }

  function updateSnapPause(): void {
    const container = containerRef.value;
    if (!container) return;

    if (!snapEnabled.value) {
      container.classList.remove(CONFIG.CLASS_NAMES.SNAP_PAUSED);
      return;
    }

    const viewTop = container.scrollTop;
    const oversizeInViewTop = findOversizeInViewTop(viewTop);

    if (!oversizeInViewTop) {
      container.classList.remove(CONFIG.CLASS_NAMES.SNAP_PAUSED);
      return;
    }

    const childTop = oversizeInViewTop.offsetTop;
    const isNearTop = viewTop <= childTop + CONFIG.SNAP_PAUSE_THRESHOLD;
    container.classList.toggle(CONFIG.CLASS_NAMES.SNAP_PAUSED, !isNearTop);
  }

  function scheduleMeasure() {
    if (measureRaf) return;
    measureRaf = window.requestAnimationFrame(() => {
      measureRaf = 0;
      refreshChildren();
      updateSnapAlignments();
      updateActiveItem();
      updateSnapPause();
    });
  }

  function scheduleScrollUpdate() {
    if (scrollRaf) return;
    scrollRaf = window.requestAnimationFrame(() => {
      scrollRaf = 0;
      updateActiveItem();
      updateSnapPause();
    });
  }

  function handleScroll() {
    scheduleScrollUpdate();
  }

  function handleLoadCapture() {
    scheduleMeasure();
  }

  function setupObservers() {
    const container = containerRef.value;
    if (!container || isObserving) return;
    isObserving = true;

    refreshChildren();
    scheduleMeasure();

    if (!resizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        scheduleMeasure();
      });
      resizeObserver.observe(container);
    }

    if (!mutationObserver) {
      mutationObserver = new MutationObserver(() => {
        scheduleMeasure();
      });
      mutationObserver.observe(container, { childList: true, subtree: false });
    }

    container.addEventListener("scroll", handleScroll, { passive: true });
    container.addEventListener("load", handleLoadCapture, { capture: true, passive: true });
  }

  function cleanupObservers() {
    const container = containerRef.value;
    if (container) {
      container.removeEventListener("scroll", handleScroll);
      container.removeEventListener("load", handleLoadCapture, { capture: true } as EventListenerOptions);
      container.classList.remove(CONFIG.CLASS_NAMES.SNAP_PAUSED);
    }

    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }

    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }

    if (measureRaf) {
      cancelAnimationFrame(measureRaf);
      measureRaf = 0;
    }

    if (scrollRaf) {
      cancelAnimationFrame(scrollRaf);
      scrollRaf = 0;
    }

    isObserving = false;
  }

  function clearActiveState() {
    const container = containerRef.value;
    if (!container) return;
    container.style.setProperty("--scroll-snap-end-gap", "0px");
    children.value.forEach((child) => {
      child.classList.remove(CONFIG.CLASS_NAMES.SNAP_ITEM_ACTIVE);
      child.classList.remove(CONFIG.CLASS_NAMES.SNAP_OVERSIZE);
      child.classList.remove(CONFIG.CLASS_NAMES.SNAP_ALIGN_START);
    });
  }

  function resetActive() {
    refreshChildren();
    updateActiveItem();
  }

  function scrollToTop(options: ScrollToOptions = { top: 0, behavior: "smooth" }) {
    containerRef.value?.scrollTo(options);
  }

  onMounted(async () => {
    if (typeof window === "undefined") return;

    mql = window.matchMedia(`(min-width: ${options.mdBreakpointPx ?? 768}px)`);
    isMdUp.value = mql.matches;

    mqlHandler = (event) => {
      isMdUp.value = event.matches;
    };

    if (mql.addEventListener) {
      mql.addEventListener("change", mqlHandler);
    } else if (mql.addListener) {
      mql.addListener(mqlHandler);
    }

    await nextTick();
    if (scaleEnabled.value) {
      setupObservers();
    }
  });

  onBeforeUnmount(() => {
    cleanupObservers();

    if (mql && mqlHandler) {
      if (mql.removeEventListener) {
        mql.removeEventListener("change", mqlHandler);
      } else if (mql.removeListener) {
        mql.removeListener(mqlHandler);
      }
    }
  });

  watch(scaleEnabled, async (enabled) => {
    if (enabled) {
      await nextTick();
      setupObservers();
    } else {
      cleanupObservers();
      clearActiveState();
    }
  });

  return {
    CONFIG,
    snapEnabled,
    scaleEnabled,
    resetActive,
    scrollToTop,
  };
}
