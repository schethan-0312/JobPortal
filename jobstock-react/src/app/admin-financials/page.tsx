"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import Swal from "sweetalert2";
import toast, { Toaster } from "react-hot-toast";

interface Mode {
  configured: boolean;
  mode: "LIVE" | "TEST" | "UNKNOWN";
  keyIdPrefix: string | null;
}

interface Transaction {
  id: string;
  amountInPaisa: number;
  refundedAmountInPaisa?: number;
  status: string;
  gatewayRef: string | null;
  createdAt: string;
  refundRequested?: boolean;
  refundReason?: string;
  user: { email: string; role: string };
  package: { name: string; audience: string };
}

interface TransactionsResponse {
  items: Transaction[];
  total: number;
  page: number;
  pageSize: number;
}

interface RevenueSummary {
  totalPaisa: number;
  transactionCount: number;
  byAudience: Record<string, number>;
  byPlan: Record<string, number>;
}

interface RefundRate {
  total: number;
  refunded: number;
  refundRate: number;
}

interface Subscription {
  id: string;
  jobPostsUsed: number;
  startedAt: string;
  expiresAt: string | null;
  status: string;
  refundRequested?: boolean;
  refundReason?: string;
  employer: { companyName: string; status: string };
  package: { name: string; priceInPaisa: number };
}

