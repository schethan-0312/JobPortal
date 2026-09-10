"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import Swal from "sweetalert2";
import toast, { Toaster } from "react-hot-toast";

interface TicketMessage {
  id: string;
  body: string;
  isAdminReply: boolean;
  createdAt: string;
  sender: { email: string };
}

interface TicketDetail {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  user: { email: string; role: string };
  assignedAdmin: { email: string } | null;
  messages: TicketMessage[];
}

export default function AdminSupportDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [fetching, setFetching] = useState(true);
  const [reply, setReply] = useState("");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function loadDetail(isSilent = false) {
    if (!isSilent) setFetching(true);
    try {
      const res = await api.get<TicketDetail>(`/admin/support/tickets/${id}`);
      setDetail(res);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed to Load",
        text: err instanceof ApiError ? err.message : "Failed to load ticket",
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
    loadDetail();
  }, [user, id]);

  async function handleAssignToMe() {
    setActing(true);
    try {
      await api.post(`/admin/support/tickets/${id}/assign`);
      toast.success("Ticket assigned to you successfully!");
      await loadDetail(true);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Assignment Failed",
        text: err instanceof ApiError ? err.message : "Failed to assign ticket",
        customClass: {
          popup: "elite-pkg-popup",
          title: "elite-pkg-title",
          confirmButton: "elite-pkg-btn",
        },
        confirmButtonColor: "#0d4f3c",
      });
    } finally {
      setActing(false);
    }
  }

  async function handleSetStatus(newStatus: string) {
    const actionLabel = newStatus === "RESOLVED" ? "Resolve" : "Close";
    const confirm = await Swal.fire({
      title: `${actionLabel} Ticket?`,
      text: `Are you sure you want to mark this support ticket as ${newStatus.toLowerCase()}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: newStatus === "RESOLVED" ? "#0d4f3c" : "#6c757d",
      cancelButtonColor: "#8ea59d",
      confirmButtonText: `Yes, Mark ${actionLabel}`,
      cancelButtonText: "Cancel",
      customClass: {
        popup: "elite-pkg-popup",
        title: "elite-pkg-title",
        confirmButton: "elite-pkg-btn",
      },
    });

    if (!confirm.isConfirmed) return;

    setActing(true);
    try {
      await api.patch(`/admin/support/tickets/${id}`, { status: newStatus });
      toast.success(`Ticket status updated to ${newStatus}!`);
      await loadDetail(true);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Status Update Failed",
        text: err instanceof ApiError ? err.message : "Failed to update status",
        customClass: {
          popup: "elite-pkg-popup",
          title: "elite-pkg-title",
          confirmButton: "elite-pkg-btn",
        },
        confirmButtonColor: "#0d4f3c",
      });
    } finally {
      setActing(false);
    }
  }

  async function handleReply() {
    if (!reply.trim()) return;
    setActing(true);
    try {
      await api.post(`/admin/support/tickets/${id}/reply`, { body: reply.trim() });
      setReply("");
      toast.success("Reply dispatched to requester!");
      await loadDetail(true);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Reply Failed",
        text: err instanceof ApiError ? err.message : "Failed to send reply",
        customClass: {
          popup: "elite-pkg-popup",
          title: "elite-pkg-title",
          confirmButton: "elite-pkg-btn",
        },
        confirmButtonColor: "#0d4f3c",
      });
    } finally {
      setActing(false);
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

        .mint-back-btn {
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
          text-decoration: none;
        }
        .mint-back-btn:hover {
          background: #e8f5f1;
          border-color: #429e85;
          color: #08382b;
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

        .btn-action-primary {
          background: #0d4f3c;
          border: 1px solid #0d4f3c;
          color: #ffffff;
          font-weight: 700;
          font-size: 13px;
          padding: 7px 16px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .btn-action-primary:hover {
          background: #08382b;
          color: #ffffff;
        }

        .btn-action-secondary {
          background: #ffffff;
          border: 1px solid #d6e8e4;
          color: #4b635b;
          font-weight: 600;
          font-size: 13px;
          padding: 7px 16px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .btn-action-secondary:hover {
          background: #f4f9f8;
          color: #0b2b22;
        }

        .msg-bubble-user {
          background: #ffffff;
          border: 1px solid #e7efe9;
          border-radius: 14px 14px 14px 2px;
          padding: 14px 18px;
          max-width: 80%;
          align-self: flex-start;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }
        .msg-bubble-admin {
          background: #e8f5f1;
          border: 1px solid #bce2d8;
          border-radius: 14px 14px 2px 14px;
          padding: 14px 18px;
          max-width: 80%;
          align-self: flex-end;
          box-shadow: 0 2px 8px rgba(13, 79, 60, 0.04);
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
        <AdminSidebar active="support" />

        <div className="dashboard-content pkg-page">
          {/* Header */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <Link href="/admin-support" className="mint-back-btn py-1 px-2" style={{ fontSize: "12px" }}>
                  <i className="fa-solid fa-arrow-left"></i> Back to Support
                </Link>
                <h1 className="pkg-header-title mb-0">{detail?.subject || "Support Ticket"}</h1>
              </div>
              <p className="pkg-header-subtitle mb-0">
                Ticket thread history, requester profile details, and agent resolution controls.
              </p>
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="mint-back-btn"
                onClick={() => loadDetail()}
                disabled={fetching}
              >
                <i className={`fa-solid fa-rotate-right ${fetching ? "fa-spin" : ""}`}></i> Refresh
              </button>
            </div>
          </div>

          {fetching && !detail && (
            <div className="text-center py-5">
              <i className="fa-solid fa-circle-notch fa-spin text-muted fs-2 mb-2"></i>
              <p className="text-muted fw-semibold">Loading ticket details...</p>
            </div>
          )}

          {detail && (
            <>
              {/* Ticket Meta Card */}
              <div className="elite-card">
                <div className="elite-card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
                  <div className="d-flex gap-2 align-items-center flex-wrap">
                    <span className="badge bg-light text-dark border fw-bold" style={{ fontSize: "12px" }}>
                      Priority: {detail.priority}
                    </span>
                    <span
                      className="badge"
                      style={{
                        background: detail.status === "RESOLVED" ? "#e8f5f1" : "#eff6ff",
                        color: detail.status === "RESOLVED" ? "#0d4f3c" : "#2563eb",
                        border: "1px solid",
                        borderColor: detail.status === "RESOLVED" ? "#bce2d8" : "#bfdbfe",
                        fontSize: "12px"
                      }}
                    >
                      Status: {detail.status}
                    </span>
                  </div>

                  <div className="d-flex gap-2 flex-wrap">
                    {!detail.assignedAdmin && (
                      <button
                        type="button"
                        className="btn-action-primary"
                        disabled={acting}
                        onClick={handleAssignToMe}
                      >
                        <i className="fa-solid fa-user-check"></i> Assign to Me
                      </button>
                    )}
                    {detail.status !== "RESOLVED" && (
                      <button
                        type="button"
                        className="btn-action-primary"
                        disabled={acting}
                        onClick={() => handleSetStatus("RESOLVED")}
                      >
                        <i className="fa-solid fa-check"></i> Mark Resolved
                      </button>
                    )}
                    {detail.status !== "CLOSED" && (
                      <button
                        type="button"
                        className="btn-action-secondary"
                        disabled={acting}
                        onClick={() => handleSetStatus("CLOSED")}
                      >
                        <i className="fa-solid fa-lock"></i> Close Ticket
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: "11.5px" }}>Requester</div>
                      <div className="fw-bold" style={{ color: "#0b2b22", fontSize: "14.5px" }}>
                        {detail.user.email} <span className="badge bg-light text-muted border ms-1">{detail.user.role}</span>
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: "11.5px" }}>Assigned Agent</div>
                      <div className="fw-semibold" style={{ color: "#0d4f3c", fontSize: "14.5px" }}>
                        {detail.assignedAdmin?.email || "Unassigned"}
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: "11.5px" }}>Opened Date</div>
                      <div className="text-muted" style={{ fontSize: "14px" }}>
                        {new Date(detail.createdAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversation Log Card */}
              <div className="elite-card">
                <div className="elite-card-header">
                  <h2 className="elite-card-title">
                    <i className="fa-regular fa-comments" style={{ color: "#429e85" }}></i>
                    Conversation Thread ({detail.messages.length})
                  </h2>
                </div>

                <div className="p-4 d-flex flex-column gap-3" style={{ background: "#fbfdfc", minHeight: "240px" }}>
                  {detail.messages.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      <p className="mb-0">No messages logged yet.</p>
                    </div>
                  ) : (
                    detail.messages.map((m) => (
                      <div
                        key={m.id}
                        className={m.isAdminReply ? "msg-bubble-admin" : "msg-bubble-user"}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-1 gap-2">
                          <span className="fw-bold small" style={{ color: m.isAdminReply ? "#0d4f3c" : "#0b2b22" }}>
                            {m.sender.email}
                            {m.isAdminReply && (
                              <span className="badge bg-success ms-1" style={{ fontSize: "10px" }}>Support Staff</span>
                            )}
                          </span>
                          <span className="text-muted" style={{ fontSize: "11px" }}>
                            {new Date(m.createdAt).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div style={{ fontSize: "13.5px", color: "#334d44", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                          {m.body}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Reply Box */}
              {detail.status !== "CLOSED" && (
                <div className="elite-card">
                  <div className="elite-card-header">
                    <h2 className="elite-card-title">
                      <i className="fa-solid fa-reply" style={{ color: "#429e85" }}></i>
                      Compose Agent Reply
                    </h2>
                  </div>
                  <div className="p-4">
                    <textarea
                      className="form-control mb-3"
                      style={{
                        borderRadius: "10px",
                        border: "1.5px solid #d6e8e4",
                        fontSize: "14px",
                        padding: "12px",
                      }}
                      rows={4}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Type response to candidate / employer..."
                    />
                    <div className="d-flex justify-content-end">
                      <button
                        type="button"
                        className="btn-action-primary"
                        disabled={acting || !reply.trim()}
                        onClick={handleReply}
                      >
                        {acting ? (
                          <>
                            <i className="fa-solid fa-circle-notch fa-spin"></i> Sending...
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-paper-plane"></i> Send Reply
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
