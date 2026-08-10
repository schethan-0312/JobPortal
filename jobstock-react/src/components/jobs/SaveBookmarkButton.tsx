"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface SaveBookmarkButtonProps {
  jobId: string;
}

export default function SaveBookmarkButton({ jobId }: SaveBookmarkButtonProps) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.role === "CANDIDATE") {
      api.get<any[]>(`/candidates/saved-jobs?t=${Date.now()}`, { cache: "no-store" })
        .then((savedJobs) => {
          if (savedJobs.some((s) => s.jobId === jobId)) {
            setSaved(true);
          }
        })
        .catch(() => {});
    }
  }, [user, jobId]);

  async function handleToggleSave(e: React.MouseEvent) {
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

    if (loading) return;

    setLoading(true);
    try {
      if (saved) {
        await api.delete(`/candidates/saved-jobs/${jobId}`);
        setSaved(false);
      } else {
        await api.post(`/candidates/saved-jobs/${jobId}`, {});
        setSaved(true);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && !saved) {
        setSaved(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className="bkrs border-0 bg-transparent p-0"
      onClick={handleToggleSave}
      disabled={loading}
      title={saved ? "Unsave Job" : "Save Job"}
      style={{ cursor: "pointer" }}
    >
      <i className={`fa-${saved ? "solid text-main" : "regular text-muted"} fa-bookmark fs-5`}></i>
    </button>
  );
}
