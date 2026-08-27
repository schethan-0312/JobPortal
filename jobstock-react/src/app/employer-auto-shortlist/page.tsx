"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar8 from "@/components/Navbar8";
import EmployerSidebar from "@/components/employer-dashboard/EmployerSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface EmployerJob {
  id: string;
  title: string;
}

interface RankedCandidate {
  applicationId: string;
  status: string;
  appliedAt: string;
  matchScore: number;
  strengths: string[];
  concerns: string[];
  candidate: {
    email: string;
    fullName?: string;
    headline?: string | null;
    skills?: string[];
    experienceYears?: number | null;
    location?: string | null;
  };
}

function scoreColor(score: number) {
  if (score >= 75) return "#28a745";
  if (score >= 50) return "#f0ad4e";
  return "#dc3545";
}

export default function EmployerAutoShortlistPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ranked, setRanked] = useState<RankedCandidate[] | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "EMPLOYER")) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user && user.role === "EMPLOYER") {
      api
        .get<EmployerJob[]>("/jobs/mine")
        .then((data) => {
          setJobs(data);
          if (data.length > 0) setSelectedJobId(data[0].id);
        })
        .catch(() => setJobs([]));
    }
  }, [user]);

  if (loading || !user || user.role !== "EMPLOYER") {
    return null;
  }

  async function handleRank() {
    if (!selectedJobId) return;
    setErrorMsg(null);
    setRanked(null);
    setStatus("loading");
    try {
      const data = await api.get<RankedCandidate[]>(`/auto-shortlist/job/${selectedJobId}`);
      setRanked(data);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof ApiError ? err.message : "Could not rank applicants. Try again.");
    }
  }

  async function updateStatus(applicationId: string, newStatus: string) {
    setUpdatingId(applicationId);
    try {
      await api.patch(`/applications/${applicationId}/status`, { status: newStatus });
      setRanked((prev) =>
        prev ? prev.map((r) => (r.applicationId === applicationId ? { ...r, status: newStatus } : r)) : prev,
      );
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : "Could not update application status");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <>
      <Navbar8 />

      <div className="dashboard-wrap bg-light">
        <EmployerSidebar active="auto-shortlist" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">AI Auto-Shortlist</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Employer</a></li>
                    <li className="breadcrumb-item text-muted"><a href="#">Dashboard</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">AI Auto-Shortlist</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            <div className="card mb-4">
              <div className="card-header">
                <h4>Rank Applicants with AI</h4>
                <p className="text-muted mb-0 mt-1">
                  Pick a job and let AI rank every applicant by fit, with strengths and concerns for each &mdash; no
                  more reading every resume manually.
                </p>
              </div>
              <div className="card-body">
                {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                {jobs.length === 0 ? (
                  <p className="text-muted mb-0">You haven't posted any jobs yet.</p>
                ) : (
                  <div className="row align-items-end">
                    <div className="col-xl-6 col-md-12 mb-3">
                      <label className="form-label">Select Job</label>
                      <select
                        className="form-control"
                        value={selectedJobId}
                        onChange={(e) => setSelectedJobId(e.target.value)}
                      >
                        {jobs.map((j) => (
                          <option key={j.id} value={j.id}>
                            {j.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-xl-4 col-md-12 mb-3">
                      <button type="button" className="btn btn-main" onClick={handleRank} disabled={status === "loading"}>
                        {status === "loading" ? "Ranking Applicants..." : "Rank Applicants"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {ranked && (
              <div className="card">
                <div className="card-header">
                  <h4>{ranked.length} Applicant{ranked.length !== 1 ? "s" : ""} Ranked</h4>
                </div>
                <div className="card-body">
                  {ranked.length === 0 && <p className="text-muted mb-0">No applicants for this job yet.</p>}
                  {ranked.map((r) => (
                    <div key={r.applicationId} className="border rounded p-3 mb-3">
                      <div className="d-flex justify-content-between align-items-start flex-wrap mb-2">
                        <div>
                          <h5 className="mb-1">{r.candidate.fullName || r.candidate.email}</h5>
                          <div className="text-muted">{r.candidate.headline || "No headline"}</div>
                          <div className="small text-muted">
                            {r.candidate.experienceYears ?? 0} yrs exp &middot; {r.candidate.location || "Location unknown"}
                          </div>
                        </div>
                        <span
                          className="badge p-2"
                          style={{ backgroundColor: scoreColor(r.matchScore), color: "#fff", minWidth: 60 }}
                        >
                          {r.matchScore}% Match
                        </span>
                      </div>

                      {r.candidate.skills && r.candidate.skills.length > 0 && (
                        <div className="mb-2">
                          {r.candidate.skills.map((s) => (
                            <span key={s} className="badge bg-light text-dark border me-2 mb-1">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="row">
                        <div className="col-md-6">
                          <h6 className="text-success small">Strengths</h6>
                          <ul className="small mb-2">
                            {r.strengths.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                        {r.concerns.length > 0 && (
                          <div className="col-md-6">
                            <h6 className="text-danger small">Concerns</h6>
                            <ul className="small mb-2">
                              {r.concerns.map((c, i) => (
                                <li key={i}>{c}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <span className="badge bg-secondary">{r.status}</span>
                        <div>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success me-2"
                            disabled={updatingId === r.applicationId}
                            onClick={() => updateStatus(r.applicationId, "SHORTLISTED")}
                          >
                            Shortlist
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            disabled={updatingId === r.applicationId}
                            onClick={() => updateStatus(r.applicationId, "REJECTED")}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* footer removed */}
        </div>
      </div>
    </>
  );
}
