import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@web/index.css";
import "leaflet/dist/leaflet.css";
import App from "@web/App.tsx";
import { LanguageProvider } from "@web/context/LanguageContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>
);
