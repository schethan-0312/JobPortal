"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar8 from "@/components/Navbar8";
import EmployerSidebar from "@/components/employer-dashboard/EmployerSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface EmployerJob {
  id: string;
  title: string;
  slug: string;
  status: string;
  location: string;
  createdAt: string;
  _count?: { applications: number };
}

export default function EmployerJobsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "EMPLOYER")) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "EMPLOYER") return;
    loadJobs();
  }, [user]);

  async function loadJobs() {
    setDataLoading(true);
    setError(null);
    try {
      const list = await api.get<EmployerJob[]>("/jobs/mine");
      setJobs(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load jobs");
    } finally {
      setDataLoading(false);
    }
  }

  async function toggleStatus(job: EmployerJob) {
    const newStatus = job.status === "OPEN" ? "CLOSED" : "OPEN";
    setUpdatingId(job.id);
    setError(null);
    try {
      await api.patch(`/jobs/${job.id}/status`, { status: newStatus });
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: newStatus } : j)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update job status");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }
    setDeletingId(id);
    setError(null);
    try {
      await api.delete(`/jobs/${id}`);
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete job");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading || !user || user.role !== "EMPLOYER") {
    return null;
  }

  const activeCount = jobs.filter((j) => j.status === "OPEN").length;
  const closedCount = jobs.filter((j) => j.status !== "OPEN").length;

  return (
    <>
      <Navbar8 />

      <div className="dashboard-wrap bg-light">
        <EmployerSidebar active="jobs" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Manage jobs</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted">
                      <a href="#">Employer</a>
                    </li>
                    <li className="breadcrumb-item text-muted">
                      <a href="#">Dashboard</a>
                    </li>
                    <li className="breadcrumb-item">
                      <a href="#" className="text-main">
                        My Jobs
                      </a>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger mb-3">{error}</div>}

            {/* Main Job List Card */}
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12">
                <div className="card shadow-sm border-0">
                  <div className="card-header bg-white py-3">
                    <h6 className="mb-0 fs-5 fw-semibold text-dark">
                      {jobs.length} job{jobs.length !== 1 ? "s" : ""} posted
                    </h6>
                  </div>
                  <div className="card-body p-4">
                    {/* Summary Counters */}
                    <div className="row mb-4">
                      <div className="col-xl-12 col-lg-12 col-md-12">
                        <div className="bg-light p-3 rounded border">
                          <h6 className="mb-0 text-dark fw-medium fs-6">
                            All: <span className="text-primary me-3">{jobs.length}</span>
                            Active: <span className="text-success me-3">{activeCount}</span>
                            Closed: <span className="text-danger">{closedCount}</span>
                          </h6>
                        </div>
                      </div>
                    </div>

                    {dataLoading && <p className="text-muted">Loading your jobs...</p>}
                    {!dataLoading && jobs.length === 0 && (
                      <p className="text-muted">You haven&apos;t posted any jobs yet.</p>
                    )}

                    {/* Aligned Job List Rows */}
                    <div className="d-flex flex-column gap-3">
                      {jobs.map((item) => (
                        <div className="card border rounded-3 shadow-none hover-shadow" key={item.id}>
                          <div className="card-body p-3">
                            <div className="row align-items-center g-3">
                              {/* Column 1: Logo & Title (4 cols) */}
                              <div className="col-xl-4 col-lg-4 col-md-5 col-sm-12">
                                <div className="d-flex align-items-center gap-3">
                                  <div className="flex-shrink-0" style={{ width: "48px", height: "48px" }}>
                                    <img
                                      src="/assets/img/l-1.png"
                                      className="img-fluid rounded border p-1"
                                      style={{ width: "48px", height: "48px", objectFit: "contain" }}
                                      alt=""
                                    />
                                  </div>
                                  <div className="overflow-hidden">
                                    <h5 className="mb-0 text-truncate font-weight-bold fs-6">
                                      <a href={`/job-detail/${item.slug}`} className="text-dark hover-main">
                                        {item.title}
                                      </a>
                                    </h5>
                                    {item.location && (
                                      <small className="text-muted text-truncate d-block mt-1">
                                        {item.location}
                                      </small>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Column 2: Applicants (2 cols - strictly aligned column-wise) */}
                              <div className="col-xl-2 col-lg-2 col-md-2 col-sm-4 text-start text-md-center">
                                <span className="badge bg-success text-white px-3 py-2 fw-medium fs-7 rounded-2">
                                  {item._count?.applications ?? 0} Applicants
                                </span>
                              </div>

                              {/* Column 3: Posted Date & Status (3 cols - strictly aligned column-wise) */}
                              <div className="col-xl-3 col-lg-3 col-md-3 col-sm-4">
                                <div className="fs-7">
                                  <div className="text-muted mb-1">
                                    <strong>Posted:</strong>{" "}
                                    <span className="text-success fw-medium">
                                      {new Date(item.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="text-muted">
                                    <strong>Status:</strong>{" "}
                                    <span className={item.status === "OPEN" ? "text-success fw-semibold" : "text-danger fw-semibold"}>
                                      {item.status}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Column 4: Action Buttons (3 cols - Close/Reopen + Delete) */}
                              <div className="col-xl-3 col-lg-3 col-md-2 col-sm-4 d-flex justify-content-end align-items-center gap-2">
                                <button
                                  type="button"
                                  className={`btn btn-sm px-3 fw-medium ${
                                    item.status === "OPEN" ? "btn-outline-warning" : "btn-outline-success"
                                  }`}
                                  disabled={updatingId === item.id || deletingId === item.id}
                                  onClick={() => toggleStatus(item)}
                                >
                                  {updatingId === item.id ? "..." : item.status === "OPEN" ? "Close" : "Reopen"}
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger px-3 fw-medium"
                                  disabled={updatingId === item.id || deletingId === item.id}
                                  onClick={() => handleDelete(item.id, item.title)}
                                >
                                  {deletingId === item.id ? "..." : "Delete"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* footer */}
          <div className="row">
            <div className="col-md-12">
              <div className="py-3 text-center text-muted">
                &copy; {new Date().getFullYear()} JobStock. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

