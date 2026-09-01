"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function NavigationInitializer() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Remove scroll locks and leftover overlays on navigation
    document.body.classList.remove("no-scroll");

    const $ = (window as any).jQuery;
    if ($ && $.fn.navigation && $("#navigation").length > 0) {
      $(".nav-menus-wrapper-close-button").remove();
      $(".nav-search-close-button").remove();
      $(".nav-overlay-panel").remove();
      $(".submenu-indicator").remove();
      $("#navigation").removeData("navigation");
      $("#navigation").navigation({
        submenuIndicator: false,
      });
    }
  }, [pathname]);

  return null;
}
