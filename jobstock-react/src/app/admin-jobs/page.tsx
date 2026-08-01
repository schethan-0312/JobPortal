"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

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

export default function AdminJobsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<JobListResponse | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
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
        if (status) params.set("status", status);
        const res = await api.get<JobListResponse>(`/admin/job-moderation?${params.toString()}`);
        setData(res);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load jobs");
      }
    })();
  }, [user, search, status]);

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="jobs" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Job Moderation</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Jobs</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="card">
              <div className="card-header d-flex flex-wrap gap-2 justify-content-between align-items-center">
                <h6 className="mb-0">All Jobs ({data?.total ?? 0})</h6>
                <div className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search title or company..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <select className="form-control form-control-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">All statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="DRAFT">Draft</option>
                    <option value="CLOSED">Closed</option>
                    <option value="FLAGGED">Flagged</option>
                  </select>
                </div>
              </div>
              <div className="card-body">
                {!data && <p className="text-muted">Loading...</p>}
                {data && data.items.length === 0 && <p className="text-muted">No jobs match these filters.</p>}
                {data && data.items.length > 0 && (
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Employer</th>
                          <th>Category</th>
                          <th>Applications</th>
                          <th>Reports</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.map((j) => (
                          <tr key={j.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/admin-jobs/${j.id}`)}>
                            <td className="small fw-medium">{j.title}</td>
                            <td className="small">{j.employerName}</td>
                            <td className="small">{j.category}</td>
                            <td className="small">{j.applicationsCount}</td>
                            <td className="small">
                              {j.reportsCount > 0 ? <span className="badge bg-danger">{j.reportsCount}</span> : "0"}
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  j.status === "OPEN"
                                    ? "bg-success"
                                    : j.status === "FLAGGED"
                                      ? "bg-danger"
                                      : j.status === "CLOSED"
                                        ? "bg-secondary"
                                        : "bg-warning"
                                }`}
                              >
                                {j.status}
                              </span>
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
