"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function NavigationInitializer() {
  const pathname = usePathname();

  useEffect(() => {
    // Re-initialize the navigation plugin when the route changes
    if (typeof window !== "undefined") {
      // Remove scroll locks and leftover overlays on navigation
      document.body.classList.remove("no-scroll");
      
      const $ = (window as any).jQuery;
      if ($ && $.fn.navigation) {
        // Destroy existing instance if possible or simply re-init
        // Clean up previous elements added by the plugin to avoid duplicates
        $(".nav-menus-wrapper-close-button").remove();
        $(".nav-search-close-button").remove();
        $(".nav-overlay-panel").remove();
        
        // Remove old data to force re-initialization
        $("#navigation").removeData("navigation");
        
        // Re-initialize
        $("#navigation").navigation();
      }
    }
  }, [pathname]);

  return null;
}
