import React, { useEffect, useRef, useState } from "react";

/**
 * Fades + slides content in when it enters the viewport.
 * `delay` = ms. `as` = wrapper tag. `y` = px offset. Runs once.
 */
export default function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  y = 16,
  className = "",
  ...rest
}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${shown ? "is-in" : ""} ${className}`.trim()}
      style={{
        transitionDelay: `${delay}ms`,
        "--reveal-y": `${y}px`,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
