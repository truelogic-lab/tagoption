import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getSession, isAuthenticated } from "../../lib/auth";
import { authApi } from "../../lib/api";

/**
 * Admin route guard.
 *
 * Two checks, because one isn't sufficient:
 *
 *   1. A synchronous check against the local session so a regular logged-in
 *      user is redirected before any admin component mounts. Without this
 *      there's a flash of the admin shell.
 *
 *   2. An async call to /auth/me so a tampered localStorage entry — someone
 *      setting their own `role` to "admin" in devtools — is caught. Without
 *      this, a user can see the empty admin UI and the pages' error toasts.
 *
 * The server's require_admin is the real gate. This guard is about not
 * rendering admin chrome to someone who isn't an admin.
 */
export default function RequireAdmin({ children }) {
  const location = useLocation();
  const session = getSession();
  const [verified, setVerified] = useState(null); // null = pending, bool = result

  const localAdmin = session?.user?.role === "admin";

  useEffect(() => {
    if (!isAuthenticated() || !localAdmin) return;
    let cancelled = false;
    (async () => {
      try {
        const me = await authApi.me();
        if (!cancelled) setVerified(me?.role === "admin");
      } catch {
        if (!cancelled) setVerified(false);
      }
    })();
    return () => { cancelled = true; };
  }, [localAdmin]);

  if (!isAuthenticated()) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (!localAdmin) {
    return <Navigate to="/trade" replace />;
  }

  // Rendering nothing while we confirm avoids showing the admin shell to
  // someone whose local role was edited. The blank frame is one network
  // round-trip — less than the admin page's own data loads.
  if (verified === null) return null;
  if (verified === false) return <Navigate to="/trade" replace />;

  return children;
}
