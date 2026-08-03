"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar8 from "@/components/Navbar8";
import EmployerSidebar from "@/components/employer-dashboard/EmployerSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl, getToken } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const STATUSES = ["APPLIED", "REVIEWED", "SHORTLISTED", "INTERVIEW", "OFFERED", "REJECTED"] as const;

interface EmployerJob {
  id: string;
  title: string;
}

interface Applicant {
  id: string;
  status: string;
  coverNote: string | null;
  appliedAt: string;
  candidate: {
    id: string;
    email: string;
    candidateProfile: {
      fullName: string;
      headline: string | null;
      resumeUrl: string | null;
      skills: string[];
      location: string | null;
      isVerified: boolean;
      profilePhotoUrl: string | null;
      githubUsername: string | null;
      githubProfileUrl: string | null;
      githubAvatarUrl: string | null;
    } | null;
  };
}

interface AiRanking {
  applicationId: string;
  matchScore: number;
  strengths: string[];
  concerns: string[];
}

type FilterChip = "ALL" | "AI_SHORTLISTED" | "REVIEWED" | "INTERVIEW";

export default function EmployerApplicantsJobsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedForZip, setSelectedForZip] = useState<Set<string>>(new Set());
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [filter, setFilter] = useState<FilterChip>("ALL");
  const [rankings, setRankings] = useState<Map<string, AiRanking>>(new Map());
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingError, setRankingError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "EMPLOYER")) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "EMPLOYER") return;
    (async () => {
      setJobsLoading(true);
      try {
        const list = await api.get<EmployerJob[]>("/jobs/mine");
        setJobs(list);
        if (list.length > 0) setSelectedJobId(list[0].id);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load jobs");
      } finally {
        setJobsLoading(false);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!selectedJobId) return;
    setRankings(new Map());
    setFilter("ALL");
    (async () => {
      setApplicantsLoading(true);
      setError(null);
      try {
        const list = await api.get<Applicant[]>(`/applications/for-job/${selectedJobId}`);
        setApplicants(list);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load applicants");
      } finally {
        setApplicantsLoading(false);
      }
    })();
  }, [selectedJobId]);

  async function runAiRanking() {
    if (!selectedJobId) return;
    setRankingLoading(true);
    setRankingError(null);
    try {
      const results = await api.get<AiRanking[]>(`/auto-shortlist/job/${selectedJobId}`);
      setRankings(new Map(results.map((r) => [r.applicationId, r])));
      setFilter("AI_SHORTLISTED");
    } catch (err) {
      setRankingError(err instanceof ApiError ? err.message : "AI ranking failed. Try again.");
    } finally {
      setRankingLoading(false);
    }
  }

  const filteredApplicants = useMemo(() => {
    let list = applicants;
    if (filter === "REVIEWED") list = list.filter((a) => a.status === "REVIEWED");
    else if (filter === "INTERVIEW") list = list.filter((a) => a.status === "INTERVIEW");
    else if (filter === "AI_SHORTLISTED") list = list.filter((a) => (rankings.get(a.id)?.matchScore ?? 0) >= 70);

    if (rankings.size > 0) {
      list = [...list].sort((a, b) => (rankings.get(b.id)?.matchScore ?? -1) - (rankings.get(a.id)?.matchScore ?? -1));
    }
    return list;
  }, [applicants, filter, rankings]);

  function scoreClass(score: number) {
    if (score >= 80) return "bg-success";
    if (score >= 60) return "bg-warning text-dark";
    return "bg-secondary";
  }

  function toggleZipSelect(applicationId: string) {
    setSelectedForZip((prev) => {
      const next = new Set(prev);
      if (next.has(applicationId)) next.delete(applicationId);
      else next.add(applicationId);
      return next;
    });
  }

  async function downloadResumesZip() {
    if (!selectedJobId) return;
    setDownloadingZip(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedForZip.size > 0) params.set("applicationIds", [...selectedForZip].join(","));
      const res = await fetch(`${API_URL}/applications/for-job/${selectedJobId}/resumes.zip?${params.toString()}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Could not generate the resume zip.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedJob?.title ?? "job"}-resumes.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not download resumes.");
    } finally {
      setDownloadingZip(false);
    }
  }

  async function updateStatus(applicationId: string, status: string) {
    setUpdatingId(applicationId);
    setError(null);
    try {
      await api.patch(`/applications/${applicationId}/status`, { status });
      setApplicants((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status } : a)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update applicant status");
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading || !user || user.role !== "EMPLOYER") {
    return null;
  }

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  return (
    <>
      <Navbar8 />

      <div className="dashboard-wrap bg-light">
        <EmployerSidebar active="applicants-jobs" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Manage Applicants</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted">
                      <a href="#">Employer</a>
                    </li>
                    <li className="breadcrumb-item text-muted">
                      <a href="#">Dashboard</a>
                    </li>
                    <li className="breadcrumb-item">
                      <a href="#" className="text-main">
                        All Applicants
                      </a>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">

            {error && <div className="alert alert-danger">{error}</div>}

            {/* Header Wrap */}
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                <div className="card">
                  <div className="card-header">
                    <div className="_mp-inner-content elior">
                      <div className="_mp-inner-first">
                        <label className="me-2 mb-0">Job:</label>
                        <select
                          className="form-control"
                          style={{ display: "inline-block", width: "auto" }}
                          value={selectedJobId}
                          onChange={(e) => setSelectedJobId(e.target.value)}
                          disabled={jobsLoading || jobs.length === 0}
                        >
                          {jobs.length === 0 && <option value="">No jobs posted</option>}
                          {jobs.map((j) => (
                            <option key={j.id} value={j.id}>{j.title}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="card-body">
                    {/* Row */}
                    <div className="row mb-3">
                      <div className="col-xl-12 col-lg-12 col-md-12">
                        <div className="duster-flex-row  align-items-center d-flex justify-content-between">
                          <div className="duster-flex-first">
                            <h6 className="mb-0">{selectedJob?.title || "Select a job"}</h6>
                          </div>
                          <div className="duster-flex-end d-flex align-items-center gap-3">
                            <h6 className="mb-0">Total: {applicants.length}</h6>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-main"
                              disabled={applicants.length === 0 || rankingLoading}
                              onClick={runAiRanking}
                              title="Rank applicants by AI-estimated fit for this job"
                            >
                              <i className="fa-solid fa-wand-magic-sparkles me-1"></i>
                              {rankingLoading ? "Ranking..." : "AI Rank Applicants"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-main"
                              disabled={applicants.length === 0 || downloadingZip}
                              onClick={downloadResumesZip}
                              title={selectedForZip.size > 0 ? `Download ${selectedForZip.size} selected resumes` : "Download all resumes for this job"}
                            >
                              <i className="fa-solid fa-file-zipper me-1"></i>
                              {downloadingZip
                                ? "Zipping..."
                                : selectedForZip.size > 0
                                  ? `Download ${selectedForZip.size} resumes`
                                  : "Download all resumes"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* End Row */}

                    {rankingError && <div className="alert alert-warning py-2">{rankingError}</div>}

                    <div className="d-flex flex-wrap gap-2 mb-3">
                      {([
                        ["ALL", "All"],
                        ["AI_SHORTLISTED", "AI Shortlisted"],
                        ["REVIEWED", "Reviewed"],
                        ["INTERVIEW", "Interview"],
                      ] as [FilterChip, string][]).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          className={`btn btn-sm rounded-pill ${filter === key ? "btn-main" : "btn-outline-secondary"}`}
                          onClick={() => setFilter(key)}
                          disabled={key === "AI_SHORTLISTED" && rankings.size === 0}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {jobsLoading && <p className="text-muted">Loading jobs...</p>}
                    {!jobsLoading && jobs.length === 0 && <p className="text-muted">You haven&apos;t posted any jobs yet.</p>}
                    {applicantsLoading && <p className="text-muted">Loading applicants...</p>}
                    {!applicantsLoading && selectedJobId && applicants.length === 0 && <p className="text-muted">No applicants yet for this job.</p>}
                    {!applicantsLoading && selectedJobId && applicants.length > 0 && filteredApplicants.length === 0 && (
                      <p className="text-muted">No applicants match this filter.</p>
                    )}

                    {/* Start All List */}
                    <div className="row justify-content-start gx-3 gy-4">
                      {filteredApplicants.map((item) => (
                        <div className="col-xl-12 col-lg-12 col-md-12 col-12" key={item.id}>
                          <div className="jbs-list-box border">
                            <div className="jbs-list-head m-0">
                              <div className="jbs-list-head-thunner center">
                                {item.candidate.candidateProfile?.resumeUrl && (
                                  <input
                                    type="checkbox"
                                    className="form-check-input me-2"
                                    checked={selectedForZip.has(item.id)}
                                    onChange={() => toggleZipSelect(item.id)}
                                    aria-label={`Select ${item.candidate.candidateProfile?.fullName ?? "candidate"} for zip download`}
                                  />
                                )}
                                <div className="jbs-list-usrs-thumb jbs-verified position-relative">
                                  <figure>
                                    <img
                                      src={assetUrl(item.candidate.candidateProfile?.profilePhotoUrl) || "/assets/img/team-5.jpg"}
                                      className="img-fluid circle"
                                      alt=""
                                    />
                                  </figure>
                                </div>
                                <div className="jbs-list-job-caption">
                                  <div className="jbs-job-title-wrap d-flex align-items-center gap-2">
                                    <h4 className="jbs-job-title mb-0">{item.candidate.candidateProfile?.fullName || item.candidate.email}</h4>
                                    {item.candidate.candidateProfile?.isVerified && (
                                      <span className="badge bg-success bg-opacity-10 text-success" title="Skill-verified candidate">
                                        <i className="fa-solid fa-circle-check me-1"></i>Verified
                                      </span>
                                    )}
                                    {item.candidate.candidateProfile?.githubUsername && (
                                      <a
                                        href={item.candidate.candidateProfile.githubProfileUrl ?? "#"}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="badge bg-dark text-light text-decoration-none"
                                        title={`GitHub: @${item.candidate.candidateProfile.githubUsername}`}
                                      >
                                        <i className="fa-brands fa-github me-1"></i>
                                        {item.candidate.candidateProfile.githubUsername}
                                      </a>
                                    )}
                                    {rankings.has(item.id) && (
                                      <span
                                        className={`badge ${scoreClass(rankings.get(item.id)!.matchScore)}`}
                                        title={rankings.get(item.id)!.strengths.join(" · ") || "AI match score"}
                                      >
                                        <i className="fa-solid fa-wand-magic-sparkles me-1"></i>
                                        {rankings.get(item.id)!.matchScore}% match
                                      </span>
                                    )}
                                  </div>
                                  <div className="jbs-job-mrch-lists">
                                    <div className="single-mrch-lists">
                                      <span>{item.candidate.candidateProfile?.headline || "No headline"}</span>.
                                      <span>
                                        <i className="fa-solid fa-location-dot me-1"></i>
                                        {item.candidate.candidateProfile?.location || "Unknown"}
                                      </span>
                                      <span>Applied: {new Date(item.appliedAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="jbs-list-head-last d-flex align-items-center gap-2">
                                <select
                                  className="form-control form-select"
                                  style={{ width: "auto" }}
                                  value={item.status}
                                  disabled={updatingId === item.id}
                                  onChange={(e) => updateStatus(item.id, e.target.value)}
                                  aria-label="Update applicant status"
                                >
                                  {STATUSES.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                                <a
                                  href={`/employer-messages?candidateId=${item.candidate.id}&name=${encodeURIComponent(item.candidate.candidateProfile?.fullName || item.candidate.email)}&photo=${encodeURIComponent(item.candidate.candidateProfile?.profilePhotoUrl || "")}`}
                                  className="rounded btn-md btn-dark px-3"
                                  title="Message Candidate"
                                >
                                  <i className="fa-solid fa-message"></i>
                                </a>
                                {item.candidate.candidateProfile?.resumeUrl && (
                                  <a
                                    href={item.candidate.candidateProfile.resumeUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded btn-md btn-dark px-3"
                                    title="Download Resume"
                                  >
                                    <i className="fa-solid fa-download"></i>
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* End All Job List */}
                  </div>
                </div>
              </div>
            </div>
            {/* Header Wrap */}
          </div>

          {/* footer */}
          <div className="row">
            <div className="col-md-12">
              <div className="py-3 text-center">
                &copy; {new Date().getFullYear()} JobStock. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
