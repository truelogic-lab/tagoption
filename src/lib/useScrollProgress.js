import { useEffect, useState } from "react";

export function useScrollProgress(range = 700) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const motionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    let frame = 0;

    const update = () => {
      frame = 0;

      if (motionQuery.matches) {
        setProgress(0);
        return;
      }

      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop ||
        0;

      const next = Math.min(
        1,
        Math.max(0, scrollTop / Math.max(1, range))
      );

      setProgress((previous) =>
        Math.abs(previous - next) < 0.002 ? previous : next
      );
    };

    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", scheduleUpdate, {
      passive: true,
    });

    window.addEventListener("resize", scheduleUpdate);
    motionQuery.addEventListener?.("change", scheduleUpdate);

    update();

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      motionQuery.removeEventListener?.("change", scheduleUpdate);

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [range]);

  return progress;
}
