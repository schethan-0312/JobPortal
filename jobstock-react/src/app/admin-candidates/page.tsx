"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

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

export default function AdminCandidatesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<CandidateListResponse | null>(null);
  const [search, setSearch] = useState("");
  const [suspendedFilter, setSuspendedFilter] = useState("");
  const [page, setPage] = useState(1);
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
        if (search) params.set("search", search);
        if (suspendedFilter) params.set("suspended", suspendedFilter);
        params.set("page", String(page));
        params.set("pageSize", "15");
        const res = await api.get<CandidateListResponse>(`/admin/candidate-management?${params.toString()}`);
        setData(res);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load candidates");
      }
    })();
  }, [user, search, suspendedFilter, page]);

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="candidates" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Candidate Management</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Candidates</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="card">
              <div className="card-header d-flex flex-wrap gap-2 justify-content-between align-items-center">
                <h6 className="mb-0">All Candidates ({data?.total ?? 0})</h6>
                <div className="d-flex gap-2 flex-wrap">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search name or email..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                  <select
                    className="form-control form-control-sm"
                    value={suspendedFilter}
                    onChange={(e) => {
                      setSuspendedFilter(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">All</option>
                    <option value="false">Active</option>
                    <option value="true">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="card-body">
                {!data && <p className="text-muted">Loading...</p>}
                {data && data.items.length === 0 && <p className="text-muted">No candidates match these filters.</p>}
                {data && data.items.length > 0 && (
                  <div className="table-responsive" style={{ overflowX: "auto", width: "100%", display: "block" }}>
                    <table className="table align-middle" style={{ whiteSpace: "nowrap", width: "auto", minWidth: "100%" }}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Location</th>
                          <th>Package</th>
                          <th>Applications</th>
                          <th>Assessments</th>
                          <th>Interviews</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.map((c) => (
                          <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/admin-candidates/${c.id}`)}>
                            <td className="small fw-medium">
                              {c.fullName}
                              {c.isVerified && <i className="fa-solid fa-circle-check text-success ms-1" title="Verified"></i>}
                            </td>
                            <td className="small">{c.email}</td>
                            <td className="small">{c.location ?? "—"}</td>
                            <td className="small">
                              {c.activeResumePackage ? (
                                <span className="badge bg-primary text-white">{c.activeResumePackage}</span>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                            <td className="small">{c.applicationsCount}</td>
                            <td className="small">{c.assessmentsCount}</td>
                            <td className="small">{c.interviewsCount}</td>
                            <td>
                              <span className={`badge ${c.isSuspended ? "bg-danger" : "bg-success"}`}>
                                {c.isSuspended ? "Suspended" : "Active"}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-main py-1 px-3"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/admin-candidates/${c.id}`);
                                }}
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {data && data.total > 15 && (
                  <div className="d-flex justify-content-between align-items-center p-3 border-top small text-muted">
                    <span>Showing {(page - 1) * 15 + 1} - {Math.min(page * 15, data.total)} of {data.total} candidates</span>
                    <div className="d-flex gap-2 flex-wrap">
                      <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
                      <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page * 15 >= data.total} onClick={() => setPage(page + 1)}>Next</button>
                    </div>
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

