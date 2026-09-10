"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar7 from "@/components/Navbar7";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
import UploadResumeModal from "@/components/candidate-dashboard/UploadResumeModal";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl } from "@/lib/api";
import { Toaster, toast } from "react-hot-toast";
import ResumePackageCheckoutModal from "@/components/candidate-dashboard/ResumePackageCheckoutModal";
import Swal from "sweetalert2";

interface Notification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

interface Application {
  id: string;
  jobId: string;
  status: string;
  appliedAt: string;
  job: {
    id: string;
    title: string;
    slug: string;
    location: string;
    employer: { companyName: string; logoUrl: string | null };
  };
}

interface JobMatch {
  matchScore: number;
  matchReasons: string[];
  job: {
    id: string;
    title: string;
    slug: string;
    location?: string;
    employer?: { companyName: string };
  };
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default function CandidateDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [recommended, setRecommended] = useState<JobMatch[] | null>(null);
  const [activePackage, setActivePackage] = useState<{ id: string; orderId: string; name: string; downloads: string; status?: string; refundRequested?: boolean; createdAt?: string; amountInPaisa?: number } | null>(null);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  
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
        const [notifs, apps, orders] = await Promise.all([
          api.get<Notification[]>("/notifications"),
          api.get<Application[]>("/applications/mine"),
          api.get<any[]>("/packages/orders/mine"),
        ]);
        setNotifications(notifs.slice(0, 5));
        setApplications(apps.slice(0, 10));

