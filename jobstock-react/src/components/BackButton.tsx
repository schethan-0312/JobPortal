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
      className="btn btn-main btn-sm no-print"
      style={{
        position: "fixed",
        top: "90px",
        right: "20px",
        zIndex: 9999,
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        borderRadius: "50px",
        padding: "10px 20px"
      }}
      title="Go Back"
    >
      <i className="bi bi-arrow-left"></i> Back
    </button>
  );
}
