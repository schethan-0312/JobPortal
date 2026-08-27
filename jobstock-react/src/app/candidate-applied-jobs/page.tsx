"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar7 from "@/components/Navbar7";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
import UploadResumeModal from "@/components/candidate-dashboard/UploadResumeModal";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl } from "@/lib/api";

interface Application {
  id: string;
  jobId: string;
  status: string;
  coverNote: string | null;
  appliedAt: string;
  job: {
    id: string;
    title: string;
    slug: string;
    location: string;
    employer: { companyName: string; logoUrl: string | null };
  };
}

const statusClass: Record<string, string> = {
  APPLIED: "warning",
  REVIEWED: "info",
  SHORTLISTED: "success",
  INTERVIEW: "success",
  OFFERED: "success",
  REJECTED: "danger",
  WITHDRAWN: "danger",
};

export default function CandidateAppliedJobsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [applications, setApplications] = useState<Application[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "CANDIDATE")) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "CANDIDATE") return;
    loadApplications();
  }, [user]);

  async function loadApplications() {
    setDataLoading(true);
    setError(null);
    try {
      const apps = await api.get<Application[]>("/applications/mine");
      setApplications(apps);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load applications");
    } finally {
      setDataLoading(false);
    }
  }

  async function handleWithdraw(id: string) {
    setWithdrawingId(id);
    setError(null);
    try {
      await api.patch(`/applications/${id}/withdraw`);
      setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status: "WITHDRAWN" } : a)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to withdraw application");
    } finally {
      setWithdrawingId(null);
    }
  }

  if (loading || !user || user.role !== "CANDIDATE") {
    return null;
  }

  return (
    <>
      <Navbar7 />

      <div className="dashboard-wrap bg-light">
        <CandidateSidebar active="applied-jobs" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Applied Jobs</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Candidate</a></li>
                    <li className="breadcrumb-item text-muted"><a href="#">Dashboard</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Applied Jobs</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">

            {error && <div className="alert alert-danger">{error}</div>}

            {/* Header Wrap */}
            <div className="row">
              <div className="col-12 col-xl-12 col-lg-12 col-md-12 col-sm-12">
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0">{applications.length} application{applications.length !== 1 ? "s" : ""}</h6>
                  </div>
                  <div className="card-body">
                    {dataLoading && <p className="text-muted">Loading...</p>}
                    {!dataLoading && applications.length === 0 && <p className="text-muted">You haven&apos;t applied to any jobs yet.</p>}
                    {/* Start All List */}
                    <div className="row justify-content-start gx-3 gy-4">
                      {applications.map((item) => (
                        <div className="col-xl-12 col-lg-12 col-md-12" key={item.id}>
                          <div className="jbs-list-box border">
                            <div className="jbs-list-head">
                              <div className="jbs-list-head-thunner">
                                <div className="jbs-list-emp-thumb jbs-verified">
                                  <a href={`/job-detail/${item.job.slug}`}>
                                    <figure><img src={assetUrl(item.job.employer.logoUrl) || "/assets/img/l-1.png"} className="img-fluid" alt="" /></figure>
                                  </a>
                                </div>
                                <div className="jbs-list-job-caption">
                                  <div className="jbs-job-title-wrap"><h4><a href={`/job-detail/${item.job.slug}`} className="jbs-job-title">{item.job.title}</a></h4></div>
                                  <div className="jbs-job-mrch-lists">
                                    <div className="single-mrch-lists">
                                      <span>{item.job.employer.companyName}</span>.<span><i className="fa-solid fa-location-dot me-1"></i>{item.job.location}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="jbs-list-head-middle">
                                <div className="elsocrio-jbs"><span className="text-sm-muted">Applied {new Date(item.appliedAt).toLocaleDateString()}</span></div>
                              </div>
                              <div className="jbs-list-head-middle">
                                <div className="elsocrio-jbs"><span className={`text-sm-muted text-light bg-${statusClass[item.status] || "secondary"} py-2 px-3 rounded`}>{item.status}</span></div>
                              </div>
                              <div className="jbs-list-head-last">
                                {item.status !== "WITHDRAWN" && !["REJECTED", "OFFERED"].includes(item.status) && (
                                  <button
                                    type="button"
                                    className="btn btn-md btn-light-red px-3 me-2"
                                    disabled={withdrawingId === item.id}
                                    onClick={() => handleWithdraw(item.id)}
                                    title="Withdraw application"
                                  >
                                    {withdrawingId === item.id ? "..." : <i className="fa-solid fa-xmark"></i>}
                                  </button>
                                )}
                                <a href={`/job-detail/${item.job.slug}`} className="btn btn-md btn-light-main px-3"><i className="fa-solid fa-eye"></i></a>
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

      <UploadResumeModal />
    </>
  );
}
