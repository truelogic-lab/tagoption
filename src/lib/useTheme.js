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
 * App-shell theme. The preference is read on mount and written back to
 * localStorage on change, but the DOM attribute is not touched here — the
 * app shell applies [data-theme] to its own root, so landing pages and the
 * auth screen stay on the document's light default.
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