function formatMoney(paisa: number) {
  return `₹${(paisa / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default function AdminFinancialsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<Mode | null>(null);
  const [transactions, setTransactions] = useState<TransactionsResponse | null>(null);
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [refundRate, setRefundRate] = useState<RefundRate | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [fetching, setFetching] = useState(true);

  const [refundTarget, setRefundTarget] = useState<Transaction | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundConfirmText, setRefundConfirmText] = useState("");
  const [refunding, setRefunding] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function loadAll(isSilent = false) {
    if (!isSilent) setFetching(true);
    try {
      const [modeRes, txRes, revRes, rrRes, subRes] = await Promise.all([
        api.get<Mode>("/admin/financials/mode"),
        api.get<TransactionsResponse>(`/admin/financials/transactions${statusFilter ? `?status=${statusFilter}` : ""}`),
        api.get<RevenueSummary>("/admin/financials/revenue-summary"),
        api.get<RefundRate>("/admin/financials/refund-rate"),
        api.get<Subscription[]>("/admin/financials/subscriptions"),
      ]);
      setMode(modeRes);
      setTransactions(txRes);
      setRevenue(revRes);
      setRefundRate(rrRes);
      setSubscriptions(subRes);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed to Load Financials",
        text: err instanceof ApiError ? err.message : "Failed to load financial data",
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
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, statusFilter]);

  async function submitRefund() {
    if (!refundTarget) return;
    setRefunding(true);
    try {
      await api.post(`/admin/financials/transactions/${refundTarget.id}/refund`, { reason: refundReason });
      toast.success(`Refund of ${formatMoney(refundTarget.amountInPaisa)} processed successfully!`);
      setRefundTarget(null);
      setRefundReason("");
      setRefundConfirmText("");
      loadAll(true);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Refund Failed",
        text: err instanceof ApiError ? err.message : "Refund failed to process",
        customClass: {
          popup: "elite-pkg-popup",
          title: "elite-pkg-title",
          confirmButton: "elite-pkg-btn",
        },
        confirmButtonColor: "#0d4f3c",
      });
    } finally {
      setRefunding(false);
    }
  }

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  const confirmAmount = refundTarget ? (refundTarget.amountInPaisa / 100).toString() : "";

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
        }
        .mint-refresh-btn:hover {
          background: #e8f5f1;
          border-color: #429e85;
          color: #08382b;
        }
        .gateway-banner {
          border-radius: 12px;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13.5px;
          font-weight: 600;
          margin-bottom: 24px;
        }
        .gateway-banner.live {
          background: #fee2e2;
          border: 1.5px solid #fca5a5;
          color: #991b1b;
        }
        .gateway-banner.test {
          background: #fef3c7;
          border: 1.5px solid #fde68a;
          color: #92400e;
        }
        .gateway-banner.unconfigured {
          background: #f3f4f6;
          border: 1.5px solid #e5e7eb;
          color: #4b5563;
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
          font-size: 1.85rem;
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

        .fin-table-wrap {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .fin-table {
          width: 100%;
          min-width: 800px;
          border-collapse: collapse;
          white-space: nowrap;
        }
        .fin-table th {
          background: #f8fbfa;
          color: #446158;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 14px 18px;
          border-bottom: 1px solid #d6e8e4;
        }
        .fin-table td {
          padding: 14px 18px;
          border-bottom: 1px solid #eef5f3;
          color: #334d44;
          font-size: 13.5px;
          vertical-align: middle;
        }
        .fin-table tbody tr {
          transition: background 0.15s ease;
        }
        .fin-table tbody tr:hover {
          background: #f2f9f6;
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
        .badge-status.paid { background: #e8f5f1; color: #0d4f3c; border: 1px solid #bce2d8; }
        .badge-status.pending { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
        .badge-status.failed { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
        .badge-status.refunded { background: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb; }
        .badge-status.active { background: #e8f5f1; color: #0d4f3c; border: 1px solid #bce2d8; }

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

        .btn-refund-action {
          background: #ffffff;
          border: 1px solid #fca5a5;
          color: #dc2626;
          font-weight: 600;
          font-size: 12px;
          padding: 5px 12px;
          border-radius: 7px;
          transition: all 0.2s;
        }
        .btn-refund-action:hover {
          background: #fee2e2;
          border-color: #ef4444;
          color: #991b1b;
        }

        .audience-badge {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 12px;
          border-radius: 8px;
          background: #f8fbfa;
          border: 1px solid #e7efe9;
          font-size: 13px;
          margin-bottom: 6px;
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
        <AdminSidebar active="financials" />

        <div className="dashboard-content pkg-page">
          {/* Header */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
              <h1 className="pkg-header-title mb-1">Financial Overview</h1>
              <p className="pkg-header-subtitle mb-0">
                Track platform transactions, revenue distribution, active employer subscriptions, and refunds.
              </p>
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="mint-refresh-btn"
                onClick={() => loadAll()}
                disabled={fetching}
              >
                <i className={`fa-solid fa-rotate-right ${fetching ? "fa-spin" : ""}`}></i> Refresh Financials
              </button>
            </div>
          </div>

          {/* Gateway Status Banner */}
          {mode && (
            <div
              className={`gateway-banner ${
                mode.mode === "LIVE" ? "live" : mode.mode === "TEST" ? "test" : "unconfigured"
              }`}
            >
              <i className={`fa-solid ${mode.mode === "LIVE" ? "fa-triangle-exclamation" : "fa-flask"}`}></i>
              {mode.configured ? (
                <span>
                  Razorpay Payment Gateway is currently in <strong>{mode.mode} MODE</strong> ({mode.keyIdPrefix})
                  {mode.mode === "LIVE"
                    ? " — Live transactions and real payments are active."
                    : " — Test environment active (sandbox / simulated transactions)."}
                </span>
              ) : (
                <span>Razorpay is not yet configured with API keys.</span>
              )}
            </div>
          )}

          {/* Stat Cards */}
          <div className="row align-items-center gx-4 gy-4 mb-4">
            <div className="col-12 col-sm-6 col-md-6 col-lg-4">
              <div className="dash-wrap-bloud">
                <div className="dash-wrap-glow" style={{ background: "#dbfbf5" }}></div>
                <div className="dash-wrap-bloud-icon">
                  <div className="bloud-icon" style={{ backgroundColor: "#def5f0", color: "#134d42" }}>
                    <i className="fa-solid fa-indian-rupee-sign"></i>
                  </div>
                </div>
                <div className="dash-wrap-bloud-caption">
                  <div className="dash-wrap-bloud-content">
                    <h5 className="ctr">{revenue ? formatMoney(revenue.totalPaisa) : "—"}</h5>
                    <p>Total Revenue (Paid)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-md-6 col-lg-4">
              <div className="dash-wrap-bloud">
                <div className="dash-wrap-glow" style={{ background: "#fff3dc" }}></div>
                <div className="dash-wrap-bloud-icon">
                  <div className="bloud-icon" style={{ backgroundColor: "#fdf3e0", color: "#b07c1a" }}>
                    <i className="fa-solid fa-rotate-left"></i>
                  </div>
                </div>
                <div className="dash-wrap-bloud-caption">
                  <div className="dash-wrap-bloud-content">
                    <h5 className="ctr">{refundRate ? `${(refundRate.refundRate * 100).toFixed(1)}%` : "0%"}</h5>
                    <p>Refund Rate ({refundRate?.refunded ?? 0}/{refundRate?.total ?? 0})</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-md-6 col-lg-4">
              <div className="dash-wrap-bloud">
                <div className="dash-wrap-glow" style={{ background: "#dcf4fa" }}></div>
                <div className="dash-wrap-bloud-icon">
                  <div className="bloud-icon" style={{ backgroundColor: "#eef3f5", color: "#174742" }}>
                    <i className="fa-solid fa-chart-pie"></i>
                  </div>
                </div>
                <div className="dash-wrap-bloud-caption">
                  <div className="dash-wrap-bloud-content">
                    <h5 className="ctr" style={{ fontSize: "1.5rem" }}>{revenue?.transactionCount ?? 0} Orders</h5>
                    <p>Total Transactions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Card */}
          <div className="elite-card">
            <div className="elite-card-header d-flex flex-wrap gap-3 justify-content-between align-items-center">
              <h2 className="elite-card-title">
                <i className="fa-solid fa-file-invoice-dollar" style={{ color: "#429e85" }}></i>
                Transactions ({transactions?.total ?? 0})
              </h2>

              <div className="d-flex gap-2">
                <select
                  className="filter-input"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>
            </div>

            <div className="fin-table-wrap">
              {fetching && !transactions && (
                <div className="text-center py-5">
                  <i className="fa-solid fa-circle-notch fa-spin text-muted fs-2 mb-2"></i>
                  <p className="text-muted fw-semibold">Loading transactions...</p>
                </div>
              )}

              {transactions && transactions.items.length === 0 && (
                <div className="text-center py-5">
                  <i className="fa-solid fa-receipt text-muted fs-1 mb-2"></i>
                  <p className="text-muted fw-semibold">No transactions found for this filter.</p>
                </div>
              )}

              {transactions && transactions.items.length > 0 && (
                <table className="fin-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>User / Email</th>
                      <th>Package Plan</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.items.map((tx) => {
                      const statusClass = tx.status.toLowerCase();
                      return (
                        <tr key={tx.id}>
                          <td className="text-muted">
                            {new Date(tx.createdAt).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td>
                            <div className="fw-semibold" style={{ color: "#0b2b22" }}>{tx.user.email}</div>
                            <div className="text-muted small" style={{ fontSize: "11px" }}>{tx.user.role}</div>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border">
                              {tx.package.name} ({tx.package.audience})
                            </span>
                          </td>
                          <td>
                            <div className="fw-bold" style={{ color: "#0d4f3c" }}>
                              {formatMoney(tx.amountInPaisa)}
                            </div>
                            {tx.status === "REFUNDED" && tx.refundedAmountInPaisa !== undefined && (
                              <div className="text-muted" style={{ fontSize: "11px" }}>
                                Refunded: {formatMoney(tx.refundedAmountInPaisa)}
                                {tx.refundedAmountInPaisa < tx.amountInPaisa && " (Partial)"}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className={`badge-status ${statusClass}`}>
                              <i className="fa-solid fa-circle" style={{ fontSize: "6px" }}></i>
                              {tx.status}
                            </span>
                            {tx.refundRequested && tx.status === "PAID" && (
                              <div className="mt-1">
                                <span className="badge bg-warning text-dark" style={{ fontSize: "10.5px" }}>
                                  Refund Requested
                                </span>
                                {tx.refundReason && (
                                  <div className="text-muted small" style={{ fontSize: "11px", maxWidth: "160px" }}>
                                    {tx.refundReason}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="text-end">
                            {tx.status === "PAID" && (
                              <button
                                type="button"
                                className="btn-refund-action"
                                onClick={() => setRefundTarget(tx)}
                              >
                                <i className="fa-solid fa-rotate-left me-1"></i> Issue Refund
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Subscriptions Card */}
          <div className="elite-card">
            <div className="elite-card-header">
              <h2 className="elite-card-title">
                <i className="fa-solid fa-crown" style={{ color: "#d97706" }}></i>
                Employer Active Subscriptions ({subscriptions.length})
              </h2>
            </div>

            <div className="fin-table-wrap">
              {subscriptions.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <p className="mb-0 fw-semibold">No active employer subscriptions currently active.</p>
                </div>
              ) : (
                <table className="fin-table">
                  <thead>
                    <tr>
                      <th>Employer</th>
                      <th>Plan Name</th>
                      <th>Job Posts Used</th>
                      <th>Started Date</th>
                      <th>Expiry Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <div className="fw-bold" style={{ color: "#0b2b22" }}>
                            {s.employer.companyName}
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            <i className="fa-solid fa-layer-group me-1 text-muted"></i>
                            {s.package.name}
                          </span>
                        </td>
                        <td>
                          <span className="fw-semibold" style={{ color: "#0d4f3c" }}>
                            {s.jobPostsUsed} posts
                          </span>
                        </td>
                        <td className="text-muted">
                          {new Date(s.startedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="text-muted">
                          {s.expiresAt ? (
                            new Date(s.expiresAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          ) : (
                            <span className="badge bg-success-subtle text-success border">Lifetime / None</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge-status ${s.status === "ACTIVE" ? "active" : "refunded"}`}>
                            {s.status}
                          </span>
                          {s.refundRequested && s.status === "ACTIVE" && (
                            <div className="mt-1">
                              <span className="badge bg-warning text-dark" style={{ fontSize: "10px" }}>
                                Refund Requested
                              </span>
                              {s.refundReason && (
                                <div className="text-muted small" style={{ fontSize: "11px", maxWidth: "160px" }}>
                                  {s.refundReason}
                                </div>
                              )}
                            </div>
                          )}
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

      {/* Modern Refund Modal */}
      {refundTarget && (
        <div
          className="modal d-block"
          style={{ background: "rgba(11, 43, 34, 0.45)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setRefundTarget(null);
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div
              className="modal-content"
              style={{
                borderRadius: "16px",
                border: "1px solid #d6e8e4",
                boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                overflow: "hidden"
              }}
            >
              <div
                className="modal-header"
                style={{ background: "#fbfdfc", borderBottom: "1px solid #d6e8e4", padding: "16px 20px" }}
              >
                <h5 className="modal-title fw-bold" style={{ color: "#0b2b22", fontSize: "16px" }}>
                  <i className="fa-solid fa-rotate-left me-2 text-danger"></i>
                  Process Refund: {formatMoney(refundTarget.amountInPaisa)}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setRefundTarget(null)}
                ></button>
              </div>

              <div className="modal-body p-4">
                <div
                  className="p-3 rounded-3 mb-3"
                  style={{ background: "#fef2f2", border: "1px solid #fecaca", fontSize: "13px", color: "#991b1b" }}
                >
                  <p className="mb-1">
                    This triggers Razorpay's live refund for <strong>{refundTarget.user.email}</strong>.
                  </p>
                  <p className="mb-0">
                    <strong>Platform Policy:</strong> 5% platform fee ({formatMoney(Math.floor(refundTarget.amountInPaisa * 0.05))}) is deducted. User receives <strong>{formatMoney(refundTarget.amountInPaisa - Math.floor(refundTarget.amountInPaisa * 0.05))}</strong>.
                  </p>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label fw-semibold" style={{ fontSize: "13px", color: "#0b2b22" }}>
                    Refund Reason (Required)
                  </label>
                  <textarea
                    className="filter-input w-100"
                    rows={3}
                    placeholder="Provide reason for refund..."
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label fw-semibold" style={{ fontSize: "13px", color: "#0b2b22" }}>
                    Type <strong className="text-danger">{confirmAmount}</strong> to confirm
                  </label>
                  <input
                    type="text"
                    className="filter-input w-100"
                    placeholder={confirmAmount}
                    value={refundConfirmText}
                    onChange={(e) => setRefundConfirmText(e.target.value)}
                  />
                </div>
              </div>

              <div
                className="modal-footer"
                style={{ background: "#fbfdfc", borderTop: "1px solid #d6e8e4", padding: "14px 20px" }}
              >
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  style={{ borderRadius: "8px", fontWeight: 600 }}
                  onClick={() => setRefundTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  style={{ borderRadius: "8px", fontWeight: 700, padding: "8px 18px" }}
                  disabled={refunding || refundConfirmText !== confirmAmount || !refundReason.trim()}
                  onClick={submitRefund}
                >
                  {refunding ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin me-1"></i> Refunding...
                    </>
                  ) : (
                    "Confirm & Issue Refund"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
