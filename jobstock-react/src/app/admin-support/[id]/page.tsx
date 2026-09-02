"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

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
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function loadDetail() {
    try {
      const res = await api.get<TicketDetail>(`/admin/support/tickets/${id}`);
      setDetail(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load ticket");
    }
  }

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    loadDetail();
  }, [user, id]);

  async function handleAssignToMe() {
    setActing(true);
    setError(null);
    try {
      await api.post(`/admin/support/tickets/${id}/assign`);
      await loadDetail();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to assign ticket");
    } finally {
      setActing(false);
    }
  }

  async function handleSetStatus(status: string) {
    setActing(true);
    setError(null);
    try {
      await api.patch(`/admin/support/tickets/${id}`, { status });
      await loadDetail();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update status");
    } finally {
      setActing(false);
    }
  }

  async function handleReply() {
    if (!reply.trim()) return;
    setActing(true);
    setError(null);
    try {
      await api.post(`/admin/support/tickets/${id}/reply`, { body: reply.trim() });
      setReply("");
      await loadDetail();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send reply");
    } finally {
      setActing(false);
    }
  }

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="support" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">{detail?.subject ?? "Ticket"}</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item text-muted"><a href="/admin-support">Support</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">{detail?.subject}</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}
            {!detail && !error && <p className="text-muted">Loading...</p>}

            {detail && (
              <>
                <div className="card mb-4">
                  <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <div className="d-flex gap-2 align-items-center flex-wrap">
                      <span className="badge bg-secondary">{detail.priority}</span>
                      <span className="badge bg-info">{detail.status}</span>
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                      {!detail.assignedAdmin && (
                        <button type="button" className="btn btn-sm btn-outline-main" disabled={acting} onClick={handleAssignToMe}>
                          Assign to Me
                        </button>
                      )}
                      {detail.status !== "RESOLVED" && (
                        <button type="button" className="btn btn-sm btn-outline-success" disabled={acting} onClick={() => handleSetStatus("RESOLVED")}>
                          Mark Resolved
                        </button>
                      )}
                      {detail.status !== "CLOSED" && (
                        <button type="button" className="btn btn-sm btn-outline-secondary" disabled={acting} onClick={() => handleSetStatus("CLOSED")}>
                          Close
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="card-body small">
                    <p className="mb-1"><strong>From:</strong> {detail.user.email} ({detail.user.role})</p>
                    <p className="mb-0"><strong>Assigned to:</strong> {detail.assignedAdmin?.email ?? "Unassigned"}</p>
                  </div>
                </div>

                <div className="card mb-4">
                  <div className="card-header"><h6 className="mb-0">Conversation</h6></div>
                  <div className="card-body">
                    <div className="d-flex flex-column gap-3">
                      {detail.messages.map((m) => (
                        <div
                          key={m.id}
                          className={`p-2 rounded ${m.isAdminReply ? "bg-main-subtle" : "bg-light"}`}
                          style={{ maxWidth: "80%", alignSelf: m.isAdminReply ? "flex-end" : "flex-start" }}
                        >
                          <div className="small fw-medium">{m.sender.email} {m.isAdminReply && <span className="badge bg-main ms-1">Admin</span>}</div>
                          <div className="small">{m.body}</div>
                          <div className="small text-muted">{new Date(m.createdAt).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {detail.status !== "CLOSED" && (
                  <div className="card">
                    <div className="card-header"><h6 className="mb-0">Reply</h6></div>
                    <div className="card-body">
                      <textarea
                        className="form-control mb-2"
                        rows={3}
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Type your reply..."
                      />
                      <button type="button" className="btn btn-main btn-sm" disabled={acting || !reply.trim()} onClick={handleReply}>
                        Send Reply
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
