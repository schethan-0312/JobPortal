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
  const [refunding, setRefunding] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [now, setNow] = useState(new Date());

  const handleRefund = async () => {
    setRefunding(true);
    try {
      const res = await api.post<{success: boolean, refundAmountInPaisa: number, message: string}>("/packages/refund-active", {});
      toast.success(`Refund of ₹${res.refundAmountInPaisa / 100} processed successfully!`);
      // Reload active sub (it should become null or show expired)
      const sub = await api.get<ActiveSubscription | null>("/packages/active-subscription");
      setActiveSub(sub);
      setShowRefundModal(false);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("An error occurred while processing refund.");
      }
    } finally {
      setRefunding(false);
    }
  };

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

  let estimatedRefund = 0;
  let isRefundEligible = false;
  let hasUsage = false;
  if (activeSub) {
    const startedAt = new Date(activeSub.startedAt);
    const diffTime = Math.abs(now.getTime() - startedAt.getTime());
    const daysUsed = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    let totalPackageDays = 30;
    if (activeSub.package.durationType === 'DAYS') totalPackageDays = activeSub.package.duration;
    if (activeSub.package.durationType === 'MONTHS') totalPackageDays = activeSub.package.duration * 30;
    if (activeSub.package.durationType === 'YEARS') totalPackageDays = activeSub.package.duration * 365;

    hasUsage = (activeSub.jobPostsUsed || 0) > 0 || (activeSub.applicantsViewed || 0) > 0 || (activeSub.jobSeekersViewed || 0) > 0;

    if (!hasUsage) {
      estimatedRefund = activeSub.package.priceInPaisa / 100;
    } else {
      const costPerDay = activeSub.package.priceInPaisa / totalPackageDays;
      const deduction = Math.round(costPerDay * daysUsed);
      estimatedRefund = Math.max(0, (activeSub.package.priceInPaisa - deduction) / 100);
    }

    // Eligible if within 7 days
    if (diffTime <= 7 * 24 * 60 * 60 * 1000) {
      isRefundEligible = true;
    }
  }

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
      <style dangerouslySetInnerHTML={{ __html: `
        .active-dashboard-card {
          border-radius: 1.25rem;
          border: 1px solid rgba(0,0,0,0.05) !important;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03) !important;
        }
        .active-dashboard-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.08) !important;
        }
        .progress {
          border-radius: 1rem;
          background-color: #f1f5f9;
          overflow: hidden;
        }
        .progress-bar {
          border-radius: 1rem;
          transition: width 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .progress-bar.bg-primary {
          background: linear-gradient(90deg, #0b8260, #13b386) !important;
        }
        .progress-bar.bg-warning {
          background: linear-gradient(90deg, #f59e0b, #fbbf24) !important;
        }
        .progress-bar.bg-success {
          background: linear-gradient(90deg, #10b981, #34d399) !important;
        }
        .icon-circle {
          width: 70px; 
          height: 70px; 
          font-size: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: linear-gradient(135deg, #e0f2ec 0%, #ffffff 100%);
          color: #0b8260;
          box-shadow: 0 8px 16px rgba(11, 130, 96, 0.1);
          border: 1px solid rgba(11,130,96,0.1);
          margin-bottom: 1rem;
        }
        .list-group-custom .list-group-item {
          border-color: rgba(0,0,0,0.04);
          padding: 1rem 1.25rem;
          transition: background 0.2s;
        }
        .list-group-custom .list-group-item:hover {
          background-color: #f8fafc;
        }
      `}} />
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
                  <div className="card active-dashboard-card bg-white h-100">
                    <div className="card-header bg-white py-4 border-bottom d-flex justify-content-between align-items-center">
                      <h5 className="mb-0 fw-bold">Current Plan Details</h5>
                      <span className={`badge rounded-pill px-3 py-2 ${activeSub.status === 'ACTIVE' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'}`}>
                        {activeSub.status}
                      </span>
                    </div>
                    <div className="card-body p-4 p-xl-5">
                      <div className="d-flex flex-wrap align-items-center justify-content-between border-bottom pb-4 mb-4 gap-3">
                        <div>
                          <h2 className="fw-bolder text-dark mb-1 display-6">{activeSub.package.name}</h2>
                          <p className="text-muted mb-0">Active since {new Date(activeSub.startedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-md-end">
                          <h3 className="fw-bold text-main mb-0" style={{ color: '#0b8260' }}>
                            {(activeSub.package.priceInPaisa / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                          </h3>
                          <p className="text-muted mb-0 fw-medium">per {activeSub.package.duration} {activeSub.package.durationType.toLowerCase()}</p>
                        </div>
                      </div>

                      <h5 className="fw-bold mb-4">Usage Statistics</h5>
                      
                      {renderProgressBar(activeSub.jobPostsUsed || 0, activeSub.package.postJobLimit, "Jobs Posted")}
                      {renderProgressBar(activeSub.applicantsViewed || 0, activeSub.package.applicantViewLimit, "Applicants Viewed")}
                      {renderProgressBar(activeSub.jobSeekersViewed || 0, activeSub.package.jobSeekerViewLimit, "Job Seeker Profiles Searched")}

                      <div className="mt-5">
                        <button className="btn btn-main px-4 py-2 fw-medium shadow-sm" onClick={() => router.push("/employer-package")}>
                          <i className="fa-solid fa-arrow-up-right-dots me-2"></i>Upgrade Package
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xl-4 col-lg-5">
                  <div className="card active-dashboard-card bg-white h-100">
                    <div className="card-header bg-white py-4 border-bottom">
                      <h5 className="mb-0 fw-bold">Subscription Status</h5>
                    </div>
                    <div className="card-body p-4 p-xl-5">
                      <div className="text-center mb-4">
                        <div className="icon-circle">
                          <i className="fa-regular fa-clock"></i>
                        </div>
                        <h6 className="text-muted mb-1 text-uppercase small fw-bold tracking-wider">Time Remaining</h6>
                        <h4 className="fw-bolder text-dark mb-0">
                          {activeSub.expiresAt ? getRemainingTime(activeSub.expiresAt) : "Unlimited"}
                        </h4>
                      </div>

                      <ul className="list-group list-group-flush list-group-custom rounded shadow-sm border mt-4">
                        <li className="list-group-item d-flex justify-content-between align-items-center">
                          <span className="text-muted fw-medium small">Started On</span>
                          <span className="fw-bold small text-dark">{new Date(activeSub.startedAt).toLocaleDateString()}</span>
                        </li>
                        <li className="list-group-item d-flex justify-content-between align-items-center">
                          <span className="text-muted fw-medium small">Expires On</span>
                          <span className="fw-bold small text-dark">{activeSub.expiresAt ? new Date(activeSub.expiresAt).toLocaleDateString() : "N/A"}</span>
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
                      
                      <div className="mt-4 pt-4 border-top text-center">
                        <button 
                          className="btn btn-outline-danger btn-sm w-100" 
                          onClick={() => setShowRefundModal(true)}
                          disabled={refunding || !isRefundEligible}
                        >
                          Cancel & Refund Package
                        </button>
                        <p className="text-muted small mt-2 mb-0" style={{ fontSize: "11px" }}>
                          You can cancel or refund a package within 7 days of purchase. After 7 days, you cannot cancel or refund your amount.
                        </p>
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

      {/* Custom Refund Confirmation Modal */}
      {showRefundModal && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
          <div className="modal fade show d-block" tabIndex={-1} style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header bg-danger text-white border-0">
                  <h5 className="modal-title">Confirm Cancellation</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => !refunding && setShowRefundModal(false)}></button>
                </div>
                <div className="modal-body p-4 text-center">
                  <div className="text-warning mb-3" style={{ fontSize: "40px" }}>
                    <i className="fa-regular fa-circle-question"></i>
                  </div>
                  <h5 className="fw-bold mb-3">Are you sure you want to cancel?</h5>
                  <p className="text-muted mb-3">
                    Your estimated refund is <strong>{estimatedRefund.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</strong>
                    {!hasUsage ? " (full refund since no features were used)." : " (calculated based on unused time)."}
                  </p>
                  <p className="text-muted mb-0 small">
                    <i className="fa-solid fa-circle-info me-1"></i>
                    You will receive this amount in your original payment method within <strong>5 to 7 working days</strong>.
                    <br/><br/>
                    <strong className="text-danger">You will lose access to all premium features immediately upon cancellation.</strong>
                  </p>
                </div>
                <div className="modal-footer border-0 justify-content-center pb-4">
                  <button type="button" className="btn btn-light px-4" onClick={() => setShowRefundModal(false)} disabled={refunding}>
                    Keep My Package
                  </button>
                  <button type="button" className="btn btn-danger px-4" onClick={handleRefund} disabled={refunding}>
                    {refunding ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Processing...
                      </>
                    ) : (
                      "Yes, Cancel & Refund"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
