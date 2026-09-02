"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface FailedLogin {
  id: string;
  email: string;
  ipAddress: string | null;
  reason: string;
  createdAt: string;
}

interface FailedLoginsResponse {
  items: FailedLogin[];
  total: number;
  page: number;
  pageSize: number;
  suspiciousIps: { ipAddress: string; attemptsLastHour: number }[];
}

interface ActiveSession {
  userId: string;
  email: string;
  role: string;
  lastLoginAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  active: boolean;
}

interface RateLimitHit {
  id: string;
  ipAddress: string | null;
  path: string;
  createdAt: string;
}

interface BlockedIp {
  id: string;
  ipAddress: string;
  reason: string | null;
  createdAt: string;
}

export default function AdminSecurityPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [failedLogins, setFailedLogins] = useState<FailedLoginsResponse | null>(null);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [rateLimitHits, setRateLimitHits] = useState<{ items: RateLimitHit[]; total: number } | null>(null);
  const [blockedIps, setBlockedIps] = useState<BlockedIp[]>([]);
  const [newIp, setNewIp] = useState("");
  const [newIpReason, setNewIpReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function loadAll() {
    setError(null);
    try {
      const [fl, sess, rlh, bips] = await Promise.all([
        api.get<FailedLoginsResponse>("/admin/security/failed-logins"),
        api.get<ActiveSession[]>("/admin/security/active-sessions"),
        api.get<{ items: RateLimitHit[]; total: number }>("/admin/security/rate-limit-hits"),
        api.get<BlockedIp[]>("/admin/security/blocked-ips"),
      ]);
      setFailedLogins(fl);
      setSessions(sess);
      setRateLimitHits(rlh);
      setBlockedIps(bips);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load security data");
    }
  }

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function revokeSession(userId: string, email: string) {
    if (!confirm(`Force-logout ${email}? They'll need to log in again.`)) return;
    setError(null);
    try {
      await api.post(`/admin/security/sessions/${userId}/revoke`);
      setSuccessMsg(`${email}'s session revoked.`);
      loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to revoke session");
    }
  }

  async function blockIp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/admin/security/blocked-ips", { ipAddress: newIp, reason: newIpReason || undefined });
      setNewIp("");
      setNewIpReason("");
      setSuccessMsg(`${newIp} blocked.`);
      loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to block IP");
    }
  }

  async function unblockIp(id: string, ip: string) {
    setError(null);
    try {
      await api.delete(`/admin/security/blocked-ips/${id}`);
      setSuccessMsg(`${ip} unblocked.`);
      loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to unblock IP");
    }
  }

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="security" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Security &amp; Access</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Security &amp; Access</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}
            {successMsg && <div className="alert alert-success">{successMsg}</div>}

            {failedLogins && failedLogins.suspiciousIps.length > 0 && (
              <div className="alert alert-danger">
                <strong>Brute-force signal:</strong>{" "}
                {failedLogins.suspiciousIps.map((s) => `${s.ipAddress} (${s.attemptsLastHour} attempts/hr)`).join(", ")}
              </div>
            )}

            <div className="card mb-4">
              <div className="card-header">
                <h6 className="mb-0">Active Sessions</h6>
              </div>
              <div className="card-body">
                {sessions.length === 0 && <p className="text-muted">No active sessions.</p>}
                {sessions.length > 0 && (
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Role</th>
                          <th>Last login</th>
                          <th>IP</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map((s) => (
                          <tr key={s.userId}>
                            <td className="small">{s.email}</td>
                            <td><span className="badge bg-secondary">{s.role}</span></td>
                            <td className="small">{new Date(s.lastLoginAt).toLocaleString()}</td>
                            <td className="small text-muted">{s.ipAddress ?? "—"}</td>
                            <td>
                              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => revokeSession(s.userId, s.email)}>
                                Force logout
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

            <div className="card mb-4">
              <div className="card-header">
                <h6 className="mb-0">Failed Login Attempts</h6>
              </div>
              <div className="card-body">
                {failedLogins && failedLogins.items.length === 0 && <p className="text-muted">No failed logins recorded.</p>}
                {failedLogins && failedLogins.items.length > 0 && (
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th>When</th>
                          <th>Email attempted</th>
                          <th>IP</th>
                          <th>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {failedLogins.items.map((f) => (
                          <tr key={f.id}>
                            <td className="small">{new Date(f.createdAt).toLocaleString()}</td>
                            <td className="small">{f.email}</td>
                            <td className="small text-muted">{f.ipAddress ?? "—"}</td>
                            <td className="small text-muted">{f.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="row g-4 mb-4">
              <div className="col-md-6">
                <div className="card h-100">
                  <div className="card-header">
                    <h6 className="mb-0">Rate-Limit Hits</h6>
                  </div>
                  <div className="card-body">
                    {rateLimitHits && rateLimitHits.items.length === 0 && <p className="text-muted small">None recorded.</p>}
                    {rateLimitHits && rateLimitHits.items.length > 0 && (
                      <div className="table-responsive">
                        <table className="table table-sm align-middle">
                          <thead>
                            <tr><th>When</th><th>IP</th><th>Path</th></tr>
                          </thead>
                          <tbody>
                            {rateLimitHits.items.slice(0, 10).map((r) => (
                              <tr key={r.id}>
                                <td className="small">{new Date(r.createdAt).toLocaleTimeString()}</td>
                                <td className="small">{r.ipAddress ?? "—"}</td>
                                <td className="small text-muted">{r.path}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card h-100">
                  <div className="card-header">
                    <h6 className="mb-0">IP Blocklist</h6>
                  </div>
                  <div className="card-body">
                    <form onSubmit={blockIp} className="d-flex gap-2 mb-3 flex-wrap">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="IP address"
                        value={newIp}
                        onChange={(e) => setNewIp(e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Reason (optional)"
                        value={newIpReason}
                        onChange={(e) => setNewIpReason(e.target.value)}
                      />
                      <button type="submit" className="btn btn-sm btn-main text-nowrap">Block</button>
                    </form>
                    {blockedIps.length === 0 && <p className="text-muted small">No IPs blocked.</p>}
                    {blockedIps.map((b) => (
                      <div key={b.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                        <div>
                          <div className="small fw-medium">{b.ipAddress}</div>
                          {b.reason && <div className="small text-muted">{b.reason}</div>}
                        </div>
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => unblockIp(b.id, b.ipAddress)}>
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

