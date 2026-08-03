"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar7 from "@/components/Navbar7";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
import UploadResumeModal from "@/components/candidate-dashboard/UploadResumeModal";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface Employer {
  companyName: string;
  logoUrl?: string | null;
}

interface Job {
  id: string;
  title: string;
  slug: string;
  location?: string;
  jobType?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  employer?: Employer;
}

interface JobMatch {
  matchScore: number;
  matchReasons: string[];
  job: Job;
}

function formatSalary(job: Job) {
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  if (job.salaryMin && job.salaryMax) return `${fmt(job.salaryMin)} - ${fmt(job.salaryMax)}`;
  if (job.salaryMin) return fmt(job.salaryMin);
  return "Not disclosed";
}

function scoreColor(score: number) {
  if (score >= 75) return "#28a745";
  if (score >= 50) return "#f0ad4e";
  return "#dc3545";
}

export default function CandidateSmartMatchPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState<"idle" | "loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [matches, setMatches] = useState<JobMatch[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "CANDIDATE")) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user && user.role === "CANDIDATE") {
      loadMatches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadMatches() {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const data = await api.get<JobMatch[]>("/smart-match/jobs");
      setMatches(data);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof ApiError ? err.message : "Could not load job matches. Try again.");
    }
  }

  function toggleSelect(jobId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  }

  function selectAllStrongMatches() {
    if (!matches) return;
    setSelected(new Set(matches.filter((m) => m.matchScore >= 70 && !appliedIds.has(m.job.id)).map((m) => m.job.id)));
  }

  async function applyToSelected() {
    if (selected.size === 0) return;
    setApplying(true);
    setBulkMsg(null);
    try {
      const result = await api.post<{ appliedCount: number; appliedJobIds: string[]; skippedCount: number }>(
        "/applications/bulk",
        { jobIds: [...selected] },
      );
      setAppliedIds((prev) => new Set([...prev, ...result.appliedJobIds]));
      setSelected(new Set());
      setBulkMsg(
        `Applied to ${result.appliedCount} job${result.appliedCount === 1 ? "" : "s"}` +
          (result.skippedCount > 0 ? ` — ${result.skippedCount} skipped (already applied or closed).` : "."),
      );
    } catch (err) {
      setBulkMsg(err instanceof ApiError ? err.message : "Could not submit applications. Try again.");
    } finally {
      setApplying(false);
    }
  }

  if (loading || !user || user.role !== "CANDIDATE") {
    return null;
  }

  return (
    <>
      <Navbar7 />

      <div className="dashboard-wrap bg-light">
        <CandidateSidebar active="smart-match" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Smart Job Matches</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Candidate</a></li>
                    <li className="breadcrumb-item text-muted"><a href="#">Dashboard</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Smart Job Matches</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <div>
                  <h4>AI-Ranked Jobs For You</h4>
                  <p className="text-muted mb-0 mt-1">
                    Matched against your profile's skills, experience, and location &mdash; not just keyword filters.
                  </p>
                </div>
                <button type="button" className="btn btn-outline-main" onClick={loadMatches} disabled={status === "loading"}>
                  {status === "loading" ? "Refreshing..." : "Refresh Matches"}
                </button>
              </div>
              <div className="card-body">
                {status === "error" && errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                {status === "loading" && <p className="text-muted mb-0">Finding your best-matching jobs...</p>}
                {status === "idle" && matches && matches.length === 0 && (
                  <p className="text-muted mb-0">
                    No strong matches right now. Try broadening your profile skills, or check back as new jobs are posted.
                  </p>
                )}
                {status === "idle" && matches && matches.length > 0 && (
                  <>
                    {bulkMsg && <div className="alert alert-info">{bulkMsg}</div>}
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                      <button type="button" className="btn btn-sm btn-outline-main" onClick={selectAllStrongMatches}>
                        Select all 70%+ matches
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-main"
                        disabled={selected.size === 0 || applying}
                        onClick={applyToSelected}
                      >
                        {applying ? "Applying..." : `Apply to ${selected.size} selected job${selected.size === 1 ? "" : "s"}`}
                      </button>
                    </div>
                    <div className="row">
                      {matches.map((m) => {
                        const applied = appliedIds.has(m.job.id);
                        return (
                          <div className="col-xl-6 col-md-12 mb-4" key={m.job.id}>
                            <div className="job-instructor-layout border p-3 h-100">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div className="d-flex align-items-start gap-2">
                                  {!applied && (
                                    <input
                                      type="checkbox"
                                      className="form-check-input mt-1"
                                      checked={selected.has(m.job.id)}
                                      onChange={() => toggleSelect(m.job.id)}
                                      aria-label={`Select ${m.job.title} for bulk apply`}
                                    />
                                  )}
                                  <div>
                                    <h5 className="mb-1">
                                      <a href={`/job-detail/${m.job.slug}`}>{m.job.title}</a>
                                    </h5>
                                    <div className="text-muted">{m.job.employer?.companyName ?? "—"}</div>
                                  </div>
                                </div>
                                <span
                                  className="badge p-2"
                                  style={{ backgroundColor: scoreColor(m.matchScore), color: "#fff", minWidth: 60 }}
                                >
                                  {m.matchScore}% Match
                                </span>
                              </div>
                              <div className="mb-2">
                                <span className="badge bg-light text-dark border me-2">{m.job.jobType ?? "—"}</span>
                                <span className="badge bg-light text-dark border me-2">{m.job.location ?? "—"}</span>
                                <span className="badge bg-light text-dark border">{formatSalary(m.job)}</span>
                                {applied && <span className="badge bg-success ms-2">Applied</span>}
                              </div>
                              <ul className="mb-0 ps-3">
                                {m.matchReasons.map((r, i) => (
                                  <li key={i} className="small">
                                    {r}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-12">
              <div className="py-3 text-center">
                &copy; {new Date().getFullYear()} JobStock. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>

      <UploadResumeModal />
    </>
  );
}
