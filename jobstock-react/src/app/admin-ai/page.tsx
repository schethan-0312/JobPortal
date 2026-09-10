"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import Swal from "sweetalert2";
import toast, { Toaster } from "react-hot-toast";

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
  const [fetching, setFetching] = useState(true);
  const [togglingFeature, setTogglingFeature] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function loadData(isSilent = false) {
    if (!isSilent) setFetching(true);
    try {
      const [ov, failLogs] = await Promise.all([
        api.get<Overview>("/admin/ai/overview"),
        api.get<{ items: UsageLogItem[] }>("/admin/ai/usage?success=false&pageSize=10"),
      ]);
      setOverview(ov);
      setFailures(failLogs.items);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed to Load AI Metrics",
        text: err instanceof ApiError ? err.message : "Failed to load AI monitoring data",
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
    loadData();
  }, [user]);

  async function handleToggle(feature: string, currentEnabled: boolean) {
    const willEnable = !currentEnabled;
    const label = featureLabel(feature);
    const actionVerb = willEnable ? "Enable" : "Disable";

    const confirm = await Swal.fire({
      title: `${actionVerb} "${label}" AI Feature?`,
      text: willEnable
        ? `Enabling this will activate live AI processing for ${label}.`
        : `Disabling this acts as an emergency kill-switch and suspends AI generation for ${label}.`,
      icon: willEnable ? "question" : "warning",
      showCancelButton: true,
      confirmButtonColor: willEnable ? "#0d4f3c" : "#d94348",
      cancelButtonColor: "#8ea59d",
      confirmButtonText: `Yes, ${actionVerb}`,
      cancelButtonText: "Cancel",
      customClass: {
        popup: "elite-pkg-popup",
        title: "elite-pkg-title",
        confirmButton: "elite-pkg-btn",
      },
    });

    if (!confirm.isConfirmed) return;

    setTogglingFeature(feature);
    try {
      await api.patch(`/admin/ai/feature-config/${feature}`, { enabled: willEnable });
      toast.success(`AI Feature "${label}" is now ${willEnable ? "Enabled" : "Disabled"}`);
      await loadData(true);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: err instanceof ApiError ? err.message : "Failed to update feature",
        customClass: {
          popup: "elite-pkg-popup",
          title: "elite-pkg-title",
          confirmButton: "elite-pkg-btn",
        },
        confirmButtonColor: "#0d4f3c",
      });
    } finally {
      setTogglingFeature(null);
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

        .ai-table-wrap {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .ai-table {
          width: 100%;
          min-width: 750px;
          border-collapse: collapse;
          white-space: nowrap;
        }
        .ai-table th {
          background: #f8fbfa;
          color: #446158;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 14px 18px;
          border-bottom: 1px solid #d6e8e4;
        }
        .ai-table td {
          padding: 14px 18px;
          border-bottom: 1px solid #eef5f3;
          color: #334d44;
          font-size: 13.5px;
          vertical-align: middle;
        }
        .ai-table tbody tr:hover {
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
        .badge-status.enabled { background: #e8f5f1; color: #0d4f3c; border: 1px solid #bce2d8; }
        .badge-status.disabled { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }

        .btn-kill-switch {
          border-radius: 7px;
          font-weight: 700;
          font-size: 12px;
          padding: 5px 14px;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .btn-kill-switch.disable {
          background: #ffffff;
          border: 1px solid #fca5a5;
          color: #dc2626;
        }
        .btn-kill-switch.disable:hover {
          background: #fee2e2;
          color: #b91c1c;
          border-color: #ef4444;
        }
        .btn-kill-switch.enable {
          background: #ffffff;
          border: 1px solid #bce2d8;
          color: #0d4f3c;
        }
        .btn-kill-switch.enable:hover {
          background: #e8f5f1;
          color: #08382b;
          border-color: #429e85;
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
        <AdminSidebar active="ai-monitoring" />

        <div className="dashboard-content pkg-page">
          {/* Header */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
              <h1 className="pkg-header-title mb-1">AI Services &amp; Feature Monitoring</h1>
              <p className="pkg-header-subtitle mb-0">
                Track real-time AI API usage, failure logs, latency metrics, and emergency feature kill-switches.
              </p>
            </div>
          </div>

          {/* Stat Cards */}
          {overview && (
            <div className="row align-items-center gx-4 gy-4 mb-4">
              <div className="col-12 col-sm-6 col-md-6 col-lg-4">
                <div className="dash-wrap-bloud">
                  <div className="dash-wrap-glow" style={{ background: "#dbfbf5" }}></div>
                  <div className="dash-wrap-bloud-icon">
                    <div className="bloud-icon" style={{ backgroundColor: "#def5f0", color: "#134d42" }}>
                      <i className="fa-solid fa-bolt"></i>
                    </div>
                  </div>
                  <div className="dash-wrap-bloud-caption">
                    <div className="dash-wrap-bloud-content">
                      <h5 className="ctr">{overview.totalCalls.toLocaleString()}</h5>
                      <p>Total Calls ({overview.windowDays}d)</p>
                    </div>
                  </div>
                </div>
              </div>

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
                      <h5 className="ctr">{overview.totalFailures.toLocaleString()}</h5>
                      <p>Total Failures ({overview.windowDays}d)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-md-6 col-lg-4">
                <div className="dash-wrap-bloud">
                  <div className="dash-wrap-glow" style={{ background: "#dcf4fa" }}></div>
                  <div className="dash-wrap-bloud-icon">
                    <div className="bloud-icon" style={{ backgroundColor: "#eef3f5", color: "#174742" }}>
                      <i className="fa-solid fa-microchip"></i>
                    </div>
                  </div>
                  <div className="dash-wrap-bloud-caption">
                    <div className="dash-wrap-bloud-content">
                      <h5 className="ctr" style={{ fontSize: "1.6rem" }}>
                        {overview.totalTokens.toLocaleString()}
                      </h5>
                      <p>Total Tokens Consumed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Features & Kill Switch */}
          <div className="elite-card">
            <div className="elite-card-header">
              <h2 className="elite-card-title">
                <i className="fa-solid fa-wand-magic-sparkles" style={{ color: "#429e85" }}></i>
                AI Feature Registry &amp; Controls
              </h2>
            </div>

            <div className="ai-table-wrap">
              {fetching && !overview && (
                <div className="text-center py-5">
                  <i className="fa-solid fa-circle-notch fa-spin text-muted fs-2 mb-2"></i>
                  <p className="text-muted fw-semibold">Loading AI feature status...</p>
                </div>
              )}

              {overview && overview.features.length === 0 && (
                <div className="text-center py-5 text-muted">
                  <p className="mb-0 fw-semibold">No AI features registered.</p>
                </div>
              )}

              {overview && overview.features.length > 0 && (
                <table className="ai-table">
                  <thead>
                    <tr>
                      <th>Feature Name</th>
                      <th>Status</th>
                      <th>Calls (30d)</th>
                      <th>Success Rate</th>
                      <th>Avg Latency</th>
                      <th>Tokens (30d)</th>
                      <th className="text-end">Emergency Switch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.features.map((f) => (
                      <tr key={f.feature}>
                        <td className="fw-bold" style={{ color: "#0b2b22" }}>
                          {featureLabel(f.feature)}
                        </td>
                        <td>
                          <span className={`badge-status ${f.enabled ? "enabled" : "disabled"}`}>
                            <i className="fa-solid fa-circle" style={{ fontSize: "6px" }}></i>
                            {f.enabled ? "Active" : "Disabled"}
                          </span>
                        </td>
                        <td className="fw-semibold">{f.calls}</td>
                        <td>
                          {f.successRate === null ? (
                            <span className="text-muted">—</span>
                          ) : (
                            <span className={`fw-bold ${f.successRate >= 95 ? "text-success" : "text-warning"}`}>
                              {f.successRate}%
                            </span>
                          )}
                        </td>
                        <td>
                          {f.avgLatencyMs === null ? (
                            <span className="text-muted">—</span>
                          ) : (
                            <span className="badge bg-light text-dark border font-monospace">
                              {f.avgLatencyMs} ms
                            </span>
                          )}
                        </td>
                        <td className="font-monospace text-muted">{f.totalTokens.toLocaleString()}</td>
                        <td className="text-end">
                          <button
                            type="button"
                            className={`btn-kill-switch ${f.enabled ? "disable" : "enable"}`}
                            disabled={togglingFeature === f.feature}
                            onClick={() => handleToggle(f.feature, f.enabled)}
                          >
                            {togglingFeature === f.feature ? (
                              <i className="fa-solid fa-circle-notch fa-spin"></i>
                            ) : f.enabled ? (
                              <>
                                <i className="fa-solid fa-ban"></i> Kill Switch
                              </>
                            ) : (
                              <>
                                <i className="fa-solid fa-power-off"></i> Enable
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Recent Failures Card */}
          <div className="elite-card">
            <div className="elite-card-header">
              <h2 className="elite-card-title">
                <i className="fa-solid fa-bug" style={{ color: "#d94348" }}></i>
                Recent AI Failures &amp; Errors ({failures.length})
              </h2>
            </div>

            <div className="ai-table-wrap">
              {failures.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="fa-solid fa-circle-check text-success fs-3 mb-2"></i>
                  <p className="mb-0 fw-semibold">No recent AI invocation errors. System operating normally.</p>
                </div>
              ) : (
                <table className="ai-table">
                  <thead>
                    <tr>
                      <th>Feature</th>
                      <th>Error Details</th>
                      <th>Latency</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failures.map((f) => (
                      <tr key={f.id}>
                        <td className="fw-semibold" style={{ color: "#0b2b22" }}>
                          {featureLabel(f.feature)}
                        </td>
                        <td className="text-danger" style={{ maxWidth: "380px" }}>
                          <i className="fa-solid fa-circle-exclamation me-1"></i>
                          {f.errorMessage ?? "Unknown error occurred"}
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border font-monospace">
                            {f.latencyMs} ms
                          </span>
                        </td>
                        <td className="text-muted">
                          {new Date(f.createdAt).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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
    </>
  );
}
