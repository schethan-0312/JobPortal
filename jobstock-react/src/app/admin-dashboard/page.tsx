"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface Alerts {
  pendingEmployers: number;
  openReports: number;
  failedLoginsLast24h: number;
  blockedIpsCount: number;
  aiFailuresLast24h: number;
  disabledAiFeatures: number;
}

interface SignupDay {
  date: string;
  candidates: number;
  employers: number;
}

interface AdminStats {
  totalCandidates: number;
  totalEmployers: number;
  pendingEmployers: number;
  jobsThisWeek: number;
  applicationsThisWeek: number;
  openReports: number;
  revenueLast30DaysPaisa: number;
  alerts: Alerts;
  signupTrend: SignupDay[];
}

function formatMoney(paisa: number) {
  return `₹${(paisa / 100).toLocaleString("en-IN")}`;
}

export default function AdminDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    (async () => {
      setDataLoading(true);
      try {
        const res = await api.get<AdminStats>("/admin/stats");
        setStats(res);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load dashboard data");
      } finally {
        setDataLoading(false);
      }
    })();
  }, [user]);

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  const ctrs = [
    { icon: "fa-solid fa-user-graduate", class: "success", title: "Total Candidates", number: String(stats?.totalCandidates ?? 0) },
    { icon: "fa-solid fa-building", class: "warning", title: "Total Employers", number: String(stats?.totalEmployers ?? 0) },
    { icon: "fa-solid fa-user-clock", class: "danger", title: "Pending Employers", number: String(stats?.pendingEmployers ?? 0) },
    { icon: "fa-solid fa-business-time", class: "info", title: "Jobs This Week", number: String(stats?.jobsThisWeek ?? 0) },
    { icon: "fa-regular fa-paper-plane", class: "success", title: "Applications This Week", number: String(stats?.applicationsThisWeek ?? 0) },
    { icon: "fa-solid fa-sack-dollar", class: "success", title: "Revenue (30d)", number: stats ? formatMoney(stats.revenueLast30DaysPaisa) : "₹0" },
  ];

  const alertItems = stats
    ? [
        { label: "Pending Employers", value: stats.alerts.pendingEmployers, href: "/admin-employers", severe: stats.alerts.pendingEmployers > 0 },
        { label: "Open Reports", value: stats.alerts.openReports, href: "/admin-reports", severe: stats.alerts.openReports > 0 },
        { label: "Failed Logins (24h)", value: stats.alerts.failedLoginsLast24h, href: "/admin-security", severe: stats.alerts.failedLoginsLast24h > 10 },
        { label: "Blocked IPs", value: stats.alerts.blockedIpsCount, href: "/admin-security", severe: false },
        { label: "AI Failures (24h)", value: stats.alerts.aiFailuresLast24h, href: "/admin-ai", severe: stats.alerts.aiFailuresLast24h > 0 },
        { label: "Disabled AI Features", value: stats.alerts.disabledAiFeatures, href: "/admin-ai", severe: stats.alerts.disabledAiFeatures > 0 },
      ]
    : [];

  const maxSignup = stats
    ? Math.max(1, ...stats.signupTrend.map((d) => d.candidates + d.employers))
    : 1;

  return (
    <>
      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="dashboard" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Admin Dashboard</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted">
                      <a href="#">Admin</a>
                    </li>
                    <li className="breadcrumb-item text-muted">
                      <a href="#">Dashboard</a>
                    </li>
                    <li className="breadcrumb-item">
                      <a href="#" className="text-main">
                        Admin Statistics
                      </a>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}
            {dataLoading && <p className="text-muted">Loading...</p>}

            {/* Row Start */}
            <div className="row align-items-center gx-4 gy-4 mb-4">
              {ctrs.map((item) => (
                <div className="col-xl-4 col-lg-6 col-md-6 col-sm-6" key={item.title}>
                  <div className="dash-wrap-bloud">
                    <div className="dash-wrap-bloud-icon">
                      <div className={`bloud-icon text-${item.class} bg-${item.class} bg-opacity-05`}>
                        <i className={item.icon}></i>
                      </div>
                    </div>
                    <div className="dash-wrap-bloud-caption">
                      <div className="dash-wrap-bloud-content">
                        <h5 className="ctr">{item.number}</h5>
                        <p>{item.title}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Row End */}

            <div className="row g-4 mb-4">
              <div className="col-lg-7">
                <div className="card h-100">
                  <div className="card-header"><h6 className="mb-0">Signups — Last 14 Days</h6></div>
                  <div className="card-body">
                    {stats && (
                      <div className="d-flex align-items-end gap-1" style={{ height: 140 }}>
                        {stats.signupTrend.map((d) => {
                          const total = d.candidates + d.employers;
                          const heightPct = Math.max(2, (total / maxSignup) * 100);
                          return (
                            <div
                              key={d.date}
                              className="flex-fill d-flex flex-column justify-content-end"
                              title={`${d.date}: ${d.candidates} candidates, ${d.employers} employers`}
                            >
                              <div
                                className="bg-main rounded-top"
                                style={{ height: `${heightPct}%`, minHeight: 2, opacity: total === 0 ? 0.15 : 1 }}
                              />
                              <div className="small text-muted text-center mt-1" style={{ fontSize: 10 }}>
                                {d.date.slice(5)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-lg-5">
                <div className="card h-100">
                  <div className="card-header"><h6 className="mb-0">Attention Needed</h6></div>
                  <div className="card-body">
                    <div className="d-flex flex-column gap-2">
                      {alertItems.map((a) => (
                        <a
                          key={a.label}
                          href={a.href}
                          className="d-flex justify-content-between align-items-center text-decoration-none px-2 py-1 rounded"
                          style={{ backgroundColor: a.severe ? "rgba(220,53,69,0.08)" : "transparent" }}
                        >
                          <span className={a.severe ? "text-danger small fw-medium" : "small text-body"}>{a.label}</span>
                          <span className={`badge ${a.severe ? "bg-danger" : "bg-secondary"}`}>{a.value}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* footer */}
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
