"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface FeatureStat {
  feature: string;
  enabled: boolean;
  calls: number;
  failures: number;
  successRate: number | null;
  avgLatencyMs: number | null;
  totalTokens: number;
}

interface Overview {
  windowDays: number;
  totalCalls: number;
  totalFailures: number;
  totalTokens: number;
  features: FeatureStat[];
}

interface UsageLogItem {
  id: string;
  feature: string;
  userId: string | null;
  success: boolean;
  errorMessage: string | null;
  latencyMs: number;
  totalTokens: number | null;
  createdAt: string;
}

function featureLabel(feature: string) {
  return feature
    .toLowerCase()
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export default function AdminAiMonitoringPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [overview, setOverview] = useState<Overview | null>(null);
  const [failures, setFailures] = useState<UsageLogItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [togglingFeature, setTogglingFeature] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function loadData() {
    try {
      const [ov, failLogs] = await Promise.all([
        api.get<Overview>("/admin/ai/overview"),
        api.get<{ items: UsageLogItem[] }>("/admin/ai/usage?success=false&pageSize=10"),
      ]);
      setOverview(ov);
      setFailures(failLogs.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load AI monitoring data");
    }
  }

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    loadData();
  }, [user]);

  async function handleToggle(feature: string, enabled: boolean) {
    setTogglingFeature(feature);
    setError(null);
    try {
      await api.patch(`/admin/ai/feature-config/${feature}`, { enabled });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update feature");
    } finally {
      setTogglingFeature(null);
    }
  }

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="ai-monitoring" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">AI Feature Monitoring</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">AI Monitoring</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}

            {overview && (
              <div className="row g-4 mb-4">
                <div className="col-md-4">
                  <div className="card h-100"><div className="card-body">
                    <div className="text-muted small">Calls (last {overview.windowDays}d)</div>
                    <div className="fw-bold fs-4">{overview.totalCalls.toLocaleString()}</div>
                  </div></div>
                </div>
                <div className="col-md-4">
                  <div className="card h-100"><div className="card-body">
                    <div className="text-muted small">Failures (last {overview.windowDays}d)</div>
                    <div className="fw-bold fs-4">{overview.totalFailures.toLocaleString()}</div>
                  </div></div>
                </div>
                <div className="col-md-4">
                  <div className="card h-100"><div className="card-body">
                    <div className="text-muted small">Total tokens used</div>
                    <div className="fw-bold fs-4">{overview.totalTokens.toLocaleString()}</div>
                  </div></div>
                </div>
              </div>
            )}

            <div className="card mb-4">
              <div className="card-header"><h6 className="mb-0">Features</h6></div>
              <div className="card-body">
                {!overview && <p className="text-muted">Loading...</p>}
                {overview && (
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th>Feature</th>
                          <th>Status</th>
                          <th>Calls (30d)</th>
                          <th>Success Rate</th>
                          <th>Avg Latency</th>
                          <th>Tokens (30d)</th>
                          <th>Kill Switch</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overview.features.map((f) => (
                          <tr key={f.feature}>
                            <td className="small fw-medium">{featureLabel(f.feature)}</td>
                            <td>
                              <span className={`badge ${f.enabled ? "bg-success" : "bg-danger"}`}>
                                {f.enabled ? "Enabled" : "Disabled"}
                              </span>
                            </td>
                            <td className="small">{f.calls}</td>
                            <td className="small">
                              {f.successRate === null ? "—" : `${f.successRate}%`}
                            </td>
                            <td className="small">{f.avgLatencyMs === null ? "—" : `${f.avgLatencyMs} ms`}</td>
                            <td className="small">{f.totalTokens.toLocaleString()}</td>
                            <td>
                              <button
                                type="button"
                                className={`btn btn-sm ${f.enabled ? "btn-outline-danger" : "btn-outline-success"}`}
                                disabled={togglingFeature === f.feature}
                                onClick={() => handleToggle(f.feature, !f.enabled)}
                              >
                                {togglingFeature === f.feature ? "..." : f.enabled ? "Disable" : "Enable"}
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

            <div className="card">
              <div className="card-header"><h6 className="mb-0">Recent Failures</h6></div>
              <div className="card-body">
                {failures.length === 0 && <p className="text-muted small mb-0">No recent failures.</p>}
                {failures.length > 0 && (
                  <div className="table-responsive">
                    <table className="table table-sm align-middle">
                      <thead>
                        <tr><th>Feature</th><th>Error</th><th>Latency</th><th>When</th></tr>
                      </thead>
                      <tbody>
                        {failures.map((f) => (
                          <tr key={f.id}>
                            <td className="small">{featureLabel(f.feature)}</td>
                            <td className="small text-danger">{f.errorMessage ?? "Unknown error"}</td>
                            <td className="small">{f.latencyMs} ms</td>
                            <td className="small text-muted">{new Date(f.createdAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

