"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl } from "@/lib/api";
import Swal from "sweetalert2";
import toast, { Toaster } from "react-hot-toast";

interface JobSummary {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

interface Payment {
  id: string;
  amountInPaisa: number;
  status: string;
  createdAt: string;
  package: { name: string };
}

interface VerificationHistoryEntry {
  id: string;
  decision: string;
  reason: string | null;
  requestedDocuments: string[];
  adminId: string;
  createdAt: string;
}

interface EmployerDetail {
  id: string;
  companyName: string;
  status: string;
  location: string | null;
  industry: string | null;
  description: string | null;
  user: { email: string; createdAt: string };
  jobs: JobSummary[];
  payments: Payment[];
  hiresCount: number;
  messageCount: number;
  verificationHistory: VerificationHistoryEntry[];
  activePackage: { package: { name: string } } | null;
  gstCertificateUrl: string | null;
  incorporationCertUrl: string | null;
  signatoryIdUrl: string | null;
  documentsSubmittedAt: string | null;
}

function formatMoney(paisa: number) {
  return `₹${(paisa / 100).toLocaleString("en-IN")}`;
}

export default function AdminEmployerDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [detail, setDetail] = useState<EmployerDetail | null>(null);
  const [fetching, setFetching] = useState(true);
  const [clearingContent, setClearingContent] = useState(false);
  const [actingDecision, setActingDecision] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function loadDetail(isSilent = false) {
    if (!isSilent) setFetching(true);
    try {
      const res = await api.get<EmployerDetail>(`/admin/employer-management/${id}`);
      setDetail(res);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed to Load",
        text: err instanceof ApiError ? err.message : "Failed to load employer detail",
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

  async function handleClearDescription() {
    const confirm = await Swal.fire({
      title: "Clear Company Description?",
      text: "This action will remove the company description content and cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d94348",
      cancelButtonColor: "#8ea59d",
      confirmButtonText: "Yes, Clear Description",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "elite-pkg-popup",
        title: "elite-pkg-title",
        confirmButton: "elite-pkg-btn",
      },
    });

    if (!confirm.isConfirmed) return;

    setClearingContent(true);
    try {
      await api.patch(`/admin/content-moderation/employers/${id}/clear-content`, {
        fields: ["description"],
        reason: "Cleared via admin content moderation",
      });
      toast.success("Employer description cleared successfully!");
      await loadDetail(true);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Clear Failed",
        text: err instanceof ApiError ? err.message : "Failed to clear content",
        customClass: {
          popup: "elite-pkg-popup",
          title: "elite-pkg-title",
          confirmButton: "elite-pkg-btn",
        },
        confirmButtonColor: "#0d4f3c",
      });
    } finally {
      setClearingContent(false);
    }
  }

  async function handleDecision(decision: "VERIFIED" | "REJECTED" | "SUSPENDED") {
    if (!id || typeof id !== "string") return;

    let title = `Change Status to ${decision}?`;
    let text = `Are you sure you want to change this employer status to ${decision}?`;
    let confirmBtnColor = decision === "SUSPENDED" ? "#d94348" : "#0d4f3c";

    if (decision === "SUSPENDED") {
      text = "Suspending will disable the employer's active postings and account access.";
    } else if (decision === "VERIFIED") {
      text = "This will verify/reopen the employer account and restore normal platform privileges.";
    }

    const confirm = await Swal.fire({
      title: title,
      text: text,
      icon: decision === "SUSPENDED" ? "warning" : "question",
      showCancelButton: true,
      confirmButtonColor: confirmBtnColor,
      cancelButtonColor: "#8ea59d",
      confirmButtonText: `Yes, ${decision === "SUSPENDED" ? "Suspend" : "Reopen / Verify"}`,
      cancelButtonText: "Cancel",
      customClass: {
        popup: "elite-pkg-popup",
        title: "elite-pkg-title",
        confirmButton: "elite-pkg-btn",
      },
    });

    if (!confirm.isConfirmed) return;

    setActingDecision(decision);
    try {
      await api.patch(`/admin/employers/${id}/verify`, { decision });
      toast.success(`Employer status updated to ${decision}!`);
      await loadDetail(true);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: err instanceof ApiError ? err.message : "Failed to update employer status",
        customClass: {
          popup: "elite-pkg-popup",
          title: "elite-pkg-title",
          confirmButton: "elite-pkg-btn",
        },
        confirmButtonColor: "#0d4f3c",
      });
    } finally {
      setActingDecision(null);
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
        .stat-glow.blue { background: #3b82f6; }
        .stat-glow.purple { background: #8b5cf6; }

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
        .stat-icon-wrap.blue { background: #eff6ff; color: #2563eb; }
        .stat-icon-wrap.purple { background: #f3e8ff; color: #7c3aed; }

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
          font-size: 11.5px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .badge-status.verified { background: #e8f5f1; color: #0d4f3c; border: 1px solid #bce2d8; }
        .badge-status.pending { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
        .badge-status.rejected { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
        .badge-status.info_requested { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
        .badge-status.suspended { background: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb; }

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

        .doc-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }
        .doc-pill.active {
          background: #e8f5f1;
          color: #0d4f3c;
          border: 1.5px solid #bce2d8;
        }
        .doc-pill.active:hover {
          background: #d4ece5;
          color: #08382b;
        }
        .doc-pill.empty {
          background: #f8faf9;
          color: #8da49c;
          border: 1.5px dashed #d6e8e4;
        }

        .elite-table-wrap {
          width: 100%;
          overflow-x: auto;
        }
        .elite-table {
          width: 100%;
          min-width: 600px;
          border-collapse: collapse;
        }
        .elite-table th {
          background: #f8fbfa;
          color: #446158;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 12px 16px;
          border-bottom: 1px solid #d6e8e4;
        }
        .elite-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #eef5f3;
          color: #334d44;
          font-size: 13.5px;
          vertical-align: middle;
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
        <AdminSidebar active="employer-directory" />

        <div className="dashboard-content pkg-page">
          {/* Header */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <Link href="/admin-employer-directory" className="mint-refresh-btn py-1 px-2" style={{ fontSize: "12px" }}>
                  <i className="fa-solid fa-arrow-left"></i> Back to Directory
                </Link>
                <h1 className="pkg-header-title mb-0">{detail?.companyName || "Employer Profile"}</h1>
              </div>
              <p className="pkg-header-subtitle mb-0">
                Detailed profile overview, verification compliance, posted jobs, and billing records.
              </p>
            </div>
            <div className="d-flex gap-2 align-items-center">
              {detail && (
                <>
                  <button
                    type="button"
                    className="btn-action-danger"
                    disabled={!!actingDecision || detail.status === "SUSPENDED"}
                    onClick={() => handleDecision("SUSPENDED")}
                  >
                    <i className="fa-solid fa-ban"></i> {actingDecision === "SUSPENDED" ? "Suspending..." : "Suspend"}
                  </button>
                  {detail.status === "SUSPENDED" && (
                    <button
                      type="button"
                      className="btn-action-primary"
                      disabled={!!actingDecision}
                      onClick={() => handleDecision("VERIFIED")}
                    >
                      <i className="fa-solid fa-rotate-left"></i> {actingDecision === "VERIFIED" ? "Reopening..." : "Reopen"}
                    </button>
                  )}
                </>
              )}
              <button
                type="button"
                className="mint-refresh-btn"
                onClick={() => loadDetail()}
                disabled={fetching}
              >
                <i className={`fa-solid fa-rotate-right ${fetching ? "fa-spin" : ""}`}></i> Refresh
              </button>
            </div>
          </div>

          {fetching && !detail && (
            <div className="text-center py-5">
              <i className="fa-solid fa-circle-notch fa-spin text-muted fs-2 mb-2"></i>
              <p className="text-muted fw-semibold">Loading employer details...</p>
            </div>
          )}

          {detail && (
            <>
              {/* Stat Cards */}
              <div className="row g-3 mb-4">
                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="stat-card-custom">
                    <div className="stat-glow mint"></div>
                    <div className="stat-icon-wrap mint">
                      <i className="fa-solid fa-briefcase"></i>
                    </div>
                    <div className="stat-number">{detail.jobs.length}</div>
                    <div className="stat-label">Jobs Posted</div>
                  </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="stat-card-custom">
                    <div className="stat-glow blue"></div>
                    <div className="stat-icon-wrap blue">
                      <i className="fa-solid fa-user-check"></i>
                    </div>
                    <div className="stat-number">{detail.hiresCount}</div>
                    <div className="stat-label">Hires Offered</div>
                  </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="stat-card-custom">
                    <div className="stat-glow purple"></div>
                    <div className="stat-icon-wrap purple">
                      <i className="fa-solid fa-comments"></i>
                    </div>
                    <div className="stat-number">{detail.messageCount}</div>
                    <div className="stat-label">Messages Exchanged</div>
                  </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="stat-card-custom">
                    <div className="stat-glow amber"></div>
                    <div className="stat-icon-wrap amber">
                      <i className="fa-solid fa-shield"></i>
                    </div>
                    <div className="stat-number" style={{ fontSize: "20px", paddingTop: "4px" }}>
                      <span className={`badge-status ${detail.status.toLowerCase()}`}>
                        {detail.status}
                      </span>
                    </div>
                    <div className="stat-label">Verification Status</div>
                  </div>
                </div>
              </div>

              {/* Company Info */}
              <div className="elite-card">
                <div className="elite-card-header">
                  <h2 className="elite-card-title">
                    <i className="fa-solid fa-building" style={{ color: "#429e85" }}></i>
                    Company Overview
                  </h2>
                  {detail.description && (
                    <button
                      type="button"
                      className="btn-action-danger py-1 px-2"
                      style={{ fontSize: "12px" }}
                      disabled={clearingContent}
                      onClick={handleClearDescription}
                    >
                      <i className="fa-solid fa-eraser"></i> Clear Description
                    </button>
                  )}
                </div>

                <div className="p-4">
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-4">
                      <div className="info-label">Account Email</div>
                      <div className="info-value">{detail.user.email}</div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="info-label">Location</div>
                      <div className="info-value">{detail.location ?? "Not specified"}</div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="info-label">Industry</div>
                      <div className="info-value">{detail.industry ?? "Not specified"}</div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="info-label">Active Subscription</div>
                      <div className="info-value">
                        {detail.activePackage?.package.name ? (
                          <span className="badge bg-light text-dark border">
                            <i className="fa-solid fa-crown me-1 text-warning"></i>
                            {detail.activePackage.package.name}
                          </span>
                        ) : (
                          "None"
                        )}
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="info-label">Member Since</div>
                      <div className="info-value">
                        {new Date(detail.user.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="border-top pt-3">
                    <div className="info-label mb-2">Company Description</div>
                    <div
                      className="p-3 rounded-3"
                      style={{ background: "#fbfdfc", border: "1px solid #e7efe9", fontSize: "14px", lineHeight: "1.7", color: "#334d44", whiteSpace: "pre-wrap" }}
                    >
                      {detail.description || "No description provided."}
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification Documents */}
              <div className="elite-card">
                <div className="elite-card-header">
                  <h2 className="elite-card-title">
                    <i className="fa-solid fa-file-circle-check" style={{ color: "#429e85" }}></i>
                    Verification Documents
                  </h2>
                </div>

                <div className="p-4">
                  <div className="d-flex flex-wrap gap-3">
                    {detail.gstCertificateUrl ? (
                      <a
                        href={assetUrl(detail.gstCertificateUrl) ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="doc-pill active"
                      >
                        <i className="fa-solid fa-file-pdf"></i> GST Certificate
                        <i className="fa-solid fa-arrow-up-right-from-square ms-1" style={{ fontSize: "11px" }}></i>
                      </a>
                    ) : (
                      <div className="doc-pill empty">
                        <i className="fa-solid fa-file-excel"></i> No GST Certificate
                      </div>
                    )}

                    {detail.incorporationCertUrl ? (
                      <a
                        href={assetUrl(detail.incorporationCertUrl) ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="doc-pill active"
                      >
                        <i className="fa-solid fa-file-pdf"></i> Incorporation Certificate
                        <i className="fa-solid fa-arrow-up-right-from-square ms-1" style={{ fontSize: "11px" }}></i>
                      </a>
                    ) : (
                      <div className="doc-pill empty">
                        <i className="fa-solid fa-file-excel"></i> No Incorporation Certificate
                      </div>
                    )}

                    {detail.signatoryIdUrl ? (
                      <a
                        href={assetUrl(detail.signatoryIdUrl) ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="doc-pill active"
                      >
                        <i className="fa-solid fa-id-card"></i> Signatory ID
                        <i className="fa-solid fa-arrow-up-right-from-square ms-1" style={{ fontSize: "11px" }}></i>
                      </a>
                    ) : (
                      <div className="doc-pill empty">
                        <i className="fa-solid fa-file-excel"></i> No Signatory ID
                      </div>
                    )}
                  </div>

                  {detail.documentsSubmittedAt && (
                    <p className="small text-muted mt-3 mb-0">
                      <i className="fa-solid fa-clock me-1"></i>
                      Last document submission: {new Date(detail.documentsSubmittedAt).toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              </div>

              {/* Jobs Posted */}
              <div className="elite-card">
                <div className="elite-card-header">
                  <h2 className="elite-card-title">
                    <i className="fa-solid fa-list-check" style={{ color: "#429e85" }}></i>
                    Jobs Posted ({detail.jobs.length})
                  </h2>
                </div>

                <div className="elite-table-wrap">
                  {detail.jobs.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      <p className="mb-0 fw-semibold">No jobs posted yet by this employer.</p>
                    </div>
                  ) : (
                    <table className="elite-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Status</th>
                          <th>Posted Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.jobs.map((j) => (
                          <tr key={j.id}>
                            <td className="fw-semibold" style={{ color: "#0b2b22" }}>{j.title}</td>
                            <td>
                              <span className="badge bg-light text-dark border">{j.status}</span>
                            </td>
                            <td className="text-muted">
                              {new Date(j.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Payment History */}
              <div className="elite-card">
                <div className="elite-card-header">
                  <h2 className="elite-card-title">
                    <i className="fa-solid fa-receipt" style={{ color: "#429e85" }}></i>
                    Payment History ({detail.payments.length})
                  </h2>
                </div>

                <div className="elite-table-wrap">
                  {detail.payments.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      <p className="mb-0 fw-semibold">No payments recorded yet.</p>
                    </div>
                  ) : (
                    <table className="elite-table">
                      <thead>
                        <tr>
                          <th>Package / Plan</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Payment Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.payments.map((p) => (
                          <tr key={p.id}>
                            <td className="fw-semibold" style={{ color: "#0b2b22" }}>{p.package.name}</td>
                            <td className="fw-bold" style={{ color: "#0d4f3c" }}>{formatMoney(p.amountInPaisa)}</td>
                            <td>
                              <span className={`badge ${p.status === "PAID" ? "bg-success" : "bg-secondary"}`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="text-muted">
                              {new Date(p.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Verification History */}
              <div className="elite-card">
                <div className="elite-card-header">
                  <h2 className="elite-card-title">
                    <i className="fa-solid fa-timeline" style={{ color: "#429e85" }}></i>
                    Verification Decision History ({detail.verificationHistory.length})
                  </h2>
                </div>

                <div className="p-4">
                  {detail.verificationHistory.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      <p className="mb-0 fw-semibold">No audit decisions recorded yet.</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {detail.verificationHistory.map((v) => (
                        <div
                          key={v.id}
                          className="p-3 rounded-3"
                          style={{ background: "#ffffff", border: "1px solid #e7efe9" }}
                        >
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="badge-status verified" style={{ fontSize: "12px" }}>
                              {v.decision}
                            </span>
                            <span className="small text-muted">
                              {new Date(v.createdAt).toLocaleString("en-IN")}
                            </span>
                          </div>
                          {v.reason && <p className="small mb-1 mt-2 text-dark"><strong>Reason:</strong> {v.reason}</p>}
                          {v.requestedDocuments.length > 0 && (
                            <p className="small text-muted mb-0">
                              <strong>Requested:</strong> {v.requestedDocuments.join(", ")}
                            </p>
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
