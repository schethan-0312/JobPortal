"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface Mode {
  configured: boolean;
  mode: "LIVE" | "TEST" | "UNKNOWN";
  keyIdPrefix: string | null;
}

interface Transaction {
  id: string;
  amountInPaisa: number;
  status: string;
  gatewayRef: string | null;
  createdAt: string;
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
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [refundTarget, setRefundTarget] = useState<Transaction | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundConfirmText, setRefundConfirmText] = useState("");
  const [refunding, setRefunding] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function loadAll() {
    setError(null);
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
      setError(err instanceof ApiError ? err.message : "Failed to load financial data");
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
    setError(null);
    try {
      await api.post(`/admin/financials/transactions/${refundTarget.id}/refund`, { reason: refundReason });
      setSuccessMsg(`Refunded ${formatMoney(refundTarget.amountInPaisa)} for ${refundTarget.user.email}.`);
      setRefundTarget(null);
      setRefundReason("");
      setRefundConfirmText("");
      loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Refund failed");
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
      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="financials" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Financials</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Financials</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}
            {successMsg && <div className="alert alert-success">{successMsg}</div>}

            {mode && (
              <div
                className={`alert d-flex align-items-center gap-2 fw-medium ${
                  mode.mode === "LIVE" ? "alert-danger" : mode.mode === "TEST" ? "alert-warning" : "alert-secondary"
                }`}
                style={{ fontSize: "1.05rem" }}
              >
                <i className={`fa-solid ${mode.mode === "LIVE" ? "fa-triangle-exclamation" : "fa-flask"}`}></i>
                {mode.configured ? (
                  <span>
                    Razorpay is in <strong>{mode.mode} MODE</strong> ({mode.keyIdPrefix})
                    {mode.mode === "LIVE" ? " — real money moves through this panel." : " — no real money moves here."}
                  </span>
                ) : (
                  <span>Razorpay is not configured yet — no keys set.</span>
                )}
              </div>
            )}

            <div className="row g-4 mb-4">
              <div className="col-md-4">
                <div className="card h-100">
                  <div className="card-body">
                    <div className="text-muted small mb-1">Total revenue (paid)</div>
                    <div className="fs-3 fw-bold">{revenue ? formatMoney(revenue.totalPaisa) : "—"}</div>
                    <div className="small text-muted">{revenue?.transactionCount ?? 0} transactions</div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card h-100">
                  <div className="card-body">
                    <div className="text-muted small mb-1">Refund rate</div>
                    <div className="fs-3 fw-bold">
                      {refundRate ? `${(refundRate.refundRate * 100).toFixed(1)}%` : "—"}
                    </div>
                    <div className="small text-muted">
                      {refundRate?.refunded ?? 0} of {refundRate?.total ?? 0} orders
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card h-100">
                  <div className="card-body">
                    <div className="text-muted small mb-2">Revenue by audience</div>
                    {revenue && Object.entries(revenue.byAudience).length > 0 ? (
                      Object.entries(revenue.byAudience).map(([k, v]) => (
                        <div key={k} className="d-flex justify-content-between small">
                          <span>{k}</span>
                          <span className="fw-medium">{formatMoney(v)}</span>
                        </div>
                      ))
                    ) : (
                      <span className="small text-muted">No paid transactions yet.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Transactions</h6>
                <select className="form-control" style={{ width: "auto" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>
              <div className="card-body">
                {!transactions && <p className="text-muted">Loading...</p>}
                {transactions && transactions.items.length === 0 && <p className="text-muted">No transactions.</p>}
                {transactions && transactions.items.length > 0 && (
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th>When</th>
                          <th>User</th>
                          <th>Plan</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.items.map((tx) => (
                          <tr key={tx.id}>
                            <td className="small text-nowrap">{new Date(tx.createdAt).toLocaleString()}</td>
                            <td className="small">{tx.user.email}</td>
                            <td className="small">{tx.package.name}</td>
                            <td className="small fw-medium">{formatMoney(tx.amountInPaisa)}</td>
                            <td>
                              <span
                                className={`badge ${
                                  tx.status === "PAID"
                                    ? "bg-success"
                                    : tx.status === "REFUNDED"
                                      ? "bg-secondary"
                                      : tx.status === "FAILED"
                                        ? "bg-danger"
                                        : "bg-warning"
                                }`}
                              >
                                {tx.status}
                              </span>
                            </td>
                            <td>
                              {tx.status === "PAID" && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => setRefundTarget(tx)}
                                >
                                  Refund
                                </button>
                              )}
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
              <div className="card-header">
                <h6 className="mb-0">Employer Subscriptions</h6>
              </div>
              <div className="card-body">
                {subscriptions.length === 0 && <p className="text-muted">No active subscriptions.</p>}
                {subscriptions.length > 0 && (
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th>Employer</th>
                          <th>Plan</th>
                          <th>Job posts used</th>
                          <th>Started</th>
                          <th>Expires</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscriptions.map((s) => (
                          <tr key={s.id}>
                            <td className="small">{s.employer.companyName}</td>
                            <td className="small">{s.package.name}</td>
                            <td className="small">{s.jobPostsUsed}</td>
                            <td className="small">{new Date(s.startedAt).toLocaleDateString()}</td>
                            <td className="small">{s.expiresAt ? new Date(s.expiresAt).toLocaleDateString() : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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

      {refundTarget && (
        <div
          className="modal d-block"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setRefundTarget(null);
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Refund {formatMoney(refundTarget.amountInPaisa)}</h5>
                <button type="button" className="btn-close" onClick={() => setRefundTarget(null)}></button>
              </div>
              <div className="modal-body">
                <p className="text-muted small">
                  This calls Razorpay's real refund API for {refundTarget.user.email}&apos;s payment. This cannot be undone.
                </p>
                <div className="form-group mb-3">
                  <label className="form-label">Reason (required)</label>
                  <textarea className="form-control" value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Type <strong>{confirmAmount}</strong> to confirm
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={refundConfirmText}
                    onChange={(e) => setRefundConfirmText(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setRefundTarget(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={refunding || refundConfirmText !== confirmAmount || refundReason.trim().length < 5}
                  onClick={submitRefund}
                >
                  {refunding ? "Refunding..." : "Confirm Refund"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
