"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, getToken } from "@/lib/api";

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
    <div className="d-flex align-items-end gap-1 flex-wrap" style={{ height: 80 }}>
      {data.map((d) => (
        <div
          key={d.date}
          className="flex-fill rounded-top"
          style={{
            height: `${Math.max(2, (d.count / max) * 100)}%`,
            backgroundColor: color,
            opacity: d.count === 0 ? 0.15 : 1,
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    (async () => {
      setError(null);
      try {
        const [ov, bk] = await Promise.all([
          api.get<Overview>(`/admin/analytics/overview?days=${days}`),
          api.get<Breakdowns>("/admin/analytics/breakdowns"),
        ]);
        setOverview(ov);
        setBreakdowns(bk);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load analytics");
      }
    })();
  }, [user, days]);

  async function handleExport(report: string) {
    const token = getToken();
    const res = await fetch(`${API_URL}/admin/analytics/export?report=${report}&days=${days}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report}-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="analytics" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Analytics &amp; Reports</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Analytics</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="d-flex flex-wrap gap-2 mb-4">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`btn btn-sm ${days === d ? "btn-main" : "btn-outline-main"}`}
                  onClick={() => setDays(d)}
                >
                  Last {d}d
                </button>
              ))}
            </div>

            {overview && (
              <>
                <div className="row g-4 mb-4">
                  <div className="col-md-3">
                    <div className="card h-100"><div className="card-body">
                      <div className="text-muted small">Signups</div>
                      <div className="fw-bold fs-4">{overview.totalSignups}</div>
                      <MiniBarChart data={overview.signupTrend} color="#0d6efd" />
                    </div></div>
                  </div>
                  <div className="col-md-3">
                    <div className="card h-100"><div className="card-body">
                      <div className="text-muted small">Jobs Posted</div>
                      <div className="fw-bold fs-4">{overview.totalJobs}</div>
                      <MiniBarChart data={overview.jobTrend} color="#198754" />
                    </div></div>
                  </div>
                  <div className="col-md-3">
                    <div className="card h-100"><div className="card-body">
                      <div className="text-muted small">Applications</div>
                      <div className="fw-bold fs-4">{overview.totalApplications}</div>
                      <MiniBarChart data={overview.applicationTrend} color="#fd7e14" />
                    </div></div>
                  </div>
                  <div className="col-md-3">
                    <div className="card h-100"><div className="card-body">
                      <div className="text-muted small">Revenue</div>
                      <div className="fw-bold fs-4">{formatMoney(overview.totalRevenuePaisa)}</div>
                      <MiniBarChart data={overview.revenueTrend} color="#20c997" />
                    </div></div>
                  </div>
                </div>

                <div className="card mb-4">
                  <div className="card-header"><h6 className="mb-0">Export Reports (CSV)</h6></div>
                  <div className="card-body d-flex flex-wrap gap-2">
                    <button type="button" className="btn btn-sm btn-outline-main" onClick={() => handleExport("signups")}>
                      Export Signups
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-main" onClick={() => handleExport("jobs")}>
                      Export Jobs
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-main" onClick={() => handleExport("revenue")}>
                      Export Revenue
                    </button>
                  </div>
                </div>
              </>
            )}

            {breakdowns && (
              <div className="row g-4">
                <div className="col-md-4">
                  <div className="card h-100">
                    <div className="card-header"><h6 className="mb-0">Jobs by Category</h6></div>
                    <div className="card-body">
                      {breakdowns.jobsByCategory.map((c) => (
                        <div key={c.category} className="d-flex justify-content-between small border-bottom py-1">
                          <span>{c.category}</span>
                          <span className="fw-medium">{c.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card h-100">
                    <div className="card-header"><h6 className="mb-0">Applications by Status</h6></div>
                    <div className="card-body">
                      {breakdowns.applicationsByStatus.map((s) => (
                        <div key={s.status} className="d-flex justify-content-between small border-bottom py-1">
                          <span>{s.status}</span>
                          <span className="fw-medium">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card h-100">
                    <div className="card-header"><h6 className="mb-0">Top Candidate Locations</h6></div>
                    <div className="card-body">
                      {breakdowns.candidatesByLocation.map((l) => (
                        <div key={l.location} className="d-flex justify-content-between small border-bottom py-1">
                          <span>{l.location}</span>
                          <span className="fw-medium">{l.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

