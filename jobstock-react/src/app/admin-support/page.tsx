"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

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
        setError(err instanceof ApiError ? err.message : "Failed to load support tickets");
      }
    })();
  }, [user, status, priority]);

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
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Support Tickets</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Support</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}

            {overview && (
              <div className="row g-4 mb-4">
                <div className="col-md col-6">
                  <div className="card h-100"><div className="card-body">
                    <div className="text-muted small">Open</div>
                    <div className="fw-bold fs-4">{overview.open}</div>
                  </div></div>
                </div>
                <div className="col-md col-6">
                  <div className="card h-100"><div className="card-body">
                    <div className="text-muted small">In Progress</div>
                    <div className="fw-bold fs-4">{overview.inProgress}</div>
                  </div></div>
                </div>
                <div className="col-md col-6">
                  <div className="card h-100"><div className="card-body">
                    <div className="text-muted small">Resolved</div>
                    <div className="fw-bold fs-4">{overview.resolved}</div>
                  </div></div>
                </div>
                <div className="col-md col-6">
                  <div className="card h-100"><div className="card-body">
                    <div className="text-muted small">Closed</div>
                    <div className="fw-bold fs-4">{overview.closed}</div>
                  </div></div>
                </div>
                <div className="col-md col-6">
                  <div className="card h-100"><div className="card-body">
                    <div className="text-muted small">Unassigned</div>
                    <div className="fw-bold fs-4 text-danger">{overview.unassigned}</div>
                  </div></div>
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-header d-flex flex-wrap gap-2 justify-content-between align-items-center">
                <h6 className="mb-0">All Tickets ({tickets.length})</h6>
                <div className="d-flex gap-2">
                  <select className="form-control form-control-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">All statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                  <select className="form-control form-control-sm" value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <option value="">All priorities</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="card-body">
                {tickets.length === 0 && <p className="text-muted mb-0">No tickets match these filters.</p>}
                {tickets.length > 0 && (
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>From</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Assigned</th>
                          <th>Messages</th>
                          <th>Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.map((t) => (
                          <tr key={t.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/admin-support/${t.id}`)}>
                            <td className="small fw-medium">{t.subject}</td>
                            <td className="small">{t.user.email}</td>
                            <td>
                              <span className={`badge ${
                                t.priority === "URGENT" ? "bg-danger" : t.priority === "HIGH" ? "bg-warning" : "bg-secondary"
                              }`}>
                                {t.priority}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${
                                t.status === "OPEN" ? "bg-info" : t.status === "IN_PROGRESS" ? "bg-warning" : t.status === "RESOLVED" ? "bg-success" : "bg-secondary"
                              }`}>
                                {t.status}
                              </span>
                            </td>
                            <td className="small">{t.assignedAdmin?.email ?? "—"}</td>
                            <td className="small">{t._count.messages}</td>
                            <td className="small text-muted">{new Date(t.updatedAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

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
