import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

try {
  const stored = localStorage.getItem("tagoption.theme");
  document.documentElement.setAttribute(
    "data-theme",
    stored === "light" ? "light" : "dark"
  );
} catch {
  document.documentElement.setAttribute("data-theme", "dark");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
