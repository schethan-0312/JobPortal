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
  employer?: {
    id: string;
    companyName: string;
    logoUrl: string | null;
    location: string | null;
  };
  candidate?: {
    id: string;
    fullName: string;
    profilePhotoUrl: string | null;
    location: string | null;
  };
}

function slugify(title: string) {
  return title.toLowerCase().replace(/ /g, "-");
}

export default function CandidateFollowEmployersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [employers, setEmployers] = useState<FollowedEmployer[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || (user.role !== "CANDIDATE" && user.role !== "EMPLOYER"))) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || (user.role !== "CANDIDATE" && user.role !== "EMPLOYER")) return;
    (async () => {
      setDataLoading(true);
      try {
        const list = await api.get<FollowedEmployer[]>("/follow/following");
        setEmployers(list);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load followed profiles");
      } finally {
        setDataLoading(false);
      }
    })();
  }, [user]);

  async function handleUnfollow(targetId: string) {
    try {
      await api.delete(`/follow/${targetId}`);
      setEmployers((prev) => prev.filter((item) => item.employer?.id !== targetId && item.candidate?.id !== targetId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to unfollow profile");
    }
  }

  if (loading || !user || (user.role !== "CANDIDATE" && user.role !== "EMPLOYER")) {
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
                <h1 className="mb-1 fs-3 fw-medium">
                  {user.role === "EMPLOYER" ? "Following Candidates" : "Following Employers"}
                </h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">{user.role === "EMPLOYER" ? "Employer" : "Candidate"}</a></li>
                    <li className="breadcrumb-item text-muted"><a href="#">Dashboard</a></li>
                    <li className="breadcrumb-item">
                      <a href="#" className="text-main">
                        {user.role === "EMPLOYER" ? "Following Candidates" : "Following Employers"}
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
                    <h6 className="mb-0">
                      {employers.length} followed {user.role === "EMPLOYER" ? "candidate" : "employer"}{employers.length !== 1 ? "s" : ""}
                    </h6>
                  </div>
                  <div className="card-body">
                    {dataLoading && <p className="text-muted">Loading...</p>}
                    {!dataLoading && employers.length === 0 && (
                      <p className="text-muted">
                        You are not following any {user.role === "EMPLOYER" ? "candidates" : "employers"} yet.
                      </p>
                    )}
                    {/* Start All List */}
                    <div className="row justify-content-start gx-3 gy-4">
                      {employers.map((item) => {
                        const isCandidate = Boolean(item.candidate);
                        const detailUrl = isCandidate 
                          ? `/candidate-detail/${item.candidate!.id}` 
                          : `/employer-detail/${item.employer!.id}`;
                        const logoUrl = isCandidate 
                          ? item.candidate!.profilePhotoUrl 
                          : item.employer!.logoUrl;
                        const defaultImg = isCandidate 
                          ? "/assets/img/avatar.jpg" 
                          : "/assets/img/l-1.png";
                        const name = isCandidate 
                          ? item.candidate!.fullName 
                          : item.employer!.companyName;
                        const location = isCandidate 
                          ? item.candidate!.location 
                          : item.employer!.location;
                        const viewText = isCandidate 
                          ? "View Profile" 
                          : "View Company";
                        const targetId = isCandidate 
                          ? item.candidate!.id 
                          : item.employer!.id;

                        return (
                          <div className="col-xl-12 col-lg-12 col-md-12 col-12" key={item.id}>
                            <div className="emplors-list-box border">
                              <div className="emplors-list-head">
                                <div className="emplors-list-head-thunner">
                                  <div className="emplors-list-emp-thumb">
                                    <a href={detailUrl}>
                                      <figure><img src={assetUrl(logoUrl) || defaultImg} className="img-fluid" alt="" /></figure>
                                    </a>
                                  </div>
                                  <div className="emplors-list-job-caption">
                                    <div className="emplors-job-title-wrap mb-1">
                                      <h4>
                                        <a href={detailUrl} className="emplors-job-title">
                                          {name}
                                        </a>
                                      </h4>
                                    </div>
                                    <div className="emplors-job-mrch-lists">
                                      <div className="single-mrch-lists">
                                        <span><i className="fa-solid fa-location-dot me-1"></i>{location || "Location not set"}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="emplors-list-head-last d-flex gap-2">
                                  <a href={detailUrl} className="btn btn-md btn-light-main px-3">{viewText}</a>
                                  <button
                                    type="button"
                                    className="btn btn-md btn-outline-danger px-3"
                                    onClick={() => handleUnfollow(targetId)}
                                    disabled={loadingId === targetId}
                                  >
                                    {loadingId === targetId ? "..." : "Unfollow"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
