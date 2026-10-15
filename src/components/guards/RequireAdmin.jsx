import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getSession, isAuthenticated } from "../../lib/auth";
import { authApi } from "../../lib/api";

/**
 * Admin route guard.
 *
 *  1. Synchronous local check — no session → /auth. Session but role != admin
 *     → /trade. This catches the common cases without a network round-trip.
 *
 *  2. Async verification against /auth/me, capped with a short timeout. If the
 *     server confirms non-admin, redirect. If it doesn't respond in time, fall
 *     through and let the page render — the API's require_admin still blocks
 *     every admin endpoint, so a non-admin who slips through the guard sees
 *     empty pages, not data. A blank white screen on a cold Render start is
 *     worse than a page that renders and shows empty.
 */
const VERIFY_TIMEOUT_MS = 4000;

export default function RequireAdmin({ children }) {
  const location = useLocation();
  const session = getSession();
  const [verified, setVerified] = useState(null); // null | true | false

  const localAdmin = session?.user?.role === "admin";

  useEffect(() => {
    if (!isAuthenticated() || !localAdmin) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) setVerified(true);   // fail open — see comment above
    }, VERIFY_TIMEOUT_MS);

    (async () => {
      try {
        const me = await authApi.me();
        if (cancelled) return;
        clearTimeout(timer);
        setVerified(me?.role === "admin");
      } catch {
        if (cancelled) return;
        clearTimeout(timer);
        // Network error is not the same as "not an admin". Fail open — the
        // API will still 403 every admin endpoint if the user is lying.
        setVerified(true);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [localAdmin]);

  if (!isAuthenticated()) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (!localAdmin) {
    return <Navigate to="/trade" replace />;
  }

  if (verified === false) return <Navigate to="/trade" replace />;

  // verified === true OR still pending. Render the children either way so the
  // admin shell shows immediately; the API is the actual gate.
  return children;
}
