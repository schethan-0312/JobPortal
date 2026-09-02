"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface IntegrationStatus {
  name: string;
  status: "up" | "down" | "not_configured";
  detail: string;
  checkedAt: string;
}

function StatusDot({ status }: { status: IntegrationStatus["status"] }) {
  const color = status === "up" ? "#28a745" : status === "down" ? "#dc3545" : "#adb5bd";
  const label = status === "up" ? "Up" : status === "down" ? "Down" : "Not configured";
  return (
    <span className="d-inline-flex align-items-center gap-2">
      <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />
      <span className="fw-medium">{label}</span>
    </span>
  );
}

export default function AdminIntegrationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [statuses, setStatuses] = useState<IntegrationStatus[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function load() {
    setRefreshing(true);
    setError(null);
    try {
      const res = await api.get<IntegrationStatus[]>("/admin/integrations/health");
      setStatuses(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load integration health");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    load();
    const interval = setInterval(load, 3 * 60 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  const razorpay = statuses?.find((s) => s.name === "Razorpay");

  return (
    <>
      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="integrations" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <h1 className="mb-1 fs-3 fw-medium">Integration Health</h1>
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                        <li className="breadcrumb-item"><a href="#" className="text-main">Integration Health</a></li>
                      </ol>
                    </nav>
                  </div>
                  <button type="button" className="btn btn-outline-main" onClick={load} disabled={refreshing}>
                    {refreshing ? "Checking..." : "Refresh now"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}

            {razorpay && (
              <div
                className={`alert d-flex align-items-center gap-2 fw-medium ${
                  razorpay.detail.startsWith("LIVE") ? "alert-danger" : "alert-warning"
                }`}
                style={{ fontSize: "1.1rem" }}
              >
                <i className="fa-solid fa-triangle-exclamation"></i>
                Razorpay: {razorpay.detail.startsWith("LIVE") ? "LIVE MODE — real money" : "TEST MODE"}
              </div>
            )}

            {!statuses && <p className="text-muted">Checking integrations...</p>}

            {statuses && (
              <div className="row g-4">
                {statuses.map((s) => (
                  <div className="col-md-6 col-xl-4" key={s.name}>
                    <div className="card h-100">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="mb-0">{s.name}</h6>
                          <StatusDot status={s.status} />
                        </div>
                        <p className="small text-muted mb-1">{s.detail}</p>
                        <p className="small text-muted mb-0">Checked {new Date(s.checkedAt).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

