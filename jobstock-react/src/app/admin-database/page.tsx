"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface TableStat {
  tableName: string;
  rowEstimate: number;
  totalSizeBytes: number;
}

interface Overview {
  totalSizeBytes: number;
  tables: TableStat[];
}

interface BackupRecord {
  id: string;
  filename: string;
  status: "RUNNING" | "SUCCESS" | "FAILED";
  sizeBytes: number | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function AdminDatabasePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [overview, setOverview] = useState<Overview | null>(null);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [gdprUserId, setGdprUserId] = useState("");
  const [gdprMsg, setGdprMsg] = useState<string | null>(null);
  const [exportedData, setExportedData] = useState<unknown | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function loadData() {
    try {
      const [ov, bk] = await Promise.all([
        api.get<Overview>("/admin/database/overview"),
        api.get<BackupRecord[]>("/admin/database/backups"),
      ]);
      setOverview(ov);
      setBackups(bk);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load database data");
    }
  }

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    loadData();
  }, [user]);

  async function handleTriggerBackup() {
    setTriggering(true);
    setError(null);
    try {
      await api.post("/admin/database/backups");
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to trigger backup");
    } finally {
      setTriggering(false);
    }
  }

  async function handleExport() {
    setGdprMsg(null);
    setExportedData(null);
    setError(null);
    try {
      const data = await api.get(`/admin/database/users/${gdprUserId.trim()}/export`);
      setExportedData(data);
      setGdprMsg("Export loaded below.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to export user data");
    }
  }

  async function handlePurge() {
    if (!confirm("This will permanently anonymize this user's PII. This cannot be undone. Continue?")) return;
    setGdprMsg(null);
    setError(null);
    try {
      await api.post(`/admin/database/users/${gdprUserId.trim()}/purge`);
      setGdprMsg("User data purged/anonymized successfully.");
      setExportedData(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to purge user data");
    }
  }

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="database" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Database &amp; Backups</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Database &amp; Backups</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}

            {overview && (
              <div className="card mb-4">
                <div className="card-header"><h6 className="mb-0">Database Size: {formatBytes(overview.totalSizeBytes)}</h6></div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-sm align-middle">
                      <thead><tr><th>Table</th><th>Rows (est.)</th><th>Size</th></tr></thead>
                      <tbody>
                        {overview.tables.map((t) => (
                          <tr key={t.tableName}>
                            <td className="small font-monospace">{t.tableName}</td>
                            <td className="small">{t.rowEstimate.toLocaleString()}</td>
                            <td className="small">{formatBytes(t.totalSizeBytes)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            <div className="card mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Backups</h6>
                <button type="button" className="btn btn-main btn-sm" disabled={triggering} onClick={handleTriggerBackup}>
                  {triggering ? "Starting..." : "Trigger Backup Now"}
                </button>
              </div>
              <div className="card-body">
                {backups.length === 0 && <p className="text-muted small mb-0">No backups yet.</p>}
                {backups.length > 0 && (
                  <div className="table-responsive">
                    <table className="table table-sm align-middle">
                      <thead><tr><th>Filename</th><th>Status</th><th>Size</th><th>Started</th></tr></thead>
                      <tbody>
                        {backups.map((b) => (
                          <tr key={b.id}>
                            <td className="small font-monospace">{b.filename}</td>
                            <td>
                              <span className={`badge ${
                                b.status === "SUCCESS" ? "bg-success" : b.status === "FAILED" ? "bg-danger" : "bg-warning"
                              }`}>
                                {b.status}
                              </span>
                              {b.status === "FAILED" && b.errorMessage && (
                                <div className="small text-danger mt-1">{b.errorMessage}</div>
                              )}
                            </td>
                            <td className="small">{b.sizeBytes ? formatBytes(b.sizeBytes) : "—"}</td>
                            <td className="small text-muted">{new Date(b.createdAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h6 className="mb-0">GDPR: Export / Purge User Data</h6></div>
              <div className="card-body">
                {gdprMsg && <div className="alert alert-success">{gdprMsg}</div>}
                <div className="row g-2 align-items-end mb-3">
                  <div className="col-md-6">
                    <label className="form-label small">User ID</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={gdprUserId}
                      onChange={(e) => setGdprUserId(e.target.value)}
                      placeholder="cms8..."
                    />
                  </div>
                  <div className="col-md-3">
                    <button type="button" className="btn btn-outline-main btn-sm w-100" disabled={!gdprUserId.trim()} onClick={handleExport}>
                      Export Data
                    </button>
                  </div>
                  <div className="col-md-3">
                    <button type="button" className="btn btn-outline-danger btn-sm w-100" disabled={!gdprUserId.trim()} onClick={handlePurge}>
                      Purge / Anonymize
                    </button>
                  </div>
                </div>
                {exportedData ? (
                  <pre className="small bg-light p-3 rounded" style={{ maxHeight: 400, overflow: "auto" }}>
                    {JSON.stringify(exportedData, null, 2)}
                  </pre>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

