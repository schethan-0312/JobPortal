"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar8 from "@/components/Navbar8";
import EmployerSidebar from "@/components/employer-dashboard/EmployerSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { Toaster, toast } from "react-hot-toast";

interface Package {
  id: string;
  name: string;
  priceInPaisa: number;
  durationType: string;
  duration: number;
  postJobLimit: number;
  applicantViewLimit: number;
  jobSeekerViewLimit: number;
  chatEnabled: boolean;
  filterShortlistEnabled: boolean;
  scheduleInterviewsEnabled: boolean;
  companyBrandingEnabled: boolean;
  verifiedRecruiterBadgeEnabled: boolean;
}

interface ActiveSubscription {
  id: string;
  packageId: string;
  package: Package;
  status: string;
  startedAt: string;
  expiresAt: string | null;
  jobPostsUsed: number;
  applicantsViewed: number;
  jobSeekersViewed: number;
}

export default function EmployerActivePackagePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [activeSub, setActiveSub] = useState<ActiveSubscription | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!loading && (!user || user.role !== "EMPLOYER")) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "EMPLOYER") return;
    (async () => {
      setDataLoading(true);
      try {
        const sub = await api.get<ActiveSubscription | null>("/packages/active-subscription");
        setActiveSub(sub);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to load active package");
      } finally {
        setDataLoading(false);
      }
    })();
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !user || user.role !== "EMPLOYER") {
    return null;
  }

  function getRemainingTime(expiresAtStr: string) {
    const expiresAt = new Date(expiresAtStr);
    const diff = expiresAt.getTime() - now.getTime();
    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);

    let parts = [];
    if (days > 0) parts.push(`${days} Days`);
    if (hours > 0) parts.push(`${hours} Hours`);
    if (days === 0 && minutes > 0) parts.push(`${minutes} Minutes`);
    
    return parts.join(" ") || "Less than a minute";
  }

  function renderProgressBar(used: number, limit: number, label: string) {
    if (limit === 999999) {
      return (
        <div className="mb-4">
          <div className="d-flex justify-content-between mb-1">
            <span className="fw-medium small">{label}</span>
            <span className="text-success small fw-bold">Unlimited ({used} Used)</span>
          </div>
          <div className="progress bg-success-subtle" style={{ height: "8px" }}>
            <div className="progress-bar bg-success" role="progressbar" style={{ width: "100%" }}></div>
          </div>
        </div>
      );
    }

    const percent = Math.min(100, Math.max(0, (used / limit) * 100));
    const isWarning = percent > 80;
    const barClass = isWarning ? "bg-warning" : "bg-primary";

    return (
      <div className="mb-4">
        <div className="d-flex justify-content-between mb-1">
          <span className="fw-medium small">{label}</span>
          <span className={`small fw-bold ${isWarning ? 'text-warning' : 'text-primary'}`}>
            {used} / {limit} Used
          </span>
        </div>
        <div className="progress" style={{ height: "8px" }}>
          <div className={`progress-bar ${barClass}`} role="progressbar" style={{ width: `${percent}%` }}></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar8 />

      <div className="dashboard-wrap bg-light">
        <EmployerSidebar active="active-package" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Active Package</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Employer</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Active Package</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            <Toaster position="top-right" />

            {dataLoading ? (
              <div className="card border-0 shadow-sm p-5 text-center">
                <div className="spinner-border text-main mb-3" role="status"></div>
                <p className="text-muted">Loading your subscription data...</p>
              </div>
            ) : !activeSub ? (
              <div className="card border-0 shadow-sm p-5 text-center">
                <div className="mb-4">
                  <i className="fa-solid fa-box-open text-muted" style={{ fontSize: "64px" }}></i>
                </div>
                <h4 className="fw-bold mb-3">No Active Package</h4>
                <p className="text-muted mb-4">You do not have an active package. Upgrade to a premium plan to post jobs, view applicant details, and access advanced features.</p>
                <div>
                  <button className="btn btn-main px-4 py-2" onClick={() => router.push("/employer-package")}>
                    View Packages
                  </button>
                </div>
              </div>
            ) : (
              <div className="row g-4">
                <div className="col-xl-8 col-lg-7">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                      <h5 className="mb-0 fw-semibold">Current Plan details</h5>
                      <span className={`badge ${activeSub.status === 'ACTIVE' ? 'bg-success' : 'bg-danger'}`}>
                        {activeSub.status}
                      </span>
                    </div>
                    <div className="card-body p-4">
                      <div className="d-flex align-items-center justify-content-between border-bottom pb-4 mb-4">
                        <div>
                          <h2 className="fw-bold text-dark mb-1">{activeSub.package.name}</h2>
                          <p className="text-muted mb-0">Active since {new Date(activeSub.startedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-end">
                          <h3 className="fw-bold text-primary mb-1">
                            {(activeSub.package.priceInPaisa / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                          </h3>
                          <p className="text-muted mb-0">per {activeSub.package.duration} {activeSub.package.durationType.toLowerCase()}</p>
                        </div>
                      </div>

                      <h6 className="fw-bold mb-3">Usage Statistics</h6>
                      
                      {renderProgressBar(activeSub.jobPostsUsed || 0, activeSub.package.postJobLimit, "Jobs Posted")}
                      {renderProgressBar(activeSub.applicantsViewed || 0, activeSub.package.applicantViewLimit, "Applicants Viewed")}
                      {renderProgressBar(activeSub.jobSeekersViewed || 0, activeSub.package.jobSeekerViewLimit, "Job Seeker Profiles Searched")}

                      <div className="mt-5">
                        <button className="btn btn-main px-4" onClick={() => router.push("/employer-package")}>
                          Upgrade Package
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xl-4 col-lg-5">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-header bg-white py-3 border-bottom">
                      <h5 className="mb-0 fw-semibold">Subscription Status</h5>
                    </div>
                    <div className="card-body p-4 bg-light">
                      <div className="text-center mb-4">
                        <div className="d-inline-flex align-items-center justify-content-center bg-white text-main rounded-circle shadow-sm mb-3" style={{ width: "70px", height: "70px", fontSize: "28px" }}>
                          <i className="fa-regular fa-clock"></i>
                        </div>
                        <h6 className="text-muted mb-1">Time Remaining</h6>
                        <h4 className="fw-bold text-dark">
                          {activeSub.expiresAt ? getRemainingTime(activeSub.expiresAt) : "Unlimited"}
                        </h4>
                      </div>

                      <ul className="list-group list-group-flush rounded shadow-sm border mt-4">
                        <li className="list-group-item d-flex justify-content-between align-items-center py-3">
                          <span className="text-muted small">Started On</span>
                          <span className="fw-medium small text-dark">{new Date(activeSub.startedAt).toLocaleDateString()}</span>
                        </li>
                        <li className="list-group-item d-flex justify-content-between align-items-center py-3">
                          <span className="text-muted small">Expires On</span>
                          <span className="fw-medium small text-dark">{activeSub.expiresAt ? new Date(activeSub.expiresAt).toLocaleDateString() : "N/A"}</span>
                        </li>
                        <li className="list-group-item d-flex justify-content-between align-items-center py-3">
                          <span className="text-muted small">Auto-Renew</span>
                          <span className="badge bg-secondary">Off</span>
                        </li>
                      </ul>
                      
                      <div className="mt-4 pt-4 border-top">
                        <h6 className="fw-bold mb-3 small text-muted text-uppercase">Included Features</h6>
                        <ul className="list-unstyled mb-0 small">
                          {activeSub.package.chatEnabled && <li className="mb-2"><i className="fa-solid fa-check text-success me-2"></i> In-App Chat</li>}
                          {activeSub.package.filterShortlistEnabled && <li className="mb-2"><i className="fa-solid fa-check text-success me-2"></i> Filter & Shortlist</li>}
                          {activeSub.package.scheduleInterviewsEnabled && <li className="mb-2"><i className="fa-solid fa-check text-success me-2"></i> Schedule Interviews</li>}
                          {activeSub.package.companyBrandingEnabled && <li className="mb-2"><i className="fa-solid fa-check text-success me-2"></i> Company Branding</li>}
                          {activeSub.package.verifiedRecruiterBadgeEnabled && <li className="mb-2"><i className="fa-solid fa-check text-success me-2"></i> Verified Recruiter Badge</li>}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="row mt-4">
            <div className="col-md-12">
              <div className="py-3 text-center text-muted small">
                &copy; {new Date().getFullYear()} JobStock. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
