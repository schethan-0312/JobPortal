"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface JobRun {
  id: string;
  status: "RUNNING" | "SUCCESS" | "FAILED";
  triggeredBy: string;
  detail: string | null;
  startedAt: string;
  completedAt: string | null;
}

interface JobDefinition {
  name: string;
  description: string;
  cronExpression: string;
  cronLabel: string;
  lastRun: JobRun | null;
}

export default function AdminBackgroundJobsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [jobs, setJobs] = useState<JobDefinition[]>([]);
  const [history, setHistory] = useState<Record<string, JobRun[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function loadJobs() {
    try {
      const res = await api.get<JobDefinition[]>("/admin/background-jobs");
      setJobs(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load background jobs");
    }
  }

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    loadJobs();
  }, [user]);

  async function toggleHistory(jobName: string) {
    if (expanded === jobName) {
      setExpanded(null);
      return;
    }
    setExpanded(jobName);
    try {
      const res = await api.get<{ items: JobRun[] }>(`/admin/background-jobs/${jobName}/history`);
      setHistory((prev) => ({ ...prev, [jobName]: res.items }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load job history");
    }
  }

  async function handleRunNow(jobName: string) {
    setRunning(jobName);
    setError(null);
    try {
      await api.post(`/admin/background-jobs/${jobName}/run`);
      await loadJobs();
      if (expanded === jobName) {
        const res = await api.get<{ items: JobRun[] }>(`/admin/background-jobs/${jobName}/history`);
        setHistory((prev) => ({ ...prev, [jobName]: res.items }));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to trigger job");
    } finally {
      setRunning(null);
    }
  }

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="background-jobs" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Background Jobs</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Background Jobs</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}

            {jobs.map((job) => (
              <div className="card mb-4" key={job.name}>
                <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
                  <div>
                    <h6 className="mb-0">{job.name}</h6>
                    <span className="small text-muted">{job.description}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className="badge bg-secondary">{job.cronLabel}</span>
                    {job.lastRun && (
                      <span className={`badge ${
                        job.lastRun.status === "SUCCESS" ? "bg-success" : job.lastRun.status === "FAILED" ? "bg-danger" : "bg-warning"
                      }`}>
                        Last: {job.lastRun.status}
                      </span>
                    )}
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => toggleHistory(job.name)}>
                      {expanded === job.name ? "Hide History" : "View History"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-main"
                      disabled={running === job.name}
                      onClick={() => handleRunNow(job.name)}
                    >
                      {running === job.name ? "Running..." : "Run Now"}
                    </button>
                  </div>
                </div>
                {job.lastRun && (
                  <div className="card-body small text-muted py-2">
                    Last run: {new Date(job.lastRun.startedAt).toLocaleString()}
                    {job.lastRun.detail && <span className="text-danger ms-2">{job.lastRun.detail}</span>}
                  </div>
                )}
                {expanded === job.name && (
                  <div className="card-body border-top">
                    {!history[job.name] && <p className="text-muted small mb-0">Loading history...</p>}
                    {history[job.name] && history[job.name].length === 0 && (
                      <p className="text-muted small mb-0">No runs recorded yet.</p>
                    )}
                    {history[job.name] && history[job.name].length > 0 && (
                      <table className="table table-sm align-middle mb-0">
                        <thead><tr><th>Status</th><th>Triggered By</th><th>Started</th><th>Duration</th><th>Detail</th></tr></thead>
                        <tbody>
                          {history[job.name].map((r) => (
                            <tr key={r.id}>
                              <td>
                                <span className={`badge ${
                                  r.status === "SUCCESS" ? "bg-success" : r.status === "FAILED" ? "bg-danger" : "bg-warning"
                                }`}>
                                  {r.status}
                                </span>
                              </td>
                              <td className="small">{r.triggeredBy}</td>
                              <td className="small text-muted">{new Date(r.startedAt).toLocaleString()}</td>
                              <td className="small">
                                {r.completedAt
                                  ? `${Math.round((new Date(r.completedAt).getTime() - new Date(r.startedAt).getTime()) / 1000)}s`
                                  : "â€”"}
                              </td>
                              <td className="small text-danger">{r.detail ?? ""}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))}
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

