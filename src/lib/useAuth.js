import { useEffect, useState } from "react";
import { getSession, clearSession } from "./auth";

export function useAuth() {
  const [session, setSession] = useState(() => getSession());

  useEffect(() => {
    const sync = () => setSession(getSession());
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const logout = () => {
    clearSession();
    setSession(null);
  };

  return { session, isAuthenticated: Boolean(session), logout };
}
