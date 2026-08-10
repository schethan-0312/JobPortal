"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface QuickApplyButtonProps {
  jobId: string;
  className?: string;
}

export default function QuickApplyButton({ jobId, className = "btn btn-md btn-main px-4" }: QuickApplyButtonProps) {
  const { user } = useAuth();
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (user && user.role === "CANDIDATE") {
      api.get<any[]>(`/applications/mine?t=${Date.now()}`, { cache: "no-store" })
        .then((apps) => {
          if (apps.some((a) => a.jobId === jobId)) {
            setApplied(true);
          }
        })
        .catch(() => {});
    }
  }, [user, jobId]);

  async function handleQuickApply(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!user || user.role !== "CANDIDATE") {
      const loginBtn = document.querySelector<HTMLElement>('[data-bs-target="#login"]');
      if (loginBtn) {
        loginBtn.click();
      } else {
        window.location.href = "/signup";
      }
      return;
    }

    if (applied || applying) return;

    setApplying(true);
    try {
      await api.post("/applications", { jobId });
      setApplied(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setApplied(true);
      } else {
        alert(err instanceof Error ? err.message : "Failed to apply.");
      }
    } finally {
      setApplying(false);
    }
  }

  if (applied) {
    return (
      <button type="button" className="btn btn-md btn-success px-4" disabled style={{ opacity: 0.9 }}>
        <i className="fa-solid fa-check me-1"></i> Applied
      </button>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handleQuickApply}
      disabled={applying}
    >
      {applying ? "Applying..." : "Quick Apply"}
    </button>
  );
}
