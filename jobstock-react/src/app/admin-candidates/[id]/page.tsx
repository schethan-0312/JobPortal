"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface SkillAssessmentSummary {
  id: string;
  skill: string;
  score: number | null;
  totalQuestions: number;
  passed: boolean | null;
  status: string;
  createdAt: string;
}

interface MockInterviewSummary {
  id: string;
  jobRole: string;
  overallRating: number | null;
  status: string;
  createdAt: string;
}

interface ApplicationSummary {
  id: string;
  status: string;
  appliedAt: string;
  job: { title: string };
}

interface LoginEventSummary {
  id: string;
  ipAddress: string | null;
  createdAt: string;
}

interface CandidateDetail {
  id: string;
  email: string;
  isSuspended: boolean;
  suspendedReason: string | null;
  createdAt: string;
  candidateProfile: {
    fullName: string;
    headline: string | null;
    location: string | null;
    isVerified: boolean;
    skills: string[];
    skillAssessments: SkillAssessmentSummary[];
    mockInterviews: MockInterviewSummary[];
  } | null;
  applications: ApplicationSummary[];
  loginEvents: LoginEventSummary[];
}

export default function AdminCandidateDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [detail, setDetail] = useState<CandidateDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function loadDetail() {
    try {
      const res = await api.get<CandidateDetail>(`/admin/candidate-management/${id}`);
      setDetail(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load candidate detail");
    }
  }

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    loadDetail();
  }, [user, id]);

  async function handleSuspend() {
    setActing(true);
    setError(null);
    try {
      await api.post(`/admin/candidate-management/${id}/suspend`, { reason: reason || undefined });
      await loadDetail();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to suspend candidate");
    } finally {
      setActing(false);
    }
  }

  async function handleUnsuspend() {
    setActing(true);
    setError(null);
    try {
      await api.post(`/admin/candidate-management/${id}/unsuspend`);
      await loadDetail();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to unsuspend candidate");
    } finally {
      setActing(false);
    }
  }

  async function handleToggleVerified() {
    setActing(true);
    setError(null);
    try {
      await api.patch(`/admin/candidate-management/${id}/toggle-verified`);
      await loadDetail();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update verification");
    } finally {
      setActing(false);
    }
  }

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="candidates" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">{detail?.candidateProfile?.fullName ?? "Candidate"}</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item text-muted"><a href="/admin-candidates">Candidates</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">{detail?.candidateProfile?.fullName}</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}
            {!detail && !error && <p className="text-muted">Loading...</p>}

            {detail && (
              <>
                <div className="card mb-4">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">Account</h6>
                    <div className="d-flex gap-2 flex-wrap">
                      <button type="button" className="btn btn-sm btn-outline-main" disabled={acting} onClick={handleToggleVerified}>
                        {detail.candidateProfile?.isVerified ? "Unverify" : "Mark Verified"}
                      </button>
                      {detail.isSuspended ? (
                        <button type="button" className="btn btn-sm btn-outline-success" disabled={acting} onClick={handleUnsuspend}>
                          Unsuspend
                        </button>
                      ) : (
                        <button type="button" className="btn btn-sm btn-outline-danger" disabled={acting} onClick={handleSuspend}>
                          Suspend
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="card-body small">
                    <p className="mb-1"><strong>Email:</strong> {detail.email}</p>
                    <p className="mb-1"><strong>Headline:</strong> {detail.candidateProfile?.headline ?? "—"}</p>
                    <p className="mb-1"><strong>Location:</strong> {detail.candidateProfile?.location ?? "—"}</p>
                    <p className="mb-1">
                      <strong>Status:</strong>{" "}
                      <span className={`badge ${detail.isSuspended ? "bg-danger" : "bg-success"}`}>
                        {detail.isSuspended ? "Suspended" : "Active"}
                      </span>
                      {detail.isSuspended && detail.suspendedReason && (
                        <span className="text-muted ms-2">({detail.suspendedReason})</span>
                      )}
                    </p>
                    {!detail.isSuspended && (
                      <input
                        type="text"
                        className="form-control form-control-sm mt-2"
                        style={{ maxWidth: 400 }}
                        placeholder="Suspension reason (optional)"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    )}
                  </div>
                </div>

                <div className="card mb-4">
                  <div className="card-header"><h6 className="mb-0">Applications</h6></div>
                  <div className="card-body">
                    {detail.applications.length === 0 && <p className="text-muted small mb-0">No applications yet.</p>}
                    {detail.applications.length > 0 && (
                      <table className="table table-sm align-middle">
                        <thead><tr><th>Job</th><th>Status</th><th>Applied</th></tr></thead>
                        <tbody>
                          {detail.applications.map((a) => (
                            <tr key={a.id}>
                              <td className="small">{a.job.title}</td>
                              <td><span className="badge bg-secondary">{a.status}</span></td>
                              <td className="small text-muted">{new Date(a.appliedAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                <div className="row g-4 mb-4">
                  <div className="col-md-6">
                    <div className="card h-100">
                      <div className="card-header"><h6 className="mb-0">Skill Assessments</h6></div>
                      <div className="card-body">
                        {(!detail.candidateProfile || detail.candidateProfile.skillAssessments.length === 0) && (
                          <p className="text-muted small mb-0">None taken yet.</p>
                        )}
                        {detail.candidateProfile && detail.candidateProfile.skillAssessments.length > 0 && (
                          <ul className="list-unstyled small mb-0">
                            {detail.candidateProfile.skillAssessments.map((a) => (
                              <li key={a.id} className="d-flex justify-content-between border-bottom py-1">
                                <span>{a.skill}</span>
                                <span>{a.score !== null ? `${a.score}/${a.totalQuestions}` : a.status}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card h-100">
                      <div className="card-header"><h6 className="mb-0">Mock Interviews</h6></div>
                      <div className="card-body">
                        {(!detail.candidateProfile || detail.candidateProfile.mockInterviews.length === 0) && (
                          <p className="text-muted small mb-0">None taken yet.</p>
                        )}
                        {detail.candidateProfile && detail.candidateProfile.mockInterviews.length > 0 && (
                          <ul className="list-unstyled small mb-0">
                            {detail.candidateProfile.mockInterviews.map((m) => (
                              <li key={m.id} className="d-flex justify-content-between border-bottom py-1">
                                <span>{m.jobRole}</span>
                                <span>{m.overallRating !== null ? `${m.overallRating}/5` : m.status}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header"><h6 className="mb-0">Recent Logins</h6></div>
                  <div className="card-body">
                    {detail.loginEvents.length === 0 && <p className="text-muted small mb-0">No login history.</p>}
                    {detail.loginEvents.length > 0 && (
                      <ul className="list-unstyled small mb-0">
                        {detail.loginEvents.map((l) => (
                          <li key={l.id} className="d-flex justify-content-between border-bottom py-1">
                            <span>{l.ipAddress ?? "unknown"}</span>
                            <span className="text-muted">{new Date(l.createdAt).toLocaleString()}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            )}
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
    </>
  );
}
