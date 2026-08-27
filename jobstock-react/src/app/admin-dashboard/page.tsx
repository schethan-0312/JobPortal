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
    { icon: "fa-solid fa-user-graduate", class: "success", title: "Total Candidates", number: String(stats?.totalCandidates ?? 0) },
    { icon: "fa-solid fa-building", class: "warning", title: "Total Employers", number: String(stats?.totalEmployers ?? 0) },
    { icon: "fa-solid fa-user-clock", class: "danger", title: "Pending Employers", number: String(stats?.pendingEmployers ?? 0) },
    { icon: "fa-solid fa-business-time", class: "info", title: "Jobs This Week", number: String(stats?.jobsThisWeek ?? 0) },
    { icon: "fa-regular fa-paper-plane", class: "success", title: "Applications This Week", number: String(stats?.applicationsThisWeek ?? 0) },
    { icon: "fa-solid fa-flag", class: "warning", title: "Open Reports", number: String(stats?.openReports ?? 0) },
  ];

  return (
    <>
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

