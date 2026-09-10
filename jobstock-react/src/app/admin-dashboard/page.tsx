"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface AdminStats {
  totalCandidates: number;
  totalEmployers: number;
  pendingEmployers: number;
  jobsThisWeek: number;
  applicationsThisWeek: number;
  openReports: number;
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
    { icon: "fa-solid fa-user-graduate", glowColor: "#dcf4fa", iconColor: "#174742", iconBg: "#eef3f5", title: "Total Candidates", number: String(stats?.totalCandidates ?? 0) },
    { icon: "fa-solid fa-building", glowColor: "#ffede8", iconColor: "#f76b59", iconBg: "#fcf0ed", title: "Total Employers", number: String(stats?.totalEmployers ?? 0) },
    { icon: "fa-solid fa-user-clock", glowColor: "#ffe8eb", iconColor: "#d94348", iconBg: "#fcf0f2", title: "Pending Employers", number: String(stats?.pendingEmployers ?? 0) },
    { icon: "fa-solid fa-business-time", glowColor: "#dbfbf5", iconColor: "#134d42", iconBg: "#def5f0", title: "Jobs This Week", number: String(stats?.jobsThisWeek ?? 0) },
    { icon: "fa-regular fa-paper-plane", glowColor: "#dcf4fa", iconColor: "#174742", iconBg: "#eef3f5", title: "Applications This Week", number: String(stats?.applicationsThisWeek ?? 0) },
    { icon: "fa-solid fa-flag", glowColor: "#fff3dc", iconColor: "#b07c1a", iconBg: "#fdf3e0", title: "Open Reports", number: String(stats?.openReports ?? 0) },
  ];

  return (
    <>
      <style jsx global>{`
        .dashboard-wrap {
          background-color: #f4f9f8 !important;
        }
        .dashboard-tlbar h1 {
          color: #06312a !important;
          font-weight: 600 !important;
        }
        .breadcrumb-item a {
          color: #63857d !important;
        }
        .breadcrumb-item a.text-main {
          color: #429e85 !important;
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
      `}</style>

      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="dashboard" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-12">
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
                <div className="col-12 col-sm-6 col-md-6 col-lg-6 col-xl-4" key={item.title}>
                  <div className="dash-wrap-bloud">
                    <div className="dash-wrap-glow" style={{ background: item.glowColor }}></div>
                    <div className="dash-wrap-bloud-icon">
                      <div className="bloud-icon" style={{ backgroundColor: item.iconBg, color: item.iconColor }}>
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
          </div>
        </div>
      </div>
    </>
  );
}

