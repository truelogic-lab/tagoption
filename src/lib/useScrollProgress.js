import { useEffect, useState } from "react";

/**
 * Returns 0..1 representing how far the user has scrolled through the
 * first `range` pixels of the page. 0 = top of page, 1 = scrolled `range`
 * pixels or more.
 *
 * Uses requestAnimationFrame to coalesce scroll events — the browser fires
 * scroll at ~60Hz on desktop, faster on high-refresh displays, and we don't
 * want a state update per event. The rAF loop runs while the component is
 * mounted; the work per frame is one getBoundingClientRect + one setState.
 */
export function useScrollProgress(range = 600) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = null;
    let last = -1;

    const tick = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      const next = Math.max(0, Math.min(1, y / range));
      if (Math.abs(next - last) > 0.001) {
        last = next;
        setProgress(next);
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [range]);

  return progress;
}
