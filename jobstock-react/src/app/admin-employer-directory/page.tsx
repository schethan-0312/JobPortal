"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import Swal from "sweetalert2";
import toast, { Toaster } from "react-hot-toast";

interface DirectoryEmployer {
  id: string;
  companyName: string;
  status: string;
  email: string;
  signupDate: string;
  jobsPostedCount: number;
  activeSubscription: string | null;
  totalSpendPaisa: number;
}

interface DirectoryResponse {
  items: DirectoryEmployer[];
  total: number;
  page: number;
  pageSize: number;
}

function formatMoney(paisa: number) {
  return `₹${(paisa / 100).toLocaleString("en-IN")}`;
}

export default function AdminEmployerDirectoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<DirectoryResponse | null>(null);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function loadData(isSilent = false) {
    if (!isSilent) setFetching(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      const res = await api.get<DirectoryResponse>(`/admin/employer-management?${params.toString()}`);
      setData(res);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed to Load Directory",
        text: err instanceof ApiError ? err.message : "Failed to load employers",
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
  }, [user, status, search]);

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  const totalEmployers = data?.total ?? 0;
  const verifiedCount = data?.items.filter(i => i.status === "VERIFIED").length ?? 0;
  const totalRevenueSpend = data?.items.reduce((acc, curr) => acc + (curr.totalSpendPaisa || 0), 0) ?? 0;

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
        .mint-refresh-btn {
          background: #ffffff;
          border: 1.5px solid #d6e8e4;
          color: #0d4f3c;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 9px;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .mint-refresh-btn:hover {
          background: #e8f5f1;
          border-color: #429e85;
          color: #08382b;
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
        }
        .elite-card-header {
          background: #fbfdfc;
          border-bottom: 1px solid #d6e8e4;
          padding: 16px 22px;
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

        .emp-table-wrap {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .emp-table {
          width: 100%;
          min-width: 800px;
          border-collapse: collapse;
          white-space: nowrap;
        }
        .emp-table th {
          background: #f8fbfa;
          color: #446158;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 14px 18px;
          border-bottom: 1px solid #d6e8e4;
        }
        .emp-table td {
          padding: 14px 18px;
          border-bottom: 1px solid #eef5f3;
          color: #334d44;
          font-size: 13.5px;
          vertical-align: middle;
        }
        .emp-table tbody tr {
          transition: background 0.15s ease;
          cursor: pointer;
        }
        .emp-table tbody tr:hover {
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
        .badge-status.verified { background: #e8f5f1; color: #0d4f3c; border: 1px solid #bce2d8; }
        .badge-status.pending { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
        .badge-status.rejected { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
        .badge-status.info_requested { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
        .badge-status.suspended { background: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb; }

        .filter-input {
          background: #ffffff;
          border: 1.5px solid #d6e8e4;
          border-radius: 9px;
          padding: 7px 12px;
          font-size: 13px;
          color: #0b2b22;
          transition: all 0.2s;
        }
        .filter-input:focus {
          border-color: #429e85;
          outline: none;
          box-shadow: 0 0 0 3px rgba(66, 158, 133, 0.15);
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
        <AdminSidebar active="employer-directory" />

        <div className="dashboard-content pkg-page">
          {/* Header */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
              <h1 className="pkg-header-title mb-1">Employer Directory</h1>
              <p className="pkg-header-subtitle mb-0">
                Explore registered companies, review subscriptions, posting metrics, and company profiles.
              </p>
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="mint-refresh-btn"
                onClick={() => loadData()}
                disabled={fetching}
              >
                <i className={`fa-solid fa-rotate-right ${fetching ? "fa-spin" : ""}`}></i> Refresh Directory
              </button>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="row align-items-center gx-4 gy-4 mb-4">
            <div className="col-12 col-sm-6 col-md-6 col-lg-4">
              <div className="dash-wrap-bloud">
                <div className="dash-wrap-glow" style={{ background: "#ffede8" }}></div>
                <div className="dash-wrap-bloud-icon">
                  <div className="bloud-icon" style={{ backgroundColor: "#fcf0ed", color: "#f76b59" }}>
                    <i className="fa-solid fa-building"></i>
                  </div>
                </div>
                <div className="dash-wrap-bloud-caption">
                  <div className="dash-wrap-bloud-content">
                    <h5 className="ctr">{totalEmployers}</h5>
                    <p>Total Registered Employers</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-md-6 col-lg-4">
              <div className="dash-wrap-bloud">
                <div className="dash-wrap-glow" style={{ background: "#dcf4fa" }}></div>
                <div className="dash-wrap-bloud-icon">
                  <div className="bloud-icon" style={{ backgroundColor: "#eef3f5", color: "#174742" }}>
                    <i className="fa-solid fa-circle-check"></i>
                  </div>
                </div>
                <div className="dash-wrap-bloud-caption">
                  <div className="dash-wrap-bloud-content">
                    <h5 className="ctr">{verifiedCount}</h5>
                    <p>Verified Companies (Page)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-md-6 col-lg-4">
              <div className="dash-wrap-bloud">
                <div className="dash-wrap-glow" style={{ background: "#fff3dc" }}></div>
                <div className="dash-wrap-bloud-icon">
                  <div className="bloud-icon" style={{ backgroundColor: "#fdf3e0", color: "#b07c1a" }}>
                    <i className="fa-solid fa-coins"></i>
                  </div>
                </div>
                <div className="dash-wrap-bloud-caption">
                  <div className="dash-wrap-bloud-content">
                    <h5 className="ctr" style={{ fontSize: "1.6rem" }}>{formatMoney(totalRevenueSpend)}</h5>
                    <p>Total Spend (Visible)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Card */}
          <div className="elite-card">
            <div className="elite-card-header d-flex flex-wrap gap-3 justify-content-between align-items-center">
              <h2 className="elite-card-title">
                <i className="fa-solid fa-address-book" style={{ color: "#429e85" }}></i>
                All Employers ({data?.total ?? 0})
              </h2>

              <div className="d-flex gap-2 flex-wrap">
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Search company name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: "200px" }}
                />
                <select
                  className="filter-input"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">All statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="INFO_REQUESTED">Info Requested</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>

            <div className="emp-table-wrap">
              {fetching && !data && (
                <div className="text-center py-5">
                  <i className="fa-solid fa-circle-notch fa-spin text-muted fs-2 mb-2"></i>
                  <p className="text-muted fw-semibold">Loading employer directory...</p>
                </div>
              )}

              {data && data.items.length === 0 && (
                <div className="text-center py-5">
                  <i className="fa-solid fa-building-circle-xmark text-muted fs-1 mb-2"></i>
                  <p className="text-muted fw-semibold">No employers match these search criteria.</p>
                </div>
              )}

              {data && data.items.length > 0 && (
                <table className="emp-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Status</th>
                      <th>Jobs Posted</th>
                      <th>Subscription</th>
                      <th>Total Spend</th>
                      <th>Signed Up</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((e) => {
                      const statusClass = e.status.toLowerCase();
                      return (
                        <tr
                          key={e.id}
                          onClick={() => router.push(`/admin-employer-directory/${e.id}`)}
                        >
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div
                                style={{
                                  width: "34px",
                                  height: "34px",
                                  borderRadius: "8px",
                                  background: "#e8f5f1",
                                  color: "#0d4f3c",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: 700,
                                  fontSize: "13px"
                                }}
                              >
                                {e.companyName ? e.companyName.charAt(0).toUpperCase() : "C"}
                              </div>
                              <div>
                                <div className="fw-bold" style={{ color: "#0b2b22" }}>{e.companyName}</div>
                                <div className="text-muted small" style={{ fontSize: "12px" }}>{e.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge-status ${statusClass}`}>
                              <i className="fa-solid fa-circle" style={{ fontSize: "6px" }}></i>
                              {e.status}
                            </span>
                          </td>
                          <td>
                            <span className="fw-semibold" style={{ color: "#0d4f3c" }}>
                              <i className="fa-solid fa-briefcase me-1 text-muted"></i>
                              {e.jobsPostedCount}
                            </span>
                          </td>
                          <td>
                            {e.activeSubscription ? (
                              <span className="badge bg-light text-dark border">
                                <i className="fa-solid fa-crown me-1 text-warning"></i>
                                {e.activeSubscription}
                              </span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="fw-bold" style={{ color: "#0b2b22" }}>
                            {formatMoney(e.totalSpendPaisa)}
                          </td>
                          <td className="text-muted">
                            {new Date(e.signupDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="text-end" onClick={(ev) => ev.stopPropagation()}>
                            <Link
                              href={`/admin-employer-directory/${e.id}`}
                              className="btn btn-sm"
                              style={{
                                background: "#ffffff",
                                border: "1px solid #d6e8e4",
                                color: "#0d4f3c",
                                fontWeight: 600,
                                borderRadius: "7px",
                                fontSize: "12px"
                              }}
                            >
                              View Profile <i className="fa-solid fa-arrow-right ms-1"></i>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
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
