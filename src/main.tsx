import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { useAppStore } from "./stores/useAppStore";

if (typeof window !== "undefined") {
  (window as any).__appStore = useAppStore;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
