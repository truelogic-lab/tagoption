import { useCallback, useEffect, useState } from "react";

const KEY = "tagoption.theme";

function readInitial() {
  if (typeof document === "undefined") return "dark";
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {}
  return "dark";
}

/**
 * App-shell theme. The stored preference is read on mount and reflected
 * back into localStorage on change, but the DOM attribute is *not* written
 * here — it's applied to the `.app` root by AppLayout, so landing pages and
 * the auth screen stay in the document's default light theme.
 */
export function useTheme() {
  const [theme, setTheme] = useState(readInitial);

  useEffect(() => {
    try { localStorage.setItem(KEY, theme); } catch {}
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  return { theme, setTheme, toggle, isDark: theme === "dark" };
}
