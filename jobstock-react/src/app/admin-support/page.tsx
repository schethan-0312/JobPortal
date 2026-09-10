"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import Swal from "sweetalert2";
import toast, { Toaster } from "react-hot-toast";

interface Overview {
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  unassigned: number;
}

interface TicketRow {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  user: { email: string; role: string };
  assignedAdmin: { email: string } | null;
  _count: { messages: number };
}

export default function AdminSupportPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [overview, setOverview] = useState<Overview | null>(null);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function loadData() {
    setFetching(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (priority) params.set("priority", priority);
      const [ov, list] = await Promise.all([
        api.get<Overview>("/admin/support/overview"),
        api.get<{ items: TicketRow[] }>(`/admin/support/tickets?${params.toString()}`),
      ]);
      setOverview(ov);
      setTickets(list.items);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed to Load Tickets",
        text: err instanceof ApiError ? err.message : "Failed to load support tickets",
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
  }, [user, status, priority]);

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
          padding: 1.25rem 1.4rem;
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
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }
        .dash-wrap-bloud-content h5 {
          font-size: 1.85rem;
          font-weight: 700;
          color: #0d362d;
          margin-bottom: 0.2rem;
          text-align: right;
        }
        .dash-wrap-bloud-content p {
          color: #63857d;
          font-size: 0.8rem;
          margin-bottom: 0;
          text-align: right;
          font-weight: 600;
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

        .support-table-wrap {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .support-table {
          width: 100%;
          min-width: 800px;
          border-collapse: collapse;
          white-space: nowrap;
        }
        .support-table th {
          background: #f8fbfa;
          color: #446158;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 14px 18px;
          border-bottom: 1px solid #d6e8e4;
        }
        .support-table td {
          padding: 14px 18px;
          border-bottom: 1px solid #eef5f3;
          color: #334d44;
          font-size: 13.5px;
          vertical-align: middle;
        }
        .support-table tbody tr {
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .support-table tbody tr:hover {
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
        .badge-status.open { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
        .badge-status.in_progress { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
        .badge-status.resolved { background: #e8f5f1; color: #0d4f3c; border: 1px solid #bce2d8; }
        .badge-status.closed { background: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb; }

        .badge-prio {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
        }
        .badge-prio.urgent { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
        .badge-prio.high { background: #ffedd5; color: #ea580c; border: 1px solid #fed7aa; }
        .badge-prio.medium { background: #fef9c3; color: #ca8a04; border: 1px solid #fef08a; }
        .badge-prio.low { background: #f3f4f6; color: #6b7280; border: 1px solid #e5e7eb; }

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
        <AdminSidebar active="support" />

        <div className="dashboard-content pkg-page">
          {/* Header */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
              <h1 className="pkg-header-title mb-1">Help Desk &amp; Support Tickets</h1>
              <p className="pkg-header-subtitle mb-0">
                Manage user assistance requests, assign tickets to administrators, and resolve queries.
              </p>
            </div>
          </div>

          {/* Stat Cards */}
          {overview && (
            <div className="row align-items-center g-3 mb-4">
              <div className="col-6 col-md-4 col-xl">
                <div className="dash-wrap-bloud">
                  <div className="dash-wrap-glow" style={{ background: "#dcf4fa" }}></div>
                  <div className="dash-wrap-bloud-icon">
                    <div className="bloud-icon" style={{ backgroundColor: "#eef3f5", color: "#174742" }}>
                      <i className="fa-solid fa-envelope-open"></i>
                    </div>
                  </div>
                  <div className="dash-wrap-bloud-caption">
                    <div className="dash-wrap-bloud-content">
                      <h5 className="ctr">{overview.open}</h5>
                      <p>Open</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-6 col-md-4 col-xl">
                <div className="dash-wrap-bloud">
                  <div className="dash-wrap-glow" style={{ background: "#fff3dc" }}></div>
                  <div className="dash-wrap-bloud-icon">
                    <div className="bloud-icon" style={{ backgroundColor: "#fdf3e0", color: "#b07c1a" }}>
                      <i className="fa-solid fa-spinner"></i>
                    </div>
                  </div>
                  <div className="dash-wrap-bloud-caption">
                    <div className="dash-wrap-bloud-content">
                      <h5 className="ctr">{overview.inProgress}</h5>
                      <p>In Progress</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-6 col-md-4 col-xl">
                <div className="dash-wrap-bloud">
                  <div className="dash-wrap-glow" style={{ background: "#dbfbf5" }}></div>
                  <div className="dash-wrap-bloud-icon">
                    <div className="bloud-icon" style={{ backgroundColor: "#def5f0", color: "#134d42" }}>
                      <i className="fa-solid fa-circle-check"></i>
                    </div>
                  </div>
                  <div className="dash-wrap-bloud-caption">
                    <div className="dash-wrap-bloud-content">
                      <h5 className="ctr">{overview.resolved}</h5>
                      <p>Resolved</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-6 col-md-6 col-xl">
                <div className="dash-wrap-bloud">
                  <div className="dash-wrap-glow" style={{ background: "#f3f4f6" }}></div>
                  <div className="dash-wrap-bloud-icon">
                    <div className="bloud-icon" style={{ backgroundColor: "#f3f4f6", color: "#4b5563" }}>
                      <i className="fa-solid fa-lock"></i>
                    </div>
                  </div>
                  <div className="dash-wrap-bloud-caption">
                    <div className="dash-wrap-bloud-content">
                      <h5 className="ctr">{overview.closed}</h5>
                      <p>Closed</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6 col-xl">
                <div className="dash-wrap-bloud">
                  <div className="dash-wrap-glow" style={{ background: "#ffe8eb" }}></div>
                  <div className="dash-wrap-bloud-icon">
                    <div className="bloud-icon" style={{ backgroundColor: "#fcf0f2", color: "#d94348" }}>
                      <i className="fa-solid fa-user-xmark"></i>
                    </div>
                  </div>
                  <div className="dash-wrap-bloud-caption">
                    <div className="dash-wrap-bloud-content">
                      <h5 className="ctr" style={{ color: "#d94348" }}>{overview.unassigned}</h5>
                      <p>Unassigned</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tickets Table Card */}
          <div className="elite-card">
            <div className="elite-card-header d-flex flex-wrap gap-2 justify-content-between align-items-center">
              <h2 className="elite-card-title">
                <i className="fa-solid fa-headset" style={{ color: "#429e85" }}></i>
                All Support Tickets ({tickets.length})
              </h2>

              <div className="d-flex gap-2 flex-wrap">
                <select
                  className="filter-input"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>

                <select
                  className="filter-input"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            <div className="support-table-wrap">
              {fetching && !overview && (
                <div className="text-center py-5">
                  <i className="fa-solid fa-circle-notch fa-spin text-muted fs-2 mb-2"></i>
                  <p className="text-muted small">Loading support tickets...</p>
                </div>
              )}

              {tickets.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="fa-solid fa-clipboard-check text-success fs-2 mb-2"></i>
                  <p className="mb-0 fw-semibold">No tickets match the selected filters.</p>
                </div>
              ) : (
                <table className="support-table">
                  <thead>
                    <tr>
                      <th>Subject / Issue</th>
                      <th>Requester</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Assigned Agent</th>
                      <th>Messages</th>
                      <th>Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t) => {
                      const statusClass = t.status.toLowerCase();
                      const prioClass = t.priority.toLowerCase();
                      return (
                        <tr key={t.id} onClick={() => router.push(`/admin-support/${t.id}`)}>
                          <td>
                            <div className="fw-bold" style={{ color: "#0b2b22" }}>
                              {t.subject}
                            </div>
                          </td>
                          <td>
                            <div className="fw-semibold" style={{ fontSize: "13px" }}>{t.user.email}</div>
                            <div className="text-muted small" style={{ fontSize: "11px" }}>{t.user.role}</div>
                          </td>
                          <td>
                            <span className={`badge-prio ${prioClass}`}>
                              {t.priority}
                            </span>
                          </td>
                          <td>
                            <span className={`badge-status ${statusClass}`}>
                              <i className="fa-solid fa-circle" style={{ fontSize: "6px" }}></i>
                              {t.status.replace("_", " ")}
                            </span>
                          </td>
                          <td>
                            {t.assignedAdmin ? (
                              <span className="badge bg-light text-dark border">
                                <i className="fa-solid fa-user-tie me-1 text-muted"></i>
                                {t.assignedAdmin.email}
                              </span>
                            ) : (
                              <span className="badge bg-danger-subtle text-danger border">Unassigned</span>
                            )}
                          </td>
                          <td>
                            <span className="fw-semibold" style={{ color: "#0d4f3c" }}>
                              <i className="fa-regular fa-comment-dots me-1 text-muted"></i>
                              {t._count.messages}
                            </span>
                          </td>
                          <td className="text-muted">
                            {new Date(t.updatedAt).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
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
