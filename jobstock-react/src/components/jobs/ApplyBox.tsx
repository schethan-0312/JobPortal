"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

export default function ApplyBox({ jobId }: { jobId: string }) {
  const { user, loading } = useAuth();
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [coverNote, setCoverNote] = useState("");

  useEffect(() => {
    if (user && user.role === "CANDIDATE") {
      api.get<any[]>(`/candidates/saved-jobs?t=${Date.now()}`, { cache: "no-store" }).then(jobs => {
        if (jobs.some(j => j.jobId === jobId)) {
          setSaved(true);
        }
      }).catch(err => {
        console.error("Failed to fetch saved jobs", err);
      });

      api.get<any[]>(`/applications/mine?t=${Date.now()}`, { cache: "no-store" }).then(apps => {
        if (apps.some(a => a.jobId === jobId)) {
          setApplied(true);
        }
      }).catch(err => {
        console.error("Failed to fetch applications", err);
      });
    }
  }, [user, jobId]);

  if (loading) {
    return (
      <button type="button" className="btn btn-md btn-main" disabled>
        Loading...
      </button>
    );
  }

  if (user && user.role === "EMPLOYER") {
    return (
      <div className="d-flex align-items-center flex-wrap gap-2">
        <span className="text-muted">Employers cannot apply for jobs.</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="d-flex align-items-center flex-wrap gap-2">
        <span className="text-sm-muted">Log in as a candidate to apply.</span>
        <button type="button" className="btn btn-md btn-main" data-bs-toggle="modal" data-bs-target="#login">
          Log In
        </button>
        <a href="/signup" className="btn btn-md btn-gray">
          Sign Up
        </a>
        <button type="button" className="btn btn-md btn-light" data-bs-toggle="modal" data-bs-target="#login">
          <i className="fa-regular fa-bookmark me-2"></i> Save Job
        </button>
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

  async function handleToggleSave() {
    setSaving(true);
    setMessage(null);
    try {
      if (saved) {
        await api.delete(`/candidates/saved-jobs/${jobId}`);
        setSaved(false);
        setMessage("Job removed from saved jobs.");
      } else {
        await api.post(`/candidates/saved-jobs/${jobId}`, {});
        setSaved(true);
        setMessage("Job saved successfully.");
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && !saved) {
        setSaved(true);
        setMessage("You have already saved this job.");
      } else {
        setMessage(err instanceof Error ? err.message : "Failed to update saved job. Please try again.");
      }
    } finally {
      setSaving(false);
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
          {applied ? "Applied" : applying ? "Applying..." : "Apply Now"}
        </button>
        <button 
          type="button" 
          className="btn btn-md btn-light"
          onClick={handleToggleSave}
          disabled={saving}
        >
          {saved ? (
            <><i className="fa-solid fa-bookmark me-2 text-main"></i> Saved</>
          ) : saving ? (
            <><i className="fa-regular fa-bookmark me-2"></i> Saving...</>
          ) : (
            <><i className="fa-regular fa-bookmark me-2"></i> Save Job</>
          )}
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
      {message && <p className={`mt-2 mb-0 ${message.includes("Failed") ? "text-danger" : "text-success"}`}>{message}</p>}
    </div>
  );
}