        const resumeOrder = orders.find((o) => (o.status === "PAID" || o.status === "REFUNDED" || o.status === "CANCELLED") && o.package?.audience === "RESUME");
        if (resumeOrder) {
          setActivePackage({
            id: resumeOrder.package.id,
            orderId: resumeOrder.id,
            name: resumeOrder.package.name,
            downloads: "Unlimited Downloads",
            status: resumeOrder.status,
            refundRequested: resumeOrder.refundRequested,
            createdAt: resumeOrder.createdAt,
            amountInPaisa: resumeOrder.amountInPaisa,
          });
        }
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to load dashboard data");
      } finally {
        setDataLoading(false);
      }
    })();

    // Independent of the main dashboard load — a candidate with an incomplete
    // profile (no headline/skills yet) gets a 400 here, which shouldn't block
    // the rest of the dashboard from rendering. Fails silently to an empty list.
    api
      .get<JobMatch[]>("/smart-match/jobs")
      .then((data) => setRecommended(data.slice(0, 3)))
      .catch(() => setRecommended([]));
  }, [user]);

  const handleRefundRequest = async () => {
    if (!refundReason) return toast.error("Reason is required");
    if (!activePackage?.orderId) return;
    try {
      await api.post(`/packages/orders/${activePackage.orderId}/request-refund`, { reason: refundReason });
      setShowRefundModal(false);
      await Swal.fire({
        icon: 'success',
        title: 'Refund Requested',
        text: 'Your refund request has been submitted successfully and will be processed soon.',
        confirmButtonColor: '#198754',
      });
      window.location.reload();
    } catch (err: any) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to request refund');
    }
  };

  if (loading || !user || user.role !== "CANDIDATE") {
    return null;
  }

  const appliedCount = applications.length;
  const shortlistedCount = applications.filter((a) => a.status === "SHORTLISTED" || a.status === "INTERVIEW" || a.status === "OFFERED").length;

  const ctrs = [
    { icon: "fa-solid fa-suitcase", glowColor: "#dcf4fa", iconColor: "#174742", iconBg: "#eef3f5", title: "Applied jobs", number: String(appliedCount) },
    { icon: "fa-regular fa-bookmark", glowColor: "#ffede8", iconColor: "#f76b59", iconBg: "#fcf0ed", title: "Shortlisted", number: String(shortlistedCount) },
    { icon: "fa-regular fa-bell", glowColor: "#ffe8eb", iconColor: "#d94348", iconBg: "#fcf0f2", title: "Notifications", number: String(notifications.length) },
    { icon: "fa-regular fa-comments", glowColor: "#dbfbf5", iconColor: "#134d42", iconBg: "#def5f0", title: "Total Applications", number: String(appliedCount) },
  ];

  return (
    <>
      <style jsx global>{`
        .dashboard-wrap {
          background-color: #f4f9f8 !important; /* Very light mint/grey */
        }
        .dashboard-tlbar h1 {
          color: #06312a !important; /* Dark teal */
          font-weight: 600 !important;
        }
        .breadcrumb-item a {
          color: #63857d !important;
        }
        .breadcrumb-item a.text-main {
          color: #429e85 !important;
        }
        .dash-wrap-bloud {
          background: #ffffff;
          border: 1px solid #e1e9e7;
          border-radius: 0.75rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .dash-wrap-bloud:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.04);
        }
        .dash-wrap-glow {
          position: absolute;
          top: -20px;
          right: -20px;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          filter: blur(35px);
          z-index: 0;
          opacity: 0.9;
        }
        .dash-wrap-bloud-icon, .dash-wrap-bloud-caption {
          position: relative;
          z-index: 1;
        }
        .bloud-icon {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
        }
        .dash-wrap-bloud-content h5 {
          font-size: 2rem;
          font-weight: 700;
          color: #0d362d;
          margin-bottom: 0.25rem;
          text-align: right;
        }
        .dash-wrap-bloud-content p {
          color: #63857d;
          font-size: 0.875rem;
          margin-bottom: 0;
          text-align: right;
          font-weight: 500;
        }
        .card {
          border: 1px solid #d0dad7 !important;
          border-radius: 0.75rem !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02) !important;
          overflow: hidden;
        }
        .card-header {
          background-color: #f2f6f5 !important;
          border-bottom: 1px solid #d0dad7 !important;
          padding: 1.25rem 1.5rem !important;
        }
        .card-header h4 {
          color: #11362e !important;
          font-weight: 600 !important;
          font-size: 1.1rem !important;
        }
        .card-header a {
          color: #3b8a74 !important;
          font-weight: 600 !important;
          text-decoration: none !important;
        }
      `}</style>
      <Navbar7 />
      <Toaster 
        position="top-center" 
        containerStyle={{
          top: '100px',
        }}
        toastOptions={{
          style: {
            padding: '16px 24px',
            fontSize: '1.1rem',
            fontWeight: '500',
            maxWidth: '600px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
          },
        }}
      />

      <div className="dashboard-wrap bg-light">
        <CandidateSidebar active="dashboard" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-5">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12 d-flex justify-content-between align-items-center">
                <div>
                  <h1 className="mb-2 fs-2 fw-bold" style={{ color: '#0d362d' }}>Candidate Dashboard</h1>
                  <nav aria-label="breadcrumb">
                    <ol className="breadcrumb mb-0" style={{ fontSize: '0.9rem' }}>
                      <li className="breadcrumb-item text-muted"><a href="#" className="text-decoration-none text-muted">Candidate</a></li>
                      <li className="breadcrumb-item text-muted"><a href="#" className="text-decoration-none text-muted">Dashboard</a></li>
                      <li className="breadcrumb-item"><a href="#" className="text-decoration-none fw-medium" style={{ color: '#44a388' }}>Candidate Statistics</a></li>
                    </ol>
                  </nav>
                </div>
                <a href="#" className="text-decoration-none fw-medium" style={{ color: '#117b5a' }} onClick={(e) => { e.preventDefault(); router.back(); }}>
                  <i className="fa-solid fa-arrow-left me-2"></i>Back
                </a>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">

            
            {/* Row Start */}
            <div className="row align-items-center gx-4 gy-4 mb-4">
              {ctrs.map((item, i) => (
                <div className="col-12 col-xl-3 col-lg-6 col-md-6 col-sm-6" key={i}>
                  <div className="dash-wrap-bloud">
                    <div className="dash-wrap-glow" style={{ background: item.glowColor }}></div>
                    <div className="dash-wrap-bloud-icon">
                      <div className="bloud-icon" style={{ backgroundColor: item.iconBg, color: item.iconColor }}>
                        <i className={item.icon}></i>
                      </div>
                    </div>
                    <div className="dash-wrap-bloud-caption">
                      <div className="dash-wrap-bloud-content">
                        <h5 className="ctr">{item.number}</h5>
                        <p>{item.title}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Row End */}

            {/* Row Start */}
            <div className="row gx-4 gy-4 mb-4">
              <div className="col-12 col-xl-8 col-lg-12 col-md-12 col-sm-12 d-flex flex-column gap-4">
                <div className="card mb-0">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">Recommended For You</h4>
                    <a href="/candidate-smart-match" className="small">
                      View all matches
                    </a>
                  </div>
                  <div className="card-body">
                    {recommended === null && <p className="text-muted mb-0 p-4 text-center">Finding jobs that fit your profile...</p>}
                    {recommended !== null && recommended.length === 0 && (
                      <div className="d-flex flex-column align-items-center justify-content-center py-5">
                        <div className="d-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: '80px', height: '80px', backgroundColor: '#f0f3f2' }}>
                          <i className="fa-solid fa-globe text-muted" style={{ fontSize: '2.2rem', opacity: 0.5 }}></i>
                        </div>
                        <p className="text-muted mb-0 text-center px-4" style={{ fontSize: '0.95rem', maxWidth: '600px', lineHeight: '1.6' }}>
                          No strong matches yet — add a headline and some skills to your{" "}
                          <a href="/candidate-profile" style={{ color: '#3b8a74', textDecoration: 'none' }}>profile</a> to get personalized recommendations.
                        </p>
                      </div>
                    )}
                    {recommended !== null && recommended.length > 0 && (
                      <div className="d-flex flex-column gap-3">
                        {recommended.map((m) => (
                          <a
                            key={m.job.id}
                            href={`/job-detail/${m.job.slug}`}
                            className="d-flex justify-content-between align-items-center border rounded p-4 text-decoration-none"
                            style={{ borderColor: '#d0dad7' }}
                          >
                            <div>
                              <div className="fw-medium text-dark fs-5 mb-1" style={{ color: '#1f2d2b' }}>{m.job.title}</div>
                              <div className="small text-muted">
                                {m.job.employer?.companyName ?? "—"} &middot; {m.job.location ?? "—"}
                              </div>
                            </div>
                            <span className="badge text-white" style={{ backgroundColor: '#117b5a', padding: '0.5rem 0.8rem', fontSize: '0.9rem', borderRadius: '0.35rem' }}>{m.matchScore}% Match</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="card mb-0">
                  <div className="card-header">
                    <h4 className="mb-0">Applied Jobs</h4>
                  </div>
                  <div className="card-body px-4 py-4">
                    {dataLoading && <p className="text-muted">Loading applied jobs...</p>}
                    {!dataLoading && applications.length === 0 && <p className="text-muted">You have not applied to any jobs yet.</p>}
                    <div className="d-flex flex-column gap-3">
                      {applications.map((item) => (
                        <div className="border rounded p-4" style={{ borderColor: '#d0dad7', backgroundColor: '#f6f8f8' }} key={item.id}>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                              <div className="border rounded d-flex align-items-center justify-content-center me-3 bg-white" style={{ width: '56px', height: '56px', borderColor: '#d0dad7' }}>
                                {item.job.employer.logoUrl ? (
                                  <img src={assetUrl(item.job.employer.logoUrl)} className="img-fluid" style={{ maxHeight: '40px' }} alt="" />
                                ) : (
                                  <i className="fa-solid fa-code text-muted fs-4"></i>
                                )}
                              </div>
                              <div>
                                <div className="mb-1">
                                  <span className="badge rounded-pill" style={{ backgroundColor: '#def2ec', color: '#136754', fontSize: '0.7rem', fontWeight: 'bold', padding: '0.35em 0.65em' }}>{item.status.toUpperCase()}</span>
                                </div>
                                <h5 className="mb-1">
                                  <a href={`/job-detail/${item.job.slug}`} className="text-dark text-decoration-none fw-medium" style={{ color: '#1a3630' }}>{item.job.title}</a>
                                </h5>
                                <div className="text-muted small d-flex align-items-center gap-3">
                                  <span><i className="fa-regular fa-building me-1"></i>{item.job.employer.companyName}</span>
                                  <span><i className="fa-solid fa-location-dot me-1"></i>{item.job.location}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <a href={`/job-detail/${item.job.slug}`} className="btn btn-sm" style={{ backgroundColor: '#e2e7e6', color: '#27403a', fontWeight: '500', padding: '0.5rem 1rem' }}>View Detail</a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              <div className="col-12 col-xl-4 col-lg-12 col-md-12 col-sm-12">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">Notifications</h4>
                    <i className="fa-solid fa-ellipsis text-muted"></i>
                  </div>

                  <div className="ground-list ground-list-hove p-0 m-0">
                    {dataLoading && <p className="p-3 text-muted">Loading...</p>}
                    {!dataLoading && notifications.length === 0 && <p className="p-3 text-muted">No notifications yet.</p>}
                    {notifications.map((n) => (
                        <a href="JavaScript:Void(0);" className="text-decoration-none border-bottom p-3 d-flex align-items-start" key={n.id} style={{ borderColor: '#e1e9e7' }}>
                          <div className={`btn-circle-40 text-${n.isRead ? "secondary" : "danger"} bg-${n.isRead ? "light" : "danger"} bg-opacity-10 me-3`} style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fas fa-bell"></i>
                          </div>
                          <div className="ground-content">
                            <h6 className="mb-1 text-dark fw-medium" style={{ fontSize: '0.95rem' }}>{n.title}</h6>
                            <div className="small text-muted mb-1" style={{ fontSize: '0.85rem' }}>{n.body || "Notification detail goes here..."}</div>
                            <span className="small text-muted" style={{ fontSize: '0.75rem' }}>
                              {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({timeAgo(n.createdAt)})
                            </span>
                          </div>
                        </a>
                      ))}
                  </div>
                  <div className="card-footer bg-white text-center py-3 border-top-0">
                    <a href="/candidate-notifications" className="fw-semibold text-decoration-none" style={{ color: '#3b8a74' }}>View all notifications</a>
                  </div>
                </div>

                <div className="card mt-4">
                  <div className="card-header">
                    <h4>Active Plan</h4>
                  </div>
                  <div className="card-body p-4">
                    {activePackage ? (
                      activePackage.status === "REFUNDED" ? (
                        <div>
                          <div className="alert alert-success d-flex align-items-center mb-3" role="alert">
                            <i className="fa-solid fa-circle-check fs-3 me-3 text-success"></i>
                            <div>
                              <h5 className="alert-heading mb-1 fw-bold">Refund Completed</h5>
                              <p className="mb-0 small">
                                Your <strong>{activePackage.name}</strong> package was refunded.
                                <br/>
                                Refund Amount: <strong>₹{(Math.floor((activePackage.amountInPaisa || 0) * 0.95) / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong>
                                <br/>
                                <span style={{ fontSize: "0.75rem" }}>(after 5% platform fee)</span>
                              </p>
                            </div>
                          </div>
                          <div className="text-center">
                            <button type="button" className="btn btn-sm btn-main" onClick={() => setShowPackageModal(true)}>
                              Purchase New Plan
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center justify-content-between">
                          <div>
                            <h5 className="fw-bold text-dark mb-1">{activePackage.name}</h5>
                            <span className="badge bg-success text-white">Active</span>
                            <div className="text-muted small mt-2">
                              <i className="fa-solid fa-check text-success me-2"></i>
                              {activePackage.downloads}
                            </div>
                          </div>
                          <div className="text-end">
                            <i className="fa-solid fa-award text-warning mb-2 d-block" style={{ fontSize: "2.5rem" }}></i>
                            <div className="d-flex flex-column gap-2">
                              {activePackage.name !== "Pro Resume" && (
                                <button className="btn btn-sm btn-outline-primary" onClick={() => setShowPackageModal(true)} disabled={activePackage.refundRequested}>
                                  Upgrade Plan
                                </button>
                              )}
                              <button
                                className={`btn btn-sm ${activePackage.refundRequested ? 'btn-secondary' : 'btn-outline-danger'}`}
                                onClick={() => setShowRefundModal(true)}
                                disabled={activePackage.refundRequested || (Date.now() - new Date(activePackage.createdAt || Date.now()).getTime() > 7 * 24 * 60 * 60 * 1000)}
                              >
                                {activePackage.refundRequested ? "Refund Requested" : "Request for Refund"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="text-center">
                        <p className="text-muted mb-3">Upgrade your account to unlock premium templates and unlimited PDF downloads.</p>
                        <button type="button" className="btn btn-sm btn-main" onClick={() => setShowPackageModal(true)}>
                          View Plans
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Row End */}

          </div>

          {/* footer removed */}

        </div>

      </div>

      <UploadResumeModal />
      <ResumePackageCheckoutModal
        show={showPackageModal}
        onClose={() => setShowPackageModal(false)}
        activePackageId={activePackage?.id}
        title="Upgrade Your Plan"
        description="Choose a higher tier to unlock more features."
        onSuccess={() => {
          setShowPackageModal(false);
          // Reload page to reflect new active plan
          window.location.reload();
        }}
      />

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-white border-bottom">
                <h5 className="modal-title fw-bold">Request Refund</h5>
                <button type="button" className="btn-close" onClick={() => setShowRefundModal(false)}></button>
              </div>
              <div className="modal-body">
                <p className="small text-muted mb-3">Please let us know why you are requesting a refund. Refunds are only available within 7 days of purchase.</p>
                <textarea 
                  className="form-control" 
                  rows={3} 
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Enter reason here..."
                ></textarea>
              </div>
              <div className="modal-footer border-top-0">
                <button type="button" className="btn btn-light" onClick={() => setShowRefundModal(false)}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={handleRefundRequest}>Submit Request</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
