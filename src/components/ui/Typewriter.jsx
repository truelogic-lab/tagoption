import { useEffect, useState } from "react";

/**
 * Types text out one character at a time, holds, erases, repeats.
 *
 * Renders the full string immediately under prefers-reduced-motion so
 * users who opted out of animation aren't shown an empty heading.
 */
export default function Typewriter({
  text,
  speed = 90,
  holdMs = 1800,
  eraseMs = 55,
  gapMs = 500,
  className = "",
  as: Tag = "span",
}) {
  const [visible, setVisible] = useState(text);
  const [phase, setPhase] = useState("hold");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setVisible(text);
      return;
    }

    let timer;
    if (phase === "hold") {
      timer = setTimeout(() => setPhase("erase"), holdMs);
    } else if (phase === "erase") {
      timer = setTimeout(
        () => (visible.length ? setVisible(visible.slice(0, -1)) : setPhase("type")),
        visible.length ? eraseMs : gapMs
      );
    } else if (phase === "type") {
      timer = setTimeout(
        () =>
          visible.length < text.length
            ? setVisible(text.slice(0, visible.length + 1))
            : setPhase("hold"),
        speed
      );
    }
    return () => clearTimeout(timer);
  }, [visible, phase, text, speed, holdMs, eraseMs, gapMs]);

  return (
    <Tag className={`tw ${className}`.trim()} aria-label={text}>
      <span aria-hidden="true">{visible}</span>
      <span className="tw__caret" aria-hidden="true" />
    </Tag>
  );
}
