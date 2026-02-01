import { useEventListener, useTimeoutFn } from "@vueuse/core";
import { useSpring } from "motion-v";
import { onMounted, onUnmounted, ref, watch } from "vue";
import type { CursorMeta, CursorObject, SmoothCursorProps } from "./cursorTypes";
import { findSemanticClickable, resolveCursorMeta } from "./cursorRegistry";

interface Position {
  x: number;
  y: number;
}

interface HoverResolution {
  meta: CursorMeta;
  element: Element;
}

export function useSmoothCursor(props: SmoothCursorProps) {
  const isMoving = ref(false);
  const isPressing = ref(false);
  const isHoveringClickable = ref(false);
  const cursorVariant = ref<string | null>(null);
  const cursorObject = ref<CursorObject | null>(null);
  const hasPointer = ref(false);

  const cursorX = useSpring(0, props.springConfig);
  const cursorY = useSpring(0, props.springConfig);
  const rotation = useSpring(0, {
    ...props.springConfig,
    damping: 60,
    stiffness: 300,
  });

  const lastPointerPos = ref<Position>({ x: 0, y: 0 });
  const lastMousePos = ref<Position>({ x: 0, y: 0 });
  const velocity = ref<Position>({ x: 0, y: 0 });
  const lastUpdateTime = ref(Date.now());
  const previousAngle = ref(0);
  const accumulatedRotation = ref(0);
  const hoverElement = ref<Element | null>(null);

  const { start: stopMovingSoon } = useTimeoutFn(
    () => {
      isMoving.value = false;
    },
    150,
    { immediate: false }
  );

  function updateVelocity(currentPos: Position) {
    const currentTime = Date.now();
    const deltaTime = currentTime - lastUpdateTime.value;

    if (deltaTime > 0) {
      velocity.value = {
        x: (currentPos.x - lastMousePos.value.x) / deltaTime,
        y: (currentPos.y - lastMousePos.value.y) / deltaTime,
      };
    }

    lastUpdateTime.value = currentTime;
    lastMousePos.value = currentPos;
  }

  function initializePointerState(currentPos: Position) {
    if (!hasPointer.value) {
      hasPointer.value = true;
      lastPointerPos.value = currentPos;
      lastMousePos.value = currentPos;
      lastUpdateTime.value = Date.now();
      cursorX.set(currentPos.x);
      cursorY.set(currentPos.y);
      refreshHoverFromPoint();
      return;
    }
    lastPointerPos.value = currentPos;
  }

  function resetRotationState() {
    rotation.set(0);
    previousAngle.value = 0;
    accumulatedRotation.value = 0;
  }

  function updateRotation(speed: number) {
    if (props.disableRotation) {
      resetRotationState();
      return;
    }

    if (speed <= 0.1) return;

    const currentAngle = Math.atan2(velocity.value.y, velocity.value.x) * (180 / Math.PI) + 90;
    let angleDiff = currentAngle - previousAngle.value;
    if (angleDiff > 180) angleDiff -= 360;
    if (angleDiff < -180) angleDiff += 360;
    accumulatedRotation.value += angleDiff;
    rotation.set(accumulatedRotation.value);
    previousAngle.value = currentAngle;
  }

  function applyHover(meta: CursorMeta, element: Element) {
    hoverElement.value = element;
    isHoveringClickable.value = Boolean(meta.clickable);
    cursorVariant.value = meta.variant ?? null;
    cursorObject.value = meta.object ?? null;
  }

  function clearHover() {
    hoverElement.value = null;
    isHoveringClickable.value = false;
    cursorVariant.value = null;
    cursorObject.value = null;
  }

  function resolveHoverFromElement(target: Element | null): HoverResolution | null {
    if (!target) return null;
    const resolved = resolveCursorMeta(target);
    if (resolved.element && resolved.meta) {
      return { meta: resolved.meta, element: resolved.element };
    }
    const clickable = findSemanticClickable(target);
    if (clickable) {
      return { meta: { clickable: true }, element: clickable };
    }
    return null;
  }

  function refreshHoverFromPoint() {
    const { x, y } = lastPointerPos.value;
    const elementAtPointer = document.elementFromPoint(x, y);
    const resolved = resolveHoverFromElement(elementAtPointer);
    if (resolved) {
      if (hoverElement.value !== resolved.element) {
        applyHover(resolved.meta, resolved.element);
      }
    } else {
      clearHover();
    }
  }

  function handlePointerMove(event: PointerEvent) {
    const currentPos = { x: event.clientX, y: event.clientY };
    initializePointerState(currentPos);
    updateVelocity(currentPos);

    const speed = Math.sqrt(velocity.value.x ** 2 + velocity.value.y ** 2);

    cursorX.set(currentPos.x);
    cursorY.set(currentPos.y);
    updateRotation(speed);

    if (speed > 0.1) {
      isMoving.value = true;
      stopMovingSoon();
    }
  }

  function handlePointerOver(event: PointerEvent) {
    initializePointerState({ x: event.clientX, y: event.clientY });
    const resolved = resolveHoverFromElement(event.target as Element | null);
    if (!resolved) {
      clearHover();
      return;
    }

    if (hoverElement.value === resolved.element) return;
    applyHover(resolved.meta, resolved.element);
  }

  function handlePointerOut(event: PointerEvent) {
    if (!hoverElement.value) return;
    const relatedTarget = event.relatedTarget as Node | null;
    if (relatedTarget && hoverElement.value.contains(relatedTarget)) return;
    clearHover();
  }

  function handlePointerDown(event: PointerEvent) {
    initializePointerState({ x: event.clientX, y: event.clientY });
    isPressing.value = true;
  }

  function handlePointerUp() {
    isPressing.value = false;
  }

  function handleBlur() {
    isPressing.value = false;
    clearHover();
  }

  onMounted(() => {
    document.body.style.cursor = "none";
  });

  useEventListener(window, "pointermove", handlePointerMove, { passive: true });
  useEventListener(document, "pointerover", handlePointerOver, { passive: true });
  useEventListener(document, "pointerout", handlePointerOut, { passive: true });
  useEventListener(window, "pointerdown", handlePointerDown, { passive: true });
  useEventListener(window, "pointerup", handlePointerUp, { passive: true });
  useEventListener(window, "blur", handleBlur);
  useEventListener(window, "scroll", refreshHoverFromPoint, { passive: true, capture: true });

  watch(
    () => props.disableRotation,
    (disabled) => {
      if (disabled) {
        resetRotationState();
      }
    }
  );

  onUnmounted(() => {
    document.body.style.cursor = "default";
  });

  return {
    cursorX,
    cursorY,
    rotation,
    isMoving,
    isPressing,
    isHoveringClickable,
    cursorVariant,
    cursorObject,
    hasPointer,
  };
}
