import React from "react";

/**
 * Minimal CSS spinner. Sizes: "sm" (14px), "md" (18px), "lg" (24px).
 * Inherits text color unless `tone` is set.
 */
export default function Spinner({ size = "md", tone }) {
  const cls = ["spinner", `spinner--${size}`, tone && `spinner--${tone}`]
    .filter(Boolean)
    .join(" ");
  return <span className={cls} aria-label="Loading" role="status" />;
}
