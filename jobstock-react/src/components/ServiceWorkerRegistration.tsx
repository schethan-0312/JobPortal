"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Chrome only checks for a new sw.js on its own roughly once every 24
        // hours, so a returning visitor could be stuck on a stale worker (and
        // therefore stale cached assets) for a full day after a deploy. Force
        // an update check on every page load and whenever the tab regains
        // focus, so a new version is picked up on the very next visit instead.
        registration.update().catch(() => {});
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            registration.update().catch(() => {});
          }
        });

        // Once a genuinely *new* worker (not the first-ever install) has
        // activated, reload so the fresh assets it now serves take effect
        // immediately rather than only on the visit after next. Guarded on
        // an existing controller so a brand-new visitor's first install
        // doesn't trigger a pointless reload.
        const isUpdate = !!navigator.serviceWorker.controller;
        if (isUpdate) {
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            newWorker?.addEventListener("statechange", () => {
              if (newWorker.state === "activated") {
                window.location.reload();
              }
            });
          });
        }
      })
      .catch(() => {
        // Installability/offline shell is a progressive enhancement — a failed
        // registration (e.g. unsupported browser) should never break the app.
      });
  }, []);

  return null;
}
