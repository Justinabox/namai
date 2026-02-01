import { defineNuxtPlugin } from "#app";
import type { CursorMeta } from "~/components/ui/smooth-cursor/cursorTypes";
import { clearCursorMeta, setCursorMeta } from "~/components/ui/smooth-cursor/cursorRegistry";

type CursorBinding = CursorMeta | null | undefined;

function normalizeMeta(value: CursorBinding): CursorMeta | null {
  if (!value) return null;
  return {
    clickable: Boolean(value.clickable),
    variant: value.variant ?? null,
    object: value.object ?? null,
  };
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive("cursor", {
    mounted(el, binding) {
      const meta = normalizeMeta(binding.value);
      if (meta) {
        setCursorMeta(el, meta);
      }
      if (meta?.clickable) {
        el.setAttribute("data-cursor", "");
      }
    },
    updated(el, binding) {
      const meta = normalizeMeta(binding.value);
      if (meta) {
        setCursorMeta(el, meta);
      } else {
        clearCursorMeta(el);
      }
      if (meta?.clickable) {
        el.setAttribute("data-cursor", "");
      } else {
        el.removeAttribute("data-cursor");
      }
    },
    unmounted(el) {
      clearCursorMeta(el);
      el.removeAttribute("data-cursor");
    },
  });
});
