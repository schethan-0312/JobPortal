"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

export default function ApplyBox({ jobId }: { jobId: string }) {
  const { user, loading } = useAuth();
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [coverNote, setCoverNote] = useState("");

  if (loading) {
    return (
      <button type="button" className="btn btn-md btn-main" disabled>
        Loading...
      </button>
    );
  }

  if (!user || user.role !== "CANDIDATE") {
    return (
      <div className="d-flex align-items-center flex-wrap gap-2">
        <span className="text-sm-muted">Log in as a candidate to apply.</span>
        <button type="button" className="btn btn-md btn-main" data-bs-toggle="modal" data-bs-target="#login">
          Log In
        </button>
        <a href="/signup" className="btn btn-md btn-gray">
          Sign Up
        </a>
      </div>
    );
  }

  async function handleApply() {
    setApplying(true);
    setMessage(null);
    try {
      await api.post("/applications", { jobId, coverNote: coverNote || undefined });
      setApplied(true);
      setMessage("Application submitted successfully.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setApplied(true);
        setMessage("You have already applied to this job.");
      } else if (err instanceof ApiError && err.status === 404) {
        setMessage("This job no longer exists.");
      } else {
        setMessage(err instanceof Error ? err.message : "Failed to apply. Please try again.");
      }
    } finally {
      setApplying(false);
    }
  }

  return (
    <div>
      <div className="d-flex align-items-center flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-md btn-main"
          onClick={handleApply}
          disabled={applying || applied}
        >
          {applied ? "Applied ✓" : applying ? "Applying..." : "Apply Now"}
        </button>
      </div>
      {!applied && (
        <div className="mt-2">
          <textarea
            className="form-control"
            placeholder="Cover note (optional)"
            value={coverNote}
            onChange={(e) => setCoverNote(e.target.value)}
            rows={3}
          />
        </div>
      )}
      {message && <p className={`mt-2 mb-0 ${applied ? "text-success" : "text-danger"}`}>{message}</p>}
    </div>
  );
}
