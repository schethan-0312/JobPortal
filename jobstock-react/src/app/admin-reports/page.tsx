"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import Swal from "sweetalert2";
import toast, { Toaster } from "react-hot-toast";

interface Report {
  id: string;
  targetType: string;
  jobId: string;
  reportedEmployerId: string;
  reporterId: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter: { email: string };
  job: { title: string; slug: string };
}

export default function AdminReportsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [reports, setReports] = useState<Report[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function loadReports(isSilent = false) {
    if (!isSilent) setDataLoading(true);
    try {
      const res = await api.get<Report[]>("/admin/reports");
      setReports(res);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed to Load Reports",
        text: err instanceof ApiError ? err.message : "Failed to load reports",
        customClass: {
          popup: "elite-pkg-popup",
          title: "elite-pkg-title",
          confirmButton: "elite-pkg-btn",
        },
        confirmButtonColor: "#0d4f3c",
      });
    } finally {
      setDataLoading(false);
    }
  }

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    loadReports();
  }, [user]);

  async function handleResolve(id: string) {
    const confirm = await Swal.fire({
      title: "Resolve this Report?",
      text: "Marking this report resolved will archive it and remove it from open moderation list.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0d4f3c",
      cancelButtonColor: "#8ea59d",
      confirmButtonText: "Yes, Resolve",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "elite-pkg-popup",
        title: "elite-pkg-title",
        confirmButton: "elite-pkg-btn",
      },
    });

    if (!confirm.isConfirmed) return;

    setActingId(id);
    try {
      const resolutionNote = notes[id]?.trim();
      await api.patch(`/admin/reports/${id}/resolve`, resolutionNote ? { resolutionNote } : {});
      setReports((prev) => prev.filter((r) => r.id !== id));
      toast.success("Report resolved successfully!");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Resolution Failed",
        text: err instanceof ApiError ? err.message : "Failed to resolve report",
        customClass: {
          popup: "elite-pkg-popup",
          title: "elite-pkg-title",
          confirmButton: "elite-pkg-btn",
        },
        confirmButtonColor: "#0d4f3c",
      });
    } finally {
      setActingId(null);
    }
  }

  async function handleFlagJob(jobId: string) {
    const confirm = await Swal.fire({
      title: "Flag this Job Listing?",
      text: "Flagging this job marks it as suspicious and restrains it from standard public candidate view.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d94348",
      cancelButtonColor: "#8ea59d",
      confirmButtonText: "Yes, Flag Job",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "elite-pkg-popup",
        title: "elite-pkg-title",
        confirmButton: "elite-pkg-btn",
      },
    });

    if (!confirm.isConfirmed) return;

    try {
      await api.patch(`/admin/jobs/${jobId}/flag`);
      setFlaggedIds((prev) => new Set(prev).add(jobId));
      toast.success("Job flagged successfully!");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Flagging Failed",
        text: err instanceof ApiError ? err.message : "Failed to flag job",
        customClass: {
          popup: "elite-pkg-popup",
          title: "elite-pkg-title",
          confirmButton: "elite-pkg-btn",
        },
        confirmButtonColor: "#0d4f3c",
      });
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

        .report-item-card {
          background: #ffffff;
          border: 1px solid #e7efe9;
          border-radius: 14px;
          padding: 18px 20px;
          margin-bottom: 16px;
          transition: all 0.2s ease;
        }
        .report-item-card:hover {
          border-color: #cbdad3;
          box-shadow: 0 6px 18px rgba(13, 79, 60, 0.05);
        }

        .btn-resolve {
          background: #0d4f3c;
          border: 1px solid #0d4f3c;
          color: #ffffff;
          font-weight: 600;
          font-size: 13px;
          padding: 7px 16px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .btn-resolve:hover {
          background: #08382b;
          color: #ffffff;
        }
        .btn-flag {
          background: #ffffff;
          border: 1px solid #fca5a5;
          color: #dc2626;
          font-weight: 600;
          font-size: 13px;
          padding: 7px 16px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .btn-flag:hover {
          background: #fee2e2;
          border-color: #ef4444;
          color: #b91c1c;
        }

        .filter-input {
          background: #ffffff;
          border: 1.5px solid #d6e8e4;
          border-radius: 9px;
          padding: 7px 12px;
          font-size: 13px;
          color: #0b2b22;
          transition: all 0.2s;
        }
        .filter-input:focus {
          border-color: #429e85;
          outline: none;
          box-shadow: 0 0 0 3px rgba(66, 158, 133, 0.15);
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
        <AdminSidebar active="reports" />

        <div className="dashboard-content pkg-page">
          {/* Header */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
              <h1 className="pkg-header-title mb-1">Reports Moderation</h1>
              <p className="pkg-header-subtitle mb-0">
                Review suspicious job submissions, investigate candidate reports, and resolve issues.
              </p>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="row align-items-center gx-4 gy-4 mb-4">
            <div className="col-12 col-sm-6 col-md-6 col-lg-4">
              <div className="dash-wrap-bloud">
                <div className="dash-wrap-glow" style={{ background: "#ffe8eb" }}></div>
                <div className="dash-wrap-bloud-icon">
                  <div className="bloud-icon" style={{ backgroundColor: "#fcf0f2", color: "#d94348" }}>
                    <i className="fa-solid fa-triangle-exclamation"></i>
                  </div>
                </div>
                <div className="dash-wrap-bloud-caption">
                  <div className="dash-wrap-bloud-content">
                    <h5 className="ctr">{reports.length}</h5>
                    <p>Active Open Reports</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-md-6 col-lg-4">
              <div className="dash-wrap-bloud">
                <div className="dash-wrap-glow" style={{ background: "#fff3dc" }}></div>
                <div className="dash-wrap-bloud-icon">
                  <div className="bloud-icon" style={{ backgroundColor: "#fdf3e0", color: "#b07c1a" }}>
                    <i className="fa-solid fa-flag"></i>
                  </div>
                </div>
                <div className="dash-wrap-bloud-caption">
                  <div className="dash-wrap-bloud-content">
                    <h5 className="ctr">{flaggedIds.size}</h5>
                    <p>Flagged in Session</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-md-6 col-lg-4">
              <div className="dash-wrap-bloud">
                <div className="dash-wrap-glow" style={{ background: "#dbfbf5" }}></div>
                <div className="dash-wrap-bloud-icon">
                  <div className="bloud-icon" style={{ backgroundColor: "#def5f0", color: "#134d42" }}>
                    <i className="fa-solid fa-shield-halved"></i>
                  </div>
                </div>
                <div className="dash-wrap-bloud-caption">
                  <div className="dash-wrap-bloud-content">
                    <h5 className="ctr" style={{ fontSize: "1.5rem" }}>{reports.length === 0 ? "Clean" : "Action Req."}</h5>
                    <p>Platform Status</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reports Main Card */}
          <div className="elite-card">
            <div className="elite-card-header">
              <h2 className="elite-card-title">
                <i className="fa-solid fa-list-check" style={{ color: "#429e85" }}></i>
                Pending Reports ({reports.length})
              </h2>
            </div>

            <div className="p-4">
              {dataLoading && (
                <div className="text-center py-5">
                  <i className="fa-solid fa-circle-notch fa-spin text-muted fs-2 mb-2"></i>
                  <p className="text-muted fw-semibold">Loading reports queue...</p>
                </div>
              )}

              {!dataLoading && reports.length === 0 && (
                <div className="text-center py-5">
                  <i className="fa-solid fa-circle-check text-success fs-1 mb-2"></i>
                  <h5 className="fw-bold" style={{ color: "#0b2b22" }}>All Caught Up!</h5>
                  <p className="text-muted small mb-0">No open reports at this moment. Platform jobs are clean.</p>
                </div>
              )}

              {!dataLoading && reports.length > 0 && (
                <div>
                  {reports.map((r) => (
                    <div className="report-item-card" key={r.id}>
                      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                        <div>
                          <h4 className="fw-bold mb-1" style={{ color: "#0b2b22", fontSize: "16px" }}>
                            {r.job?.title ?? "Unknown Job Listing"}
                          </h4>
                          <div className="text-muted small" style={{ fontSize: "12.5px" }}>
                            <i className="fa-solid fa-user me-1 text-muted"></i>
                            Reported by <strong>{r.reporter?.email ?? "Unknown"}</strong>
                            <span className="mx-2">•</span>
                            <i className="fa-solid fa-calendar-day me-1 text-muted"></i>
                            {new Date(r.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>

                        <span
                          className="badge"
                          style={{
                            background: "#fee2e2",
                            color: "#dc2626",
                            border: "1px solid #fecaca",
                            padding: "6px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: 700
                          }}
                        >
                          <i className="fa-solid fa-circle-exclamation me-1"></i> {r.status}
                        </span>
                      </div>

                      <div
                        className="p-3 rounded-3 mb-3"
                        style={{ background: "#fbfdfc", border: "1px solid #e7efe9", fontSize: "13.5px", color: "#334d44" }}
                      >
                        <strong>Reason:</strong> {r.reason}
                      </div>

                      <div className="d-flex flex-wrap align-items-center gap-2">
                        <input
                          type="text"
                          className="filter-input flex-grow-1"
                          style={{ minWidth: "220px", maxWidth: "420px" }}
                          placeholder="Resolution note (optional)..."
                          value={notes[r.id] ?? ""}
                          onChange={(e) =>
                            setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))
                          }
                        />

                        <button
                          type="button"
                          className="btn-resolve"
                          disabled={actingId === r.id}
                          onClick={() => handleResolve(r.id)}
                        >
                          <i className="fa-solid fa-check"></i>
                          {actingId === r.id ? "Resolving..." : "Resolve Report"}
                        </button>

                        <button
                          type="button"
                          className="btn-flag"
                          disabled={flaggedIds.has(r.jobId)}
                          onClick={() => handleFlagJob(r.jobId)}
                        >
                          <i className="fa-solid fa-flag"></i>
                          {flaggedIds.has(r.jobId) ? "Job Flagged" : "Flag Job"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
