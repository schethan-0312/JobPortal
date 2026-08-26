"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface AuditLogEntry {
  id: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

interface AuditLogResponse {
  items: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

const TARGET_TYPES = ["USER", "EMPLOYER", "JOB", "TRANSACTION", "CONFIG", "ASSESSMENT", "REPORT", "ADMIN"];

export default function AdminAuditLogPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<AuditLogResponse | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targetType, setTargetType] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    (async () => {
      setDataLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (targetType) params.set("targetType", targetType);
        if (action) params.set("action", action);
        params.set("page", String(page));
        params.set("pageSize", "25");
        const res = await api.get<AuditLogResponse>(`/admin/audit-log?${params.toString()}`);
        setData(res);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load audit log");
      } finally {
        setDataLoading(false);
      }
    })();
  }, [user, targetType, action, page]);

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="audit-log" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Audit Log</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Audit Log</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">Every sensitive admin action, in order</h6>
              </div>
              <div className="card-body">
                <div className="row g-3 align-items-end mb-3">
                  <div className="col-md-4">
                    <label className="form-label small text-muted">Target type</label>
                    <select className="form-control" value={targetType} onChange={(e) => { setTargetType(e.target.value); setPage(1); }}>
                      <option value="">All types</option>
                      {TARGET_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small text-muted">Action</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. VERIFY_EMPLOYER"
                      value={action}
                      onChange={(e) => { setAction(e.target.value); setPage(1); }}
                    />
                  </div>
                </div>

                {dataLoading && <p className="text-muted">Loading...</p>}
                {!dataLoading && data && data.items.length === 0 && (
                  <p className="text-muted">No audit log entries match these filters.</p>
                )}

                {!dataLoading && data && data.items.length > 0 && (
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th>When</th>
                          <th>Admin</th>
                          <th>Action</th>
                          <th>Target</th>
                          <th>Reason</th>
                          <th>IP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.map((entry) => (
                          <tr key={entry.id}>
                            <td className="small text-nowrap">{new Date(entry.createdAt).toLocaleString()}</td>
                            <td className="small">{entry.adminEmail}</td>
                            <td>
                              <span className="badge bg-main-subtle text-main border border-main">{entry.action}</span>
                            </td>
                            <td className="small">
                              {entry.targetType} <span className="text-muted">#{entry.targetId.slice(0, 8)}</span>
                            </td>
                            <td className="small text-muted">{entry.reason ?? "â€”"}</td>
                            <td className="small text-muted">{entry.ipAddress ?? "â€”"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {data && totalPages > 1 && (
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <span className="small text-muted">
                      Page {data.page} of {totalPages} ({data.total} entries)
                    </span>
                    <div className="d-flex gap-2 flex-wrap">
                      <button type="button" className="btn btn-sm btn-outline-main" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                        Previous
                      </button>
                      <button type="button" className="btn btn-sm btn-outline-main" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                        Next
                      </button>
                    </div>
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
    </>
  );
}

