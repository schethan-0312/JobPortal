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
              <div className="colxl-12 col-lg-12 col-md-12">
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

            {error && <div className="alert alert-danger">{error}</div>}

            {/* Header Wrap */}
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0">{jobs.length} job{jobs.length !== 1 ? "s" : ""} posted</h6>
                  </div>
                  <div className="card-body">
                    {/* Row */}
                    <div className="row mb-3">
                      <div className="col-xl-12 col-lg-12 col-md-12">
                        <div className="duster-flex-row align-items-center d-flex justify-content-between">
                          <div className="duster-flex-first">
                            <h6 className="mb-0">All: {jobs.length} &nbsp; Active: {activeCount} &nbsp; Closed: {closedCount}</h6>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* End Row */}

                    {dataLoading && <p className="text-muted">Loading...</p>}
                    {!dataLoading && jobs.length === 0 && <p className="text-muted">You haven&apos;t posted any jobs yet.</p>}

                    {/* Start All List */}
                    <div className="row justify-content-start gx-3 gy-4">
                      {jobs.map((item) => (
                        <div className="col-xl-12 col-lg-12 col-md-12" key={item.id}>
                          <div className="jbs-list-box border">
                            <div className="jbs-list-head">
                              <div className="jbs-list-head-thunner">
                                <div className="jbs-list-emp-thumb jbs-verified">
                                  <a href={`/job-detail/${item.slug}`}>
                                    <figure>
                                      <img src="/assets/img/l-1.png" className="img-fluid" alt="" />
                                    </figure>
                                  </a>
                                </div>
                                <div className="jbs-list-job-caption">
                                  <div className="jbs-job-title-wrap">
                                    <h4>
                                      <a href={`/job-detail/${item.slug}`} className="jbs-job-title">
                                        {item.title}
                                      </a>
                                    </h4>
                                  </div>
                                </div>
                              </div>
                              <div className="jbs-list-applied-users">
                                <span className={`text-sm-muted text-light bg-${item.status === "OPEN" ? "green" : "red"} label`}>{item._count?.applications ?? 0} Applicants</span>
                              </div>
                              <div className="jbs-list-postedinfo">
                                <p className="m-0 text-sm-muted">
                                  <strong>Posted:</strong>
                                  <span className="text-success">{new Date(item.createdAt).toLocaleDateString()}</span>
                                </p>
                                <p className="m-0 text-sm-muted">
                                  <strong>Status:</strong>
                                  <span className={item.status === "OPEN" ? "text-success" : "text-danger"}>{item.status}</span>
                                </p>
                              </div>
                              <div className="jbs-list-head-last">
                                <button
                                  type="button"
                                  className={`rounded btn-md px-3 ${item.status === "OPEN" ? "text-danger bg-light-red" : "text-success bg-light-green"}`}
                                  disabled={updatingId === item.id}
                                  onClick={() => toggleStatus(item)}
                                >
                                  {updatingId === item.id ? "..." : item.status === "OPEN" ? "Close" : "Reopen"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* End All Job List */}
                  </div>
                </div>
              </div>
            </div>
            {/* Header Wrap */}
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
