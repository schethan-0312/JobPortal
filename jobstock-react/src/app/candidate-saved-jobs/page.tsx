"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar7 from "@/components/Navbar7";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
import UploadResumeModal from "@/components/candidate-dashboard/UploadResumeModal";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl } from "@/lib/api";

interface SavedJob {
  id: string;
  jobId: string;
  createdAt: string;
  job: {
    id: string;
    title: string;
    slug: string;
    location: string;
    employer: { companyName: string; logoUrl: string | null };
  };
}

export default function CandidateSavedJobsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "CANDIDATE")) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "CANDIDATE") return;
    (async () => {
      setDataLoading(true);
      try {
        const jobs = await api.get<SavedJob[]>("/candidates/saved-jobs", { cache: "no-store" });
        setSavedJobs(jobs);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load saved jobs");
      } finally {
        setDataLoading(false);
      }
    })();
  }, [user]);

  async function handleRemove(jobId: string) {
    setRemovingId(jobId);
    setError(null);
    try {
      await api.delete(`/candidates/saved-jobs/${jobId}`);
      setSavedJobs((prev) => prev.filter((s) => s.jobId !== jobId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to remove saved job");
    } finally {
      setRemovingId(null);
    }
  }

  if (loading || !user || user.role !== "CANDIDATE") {
    return null;
  }

  return (
    <>
      <Navbar7 />

      <div className="dashboard-wrap bg-light">
        <CandidateSidebar active="saved-jobs" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Saved jobs</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Candidate</a></li>
                    <li className="breadcrumb-item text-muted"><a href="#">Dashboard</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Saved jobs</a></li>
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
                    <h6 className="mb-0">{savedJobs.length} saved job{savedJobs.length !== 1 ? "s" : ""}</h6>
                  </div>
                  <div className="card-body">
                    {dataLoading && <p className="text-muted">Loading...</p>}
                    {!dataLoading && savedJobs.length === 0 && <p className="text-muted">You haven&apos;t saved any jobs yet.</p>}
                    {/* Start All List */}
                    <div className="row justify-content-start gx-3 gy-4">
                      {savedJobs.map((item) => (
                        <div className="col-xl-12 col-lg-12 col-md-12" key={item.id}>
                          <div className="jbs-list-box border">
                            <div className="jbs-list-head mb-0">
                              <div className="jbs-list-head-thunner">
                                <div className="jbs-list-emp-thumb jbs-verified">
                                  <a href={`/job-detail/${item.job.slug}`}>
                                    <figure><img src={assetUrl(item.job.employer?.logoUrl) || "/assets/img/l-1.png"} className="img-fluid" alt="" /></figure>
                                  </a>
                                </div>
                                <div className="jbs-list-job-caption">
                                  <div className="jbs-job-title-wrap"><h4><a href={`/job-detail/${item.job.slug}`} className="jbs-job-title">{item.job.title}</a></h4></div>
                                  <div className="jbs-job-mrch-lists">
                                    <div className="single-mrch-lists">
                                      <span>{item.job.employer?.companyName || "Unknown"}</span>.<span><i className="fa-solid fa-location-dot me-1"></i>{item.job.location}</span>.<span>Saved {new Date(item.createdAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="jbs-list-head-last">
                                <button
                                  type="button"
                                  className="btn btn-md btn-light-red px-3 me-2"
                                  disabled={removingId === item.jobId}
                                  onClick={() => handleRemove(item.jobId)}
                                  title="Remove"
                                >
                                  {removingId === item.jobId ? "..." : <i className="fa-solid fa-xmark"></i>}
                                </button>
                                <a href={`/job-detail/${item.job.slug}`} className="btn btn-md btn-light-main px-3">View Detail</a>
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
