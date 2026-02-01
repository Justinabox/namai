import type { CursorMeta } from "./cursorTypes";

const cursorMetaMap = new WeakMap<Element, CursorMeta>();

const CLICKABLE_SELECTOR =
  'button, a[href], input[type="button"], input[type="submit"], input[type="reset"], input[type="checkbox"], input[type="radio"], input[type="file"], select, textarea, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [data-cursor], .cursor-pointer';

export function setCursorMeta(element: Element, meta: CursorMeta) {
  cursorMetaMap.set(element, meta);
}

export function clearCursorMeta(element: Element) {
  cursorMetaMap.delete(element);
}

export function resolveCursorMeta(target: Element | null) {
  for (let node = target; node; node = node.parentElement) {
    const meta = cursorMetaMap.get(node);
    if (meta) {
      return { meta, element: node };
    }
  }
  return { meta: null, element: null };
}

export function findSemanticClickable(target: Element | null) {
  if (!target) return null;
  return target.closest(CLICKABLE_SELECTOR);
}
