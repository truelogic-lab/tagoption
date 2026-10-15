import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SiteProvider } from "./lib/SiteContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SiteProvider>
      <App />
    </SiteProvider>
  </React.StrictMode>
);
