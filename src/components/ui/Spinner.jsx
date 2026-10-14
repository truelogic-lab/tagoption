import React from "react";

export default function Spinner({ size = "md", tone }) {
  const cls = ["spinner", `spinner--${size}`, tone && `spinner--${tone}`]
    .filter(Boolean)
    .join(" ");
  return <span className={cls} aria-label="Loading" role="status" />;
}
