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

export function useTheme() {
  const [theme, setTheme] = useState(readInitial);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(KEY, theme); } catch {}
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  return { theme, setTheme, toggle, isDark: theme === "dark" };
}
