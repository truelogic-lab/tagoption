import React, { useEffect, useState } from "react";
import { useSite } from "../../lib/SiteContext";

/**
 * The site's brand mark. Shows the uploaded logo if there is one and it
 * loads, otherwise the initial of the site name in a coloured square.
 *
 * The `failed` flag handles the case where a logo URL is set but the image
 * 404s or can't decode — without it, the browser renders a broken image
 * icon next to the site name. The moment the image errors, we swap to the
 * badge and stay there.
 */
export default function BrandMark({ variant = "default", className = "" }) {
  const site = useSite();
  const initial = (site.name?.[0] || "T").toUpperCase();
  const [failed, setFailed] = useState(false);

  // If the logo URL changes, give the new one a chance before falling back.
  useEffect(() => {
    setFailed(false);
  }, [site.logo]);

  const showImage = Boolean(site.logo) && !failed;

  return (
    <span className={`brand-mark brand-mark--${variant} ${className}`}>
      {showImage ? (
        <img
          src={site.logo}
          alt={site.name}
          className="brand-mark__img"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="brand-mark__badge">{initial}</span>
      )}
      <span className="brand-mark__text">{site.name.toUpperCase()}</span>
    </span>
  );
}
