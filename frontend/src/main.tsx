import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { msalInstance } from "./authConfig";
import "./index.css";

async function bootstrap() {
  try {
    // 🔑 IMPORTANT: initialize MSAL before any other MSAL API calls
    await msalInstance.initialize();

    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error("Root element #root not found");
    }

    const root = ReactDOM.createRoot(rootElement);

    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error("Failed to initialize MSAL or render app:", err);
  }
}

bootstrap();
