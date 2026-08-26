"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface Report {
  id: string;
  targetType: string;
  jobId: string;
  reportedEmployerId: string;
  reporterId: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter: { email: string };
  job: { title: string; slug: string };
}

export default function AdminReportsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [reports, setReports] = useState<Report[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    (async () => {
      setDataLoading(true);
      try {
        const res = await api.get<Report[]>("/admin/reports");
        setReports(res);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load reports");
      } finally {
        setDataLoading(false);
      }
    })();
  }, [user]);

  async function handleResolve(id: string) {
    setActingId(id);
    setError(null);
    setSuccessMsg(null);
    try {
      const resolutionNote = notes[id]?.trim();
      await api.patch(`/admin/reports/${id}/resolve`, resolutionNote ? { resolutionNote } : {});
      setReports((prev) => prev.filter((r) => r.id !== id));
      setSuccessMsg("Report resolved successfully.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to resolve report");
    } finally {
      setActingId(null);
    }
  }

  async function handleFlagJob(jobId: string) {
    setError(null);
    setSuccessMsg(null);
    try {
      await api.patch(`/admin/jobs/${jobId}/flag`);
      setFlaggedIds((prev) => new Set(prev).add(jobId));
      setSuccessMsg("Job flagged successfully.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to flag job");
    }
  }

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="reports" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Reports</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted">
                      <a href="#">Admin</a>
                    </li>
                    <li className="breadcrumb-item">
                      <a href="#" className="text-main">
                        Reports
                      </a>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}
            {successMsg && <div className="alert alert-success">{successMsg}</div>}

            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0">Open Reports</h6>
                  </div>
                  <div className="card-body">
                    {dataLoading && <p className="text-muted">Loading...</p>}
                    {!dataLoading && reports.length === 0 && (
                      <p className="text-muted">No open reports.</p>
                    )}

                    <div className="row justify-content-start gx-3 gy-4">
                      {reports.map((r) => (
                        <div className="col-xl-12 col-lg-12 col-md-12" key={r.id}>
                          <div className="jbs-list-box border">
                            <div className="jbs-list-head flex-column align-items-start">
                              <div className="jbs-list-job-caption w-100">
                                <div className="jbs-job-title-wrap">
                                  <h4>
                                    <span className="jbs-job-title">{r.job?.title ?? "Unknown job"}</span>
                                  </h4>
                                </div>
                                <div className="jbs-job-mrch-lists">
                                  <div className="single-mrch-lists">
                                    <span>Reported by {r.reporter?.email ?? "unknown"}</span>.
                                    <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                                <p className="text-muted mb-2 mt-2">
                                  <strong>Reason:</strong> {r.reason}
                                </p>

                                <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
                                  <input
                                    type="text"
                                    className="form-control"
                                    style={{ maxWidth: 320 }}
                                    placeholder="Resolution note (optional)"
                                    value={notes[r.id] ?? ""}
                                    onChange={(e) =>
                                      setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))
                                    }
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-md btn-main px-3"
                                    disabled={actingId === r.id}
                                    onClick={() => handleResolve(r.id)}
                                  >
                                    {actingId === r.id ? "Please wait..." : "Resolve"}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-md btn-gray px-3"
                                    disabled={flaggedIds.has(r.jobId)}
                                    onClick={() => handleFlagJob(r.jobId)}
                                  >
                                    {flaggedIds.has(r.jobId) ? "Flagged" : "Flag this job"}
                                  </button>
                                </div>
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

