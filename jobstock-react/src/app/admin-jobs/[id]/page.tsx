"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface JobReport {
  id: string;
  reason: string;
  status: string;
  resolutionNote: string | null;
  createdAt: string;
  reporter: { email: string };
}

interface JobDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  jobType: string;
  status: string;
  salaryMin: number | null;
  salaryMax: number | null;
  createdAt: string;
  employer: { id: string; companyName: string; status: string };
  reports: JobReport[];
  _count: { applications: number };
}

export default function AdminJobDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function loadDetail() {
    try {
      const res = await api.get<JobDetail>(`/admin/job-moderation/${id}`);
      setDetail(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load job detail");
    }
  }

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    loadDetail();
  }, [user, id]);

  async function handleSetStatus(status: string) {
    setActing(true);
    setError(null);
    try {
      await api.patch(`/admin/job-moderation/${id}/status`, { status });
      await loadDetail();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update job status");
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
        <AdminSidebar active="jobs" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">{detail?.title ?? "Job"}</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item text-muted"><a href="/admin-jobs">Jobs</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">{detail?.title}</a></li>
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
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">
                      Status: <span className="badge bg-secondary">{detail.status}</span>
                    </h6>
                    <div className="d-flex gap-2 flex-wrap">
                      {detail.status !== "FLAGGED" && (
                        <button type="button" className="btn btn-sm btn-outline-danger" disabled={acting} onClick={() => handleSetStatus("FLAGGED")}>
                          Flag
                        </button>
                      )}
                      {detail.status === "FLAGGED" && (
                        <button type="button" className="btn btn-sm btn-outline-success" disabled={acting} onClick={() => handleSetStatus("OPEN")}>
                          Unflag (reopen)
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
                    <p className="mb-1"><strong>Employer:</strong> {detail.employer.companyName} ({detail.employer.status})</p>
                    <p className="mb-1"><strong>Category:</strong> {detail.category}</p>
                    <p className="mb-1"><strong>Location:</strong> {detail.location}</p>
                    <p className="mb-1"><strong>Type:</strong> {detail.jobType}</p>
                    <p className="mb-1">
                      <strong>Salary:</strong>{" "}
                      {detail.salaryMin && detail.salaryMax ? `₹${detail.salaryMin} - ₹${detail.salaryMax}` : "Not specified"}
                    </p>
                    <p className="mb-1"><strong>Applications:</strong> {detail._count.applications}</p>
                    <p className="mb-0"><strong>Description:</strong> {detail.description}</p>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header"><h6 className="mb-0">Reports ({detail.reports.length})</h6></div>
                  <div className="card-body">
                    {detail.reports.length === 0 && <p className="text-muted small mb-0">No reports filed against this job.</p>}
                    {detail.reports.length > 0 && (
                      <div className="d-flex flex-column gap-2">
                        {detail.reports.map((r) => (
                          <div key={r.id} className="border-bottom pb-2">
                            <div className="d-flex justify-content-between">
                              <span className="small fw-medium">{r.reporter.email}</span>
                              <span className={`badge ${r.status === "OPEN" ? "bg-warning" : "bg-secondary"}`}>{r.status}</span>
                            </div>
                            <p className="small mb-0 mt-1">{r.reason}</p>
                            {r.resolutionNote && <p className="small text-muted mb-0">Resolution: {r.resolutionNote}</p>}
                            <p className="small text-muted mb-0">{new Date(r.createdAt).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
