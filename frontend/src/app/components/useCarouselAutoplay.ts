// Lightweight auto-advance for the embla-based Carousel (no extra dependency).
// Pass the api from <Carousel setApi={...} /> and it will scrollNext() on an
// interval, pausing while the pointer is over the carousel and resuming after.
// Only advances when there is actually something to scroll to.

import { useEffect } from "react";
import type { CarouselApi } from "./ui/carousel";

export function useCarouselAutoplay(
  api: CarouselApi | undefined,
  options?: { delay?: number; enabled?: boolean }
) {
  const delay = options?.delay ?? 4000;
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!api || !enabled) return;
    // Respect the OS "reduce motion" setting — don't auto-advance.
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let timer: ReturnType<typeof setInterval> | null = null;
    let paused = false;

    const tick = () => {
      if (paused) return;
      // With loop enabled, scrollNext() wraps around on its own. When every
      // slide already fits (nothing to scroll), embla makes this a no-op.
      api.scrollNext();
    };

    const start = () => { if (!timer) timer = setInterval(tick, delay); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };

    const node = api.rootNode();
    const onEnter = () => { paused = true; };
    const onLeave = () => { paused = false; };
    node?.addEventListener("pointerenter", onEnter);
    node?.addEventListener("pointerleave", onLeave);
    // Pause briefly after a manual interaction so it doesn't fight the user.
    api.on("pointerDown", onEnter);
    api.on("pointerUp", onLeave);

    start();
    return () => {
      stop();
      node?.removeEventListener("pointerenter", onEnter);
      node?.removeEventListener("pointerleave", onLeave);
      api.off("pointerDown", onEnter);
      api.off("pointerUp", onLeave);
    };
  }, [api, delay, enabled]);
}
