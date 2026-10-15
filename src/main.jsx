import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SiteProvider } from "./lib/SiteContext";
import "./index.css";

// Migration: the old useTheme wrote data-theme on <html>, which leaked the
// app-shell theme into landing pages. Remove it once so returning users get
// the light document default. Safe to delete after a few releases.
try {
  document.documentElement.removeAttribute("data-theme");
} catch {}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SiteProvider>
      <App />
    </SiteProvider>
  </React.StrictMode>
);
