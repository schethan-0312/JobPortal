"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

type AdminRoleValue = "SUPER_ADMIN" | "SUPPORT_ADMIN" | "FINANCE_ADMIN" | "MODERATION_ADMIN";

interface TeamMember {
  id: string;
  email: string;
  adminRole: AdminRoleValue | null;
  createdAt: string;
  invitedByEmail: string | null;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
}

const ROLE_OPTIONS: { value: AdminRoleValue; label: string }[] = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "SUPPORT_ADMIN", label: "Support Admin" },
  { value: "FINANCE_ADMIN", label: "Finance Admin" },
  { value: "MODERATION_ADMIN", label: "Moderation Admin" },
];

function roleLabel(role: string | null) {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role ?? "—";
}

export default function AdminTeamPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [newAdminPassword, setNewAdminPassword] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminRoleValue>("SUPPORT_ADMIN");
  const [inviting, setInviting] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function loadMembers() {
    setDataLoading(true);
    try {
      const res = await api.get<TeamMember[]>("/admin/team");
      setMembers(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load admin team");
    } finally {
      setDataLoading(false);
    }
  }

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    loadMembers();
  }, [user]);

  async function handleInvite() {
    setError(null);
    setSuccessMsg(null);
    setNewAdminPassword(null);
    setInviting(true);
    try {
      const res = await api.post<{ email: string; tempPassword: string }>("/admin/team/invite", {
        email: inviteEmail.trim(),
        adminRole: inviteRole,
      });
      setNewAdminPassword(res.tempPassword);
      setSuccessMsg(`Admin ${res.email} created. Share the one-time password below with them securely.`);
      setInviteEmail("");
      await loadMembers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to invite admin");
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(id: string, adminRole: AdminRoleValue) {
    setActingId(id);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.patch(`/admin/team/${id}/role`, { adminRole });
      setSuccessMsg("Role updated.");
      await loadMembers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update role");
    } finally {
      setActingId(null);
    }
  }

  async function handleForceLogout(id: string) {
    setActingId(id);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.post(`/admin/team/${id}/force-logout`);
      setSuccessMsg("Admin has been force-logged-out; their next request will require re-authentication.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to force logout");
    } finally {
      setActingId(null);
    }
  }

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  const self = members.find((m) => m.id === user.userId);
  const isSuperAdmin = self ? self.adminRole === "SUPER_ADMIN" : false;

  return (
    <>
      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="team" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Admin Team &amp; Permissions</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Team &amp; Permissions</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}
            {successMsg && <div className="alert alert-success">{successMsg}</div>}
            {newAdminPassword && (
              <div className="alert alert-warning">
                <strong>One-time password (shown once):</strong>{" "}
                <code>{newAdminPassword}</code>
              </div>
            )}

            {isSuperAdmin && (
              <div className="card mb-4">
                <div className="card-header"><h6 className="mb-0">Invite Admin</h6></div>
                <div className="card-body">
                  <div className="row g-2 align-items-end">
                    <div className="col-md-5">
                      <label className="form-label small">Email</label>
                      <input
                        type="email"
                        className="form-control form-control-sm"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="new-admin@example.com"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small">Role</label>
                      <select
                        className="form-control form-control-sm"
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as AdminRoleValue)}
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <button
                        type="button"
                        className="btn btn-main btn-sm w-100"
                        disabled={inviting || !inviteEmail.trim()}
                        onClick={handleInvite}
                      >
                        {inviting ? "Inviting..." : "Invite Admin"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-header"><h6 className="mb-0">Team ({members.length})</h6></div>
              <div className="card-body">
                {dataLoading && <p className="text-muted">Loading...</p>}
                {!dataLoading && members.length > 0 && (
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Invited By</th>
                          <th>Last Login</th>
                          <th>Joined</th>
                          {isSuperAdmin && <th>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((m) => (
                          <tr key={m.id}>
                            <td className="small fw-medium">
                              {m.email}
                              {m.id === user.userId && <span className="badge bg-secondary ms-2">You</span>}
                            </td>
                            <td>
                              {isSuperAdmin && m.id !== user.userId ? (
                                <select
                                  className="form-control form-control-sm"
                                  style={{ width: 180 }}
                                  value={m.adminRole ?? ""}
                                  disabled={actingId === m.id}
                                  onChange={(e) => handleRoleChange(m.id, e.target.value as AdminRoleValue)}
                                >
                                  {ROLE_OPTIONS.map((r) => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className="badge bg-main-subtle text-main border border-main">
                                  {roleLabel(m.adminRole)}
                                </span>
                              )}
                            </td>
                            <td className="small text-muted">{m.invitedByEmail ?? "—"}</td>
                            <td className="small text-muted">
                              {m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleString() : "Never"}
                            </td>
                            <td className="small text-muted">{new Date(m.createdAt).toLocaleDateString()}</td>
                            {isSuperAdmin && (
                              <td>
                                {m.id !== user.userId && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    disabled={actingId === m.id}
                                    onClick={() => handleForceLogout(m.id)}
                                  >
                                    Force Logout
                                  </button>
                                )}
                              </td>
                            )}
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

