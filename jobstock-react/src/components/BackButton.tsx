"use client";

import { useRouter, usePathname } from "next/navigation";

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  // Don't show back button on home page
  if (pathname === "/") return null;

  return (
    <button
      onClick={() => router.back()}
      className="btn btn-main btn-sm no-print back-button-floating"
      title="Go Back"
    >
      <i className="bi bi-arrow-left"></i> Back
    </button>
  );
}
