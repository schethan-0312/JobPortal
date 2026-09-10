"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import Swal from "sweetalert2";
import { Toaster, toast } from "react-hot-toast";

interface JobRow {
  id: string;
  title: string;
  category: string;
  location: string;
  jobType: string;
  status: string;
  createdAt: string;
  employerName: string;
  employerStatus: string;
  applicationsCount: number;
  reportsCount: number;
}

interface JobListResponse {
  items: JobRow[];
  total: number;
}

interface AdminStats {
  jobsThisWeek?: number;
  openReports?: number;
}

export default function AdminJobsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<JobListResponse | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const showErrorPopup = (title: string, text: string) => {
    Swal.fire({
      icon: "error",
      title: title,
      text: text,
      confirmButtonText: "Got It",
      confirmButtonColor: "#d94348",
      customClass: {
        popup: "elite-pkg-popup",
        title: "elite-pkg-title",
        confirmButton: "elite-pkg-btn",
      },
    });
  };

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  const loadData = async () => {
    setDataLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);

      const [res, statsRes] = await Promise.all([
        api.get<JobListResponse>(`/admin/job-moderation?${params.toString()}`),
        api.get<AdminStats>("/admin/stats").catch(() => null),
      ]);
      setData(res);
      if (statsRes) setAdminStats(statsRes);
    } catch (err) {
      showErrorPopup("Sync Error", err instanceof ApiError ? err.message : "Failed to load jobs");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    loadData();
  }, [user, search, status, refreshKey]);

  const handleRefresh = async () => {
    setSearch("");
    setStatus("");
    setRefreshKey((prev) => prev + 1);
    toast.success("Job moderation list refreshed!", { icon: "🔄" });
  };

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  const totalJobs = data?.total ?? 0;
  const openJobs = data?.items.filter((j) => j.status === "OPEN").length ?? 0;
  const flaggedJobs = data?.items.filter((j) => j.status === "FLAGGED" || j.reportsCount > 0).length ?? 0;

  const statCards = [
    { 
      icon: "fa-solid fa-briefcase", 
      glowColor: "#dcf4fa", 
      iconColor: "#174742", 
      iconBg: "#eef3f5", 
      label: "TOTAL POSTED JOBS", 
      value: `${totalJobs} Listings` 
    },
    { 
      icon: "fa-solid fa-circle-check", 
      glowColor: "#dbfbf5", 
      iconColor: "#134d42", 
      iconBg: "#def5f0", 
      label: "ACTIVE OPEN JOBS", 
      value: `${openJobs} Published` 
    },
    { 
      icon: "fa-solid fa-flag", 
      glowColor: "#ffede8", 
      iconColor: "#b24025", 
      iconBg: "#fbebe7", 
      label: "FLAGGED / REPORTED", 
      value: `${flaggedJobs} Flagged` 
    },
  ];

  const getStatusBadge = (jobStatus: string) => {
    switch (jobStatus) {
      case "OPEN":
        return <span className="job-badge-open">Active Open</span>;
      case "FLAGGED":
        return <span className="job-badge-flagged">Flagged</span>;
      case "CLOSED":
        return <span className="job-badge-closed">Closed</span>;
      case "DRAFT":
        return <span className="job-badge-draft">Draft</span>;
      default:
        return <span className="job-badge-closed">{jobStatus}</span>;
    }
  };

  return (
    <>
      <style jsx global>{`
        .dashboard-wrap { background-color: #f4f9f8 !important; overflow-x: hidden !important; }
        .dashboard-content.pkg-page {
          max-width: 100% !important;
          overflow-x: hidden !important;
        }
        .pkg-page h1 { color: #06312a; font-weight: 700; }
        .breadcrumb-item a { color: #63857d !important; }
        .breadcrumb-item a.text-main { color: #429e85 !important; }

        /* Stat cards */
        .pkg-stat-card {
          background: #fff; border: 1px solid #e1e9e7; border-radius: 0.85rem;
          box-shadow: 0 4px 12px rgba(0,0,0,.025); padding: 1.25rem 1.4rem;
          display: flex; align-items: center; gap: 1rem;
          position: relative; overflow: hidden;
          transition: transform .2s ease, box-shadow .2s ease;
        }
        .pkg-stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,.05); }
        .pkg-stat-glow {
          position: absolute; top: -20px; right: -20px;
          width: 130px; height: 130px; border-radius: 50%;
          filter: blur(35px); z-index: 0; opacity: .85;
        }
        .pkg-stat-icon {
          width: 52px; height: 52px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.15rem; position: relative; z-index: 1;
        }
        .pkg-stat-text { position: relative; z-index: 1; }
        .pkg-stat-text .slabel {
          font-size: .68rem; font-weight: 700; letter-spacing: .07em;
          color: #7a9b94; text-transform: uppercase; display: block; margin-bottom: .3rem;
        }
        .pkg-stat-text .svalue { font-size: 1.35rem; font-weight: 800; color: #0d362d; line-height: 1.15; }

        /* Table Card Container */
        .job-list-card {
          background: #fff; border: 1px solid #e1e9e7; border-radius: 0.85rem;
          box-shadow: 0 4px 14px rgba(0,0,0,.025); overflow: hidden;
          width: 100%;
          max-width: 100%;
        }
        .job-list-card .card-header-custom {
          background: #f2f8f6; border-bottom: 1px solid #d6e8e4;
          padding: 1rem 1.25rem;
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;
        }
        .job-list-card .card-header-custom h5 {
          font-size: 1rem; font-weight: 700; color: #0d362d; margin: 0;
        }

        .pkg-search {
          border: 1.5px solid #d0deda; border-radius: 0.5rem; padding: 0.42rem 0.8rem;
          font-size: 0.82rem; color: #1a3630; background: #f9fdfb; width: 210px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .pkg-search:focus { outline: none; border-color: #429e85; box-shadow: 0 0 0 3px rgba(66,158,133,.12); }

        .pkg-filter-select {
          border: 1.5px solid #d0deda; border-radius: 0.5rem; padding: 0.42rem 0.8rem;
          font-size: 0.82rem; color: #1a3630; background: #f9fdfb;
          transition: border-color 0.2s;
        }
        .pkg-filter-select:focus { outline: none; border-color: #429e85; }

        .btn-pkg-ghost {
          background: #eef3f1; color: #4a6862; border: 1px solid #d0deda;
          border-radius: 0.5rem; padding: 0.58rem 1.2rem; font-size: 0.875rem; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
        }
        .btn-pkg-ghost:hover { background: #dce8e4; color: #2d4e45; }

        .btn-pkg-refresh {
          background: #f2f8f6; border: 1px solid #d0deda; color: #4a6862;
          border-radius: 0.45rem; padding: 0.42rem 0.8rem; font-size: 0.8rem; cursor: pointer; transition: all 0.2s;
        }
        .btn-pkg-refresh:hover { background: #dce8e4; }

        .job-table-wrap {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        /* Custom Modern Table */
        .job-table {
          width: 100%;
          min-width: 820px;
          border-collapse: separate;
          border-spacing: 0;
        }
        .job-table th {
          background: #f9fdfb;
          color: #5a8578;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 0.8rem 1rem;
          border-bottom: 1.5px solid #d9e8e4;
          white-space: nowrap;
        }
        .job-table td {
          padding: 0.85rem 1rem;
          font-size: 0.83rem;
          color: #2d4e45;
          border-bottom: 1px solid #eaf2f0;
          vertical-align: middle;
          white-space: nowrap;
        }
        .job-table tr {
          transition: background 0.15s ease;
        }
        .job-table tr:hover {
          background: #f4faf8;
          cursor: pointer;
        }

        .btn-job-view {
          background: #e4f5ef;
          color: #0d4f3c;
          border: 1px solid #c0ddd6;
          border-radius: 0.45rem;
          padding: 0.32rem 0.75rem;
          font-size: 0.78rem;
          font-weight: 600;
          transition: all 0.2s ease;
          cursor: pointer;
          white-space: nowrap;
        }
        .btn-job-view:hover {
          background: #d0ede4;
          color: #083826;
        }

        .job-badge-open {
          background: #d4f0e4; color: #0d6e3f; font-size: 0.7rem; font-weight: 700;
          border-radius: 0.35rem; padding: 0.3rem 0.65rem; display: inline-block;
        }
        .job-badge-flagged {
          background: #fce8e8; color: #b02020; font-size: 0.7rem; font-weight: 700;
          border-radius: 0.35rem; padding: 0.3rem 0.65rem; display: inline-block;
        }
        .job-badge-closed {
          background: #eef3f1; color: #63857d; font-size: 0.7rem; font-weight: 700;
          border-radius: 0.35rem; padding: 0.3rem 0.65rem; display: inline-block;
        }
        .job-badge-draft {
          background: #fff3dc; color: #b07c1a; font-size: 0.7rem; font-weight: 700;
          border-radius: 0.35rem; padding: 0.3rem 0.65rem; display: inline-block;
        }
        .job-badge-reports {
          background: #fce8e8; color: #b02020; font-size: 0.72rem; font-weight: 700;
          border: 1px solid #f0c8c8; border-radius: 0.35rem; padding: 0.2rem 0.55rem;
        }

        /* SweetAlert popup styles */
        .elite-pkg-popup {
          border-radius: 1rem !important;
          border: 1px solid #d6e8e4 !important;
          box-shadow: 0 20px 40px -15px rgba(6, 49, 42, 0.18) !important;
          padding: 1.75rem 2rem !important;
          background: #ffffff !important;
          font-family: inherit !important;
        }
        .elite-pkg-title {
          font-size: 1.35rem !important;
          font-weight: 700 !important;
          color: #06312a !important;
          padding: 0 !important;
          margin-bottom: 0.5rem !important;
        }
        .elite-pkg-btn {
          border-radius: 0.5rem !important;
          padding: 0.6rem 1.6rem !important;
          font-weight: 600 !important;
          font-size: 0.88rem !important;
          box-shadow: none !important;
          transition: transform 0.15s ease, opacity 0.15s ease !important;
        }
        .elite-pkg-btn:hover {
          transform: translateY(-1px) !important;
          opacity: 0.95 !important;
        }
      `}</style>

      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: "#ffffff",
            color: "#06312a",
            border: "1px solid #d0deda",
            borderRadius: "0.6rem",
            fontSize: "0.88rem",
            fontWeight: "500",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)",
          },
        }}
      />

      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="jobs" />

        <div className="dashboard-content pkg-page">
          {/* Header */}
          <div className="dashboard-tlbar d-block mb-4">
            <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
              <div>
                <h1 className="mb-1 fs-3">Job Moderation</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Job Moderation &amp; Quality</a></li>
                  </ol>
                </nav>
              </div>
              <div className="d-flex gap-2">
                <button className="btn-pkg-ghost" onClick={() => router.back()}>
                  <i className="fa-solid fa-arrow-left me-1"></i> Back
                </button>
                <button className="btn-pkg-ghost" onClick={handleRefresh} title="Reload Data">
                  <i className={`fa-solid ${dataLoading ? "fa-spinner fa-spin" : "fa-rotate"} me-1`}></i> Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {/* Stat Boxes */}
            <div className="row gx-4 gy-4 mb-4">
              {statCards.map((card, i) => (
                <div className="col-12 col-sm-6 col-md-4" key={i}>
                  <div className="pkg-stat-card">
                    <div className="pkg-stat-glow" style={{ background: card.glowColor }}></div>
                    <div className="pkg-stat-icon" style={{ backgroundColor: card.iconBg, color: card.iconColor }}>
                      <i className={card.icon}></i>
                    </div>
                    <div className="pkg-stat-text">
                      <span className="slabel">{card.label}</span>
                      <div className="svalue">{card.value}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Job Table Card */}
            <div className="job-list-card">
              <div className="card-header-custom">
                <div>
                  <h5>
                    <i className="fa-solid fa-list-check me-2" style={{ color: "#429e85" }}></i>
                    Job Listings Moderation
                    <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "#7a9b94", marginLeft: "0.5rem" }}>
                      ({totalJobs} Total Records)
                    </span>
                  </h5>
                </div>
                <div className="d-flex gap-2 align-items-center flex-wrap">
                  <input
                    type="text"
                    className="pkg-search"
                    placeholder="Search title or company..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <select 
                    className="pkg-filter-select" 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="OPEN">Open Only</option>
                    <option value="DRAFT">Drafts</option>
                    <option value="CLOSED">Closed</option>
                    <option value="FLAGGED">Flagged Only</option>
                  </select>
                  <button className="btn-pkg-refresh" onClick={handleRefresh} title="Refresh">
                    <i className={`fa-solid ${dataLoading ? "fa-spinner fa-spin" : "fa-rotate"}`}></i>
                  </button>
                </div>
              </div>

              <div>
                {dataLoading && !data ? (
                  <div className="p-5 text-center text-muted">
                    <i className="fa-solid fa-spinner fa-spin me-2 fs-5"></i> Loading job listings...
                  </div>
                ) : data && data.items.length === 0 ? (
                  <div className="p-5 text-center text-muted">
                    <i className="fa-solid fa-folder-open fs-2 d-block mb-2 opacity-50"></i>
                    No jobs match your search or filters.
                  </div>
                ) : (
                  <div className="job-table-wrap">
                    <table className="job-table">
                      <thead>
                        <tr>
                          <th>Job Position</th>
                          <th>Hiring Employer</th>
                          <th>Category</th>
                          <th>Location</th>
                          <th>Applications</th>
                          <th>User Reports</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.items.map((j) => (
                          <tr key={j.id} onClick={() => router.push(`/admin-jobs/${j.id}`)}>
                            <td className="fw-bold" style={{ color: "#0d362d" }}>
                              {j.title}
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-1 small">
                                <span className="fw-medium">{j.employerName}</span>
                                {j.employerStatus === "VERIFIED" && (
                                  <i className="fa-solid fa-circle-check text-success" title="Verified Employer" style={{ fontSize: "0.75rem" }}></i>
                                )}
                              </div>
                            </td>
                            <td className="small text-muted">{j.category}</td>
                            <td className="small">{j.location ?? "—"}</td>
                            <td className="small fw-semibold">{j.applicationsCount}</td>
                            <td>
                              {j.reportsCount > 0 ? (
                                <span className="job-badge-reports">
                                  <i className="fa-solid fa-triangle-exclamation me-1"></i>
                                  {j.reportsCount}
                                </span>
                              ) : (
                                <span className="text-muted small">0</span>
                              )}
                            </td>
                            <td>
                              {getStatusBadge(j.status)}
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn-job-view"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/admin-jobs/${j.id}`);
                                }}
                              >
                                Review Job
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
          </div>
        </div>
      </div>
    </>
  );
}
