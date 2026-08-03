"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar7 from "@/components/Navbar7";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
import UploadResumeModal from "@/components/candidate-dashboard/UploadResumeModal";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl } from "@/lib/api";

interface FollowedEmployer {
  id: string;
  employer: {
    id: string;
    companyName: string;
    logoUrl: string | null;
    location: string | null;
  };
}

export default function CandidateFollowEmployersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [employers, setEmployers] = useState<FollowedEmployer[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const list = await api.get<FollowedEmployer[]>("/candidates/followed-employers");
        setEmployers(list);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load followed employers");
      } finally {
        setDataLoading(false);
      }
    })();
  }, [user]);

  if (loading || !user || user.role !== "CANDIDATE") {
    return null;
  }

  return (
    <>
      <Navbar7 />

      <div className="dashboard-wrap bg-light">
        <CandidateSidebar active="follow-employers" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Following Employers</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Candidate</a></li>
                    <li className="breadcrumb-item text-muted"><a href="#">Dashboard</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Following Employers</a></li>
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
                    <h6 className="mb-0">{employers.length} followed employer{employers.length !== 1 ? "s" : ""}</h6>
                  </div>
                  <div className="card-body">
                    {dataLoading && <p className="text-muted">Loading...</p>}
                    {!dataLoading && employers.length === 0 && <p className="text-muted">You are not following any employers yet.</p>}
                    {/* Start All List */}
                    <div className="row justify-content-start gx-3 gy-4">
                      {employers.map((item) => (
                        <div className="col-xl-12 col-lg-12 col-md-12 col-12" key={item.id}>
                          <div className="emplors-list-box border">
                            <div className="emplors-list-head">
                              <div className="emplors-list-head-thunner">
                                <div className="emplors-list-emp-thumb">
                                  <a href={`/employer-detail/${item.employer.id}`}>
                                    <figure><img src={assetUrl(item.employer.logoUrl) || "/assets/img/l-1.png"} className="img-fluid" alt="" /></figure>
                                  </a>
                                </div>
                                <div className="emplors-list-job-caption">
                                  <div className="emplors-job-title-wrap mb-1"><h4><a href={`/employer-detail/${item.employer.id}`} className="emplors-job-title">{item.employer.companyName}</a></h4></div>
                                  <div className="emplors-job-mrch-lists">
                                    <div className="single-mrch-lists">
                                      <span><i className="fa-solid fa-location-dot me-1"></i>{item.employer.location || "Location not set"}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="emplors-list-head-last">
                                <a href={`/employer-detail/${item.employer.id}`} className="btn btn-md btn-light-main px-3">View Company</a>
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
