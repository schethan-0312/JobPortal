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

interface Applicant {
  id: string;
  status: string;
  appliedAt: string;
  candidate: {
    email: string;
    candidateProfile: {
      fullName: string;
      headline: string | null;
      skills: string[];
      location: string | null;
      experienceYears: number | null;
    } | null;
  };
}

interface ShortlistedRow extends Applicant {
  jobTitle: string;
}

export default function EmployerShortlistCandidatesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [rows, setRows] = useState<ShortlistedRow[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "EMPLOYER")) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "EMPLOYER") return;
    loadShortlisted();
  }, [user]);

  async function loadShortlisted() {
    setDataLoading(true);
    setError(null);
    try {
      const jobs = await api.get<EmployerJob[]>("/jobs/mine");
      const results: ShortlistedRow[] = [];
      for (const job of jobs) {
        try {
          const applicants = await api.get<Applicant[]>(`/applications/for-job/${job.id}`);
          for (const a of applicants) {
            if (a.status === "SHORTLISTED" || a.status === "INTERVIEW" || a.status === "OFFERED") {
              results.push({ ...a, jobTitle: job.title });
            }
          }
        } catch {
          // skip jobs whose applicants fail to load
        }
      }
      setRows(results);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load shortlisted candidates");
    } finally {
      setDataLoading(false);
    }
  }

  async function updateStatus(applicationId: string, status: string) {
    setUpdatingId(applicationId);
    setError(null);
    try {
      await api.patch(`/applications/${applicationId}/status`, { status });
      setRows((prev) => prev.filter((r) => r.id !== applicationId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading || !user || user.role !== "EMPLOYER") {
    return null;
  }

  return (
    <>
      <Navbar8 />

      <div className="dashboard-wrap bg-light">
        <EmployerSidebar active="shortlist-candidates" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Shortlisted Candidates</h1>
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
                        Shortlisted Candidates
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
                    <h6 className="mb-0">{rows.length} shortlisted candidate{rows.length !== 1 ? "s" : ""}</h6>
                  </div>
                  <div className="card-body">
                    {dataLoading && <p className="text-muted">Loading...</p>}
                    {!dataLoading && rows.length === 0 && <p className="text-muted">No shortlisted candidates yet.</p>}
                    {/* Start All List */}
                    <div className="row justify-content-start gx-3 gy-4">
                      {rows.map((item) => (
                        <div className="col-xl-12 col-lg-12 col-md-12 col-12" key={item.id}>
                          <div className="jbs-list-box border">
                            <div className="jbs-list-head m-0">
                              <div className="jbs-list-head-thunner">
                                <div className="jbs-list-usrs-thumb jbs-verified">
                                  <figure>
                                    <img src="/assets/img/team-5.jpg" className="img-fluid circle" alt="" />
                                  </figure>
                                </div>
                                <div className="jbs-list-job-caption">
                                  <div className="jbs-job-title-wrap">
                                    <h4 className="jbs-job-title">{item.candidate.candidateProfile?.fullName || item.candidate.email}</h4>
                                  </div>
                                  <div className="jbs-job-mrch-lists">
                                    <div className="single-mrch-lists">
                                      <span>{item.candidate.candidateProfile?.headline || "No headline"}</span>.
                                      <span>
                                        <i className="fa-solid fa-location-dot me-1"></i>
                                        {item.candidate.candidateProfile?.location || "Unknown"}
                                      </span>
                                      <span>Job: {item.jobTitle}</span>
                                    </div>
                                  </div>
                                  <div className="jbs-grid-job-edrs-group mt-1">
                                    {(item.candidate.candidateProfile?.skills || []).map((s) => (
                                      <span key={s}>{s}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="jbs-list-head-middle">
                                <div className="elsocrio-jbs sm">
                                  <div className="ilop-tr">
                                    <i className="fa-solid fa-coins"></i>
                                  </div>
                                  <h5 className="jbs-list-pack">{item.candidate.candidateProfile?.experienceYears ?? 0} Years exp.</h5>
                                </div>
                              </div>
                              <div className="jbs-list-head-last">
                                <span className="label text-light bg-success me-2">{item.status}</span>
                                <button
                                  type="button"
                                  className="rounded btn-md btn-green px-3 me-2"
                                  disabled={updatingId === item.id}
                                  onClick={() => updateStatus(item.id, "OFFERED")}
                                  title="Mark Offered"
                                >
                                  <i className="fa-solid fa-envelope-circle-check"></i>
                                </button>
                                <button
                                  type="button"
                                  className="rounded btn-md btn-red px-3"
                                  disabled={updatingId === item.id}
                                  onClick={() => updateStatus(item.id, "REJECTED")}
                                  title="Reject"
                                >
                                  <i className="fa-solid fa-trash-can"></i>
                                </button>
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
