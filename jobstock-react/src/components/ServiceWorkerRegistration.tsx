"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installability/offline shell is a progressive enhancement — a failed
        // registration (e.g. unsupported browser) should never break the app.
      });
    }
  }, []);

  return null;
}
