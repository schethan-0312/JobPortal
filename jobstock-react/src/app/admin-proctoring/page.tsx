"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import Swal from "sweetalert2";
import toast, { Toaster } from "react-hot-toast";

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
  const [fetching, setFetching] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function loadData(isSilent = false) {
    if (!isSilent) setFetching(true);
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
      Swal.fire({
        icon: "error",
        title: "Failed to Load",
        text: err instanceof ApiError ? err.message : "Failed to load proctoring data",
        customClass: {
          popup: "elite-pkg-popup",
          title: "elite-pkg-title",
          confirmButton: "elite-pkg-btn",
        },
        confirmButtonColor: "#0d4f3c",
      });
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    loadData();
  }, [user, flaggedOnly]);

  async function handleInvalidateAssessment(id: string) {
    const confirm = await Swal.fire({
      title: "Invalidate Assessment Result?",
      text: "This action will invalidate the candidate's skill test score and mark it void. This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d94348",
      cancelButtonColor: "#8ea59d",
      confirmButtonText: "Yes, Invalidate",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "elite-pkg-popup",
        title: "elite-pkg-title",
        confirmButton: "elite-pkg-btn",
      },
    });

    if (!confirm.isConfirmed) return;

    setActing(id);
    try {
      await api.post(`/admin/proctoring/assessments/${id}/invalidate`);
      toast.success("Assessment result invalidated successfully!");
      await loadData(true);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Action Failed",
        text: err instanceof ApiError ? err.message : "Failed to invalidate assessment",
        customClass: {
          popup: "elite-pkg-popup",
          title: "elite-pkg-title",
          confirmButton: "elite-pkg-btn",
        },
        confirmButtonColor: "#0d4f3c",
      });
    } finally {
      setActing(null);
    }
  }

  async function handleInvalidateInterview(id: string) {
    const confirm = await Swal.fire({
      title: "Invalidate Mock Interview?",
      text: "This action will invalidate the candidate's interview session due to proctoring infractions.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d94348",
      cancelButtonColor: "#8ea59d",
      confirmButtonText: "Yes, Invalidate",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "elite-pkg-popup",
        title: "elite-pkg-title",
        confirmButton: "elite-pkg-btn",
      },
    });

    if (!confirm.isConfirmed) return;

    setActing(id);
    try {
      await api.post(`/admin/proctoring/interviews/${id}/invalidate`);
      toast.success("Mock interview invalidated successfully!");
      await loadData(true);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Action Failed",
        text: err instanceof ApiError ? err.message : "Failed to invalidate interview",
        customClass: {
          popup: "elite-pkg-popup",
          title: "elite-pkg-title",
          confirmButton: "elite-pkg-btn",
        },
        confirmButtonColor: "#0d4f3c",
      });
    } finally {
      setActing(null);
    }
  }

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <Toaster position="top-right" />
      <AdminNavbar />

      <style jsx global>{`
        .dashboard-wrap {
          background-color: #f4f9f8 !important;
          min-height: 100vh;
          overflow-x: hidden !important;
        }
        .dashboard-content.pkg-page {
          background-color: #f4f9f8 !important;
          padding: 30px 24px !important;
          max-width: 100% !important;
          overflow-x: hidden !important;
        }
        .pkg-header-title {
          font-size: 24px;
          font-weight: 800;
          color: #0b2b22;
          letter-spacing: -0.5px;
        }
        .pkg-header-subtitle {
          color: #5c756d;
          font-size: 13.5px;
        }

        .dash-wrap-bloud {
          background: #ffffff;
          border: 1px solid #e1e9e7;
          border-radius: 0.75rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .dash-wrap-bloud:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.06);
        }
        .dash-wrap-glow {
          position: absolute;
          top: -20px;
          right: -20px;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          filter: blur(35px);
          z-index: 0;
          opacity: 0.9;
        }
        .dash-wrap-bloud-icon, .dash-wrap-bloud-caption {
          position: relative;
          z-index: 1;
        }
        .bloud-icon {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
        }
        .dash-wrap-bloud-content h5 {
          font-size: 2rem;
          font-weight: 700;
          color: #0d362d;
          margin-bottom: 0.25rem;
          text-align: right;
        }
        .dash-wrap-bloud-content p {
          color: #63857d;
          font-size: 0.875rem;
          margin-bottom: 0;
          text-align: right;
          font-weight: 500;
        }

        .elite-card {
          background: #ffffff;
          border: 1px solid #d6e8e4;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(13, 79, 60, 0.04);
          overflow: hidden;
          margin-bottom: 24px;
        }
        .elite-card-header {
          background: #fbfdfc;
          border-bottom: 1px solid #d6e8e4;
          padding: 16px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .elite-card-title {
          font-size: 16px;
          font-weight: 700;
          color: #0b2b22;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .proctor-table-wrap {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .proctor-table {
          width: 100%;
          min-width: 800px;
          border-collapse: collapse;
          white-space: nowrap;
        }
        .proctor-table th {
          background: #f8fbfa;
          color: #446158;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 14px 18px;
          border-bottom: 1px solid #d6e8e4;
        }
        .proctor-table td {
          padding: 14px 18px;
          border-bottom: 1px solid #eef5f3;
          color: #334d44;
          font-size: 13.5px;
          vertical-align: middle;
        }
        .proctor-table tbody tr:hover {
          background: #f2f9f6;
        }

        .toggle-switch-wrap {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          border: 1px solid #d6e8e4;
          padding: 8px 16px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 13.5px;
          font-weight: 600;
          color: #0b2b22;
        }

        .btn-invalidate {
          background: #ffffff;
          border: 1px solid #fca5a5;
          color: #dc2626;
          font-weight: 600;
          font-size: 12px;
          padding: 5px 12px;
          border-radius: 7px;
          transition: all 0.2s;
        }
        .btn-invalidate:hover {
          background: #fee2e2;
          border-color: #ef4444;
          color: #991b1b;
        }

        .elite-pkg-popup {
          border-radius: 16px !important;
          padding: 24px !important;
          border: 1px solid #d6e8e4 !important;
          font-family: inherit !important;
        }
        .elite-pkg-title {
          font-size: 20px !important;
          font-weight: 800 !important;
          color: #0b2b22 !important;
        }
        .elite-pkg-btn {
          border-radius: 8px !important;
          font-weight: 700 !important;
          padding: 10px 22px !important;
          font-size: 14px !important;
        }
      `}</style>

      <div className="dashboard-wrap">
        <AdminSidebar active="proctoring" />

        <div className="dashboard-content pkg-page">
          {/* Header */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
              <h1 className="pkg-header-title mb-1">Assessments &amp; Proctoring Oversight</h1>
              <p className="pkg-header-subtitle mb-0">
                Monitor live candidate assessments, interview violation signals, test timing, and integrity audits.
              </p>
            </div>
          </div>

          {/* Stat Cards */}
          {overview && (
            <div className="row align-items-center gx-4 gy-4 mb-4">
              <div className="col-12 col-sm-6 col-md-6 col-lg-3">
                <div className="dash-wrap-bloud">
                  <div className="dash-wrap-glow" style={{ background: "#dbfbf5" }}></div>
                  <div className="dash-wrap-bloud-icon">
                    <div className="bloud-icon" style={{ backgroundColor: "#def5f0", color: "#134d42" }}>
                      <i className="fa-solid fa-clipboard-check"></i>
                    </div>
                  </div>
                  <div className="dash-wrap-bloud-caption">
                    <div className="dash-wrap-bloud-content">
                      <h5 className="ctr">{overview.totalAssessments}</h5>
                      <p>Total Assessments</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-md-6 col-lg-3">
                <div className="dash-wrap-bloud">
                  <div className="dash-wrap-glow" style={{ background: "#ffe8eb" }}></div>
                  <div className="dash-wrap-bloud-icon">
                    <div className="bloud-icon" style={{ backgroundColor: "#fcf0f2", color: "#d94348" }}>
                      <i className="fa-solid fa-triangle-exclamation"></i>
                    </div>
                  </div>
                  <div className="dash-wrap-bloud-caption">
                    <div className="dash-wrap-bloud-content">
                      <h5 className="ctr" style={{ color: "#d94348" }}>{overview.flaggedAssessments}</h5>
                      <p>Flagged Assessments</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-md-6 col-lg-3">
                <div className="dash-wrap-bloud">
                  <div className="dash-wrap-glow" style={{ background: "#dcf4fa" }}></div>
                  <div className="dash-wrap-bloud-icon">
                    <div className="bloud-icon" style={{ backgroundColor: "#eef3f5", color: "#174742" }}>
                      <i className="fa-solid fa-headset"></i>
                    </div>
                  </div>
                  <div className="dash-wrap-bloud-caption">
                    <div className="dash-wrap-bloud-content">
                      <h5 className="ctr">{overview.totalInterviews}</h5>
                      <p>Total Interviews</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-md-6 col-lg-3">
                <div className="dash-wrap-bloud">
                  <div className="dash-wrap-glow" style={{ background: "#fff3dc" }}></div>
                  <div className="dash-wrap-bloud-icon">
                    <div className="bloud-icon" style={{ backgroundColor: "#fdf3e0", color: "#b07c1a" }}>
                      <i className="fa-solid fa-user-xmark"></i>
                    </div>
                  </div>
                  <div className="dash-wrap-bloud-caption">
                    <div className="dash-wrap-bloud-content">
                      <h5 className="ctr" style={{ color: "#b07c1a" }}>{overview.flaggedInterviews}</h5>
                      <p>Flagged Interviews</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Toggle Switch */}
          <div className="toggle-switch-wrap">
            <div className="form-check form-switch mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                id="flaggedOnly"
                checked={flaggedOnly}
                onChange={(e) => setFlaggedOnly(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              <label className="form-check-label ms-1" htmlFor="flaggedOnly" style={{ cursor: "pointer" }}>
                Show flagged only (violations or time exceeded)
              </label>
            </div>
          </div>

          {/* 1. Skill Assessments Card */}
          <div className="elite-card">
            <div className="elite-card-header">
              <h2 className="elite-card-title">
                <i className="fa-solid fa-laptop-code" style={{ color: "#429e85" }}></i>
                Skill Assessments ({assessments.length})
              </h2>
            </div>

            <div className="proctor-table-wrap">
              {fetching && !overview && (
                <div className="text-center py-5">
                  <i className="fa-solid fa-circle-notch fa-spin text-muted fs-2 mb-2"></i>
                  <p className="text-muted small">Loading assessment records...</p>
                </div>
              )}

              {assessments.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="fa-solid fa-clipboard-check text-success fs-2 mb-2"></i>
                  <p className="mb-0 fw-semibold">No skill assessments matching current filter criteria.</p>
                </div>
              ) : (
                <table className="proctor-table">
                  <thead>
                    <tr>
                      <th>Candidate Name</th>
                      <th>Skill Tested</th>
                      <th>Score</th>
                      <th>Proctor Violations</th>
                      <th>Time Limit</th>
                      <th>Completed Date</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessments.map((a) => (
                      <tr key={a.id}>
                        <td>
                          <div className="fw-bold" style={{ color: "#0b2b22" }}>
                            {a.candidate.fullName}
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">{a.skill}</span>
                        </td>
                        <td>
                          <span className="fw-semibold" style={{ color: "#0d4f3c" }}>
                            {a.score !== null ? `${a.score} / ${a.totalQuestions}` : "—"}
                          </span>
                        </td>
                        <td>
                          {a.violations > 0 ? (
                            <span className="badge bg-danger" style={{ fontSize: "11.5px" }}>
                              <i className="fa-solid fa-triangle-exclamation me-1"></i> {a.violations} infractions
                            </span>
                          ) : (
                            <span className="badge bg-success-subtle text-success border">0 Clean</span>
                          )}
                        </td>
                        <td>
                          {a.timeExceeded ? (
                            <span className="badge bg-warning text-dark">
                              <i className="fa-solid fa-hourglass-end me-1"></i> Exceeded
                            </span>
                          ) : (
                            <span className="badge bg-light text-muted border">Within limit</span>
                          )}
                        </td>
                        <td className="text-muted">
                          {a.completedAt
                            ? new Date(a.completedAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn-invalidate"
                            disabled={acting === a.id}
                            onClick={() => handleInvalidateAssessment(a.id)}
                          >
                            <i className="fa-solid fa-ban me-1"></i>
                            {acting === a.id ? "Invalidating..." : "Invalidate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* 2. Mock Interviews Card */}
          <div className="elite-card">
            <div className="elite-card-header">
              <h2 className="elite-card-title">
                <i className="fa-solid fa-user-tie" style={{ color: "#429e85" }}></i>
                Mock Interviews ({interviews.length})
              </h2>
            </div>

            <div className="proctor-table-wrap">
              {interviews.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="fa-solid fa-headset text-success fs-2 mb-2"></i>
                  <p className="mb-0 fw-semibold">No mock interviews matching current filter criteria.</p>
                </div>
              ) : (
                <table className="proctor-table">
                  <thead>
                    <tr>
                      <th>Candidate Name</th>
                      <th>Job Role</th>
                      <th>Overall Rating</th>
                      <th>Proctor Violations</th>
                      <th>Time Limit</th>
                      <th>Completed Date</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interviews.map((i) => (
                      <tr key={i.id}>
                        <td>
                          <div className="fw-bold" style={{ color: "#0b2b22" }}>
                            {i.candidate.fullName}
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">{i.jobRole}</span>
                        </td>
                        <td>
                          <span className="fw-semibold" style={{ color: "#0d4f3c" }}>
                            {i.overallRating !== null ? `${i.overallRating} / 5` : "—"}
                          </span>
                        </td>
                        <td>
                          {i.violations > 0 ? (
                            <span className="badge bg-danger" style={{ fontSize: "11.5px" }}>
                              <i className="fa-solid fa-triangle-exclamation me-1"></i> {i.violations} infractions
                            </span>
                          ) : (
                            <span className="badge bg-success-subtle text-success border">0 Clean</span>
                          )}
                        </td>
                        <td>
                          {i.timeExceeded ? (
                            <span className="badge bg-warning text-dark">
                              <i className="fa-solid fa-hourglass-end me-1"></i> Exceeded
                            </span>
                          ) : (
                            <span className="badge bg-light text-muted border">Within limit</span>
                          )}
                        </td>
                        <td className="text-muted">
                          {i.completedAt
                            ? new Date(i.completedAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn-invalidate"
                            disabled={acting === i.id}
                            onClick={() => handleInvalidateInterview(i.id)}
                          >
                            <i className="fa-solid fa-ban me-1"></i>
                            {acting === i.id ? "Invalidating..." : "Invalidate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
