"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import Swal from "sweetalert2";
import toast, { Toaster } from "react-hot-toast";

interface JobReport {
  id: string;
  reason: string;
  status: string;
  resolutionNote: string | null;
  createdAt: string;
  reporter: { email: string };
}

interface JobDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  jobType: string;
  status: string;
  salaryMin: number | null;
  salaryMax: number | null;
  createdAt: string;
  employer: { id: string; companyName: string; status: string };
  reports: JobReport[];
  _count: { applications: number };
}

export default function AdminJobDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [fetching, setFetching] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function loadDetail(isSilent = false) {
    if (!isSilent) setFetching(true);
    try {
      const res = await api.get<JobDetail>(`/admin/job-moderation/${id}`);
      setDetail(res);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed to Load",
        text: err instanceof ApiError ? err.message : "Failed to load job detail",
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
    loadDetail();
  }, [user, id]);

  async function handleSetStatus(newStatus: string) {
    let actionVerb = newStatus.toLowerCase();
    let confirmText = `Are you sure you want to ${actionVerb} this job posting?`;
    let confirmBtnText = `Yes, ${actionVerb}`;
    let confirmBtnColor = newStatus === "FLAGGED" ? "#d94348" : newStatus === "OPEN" ? "#0d4f3c" : "#6c757d";

    if (newStatus === "FLAGGED") {
      confirmText = "Flagging this job will hide or mark it suspicious in public searches.";
      confirmBtnText = "Yes, Flag Job";
    } else if (newStatus === "OPEN") {
      confirmText = "This will restore and unflag the job to active public status.";
      confirmBtnText = "Yes, Reopen Job";
    } else if (newStatus === "CLOSED") {
      confirmText = "This will close the job listing so candidates can no longer apply.";
      confirmBtnText = "Yes, Close Listing";
    }

    const confirm = await Swal.fire({
      title: `Update Status to ${newStatus}?`,
      text: confirmText,
      icon: newStatus === "FLAGGED" ? "warning" : "question",
      showCancelButton: true,
      confirmButtonColor: confirmBtnColor,
      cancelButtonColor: "#8ea59d",
      confirmButtonText: confirmBtnText,
      cancelButtonText: "Cancel",
      customClass: {
        popup: "elite-pkg-popup",
        title: "elite-pkg-title",
        confirmButton: "elite-pkg-btn",
      },
    });

    if (!confirm.isConfirmed) return;

    setActing(true);
    try {
      await api.patch(`/admin/job-moderation/${id}/status`, { status: newStatus });
      toast.success(`Job status updated to ${newStatus} successfully!`);
      await loadDetail(true);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Status Update Failed",
        text: err instanceof ApiError ? err.message : "Failed to update job status",
        customClass: {
          popup: "elite-pkg-popup",
          title: "elite-pkg-title",
          confirmButton: "elite-pkg-btn",
        },
        confirmButtonColor: "#0d4f3c",
      });
    } finally {
      setActing(false);
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
        .mint-refresh-btn {
          background: #ffffff;
          border: 1.5px solid #d6e8e4;
          color: #0d4f3c;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 9px;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
        }
        .mint-refresh-btn:hover {
          background: #e8f5f1;
          border-color: #429e85;
          color: #08382b;
        }
        .stat-card-custom {
          background: #ffffff;
          border: 1px solid #d6e8e4;
          border-radius: 16px;
          padding: 20px 22px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 18px rgba(13, 79, 60, 0.04);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .stat-card-custom:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(13, 79, 60, 0.08);
        }
        .stat-glow {
          position: absolute;
          width: 90px;
          height: 90px;
          border-radius: 50%;
          right: -20px;
          bottom: -20px;
          opacity: 0.15;
          pointer-events: none;
        }
        .stat-glow.mint { background: #429e85; }
        .stat-glow.amber { background: #f59e0b; }
        .stat-glow.red { background: #ef4444; }

        .stat-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          margin-bottom: 12px;
        }
        .stat-icon-wrap.mint { background: #e8f5f1; color: #0d4f3c; }
        .stat-icon-wrap.amber { background: #fef3c7; color: #d97706; }
        .stat-icon-wrap.red { background: #fee2e2; color: #dc2626; }

        .stat-number {
          font-size: 26px;
          font-weight: 800;
          color: #0b2b22;
          line-height: 1.1;
          margin-bottom: 4px;
        }
        .stat-label {
          font-size: 12.5px;
          font-weight: 600;
          color: #5c756d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
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

        .badge-status {
          font-size: 12px;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .badge-status.open { background: #e8f5f1; color: #0d4f3c; border: 1px solid #bce2d8; }
        .badge-status.flagged { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
        .badge-status.closed { background: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb; }

        .btn-action-primary {
          background: #0d4f3c;
          border: 1px solid #0d4f3c;
          color: #ffffff;
          font-weight: 600;
          font-size: 13px;
          padding: 7px 14px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .btn-action-primary:hover {
          background: #08382b;
          color: #ffffff;
        }
        .btn-action-danger {
          background: #fff;
          border: 1px solid #fca5a5;
          color: #dc2626;
          font-weight: 600;
          font-size: 13px;
          padding: 7px 14px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .btn-action-danger:hover {
          background: #fee2e2;
          border-color: #ef4444;
          color: #b91c1c;
        }
        .btn-action-secondary {
          background: #fff;
          border: 1px solid #d6e8e4;
          color: #4b5563;
          font-weight: 600;
          font-size: 13px;
          padding: 7px 14px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .btn-action-secondary:hover {
          background: #f4f9f8;
          color: #111827;
        }

        .info-label {
          font-size: 12px;
          font-weight: 700;
          color: #718b82;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }
        .info-value {
          font-size: 14.5px;
          font-weight: 600;
          color: #0b2b22;
        }

        .report-item-box {
          background: #ffffff;
          border: 1px solid #e7efe9;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          transition: all 0.2s;
        }
        .report-item-box:hover {
          border-color: #cbdad3;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
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
        <AdminSidebar active="jobs" />

        <div className="dashboard-content pkg-page">
          {/* Header */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <Link href="/admin-jobs" className="mint-refresh-btn py-1 px-2" style={{ fontSize: "12px" }}>
                  <i className="fa-solid fa-arrow-left"></i> Back to Jobs
                </Link>
                <h1 className="pkg-header-title mb-0">{detail?.title || "Job Moderation Detail"}</h1>
              </div>
              <p className="pkg-header-subtitle mb-0">
                Inspect job description, moderation reports, applicant statistics, and manage status.
              </p>
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="mint-refresh-btn"
                onClick={() => loadDetail()}
                disabled={fetching}
              >
                <i className={`fa-solid fa-rotate-right ${fetching ? "fa-spin" : ""}`}></i> Refresh Details
              </button>
            </div>
          </div>

          {fetching && !detail && (
            <div className="text-center py-5">
              <i className="fa-solid fa-circle-notch fa-spin text-muted fs-2 mb-2"></i>
              <p className="text-muted fw-semibold">Loading job details...</p>
            </div>
          )}

          {detail && (
            <>
              {/* Stat Cards */}
              <div className="row g-3 mb-4">
                <div className="col-12 col-md-4">
                  <div className="stat-card-custom">
                    <div className="stat-glow mint"></div>
                    <div className="stat-icon-wrap mint">
                      <i className="fa-solid fa-users"></i>
                    </div>
                    <div className="stat-number">{detail._count?.applications ?? 0}</div>
                    <div className="stat-label">Applications Received</div>
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <div className="stat-card-custom">
                    <div className="stat-glow red"></div>
                    <div className="stat-icon-wrap red">
                      <i className="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <div className="stat-number">{detail.reports?.length ?? 0}</div>
                    <div className="stat-label">User Reports Filed</div>
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <div className="stat-card-custom">
                    <div className="stat-glow amber"></div>
                    <div className="stat-icon-wrap amber">
                      <i className="fa-solid fa-briefcase"></i>
                    </div>
                    <div className="stat-number text-capitalize" style={{ fontSize: "20px", paddingTop: "4px" }}>
                      {detail.status.toLowerCase()}
                    </div>
                    <div className="stat-label">Current Moderation State</div>
                  </div>
                </div>
              </div>

              {/* Main Content Info */}
              <div className="elite-card">
                <div className="elite-card-header">
                  <div className="d-flex align-items-center gap-3">
                    <h2 className="elite-card-title">
                      <i className="fa-solid fa-file-lines" style={{ color: "#429e85" }}></i>
                      Job Information
                    </h2>
                    <span className={`badge-status ${detail.status.toLowerCase()}`}>
                      <i className="fa-solid fa-circle" style={{ fontSize: "7px" }}></i>
                      {detail.status}
                    </span>
                  </div>

                  <div className="d-flex gap-2 flex-wrap">
                    {detail.status !== "FLAGGED" && (
                      <button
                        type="button"
                        className="btn-action-danger"
                        disabled={acting}
                        onClick={() => handleSetStatus("FLAGGED")}
                      >
                        <i className="fa-solid fa-flag"></i> Flag Job
                      </button>
                    )}
                    {detail.status === "FLAGGED" && (
                      <button
                        type="button"
                        className="btn-action-primary"
                        disabled={acting}
                        onClick={() => handleSetStatus("OPEN")}
                      >
                        <i className="fa-solid fa-check-circle"></i> Unflag & Reopen
                      </button>
                    )}
                    {detail.status !== "CLOSED" && (
                      <button
                        type="button"
                        className="btn-action-secondary"
                        disabled={acting}
                        onClick={() => handleSetStatus("CLOSED")}
                      >
                        <i className="fa-solid fa-lock"></i> Close Listing
                      </button>
                    )}
                    {detail.status === "CLOSED" && (
                      <button
                        type="button"
                        className="btn-action-primary"
                        disabled={acting}
                        onClick={() => handleSetStatus("OPEN")}
                      >
                        <i className="fa-solid fa-envelope-open"></i> Reopen Listing
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-4">
                      <div className="info-label">Employer / Company</div>
                      <div className="info-value">
                        {detail.employer?.companyName || "Unknown"}{" "}
                        <span className="badge bg-light text-dark border ms-1" style={{ fontSize: "11px" }}>
                          {detail.employer?.status}
                        </span>
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <div className="info-label">Category</div>
                      <div className="info-value">{detail.category || "General"}</div>
                    </div>

                    <div className="col-12 col-md-4">
                      <div className="info-label">Location & Type</div>
                      <div className="info-value">
                        {detail.location || "Remote"} • {detail.jobType}
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <div className="info-label">Salary Range</div>
                      <div className="info-value">
                        {detail.salaryMin && detail.salaryMax
                          ? `₹${Number(detail.salaryMin).toLocaleString("en-IN")} - ₹${Number(detail.salaryMax).toLocaleString("en-IN")}`
                          : "Not specified"}
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <div className="info-label">Posted Date</div>
                      <div className="info-value">
                        {new Date(detail.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <div className="info-label">Total Applications</div>
                      <div className="info-value text-success">
                        <i className="fa-solid fa-users me-1"></i> {detail._count?.applications ?? 0} candidates
                      </div>
                    </div>
                  </div>

                  <div className="border-top pt-3">
                    <div className="info-label mb-2">Job Description</div>
                    <div
                      className="p-3 rounded-3"
                      style={{ background: "#fbfdfc", border: "1px solid #e7efe9", fontSize: "14px", lineHeight: "1.7", color: "#334d44", whiteSpace: "pre-wrap" }}
                    >
                      {detail.description || "No description provided."}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reports Section */}
              <div className="elite-card">
                <div className="elite-card-header">
                  <h2 className="elite-card-title">
                    <i className="fa-solid fa-shield-halved" style={{ color: "#d97706" }}></i>
                    Job Reports ({detail.reports?.length ?? 0})
                  </h2>
                </div>

                <div className="p-4">
                  {(!detail.reports || detail.reports.length === 0) ? (
                    <div className="text-center py-4 text-muted">
                      <i className="fa-solid fa-circle-check text-success fs-3 mb-2"></i>
                      <p className="mb-0 fw-semibold">No reports filed against this job. Listing is in good standing.</p>
                    </div>
                  ) : (
                    <div>
                      {detail.reports.map((r) => (
                        <div key={r.id} className="report-item-box">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="d-flex align-items-center gap-2">
                              <span className="fw-bold" style={{ color: "#0b2b22", fontSize: "13.5px" }}>
                                <i className="fa-solid fa-user-tag me-1 text-muted"></i>
                                {r.reporter?.email || "Anonymous user"}
                              </span>
                              <span className="text-muted" style={{ fontSize: "12px" }}>
                                • {new Date(r.createdAt).toLocaleString("en-IN")}
                              </span>
                            </div>
                            <span
                              className={`badge-status ${r.status === "OPEN" ? "flagged" : "open"}`}
                              style={{ fontSize: "11px", padding: "3px 8px" }}
                            >
                              {r.status}
                            </span>
                          </div>

                          <div className="p-2 rounded bg-light mb-2" style={{ fontSize: "13.5px", color: "#334d44" }}>
                            <strong>Report Reason:</strong> {r.reason}
                          </div>

                          {r.resolutionNote && (
                            <div className="small text-muted ps-1">
                              <strong>Admin Resolution Note:</strong> {r.resolutionNote}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
