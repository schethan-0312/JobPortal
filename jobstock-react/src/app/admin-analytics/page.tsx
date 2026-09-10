"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, getToken } from "@/lib/api";
import Swal from "sweetalert2";
import toast, { Toaster } from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

interface TrendPoint {
  date: string;
  count: number;
}

interface Overview {
  windowDays: number;
  totalSignups: number;
  totalJobs: number;
  totalApplications: number;
  totalRevenuePaisa: number;
  signupTrend: TrendPoint[];
  jobTrend: TrendPoint[];
  applicationTrend: TrendPoint[];
  revenueTrend: TrendPoint[];
}

interface Breakdowns {
  jobsByCategory: { category: string; count: number }[];
  applicationsByStatus: { status: string; count: number }[];
  candidatesByLocation: { location: string; count: number }[];
}

function formatMoney(paisa: number) {
  return `₹${(paisa / 100).toLocaleString("en-IN")}`;
}

function MiniBarChart({ data, color }: { data: TrendPoint[]; color: string }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="d-flex align-items-end gap-1 mt-3" style={{ height: 65 }}>
      {data.map((d) => (
        <div
          key={d.date}
          className="flex-fill rounded-top"
          style={{
            height: `${Math.max(4, (d.count / max) * 100)}%`,
            backgroundColor: color,
            opacity: d.count === 0 ? 0.15 : 0.85,
            transition: "all 0.2s ease"
          }}
          title={`${d.date}: ${d.count}`}
        />
      ))}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [days, setDays] = useState(30);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [breakdowns, setBreakdowns] = useState<Breakdowns | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function loadData() {
    setFetching(true);
    try {
      const [ov, bk] = await Promise.all([
        api.get<Overview>(`/admin/analytics/overview?days=${days}`),
        api.get<Breakdowns>("/admin/analytics/breakdowns"),
      ]);
      setOverview(ov);
      setBreakdowns(bk);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Analytics Failed",
        text: err instanceof ApiError ? err.message : "Failed to load analytics data",
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
  }, [user, days]);

  async function handleExport(report: string) {
    try {
      toast.loading(`Generating ${report} CSV export...`, { id: "export-toast" });
      const token = getToken();
      const res = await fetch(`${API_URL}/admin/analytics/export?report=${report}&days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed on server");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report}-${days}d.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${report} report exported successfully!`, { id: "export-toast" });
    } catch (err: any) {
      toast.error(err.message || "Failed to download export", { id: "export-toast" });
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
        .stat-glow.blue { background: #3b82f6; }
        .stat-glow.mint { background: #429e85; }
        .stat-glow.amber { background: #f59e0b; }
        .stat-glow.teal { background: #0d9488; }

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
        .stat-icon-wrap.blue { background: #eff6ff; color: #2563eb; }
        .stat-icon-wrap.mint { background: #e8f5f1; color: #0d4f3c; }
        .stat-icon-wrap.amber { background: #fef3c7; color: #d97706; }
        .stat-icon-wrap.teal { background: #ccfbf1; color: #0f766e; }

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

        .day-filter-btn {
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          padding: 6px 16px;
          border: 1.5px solid #d6e8e4;
          background: #ffffff;
          color: #4b635b;
          transition: all 0.2s;
        }
        .day-filter-btn:hover {
          border-color: #429e85;
          color: #0d4f3c;
          background: #e8f5f1;
        }
        .day-filter-btn.active {
          background: #0d4f3c;
          border-color: #0d4f3c;
          color: #ffffff;
        }

        .btn-export {
          background: #ffffff;
          border: 1.5px solid #d6e8e4;
          color: #0d4f3c;
          font-weight: 600;
          font-size: 13px;
          padding: 8px 16px;
          border-radius: 9px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .btn-export:hover {
          background: #e8f5f1;
          border-color: #429e85;
          color: #08382b;
        }

        .breakdown-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 6px;
          background: #fbfdfc;
          border: 1px solid #edf4f1;
        }
        .breakdown-row:hover {
          background: #f2f9f6;
          border-color: #d6e8e4;
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
        <AdminSidebar active="analytics" />

        <div className="dashboard-content pkg-page">
          {/* Header */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
              <h1 className="pkg-header-title mb-1">Analytics &amp; Growth Insights</h1>
              <p className="pkg-header-subtitle mb-0">
                Track platform trends across user signups, job postings, candidate applications, and gross revenue.
              </p>
            </div>

            {/* Time Window Buttons */}
            <div className="d-flex gap-2">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`day-filter-btn ${days === d ? "active" : ""}`}
                  onClick={() => setDays(d)}
                >
                  Last {d} Days
                </button>
              ))}
            </div>
          </div>

          {fetching && !overview && (
            <div className="text-center py-5">
              <i className="fa-solid fa-circle-notch fa-spin text-muted fs-2 mb-2"></i>
              <p className="text-muted fw-semibold">Loading platform analytics...</p>
            </div>
          )}

          {overview && (
            <>
              {/* Stat Cards with Mini Bar Charts */}
              <div className="row g-3 mb-4">
                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="stat-card-custom">
                    <div className="stat-glow blue"></div>
                    <div className="stat-icon-wrap blue">
                      <i className="fa-solid fa-user-plus"></i>
                    </div>
                    <div className="stat-number">{overview.totalSignups}</div>
                    <div className="stat-label">New Signups ({days}d)</div>
                    <MiniBarChart data={overview.signupTrend} color="#2563eb" />
                  </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="stat-card-custom">
                    <div className="stat-glow mint"></div>
                    <div className="stat-icon-wrap mint">
                      <i className="fa-solid fa-briefcase"></i>
                    </div>
                    <div className="stat-number">{overview.totalJobs}</div>
                    <div className="stat-label">Jobs Posted ({days}d)</div>
                    <MiniBarChart data={overview.jobTrend} color="#0d4f3c" />
                  </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="stat-card-custom">
                    <div className="stat-glow amber"></div>
                    <div className="stat-icon-wrap amber">
                      <i className="fa-solid fa-paper-plane"></i>
                    </div>
                    <div className="stat-number">{overview.totalApplications}</div>
                    <div className="stat-label">Applications ({days}d)</div>
                    <MiniBarChart data={overview.applicationTrend} color="#d97706" />
                  </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="stat-card-custom">
                    <div className="stat-glow teal"></div>
                    <div className="stat-icon-wrap teal">
                      <i className="fa-solid fa-indian-rupee-sign"></i>
                    </div>
                    <div className="stat-number">{formatMoney(overview.totalRevenuePaisa)}</div>
                    <div className="stat-label">Revenue ({days}d)</div>
                    <MiniBarChart data={overview.revenueTrend} color="#0f766e" />
                  </div>
                </div>
              </div>

              {/* CSV Export Card */}
              <div className="elite-card">
                <div className="elite-card-header">
                  <h2 className="elite-card-title">
                    <i className="fa-solid fa-file-arrow-down" style={{ color: "#429e85" }}></i>
                    Export Analytics Reports (CSV)
                  </h2>
                </div>
                <div className="p-4 d-flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-export"
                    onClick={() => handleExport("signups")}
                  >
                    <i className="fa-solid fa-download"></i> Export Signups CSV
                  </button>
                  <button
                    type="button"
                    className="btn-export"
                    onClick={() => handleExport("jobs")}
                  >
                    <i className="fa-solid fa-download"></i> Export Jobs CSV
                  </button>
                  <button
                    type="button"
                    className="btn-export"
                    onClick={() => handleExport("revenue")}
                  >
                    <i className="fa-solid fa-download"></i> Export Revenue CSV
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Breakdown Cards */}
          {breakdowns && (
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <div className="elite-card h-100">
                  <div className="elite-card-header">
                    <h2 className="elite-card-title">
                      <i className="fa-solid fa-folder-tree" style={{ color: "#429e85" }}></i>
                      Jobs by Category
                    </h2>
                  </div>
                  <div className="p-3">
                    {breakdowns.jobsByCategory.length === 0 ? (
                      <p className="text-muted small mb-0">No job records.</p>
                    ) : (
                      breakdowns.jobsByCategory.map((c) => (
                        <div key={c.category} className="breakdown-row">
                          <span className="fw-medium text-dark">{c.category}</span>
                          <span className="badge bg-light text-dark border fw-bold">{c.count}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="elite-card h-100">
                  <div className="elite-card-header">
                    <h2 className="elite-card-title">
                      <i className="fa-solid fa-chart-simple" style={{ color: "#429e85" }}></i>
                      Applications by Status
                    </h2>
                  </div>
                  <div className="p-3">
                    {breakdowns.applicationsByStatus.length === 0 ? (
                      <p className="text-muted small mb-0">No application records.</p>
                    ) : (
                      breakdowns.applicationsByStatus.map((s) => (
                        <div key={s.status} className="breakdown-row">
                          <span className="fw-medium text-capitalize text-dark">{s.status.toLowerCase()}</span>
                          <span className="badge bg-light text-dark border fw-bold">{s.count}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="elite-card h-100">
                  <div className="elite-card-header">
                    <h2 className="elite-card-title">
                      <i className="fa-solid fa-location-dot" style={{ color: "#429e85" }}></i>
                      Top Candidate Locations
                    </h2>
                  </div>
                  <div className="p-3">
                    {breakdowns.candidatesByLocation.length === 0 ? (
                      <p className="text-muted small mb-0">No location data.</p>
                    ) : (
                      breakdowns.candidatesByLocation.map((l) => (
                        <div key={l.location} className="breakdown-row">
                          <span className="fw-medium text-dark">{l.location}</span>
                          <span className="badge bg-light text-dark border fw-bold">{l.count}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
