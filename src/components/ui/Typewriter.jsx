import { useEffect, useState } from "react";

export default function Typewriter({
  text,
  speed = 90,
  holdMs = 1800,
  eraseMs = 55,
  gapMs = 500,
  className = "",
  as: Tag = "span",
}) {
  const [visible, setVisible] = useState("");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const updatePreference = () => {
      setReducedMotion(media.matches);
    };

    updatePreference();
    media.addEventListener?.("change", updatePreference);

    return () => {
      media.removeEventListener?.("change", updatePreference);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setVisible(text);
      return undefined;
    }

    let timeout;
    let index = 0;
    let deleting = false;

    setVisible("");

    const tick = () => {
      if (!deleting) {
        index += 1;
        setVisible(text.slice(0, index));

        if (index >= text.length) {
          timeout = window.setTimeout(() => {
            deleting = true;
            tick();
          }, holdMs);
          return;
        }

        timeout = window.setTimeout(tick, speed);
        return;
      }

      index -= 1;
      setVisible(text.slice(0, Math.max(0, index)));

      if (index <= 0) {
        deleting = false;
        timeout = window.setTimeout(tick, gapMs);
        return;
      }

      timeout = window.setTimeout(tick, eraseMs);
    };

    timeout = window.setTimeout(tick, speed);

    return () => window.clearTimeout(timeout);
  }, [text, speed, holdMs, eraseMs, gapMs, reducedMotion]);

  return (
    <Tag
      className={`tw ${className}`.trim()}
      aria-label={text}
    >
      <span aria-hidden="true">{visible}</span>

      {!reducedMotion && (
        <span className="tw__caret" aria-hidden="true" />
      )}
    </Tag>
  );
}
