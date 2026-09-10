"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

function getIntegrationIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("razorpay") || n.includes("stripe") || n.includes("payment")) return "fa-credit-card";
  if (n.includes("mail") || n.includes("sendgrid") || n.includes("smtp")) return "fa-envelope";
  if (n.includes("s3") || n.includes("storage") || n.includes("aws")) return "fa-cloud";
  if (n.includes("openai") || n.includes("ai") || n.includes("gemini")) return "fa-robot";
  if (n.includes("db") || n.includes("database") || n.includes("postgres") || n.includes("prisma")) return "fa-database";
  if (n.includes("auth") || n.includes("oauth") || n.includes("google")) return "fa-shield-halved";
  if (n.includes("proctor") || n.includes("face") || n.includes("camera")) return "fa-video";
  return "fa-plug";
}

function StatusBadge({ status }: { status: IntegrationStatus["status"] }) {
  if (status === "up") {
    return (
      <span
        className="badge rounded-pill fw-semibold d-inline-flex align-items-center gap-1.5 px-3 py-1.5"
        style={{ background: "rgba(16, 185, 129, 0.12)", color: "#059669", fontSize: "0.78rem" }}
      >
        <span
          className="rounded-circle"
          style={{
            width: "7px",
            height: "7px",
            background: "#10b981",
            boxShadow: "0 0 6px #10b981"
          }}
        />
        Operational
      </span>
    );
  }
  if (status === "down") {
    return (
      <span
        className="badge rounded-pill fw-semibold d-inline-flex align-items-center gap-1.5 px-3 py-1.5"
        style={{ background: "rgba(239, 68, 68, 0.12)", color: "#dc2626", fontSize: "0.78rem" }}
      >
        <span
          className="rounded-circle"
          style={{
            width: "7px",
            height: "7px",
            background: "#ef4444",
            boxShadow: "0 0 6px #ef4444"
          }}
        />
        Degraded / Down
      </span>
    );
  }
  return (
    <span
      className="badge rounded-pill fw-semibold d-inline-flex align-items-center gap-1.5 px-3 py-1.5"
      style={{ background: "rgba(100, 116, 139, 0.12)", color: "#475569", fontSize: "0.78rem" }}
    >
      <span
        className="rounded-circle"
        style={{ width: "7px", height: "7px", background: "#94a3b8" }}
      />
      Not Configured
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
  const upCount = statuses?.filter((s) => s.status === "up").length ?? 0;
  const downCount = statuses?.filter((s) => s.status === "down").length ?? 0;
  const notConfiguredCount = statuses?.filter((s) => s.status === "not_configured").length ?? 0;

  return (
    <>
      <AdminNavbar />

      <div className="dashboard-wrap bg-light" style={{ minHeight: "100vh", overflowX: "hidden" }}>
        <AdminSidebar active="integrations" />

        <div className="dashboard-content" style={{ padding: "30px 25px 60px" }}>
          {/* Breadcrumb / Title Bar */}
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row align-items-center">
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <div>
                    <h1 className="mb-1 fs-3 fw-bold text-dark" style={{ letterSpacing: "-0.5px" }}>
                      Integration Health
                    </h1>
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                        <li className="breadcrumb-item">
                          <Link href="/admin-dashboard" className="text-muted text-decoration-none">Admin</Link>
                        </li>
                        <li className="breadcrumb-item active text-dark fw-medium" aria-current="page" style={{ color: "#0d4f3c" }}>
                          Integration Health
                        </li>
                      </ol>
                    </nav>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn px-3 py-2 rounded-3 text-white fw-semibold d-inline-flex align-items-center gap-2 border-0 shadow-sm"
                      onClick={load}
                      disabled={refreshing}
                      style={{
                        background: "linear-gradient(135deg, #0d4f3c 0%, #157358 100%)",
                        fontSize: "0.85rem",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <i className={`fa-solid fa-arrows-rotate ${refreshing ? "fa-spin" : ""}`}></i>
                      {refreshing ? "Checking..." : "Refresh Health"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 mb-4 rounded-3 border-0 shadow-sm" style={{ background: "#fef2f2", color: "#991b1b" }}>
                <i className="fa-solid fa-circle-exclamation fs-5"></i>
                <span>{error}</span>
              </div>
            )}

            {/* Razorpay Environment Banner */}
            {razorpay && (
              <div
                className="card border-0 rounded-4 shadow-sm mb-4 overflow-hidden"
                style={{
                  background: razorpay.detail.startsWith("LIVE")
                    ? "linear-gradient(135deg, #fff5f5 0%, #ffe3e3 100%)"
                    : "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                  border: razorpay.detail.startsWith("LIVE") ? "1px solid #fca5a5" : "1px solid #fde68a"
                }}
              >
                <div className="card-body p-3.5 d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0"
                      style={{
                        width: "44px",
                        height: "44px",
                        background: razorpay.detail.startsWith("LIVE") ? "#dc2626" : "#d97706"
                      }}
                    >
                      <i className="fa-solid fa-triangle-exclamation fs-5"></i>
                    </div>
                    <div>
                      <h6 className="mb-0.5 fw-bold text-dark" style={{ fontSize: "0.95rem" }}>
                        Payment Gateway Status: {razorpay.detail.startsWith("LIVE") ? "LIVE PRODUCTION MODE" : "TEST SANDBOX MODE"}
                      </h6>
                      <p className="mb-0 text-muted small" style={{ fontSize: "0.82rem" }}>
                        {razorpay.detail.startsWith("LIVE")
                          ? "Real transactions and credit cards are currently being charged."
                          : "Simulated test gateway active. Real cards will not be charged."}
                      </p>
                    </div>
                  </div>
                  <span
                    className="badge rounded-pill fw-bold px-3 py-1.5"
                    style={{
                      background: razorpay.detail.startsWith("LIVE") ? "#dc2626" : "#d97706",
                      color: "#ffffff",
                      fontSize: "0.8rem",
                      letterSpacing: "0.5px"
                    }}
                  >
                    {razorpay.detail.startsWith("LIVE") ? "LIVE MONEY" : "TEST MODE"}
                  </span>
                </div>
              </div>
            )}

            {/* Overview Stat Cards in .dash-wrap-bloud style */}
            {statuses && (
              <div className="row g-3 mb-4">
                <div className="col-xl-4 col-md-4 col-sm-12">
                  <div className="dash-wrap-bloud" style={{ minHeight: "105px" }}>
                    <div className="dash-wrap-glow"></div>
                    <div className="bloud-icon" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
                      <i className="fa-solid fa-circle-check"></i>
                    </div>
                    <div className="dash-wrap-bloud-caption">
                      <div className="dash-wrap-bloud-content text-end">
                        <h5 className="ctr text-dark fw-bold mb-0">{upCount}</h5>
                        <p className="text-muted mb-0 small fw-medium">Operational Services</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xl-4 col-md-4 col-sm-12">
                  <div className="dash-wrap-bloud" style={{ minHeight: "105px" }}>
                    <div className="dash-wrap-glow"></div>
                    <div className="bloud-icon" style={{ background: "rgba(239, 68, 68, 0.12)", color: "#ef4444" }}>
                      <i className="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <div className="dash-wrap-bloud-caption">
                      <div className="dash-wrap-bloud-content text-end">
                        <h5 className="ctr text-dark fw-bold mb-0">{downCount}</h5>
                        <p className="text-muted mb-0 small fw-medium">Degraded / Offline</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xl-4 col-md-4 col-sm-12">
                  <div className="dash-wrap-bloud" style={{ minHeight: "105px" }}>
                    <div className="dash-wrap-glow"></div>
                    <div className="bloud-icon" style={{ background: "rgba(100, 116, 139, 0.12)", color: "#64748b" }}>
                      <i className="fa-solid fa-gear"></i>
                    </div>
                    <div className="dash-wrap-bloud-caption">
                      <div className="dash-wrap-bloud-content text-end">
                        <h5 className="ctr text-dark fw-bold mb-0">{notConfiguredCount}</h5>
                        <p className="text-muted mb-0 small fw-medium">Not Configured</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!statuses && !error && (
              <div className="card border-0 rounded-4 shadow-sm text-center py-5" style={{ background: "#ffffff" }}>
                <div className="card-body p-4">
                  <div
                    className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
                    style={{ width: "60px", height: "60px", background: "rgba(13, 79, 60, 0.08)", color: "#0d4f3c" }}
                  >
                    <i className="fa-solid fa-spinner fa-spin fs-4"></i>
                  </div>
                  <h6 className="fw-bold text-dark mb-1">Checking Integration Health...</h6>
                  <p className="text-muted small mb-0">Querying status from third-party services and APIs.</p>
                </div>
              </div>
            )}

            {statuses && (
              <div className="row g-3">
                {statuses.map((s) => {
                  const icon = getIntegrationIcon(s.name);
                  const isUp = s.status === "up";
                  const isDown = s.status === "down";

                  const iconBg = isUp
                    ? "rgba(16, 185, 129, 0.1)"
                    : isDown
                    ? "rgba(239, 68, 68, 0.1)"
                    : "rgba(100, 116, 139, 0.1)";

                  const iconColor = isUp ? "#059669" : isDown ? "#dc2626" : "#64748b";

                  return (
                    <div className="col-md-6 col-xl-4" key={s.name}>
                      <div
                        className="card border-0 rounded-4 shadow-sm h-100 position-relative overflow-hidden"
                        style={{
                          background: "#ffffff",
                          border: "1px solid #f1f5f9",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <div className="card-body p-4 d-flex flex-column justify-content-between">
                          <div>
                            <div className="d-flex justify-content-between align-items-start mb-3">
                              <div className="d-flex align-items-center gap-3">
                                <div
                                  className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                                  style={{ width: "42px", height: "42px", background: iconBg, color: iconColor }}
                                >
                                  <i className={`fa-solid ${icon} fs-5`}></i>
                                </div>
                                <div>
                                  <h6 className="mb-0.5 fw-bold text-dark" style={{ fontSize: "0.98rem" }}>
                                    {s.name}
                                  </h6>
                                  <span className="small text-muted" style={{ fontSize: "0.75rem" }}>
                                    External Integration
                                  </span>
                                </div>
                              </div>
                              <StatusBadge status={s.status} />
                            </div>

                            <div
                              className="p-3 rounded-3 mb-3"
                              style={{
                                background: "#f8faf9",
                                border: "1px solid #eef2f0",
                                fontSize: "0.85rem",
                                color: "#334155"
                              }}
                            >
                              <div className="d-flex align-items-start gap-2">
                                <i className="fa-solid fa-circle-info text-muted mt-0.5" style={{ fontSize: "0.8rem" }}></i>
                                <span className="text-break">{s.detail || "No details provided"}</span>
                              </div>
                            </div>
                          </div>

                          <div className="d-flex align-items-center justify-content-between pt-2 border-top" style={{ borderColor: "#f1f5f9" }}>
                            <span className="text-muted small" style={{ fontSize: "0.75rem" }}>
                              <i className="fa-regular fa-clock me-1 text-muted"></i>
                              Checked {s.checkedAt ? new Date(s.checkedAt).toLocaleTimeString() : "Just now"}
                            </span>
                            <span
                              className="small fw-semibold"
                              style={{
                                fontSize: "0.75rem",
                                color: isUp ? "#059669" : isDown ? "#dc2626" : "#64748b"
                              }}
                            >
                              {isUp ? "Healthy" : isDown ? "Action Required" : "Inactive"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
