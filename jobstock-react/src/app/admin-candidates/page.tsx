"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import Swal from "sweetalert2";
import { Toaster, toast } from "react-hot-toast";

interface CandidateRow {
  id: string;
  email: string;
  isSuspended: boolean;
  createdAt: string;
  fullName: string;
  headline: string | null;
  location: string | null;
  isVerified: boolean;
  applicationsCount: number;
  assessmentsCount: number;
  interviewsCount: number;
  activeResumePackage: string | null;
}

interface CandidateListResponse {
  items: CandidateRow[];
  total: number;
}

interface AdminStats {
  totalCandidates: number;
}

export default function AdminCandidatesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<CandidateListResponse | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [suspendedFilter, setSuspendedFilter] = useState("");
  const [page, setPage] = useState(1);
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
      if (suspendedFilter) params.set("suspended", suspendedFilter);
      params.set("page", String(page));
      params.set("pageSize", "15");

      const [res, statsRes] = await Promise.all([
        api.get<CandidateListResponse>(`/admin/candidate-management?${params.toString()}`),
        api.get<AdminStats>("/admin/stats").catch(() => null),
      ]);
      setData(res);
      if (statsRes) setAdminStats(statsRes);
    } catch (err) {
      showErrorPopup("Sync Error", err instanceof ApiError ? err.message : "Failed to load candidates");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    loadData();
  }, [user, search, suspendedFilter, page, refreshKey]);

  const handleRefresh = async () => {
    setSearch("");
    setSuspendedFilter("");
    setPage(1);
    setRefreshKey((prev) => prev + 1);
    toast.success("Candidate list refreshed!", { icon: "🔄" });
  };

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  const totalCandidates = adminStats?.totalCandidates ?? (data?.total ?? 0);
  const activeCount = data?.items.filter((c) => !c.isSuspended).length ?? 0;
  const verifiedCount = data?.items.filter((c) => c.isVerified).length ?? 0;

  const statCards = [
    { 
      icon: "fa-solid fa-users", 
      glowColor: "#dcf4fa", 
      iconColor: "#174742", 
      iconBg: "#eef3f5", 
      label: "TOTAL CANDIDATES", 
      value: `${totalCandidates} Jobseekers` 
    },
    { 
      icon: "fa-solid fa-circle-check", 
      glowColor: "#dbfbf5", 
      iconColor: "#134d42", 
      iconBg: "#def5f0", 
      label: "VERIFIED PROFILES", 
      value: `${verifiedCount} Verified` 
    },
    { 
      icon: "fa-solid fa-user-check", 
      glowColor: "#fff3dc", 
      iconColor: "#b07c1a", 
      iconBg: "#fdf3e0", 
      label: "ACTIVE IN CURRENT VIEW", 
      value: `${activeCount} Active` 
    },
  ];

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
        .cnd-list-card {
          background: #fff; border: 1px solid #e1e9e7; border-radius: 0.85rem;
          box-shadow: 0 4px 14px rgba(0,0,0,.025); overflow: hidden;
          width: 100%;
          max-width: 100%;
        }
        .cnd-list-card .card-header-custom {
          background: #f2f8f6; border-bottom: 1px solid #d6e8e4;
          padding: 1rem 1.25rem;
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;
        }
        .cnd-list-card .card-header-custom h5 {
          font-size: 1rem; font-weight: 700; color: #0d362d; margin: 0;
        }

        .pkg-search {
          border: 1.5px solid #d0deda; border-radius: 0.5rem; padding: 0.42rem 0.8rem;
          font-size: 0.82rem; color: #1a3630; background: #f9fdfb; width: 190px;
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

        .cnd-table-wrap {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        /* Custom Modern Table */
        .cnd-table {
          width: 100%;
          min-width: 780px;
          border-collapse: separate;
          border-spacing: 0;
        }
        .cnd-table th {
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
        .cnd-table td {
          padding: 0.85rem 1rem;
          font-size: 0.83rem;
          color: #2d4e45;
          border-bottom: 1px solid #eaf2f0;
          vertical-align: middle;
          white-space: nowrap;
        }
        .cnd-table tr {
          transition: background 0.15s ease;
        }
        .cnd-table tr:hover {
          background: #f4faf8;
          cursor: pointer;
        }

        .btn-cnd-view {
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
        .btn-cnd-view:hover {
          background: #d0ede4;
          color: #083826;
        }

        .cnd-badge-active {
          background: #d4f0e4; color: #0d6e3f; font-size: 0.7rem; font-weight: 700;
          border-radius: 0.35rem; padding: 0.3rem 0.65rem; display: inline-block;
        }
        .cnd-badge-suspended {
          background: #fce8e8; color: #b02020; font-size: 0.7rem; font-weight: 700;
          border-radius: 0.35rem; padding: 0.3rem 0.65rem; display: inline-block;
        }
        .cnd-badge-pkg {
          background: #e4f5ef; color: #0d4f3c; font-size: 0.72rem; font-weight: 600;
          border: 1px solid #c0ddd6; border-radius: 0.35rem; padding: 0.25rem 0.6rem;
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
        <AdminSidebar active="candidates" />

        <div className="dashboard-content pkg-page">
          {/* Header */}
          <div className="dashboard-tlbar d-block mb-4">
            <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
              <div>
                <h1 className="mb-1 fs-3">Candidate Management</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Candidates Directory</a></li>
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

            {/* Candidate Directory Table Card */}
            <div className="cnd-list-card">
              <div className="card-header-custom">
                <div>
                  <h5>
                    <i className="fa-solid fa-user-graduate me-2" style={{ color: "#429e85" }}></i>
                    Candidate Profiles
                    <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "#7a9b94", marginLeft: "0.5rem" }}>
                      ({data?.total ?? 0} Total Registered)
                    </span>
                  </h5>
                </div>
                <div className="d-flex gap-2 align-items-center flex-wrap">
                  <input
                    type="text"
                    className="pkg-search"
                    placeholder="Search name or email..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                  <select
                    className="pkg-filter-select"
                    value={suspendedFilter}
                    onChange={(e) => {
                      setSuspendedFilter(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">All Statuses</option>
                    <option value="false">Active Only</option>
                    <option value="true">Suspended Only</option>
                  </select>
                  <button className="btn-pkg-refresh" onClick={handleRefresh} title="Refresh">
                    <i className={`fa-solid ${dataLoading ? "fa-spinner fa-spin" : "fa-rotate"}`}></i>
                  </button>
                </div>
              </div>

              <div>
                {dataLoading && !data ? (
                  <div className="p-5 text-center text-muted">
                    <i className="fa-solid fa-spinner fa-spin me-2 fs-5"></i> Loading candidates...
                  </div>
                ) : data && data.items.length === 0 ? (
                  <div className="p-5 text-center text-muted">
                    <i className="fa-solid fa-user-xmark fs-2 d-block mb-2 opacity-50"></i>
                    No candidates match your search or filters.
                  </div>
                ) : (
                  <div className="cnd-table-wrap">
                    <table className="cnd-table">
                      <thead>
                        <tr>
                          <th>Candidate Name</th>
                          <th>Email Address</th>
                          <th>Location</th>
                          <th>Resume Plan</th>
                          <th>Applications</th>
                          <th>Assessments</th>
                          <th>Interviews</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.items.map((c) => (
                          <tr key={c.id} onClick={() => router.push(`/admin-candidates/${c.id}`)}>
                            <td className="fw-bold" style={{ color: "#0d362d" }}>
                              <div className="d-flex align-items-center gap-1">
                                {c.fullName}
                                {c.isVerified && (
                                  <i className="fa-solid fa-circle-check" style={{ color: "#429e85", fontSize: "0.85rem" }} title="Verified Candidate"></i>
                                )}
                              </div>
                            </td>
                            <td className="text-muted small">{c.email}</td>
                            <td className="small">{c.location ?? "—"}</td>
                            <td>
                              {c.activeResumePackage ? (
                                <span className="cnd-badge-pkg">{c.activeResumePackage}</span>
                              ) : (
                                <span className="text-muted small">—</span>
                              )}
                            </td>
                            <td className="small fw-semibold">{c.applicationsCount}</td>
                            <td className="small fw-semibold">{c.assessmentsCount}</td>
                            <td className="small fw-semibold">{c.interviewsCount}</td>
                            <td>
                              <span className={c.isSuspended ? "cnd-badge-suspended" : "cnd-badge-active"}>
                                {c.isSuspended ? "Suspended" : "Active"}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn-cnd-view"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/admin-candidates/${c.id}`);
                                }}
                              >
                                View Profile
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {data && data.total > 15 && (
                  <div className="d-flex justify-content-between align-items-center p-3 border-top small text-muted" style={{ background: "#f9fdfb" }}>
                    <span>Showing {(page - 1) * 15 + 1} - {Math.min(page * 15, data.total)} of {data.total} candidates</span>
                    <div className="d-flex gap-2 flex-wrap">
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-secondary" 
                        disabled={page === 1} 
                        onClick={() => setPage(page - 1)}
                        style={{ borderRadius: "0.4rem", borderColor: "#d0deda" }}
                      >
                        Previous
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-secondary" 
                        disabled={page * 15 >= data.total} 
                        onClick={() => setPage(page + 1)}
                        style={{ borderRadius: "0.4rem", borderColor: "#d0deda" }}
                      >
                        Next
                      </button>
                    </div>
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
