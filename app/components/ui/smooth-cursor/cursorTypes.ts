import type { Transition } from "motion-v";

export interface CursorObject {
  title?: string;
  descp?: string;
  icon?: string;
  image?: string;
  [key: string]: unknown;
}

export interface CursorMeta {
  clickable?: boolean;
  variant?: string | null;
  object?: CursorObject | null;
}

export interface SmoothCursorProps {
  springConfig?: {
    damping: number;
    stiffness: number;
    mass: number;
    restDelta: number;
  };
  disableRotation?: boolean;
}

export interface CursorVariantMotion {
  initial?: Record<string, number>;
  animate?: Record<string, number>;
  exit?: Record<string, number>;
  transition?: Transition;
}
