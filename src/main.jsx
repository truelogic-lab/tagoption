import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SiteProvider } from "./lib/SiteContext";
import { loadSiteConfig } from "./lib/siteConfig";
import "./index.css";

// Kick off the config fetch immediately so it's usually resolved before
// React's first paint. Consumers fall back to defaults while it's pending.
loadSiteConfig();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SiteProvider>
      <App />
    </SiteProvider>
  </React.StrictMode>
);
