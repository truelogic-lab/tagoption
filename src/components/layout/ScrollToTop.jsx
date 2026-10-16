import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets the scroll position on every route change.
 *
 * Without this, tapping a footer link from halfway down a page lands you at
 * the same scroll offset on the new page — halfway through the content, past
 * the heading. React Router preserves scroll by default; SPA behaviour needs
 * to override it.
 *
 * Two exceptions preserved deliberately:
 *  - Hash anchors (#section) still scroll to their target.
 *  - In-page query-string changes do not scroll (filters, pagination on the
 *    same route).
 */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // A hash means the user asked to jump to a specific section — let the
    // browser handle it rather than yanking to the top.
    if (hash) return;

    // scrollTo with instant behaviour rather than smooth — a smooth scroll
    // that races the new content loading looks janky. Instant is correct.
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } catch {
      // Older browsers without scrollTo options.
      window.scrollTo(0, 0);
    }
  }, [pathname, search, hash]);

  return null;
}
