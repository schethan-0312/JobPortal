"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface Overview {
  totalAssessments: number;
  flaggedAssessments: number;
  totalInterviews: number;
  flaggedInterviews: number;
}

interface AssessmentRow {
  id: string;
  skill: string;
  score: number | null;
  totalQuestions: number;
  passed: boolean | null;
  violations: number;
  timeExceeded: boolean;
  completedAt: string | null;
  candidate: { fullName: string; userId: string };
}

interface InterviewRow {
  id: string;
  jobRole: string;
  overallRating: number | null;
  violations: number;
  timeExceeded: boolean;
  completedAt: string | null;
  candidate: { fullName: string; userId: string };
}

export default function AdminProctoringPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [overview, setOverview] = useState<Overview | null>(null);
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [interviews, setInterviews] = useState<InterviewRow[]>([]);
  const [flaggedOnly, setFlaggedOnly] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function loadData() {
    try {
      const [ov, a, i] = await Promise.all([
        api.get<Overview>("/admin/proctoring/overview"),
        api.get<{ items: AssessmentRow[] }>(`/admin/proctoring/assessments?flaggedOnly=${flaggedOnly}`),
        api.get<{ items: InterviewRow[] }>(`/admin/proctoring/interviews?flaggedOnly=${flaggedOnly}`),
      ]);
      setOverview(ov);
      setAssessments(a.items);
      setInterviews(i.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load proctoring data");
    }
  }

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    loadData();
  }, [user, flaggedOnly]);

  async function handleInvalidateAssessment(id: string) {
    if (!confirm("Invalidate this assessment result?")) return;
    setActing(id);
    setError(null);
    try {
      await api.post(`/admin/proctoring/assessments/${id}/invalidate`);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to invalidate assessment");
    } finally {
      setActing(null);
    }
  }

  async function handleInvalidateInterview(id: string) {
    if (!confirm("Invalidate this mock interview result?")) return;
    setActing(id);
    setError(null);
    try {
      await api.post(`/admin/proctoring/interviews/${id}/invalidate`);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to invalidate interview");
    } finally {
      setActing(null);
    }
  }

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="proctoring" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Assessments &amp; Proctoring Oversight</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Proctoring</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}

            {overview && (
              <div className="row g-4 mb-4">
                <div className="col-md-3">
                  <div className="card h-100"><div className="card-body">
                    <div className="text-muted small">Total Assessments</div>
                    <div className="fw-bold fs-4">{overview.totalAssessments}</div>
                  </div></div>
                </div>
                <div className="col-md-3">
                  <div className="card h-100"><div className="card-body">
                    <div className="text-muted small">Flagged Assessments</div>
                    <div className="fw-bold fs-4 text-danger">{overview.flaggedAssessments}</div>
                  </div></div>
                </div>
                <div className="col-md-3">
                  <div className="card h-100"><div className="card-body">
                    <div className="text-muted small">Total Interviews</div>
                    <div className="fw-bold fs-4">{overview.totalInterviews}</div>
                  </div></div>
                </div>
                <div className="col-md-3">
                  <div className="card h-100"><div className="card-body">
                    <div className="text-muted small">Flagged Interviews</div>
                    <div className="fw-bold fs-4 text-danger">{overview.flaggedInterviews}</div>
                  </div></div>
                </div>
              </div>
            )}

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="flaggedOnly"
                checked={flaggedOnly}
                onChange={(e) => setFlaggedOnly(e.target.checked)}
              />
              <label className="form-check-label small" htmlFor="flaggedOnly">
                Show flagged only (violations or time exceeded)
              </label>
            </div>

            <div className="card mb-4">
              <div className="card-header"><h6 className="mb-0">Skill Assessments ({assessments.length})</h6></div>
              <div className="card-body">
                {assessments.length === 0 && <p className="text-muted small mb-0">No assessments to show.</p>}
                {assessments.length > 0 && (
                  <div className="table-responsive">
                    <table className="table table-sm align-middle">
                      <thead>
                        <tr><th>Candidate</th><th>Skill</th><th>Score</th><th>Violations</th><th>Time</th><th>Completed</th><th>Action</th></tr>
                      </thead>
                      <tbody>
                        {assessments.map((a) => (
                          <tr key={a.id}>
                            <td className="small">{a.candidate.fullName}</td>
                            <td className="small">{a.skill}</td>
                            <td className="small">{a.score !== null ? `${a.score}/${a.totalQuestions}` : "—"}</td>
                            <td>
                              {a.violations > 0 ? <span className="badge bg-danger">{a.violations}</span> : "0"}
                            </td>
                            <td>{a.timeExceeded && <span className="badge bg-warning">Exceeded</span>}</td>
                            <td className="small text-muted">{a.completedAt ? new Date(a.completedAt).toLocaleDateString() : "—"}</td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                disabled={acting === a.id}
                                onClick={() => handleInvalidateAssessment(a.id)}
                              >
                                Invalidate
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h6 className="mb-0">Mock Interviews ({interviews.length})</h6></div>
              <div className="card-body">
                {interviews.length === 0 && <p className="text-muted small mb-0">No interviews to show.</p>}
                {interviews.length > 0 && (
                  <div className="table-responsive">
                    <table className="table table-sm align-middle">
                      <thead>
                        <tr><th>Candidate</th><th>Role</th><th>Rating</th><th>Violations</th><th>Time</th><th>Completed</th><th>Action</th></tr>
                      </thead>
                      <tbody>
                        {interviews.map((i) => (
                          <tr key={i.id}>
                            <td className="small">{i.candidate.fullName}</td>
                            <td className="small">{i.jobRole}</td>
                            <td className="small">{i.overallRating !== null ? `${i.overallRating}/5` : "—"}</td>
                            <td>
                              {i.violations > 0 ? <span className="badge bg-danger">{i.violations}</span> : "0"}
                            </td>
                            <td>{i.timeExceeded && <span className="badge bg-warning">Exceeded</span>}</td>
                            <td className="small text-muted">{i.completedAt ? new Date(i.completedAt).toLocaleDateString() : "—"}</td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                disabled={acting === i.id}
                                onClick={() => handleInvalidateInterview(i.id)}
                              >
                                Invalidate
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

