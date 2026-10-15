import React from "react";
import { useSite } from "../../lib/SiteContext";

/**
 * The site's brand mark. Shows the uploaded logo if there is one, otherwise
 * the initial of the site name in a coloured square. One component so the
 * three different places that render the mark stay in sync.
 *
 * `variant` picks the class names to use for layout, since Header, Footer,
 * Auth, and the admin sidebar each size the badge differently.
 */
export default function BrandMark({ variant = "default", className = "" }) {
  const site = useSite();
  const initial = (site.name?.[0] || "T").toUpperCase();

  return (
    <span className={`brand-mark brand-mark--${variant} ${className}`}>
      {site.logo ? (
        <img src={site.logo} alt={site.name} className="brand-mark__img" />
      ) : (
        <span className="brand-mark__badge">{initial}</span>
      )}
      <span className="brand-mark__text">{site.name.toUpperCase()}</span>
    </span>
  );
}
