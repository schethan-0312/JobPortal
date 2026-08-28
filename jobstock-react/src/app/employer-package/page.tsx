"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar8 from "@/components/Navbar8";
import EmployerSidebar from "@/components/employer-dashboard/EmployerSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { Toaster, toast } from "react-hot-toast";
import confetti from "canvas-confetti";

interface Package {
  id: string;
  audience: string;
  name: string;
  priceInPaisa: number;
  durationType: "DAYS" | "MONTHS" | "YEARS";
  duration: number;
  postJobLimit: number;
  applicantViewLimit: number;
  jobSeekerViewLimit: number;
  chatEnabled: boolean;
  filterShortlistEnabled: boolean;
  scheduleInterviewsEnabled: boolean;
  companyBrandingEnabled: boolean;
  verifiedRecruiterBadgeEnabled: boolean;
  isActive: boolean;
}

interface Order {
  id: string;
  status: string;
  packageId: string;
}

interface RazorpayOrderResponse {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface ActiveSubscription {
  id: string;
  packageId: string;
  status: string;
  startedAt: string;
  expiresAt: string;
}

export default function EmployerPackagePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [packages, setPackages] = useState<Package[]>([]);
  const [activeSub, setActiveSub] = useState<ActiveSubscription | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);

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
        const sub = await api.get<ActiveSubscription | null>("/packages/active-subscription").catch(() => null);
        setActiveSub(sub);

        let list = await api.get<Package[]>("/packages?audience=EMPLOYER");
        if (!list || list.length === 0) {
          list = await api.get<Package[]>("/packages");
        }
        setPackages(list || []);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to load packages");
      } finally {
        setDataLoading(false);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (activeSub?.status === 'ACTIVE') {
      const hasShown = sessionStorage.getItem('activePackageToastShown');
      if (!hasShown) {
        toast("You have an active package. You can upgrade to a higher tier plan at any time.", {
          duration: 10000,
          icon: 'ℹ️',
        });
        sessionStorage.setItem('activePackageToastShown', 'true');
      }
    }
  }, [activeSub]);

  async function handleBuy(pkg: Package) {
    if (activeSub && activeSub.status === 'ACTIVE') {
      const currentPackage = packages.find(p => p.id === activeSub.packageId);
      if (currentPackage && pkg.priceInPaisa <= currentPackage.priceInPaisa) {
        toast.error("You can only upgrade to a higher tier package.");
        return;
      }
    }
    setBuyingId(pkg.id);
    try {
      const order = await api.post<Order>("/packages/orders", { packageId: pkg.id });

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Could not load the payment widget. Please check your connection and try again.");
        setBuyingId(null);
        return;
      }

      const rpOrder = await api.post<RazorpayOrderResponse>(`/packages/orders/${order.id}/razorpay-order`);

      const razorpay = new window.Razorpay({
        key: rpOrder.keyId,
        amount: rpOrder.amount,
        currency: rpOrder.currency,
        order_id: rpOrder.razorpayOrderId,
        name: "JobStock",
        description: `${pkg.name} package`,
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            await api.post(`/packages/orders/${order.id}/verify-razorpay`, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 }
            });
            toast.success(`Payment successful — "${pkg.name}" package activated!`, { duration: 5000 });
            setTimeout(() => {
              router.push('/employer-active-package');
            }, 3000);
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Payment verification failed");
          } finally {
            setBuyingId(null);
          }
        },
        modal: {
          ondismiss: () => setBuyingId(null),
        },
        theme: { color: "#0b8260" },
      });
      razorpay.open();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to start checkout");
      setBuyingId(null);
    }
  }

  if (loading || !user || user.role !== "EMPLOYER") {
    return null;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        .pricing-section {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        
        .package-card-hover {
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease, border-color 0.4s ease;
          border-radius: 1.5rem;
          border: 1px solid rgba(0,0,0,0.08) !important;
          background: #ffffff;
          overflow: visible;
          position: relative;
          z-index: 1;
        }
        .package-card-hover::before {
          content: "";
          position: absolute;
          top: -1px; left: -1px; right: -1px; height: 6px;
          border-top-left-radius: 1.5rem;
          border-top-right-radius: 1.5rem;
          background: linear-gradient(90deg, #0b8260, #13b386);
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 0;
        }
        .package-card-hover:hover {
          transform: translateY(-15px) scale(1.02);
          box-shadow: 0 30px 60px rgba(11, 130, 96, 0.15) !important;
          border-color: rgba(11, 130, 96, 0.3) !important;
          z-index: 10;
        }
        .package-card-hover:hover::before {
          opacity: 1;
        }
        
        .feature-icon-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(11, 130, 96, 0.1);
          color: #0b8260;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .btn-buy-now {
          background: #0b8260;
          color: white;
          border: none;
          transition: all 0.3s ease;
          box-shadow: 0 4px 14px rgba(11, 130, 96, 0.25);
        }
        .btn-buy-now:hover {
          background: #09684d;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(11, 130, 96, 0.35);
        }
      `}} />
      
      <Toaster position="top-right" />
      <Navbar8 />

      <div className="dashboard-wrap bg-light">
        <EmployerSidebar active="package" />
        
        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-5">
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-bold text-dark pricing-section">Recruiter Subscriptions</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Employer</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-primary fw-medium">Packages</a></li>
                  </ol>
                </nav>
                <p className="text-muted mt-2 fs-6">Upgrade your recruiting potential with our specialized plans tailored for businesses of all sizes.</p>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block pricing-section">
            {dataLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted mt-3 fw-medium">Loading packages...</p>
              </div>
            ) : packages.length === 0 ? (
              <div className="text-center py-5 bg-white rounded shadow-sm border">
                <i className="fa-solid fa-box-open text-muted fs-1 mb-3"></i>
                <p className="text-muted fs-5 fw-medium">No packages available at the moment.</p>
              </div>
            ) : (
              <div className="row g-4 justify-content-center align-items-stretch">
                {packages.map((pkg) => {
                  const isCurrent = activeSub?.status === 'ACTIVE' && activeSub.packageId === pkg.id;
                  let upgradeStatus = "";
                  
                  if (activeSub && activeSub.status === 'ACTIVE') {
                    const currentPkg = packages.find(p => p.id === activeSub.packageId);
                    if (currentPkg) {
                      if (pkg.id === activeSub.packageId) {
                        upgradeStatus = "CURRENT";
                      } else if (pkg.priceInPaisa > currentPkg.priceInPaisa) {
                        upgradeStatus = "UPGRADE";
                      } else {
                        upgradeStatus = "DOWNGRADE";
                      }
                    }
                  }
                  const isPopular = pkg.name.toLowerCase().includes('pro');

                  return (
                    <div className="col-xl-4 col-lg-6 col-md-12 d-flex" key={pkg.id}>
                      <div className="card package-card-hover shadow-sm w-100 d-flex flex-column" style={isCurrent ? { borderColor: '#0b8260', borderWidth: '2px', backgroundColor: '#f4fcf9' } : {}}>
                        
                        {isPopular && !isCurrent && (
                          <div className="position-absolute top-0 start-50 translate-middle-x bg-warning text-dark px-3 py-1 fw-bold small rounded-bottom shadow-sm" style={{ zIndex: 5, fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                            <i className="fa-solid fa-star me-1"></i> MOST POPULAR
                          </div>
                        )}

                        <div className="card-body p-4 p-xl-5 d-flex flex-column h-100" style={{ position: 'relative', zIndex: 2 }}>
                          {isCurrent && (
                            <div className="position-absolute top-0 end-0 text-white px-3 py-1 fw-bold small shadow-sm" style={{ borderBottomLeftRadius: '1rem', borderTopRightRadius: '1.25rem', backgroundColor: '#0b8260' }}>
                              Current Plan
                            </div>
                          )}
                          
                          <div className="mb-4 mt-2">
                            <span className="badge bg-light text-primary border border-primary-subtle px-3 py-2 rounded-pill fw-bold mb-3 shadow-sm d-inline-flex align-items-center gap-2">
                              <i className="fa-regular fa-clock"></i> 
                              {pkg.duration} {pkg.durationType}
                            </span>
                            <h3 className="card-title fw-bolder text-dark mb-1 fs-4">{pkg.name}</h3>
                          </div>
                          
                          <div className="mb-4 pb-4 border-bottom position-relative">
                            <div className="d-flex align-items-start">
                              <span className="fs-5 fw-bold text-dark mt-1 me-1">₹</span>
                              <span className="display-4 fw-bolder text-dark lh-1" style={{ letterSpacing: '-1px' }}>
                                {(pkg.priceInPaisa / 100).toLocaleString("en-IN")}
                              </span>
                            </div>
                            <p className="text-muted small mt-2 mb-0">Billed once for {pkg.duration} {pkg.durationType.toLowerCase()}</p>
                          </div>

                          <div className="package-descr mt-2 mb-4 flex-grow-1" style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
                            <p className="text-sm-muted mb-3 d-flex align-items-start gap-2 text-break fw-medium" style={{ color: '#4a5568', fontSize: '0.95rem' }}>
                              <span className="feature-icon-wrapper" style={{ width: '22px', height: '22px' }}>
                                <i className="fa-solid fa-briefcase" style={{ fontSize: '0.7rem' }}></i>
                              </span>
                              <span style={{ minWidth: 0, paddingTop: '1px' }}>
                                <strong>{pkg.postJobLimit === 999999 ? "Unlimited" : pkg.postJobLimit}</strong> Job Postings
                              </span>
                            </p>
                            <p className="text-sm-muted mb-3 d-flex align-items-start gap-2 text-break fw-medium" style={{ color: '#4a5568', fontSize: '0.95rem' }}>
                              <span className="feature-icon-wrapper" style={{ width: '22px', height: '22px' }}>
                                <i className="fa-solid fa-users-viewfinder" style={{ fontSize: '0.7rem' }}></i>
                              </span>
                              <span style={{ minWidth: 0, paddingTop: '1px' }}>
                                <strong>{pkg.applicantViewLimit === 999999 ? "Unlimited" : pkg.applicantViewLimit}</strong> Applicant Views
                              </span>
                            </p>
                            <p className="text-sm-muted mb-3 d-flex align-items-start gap-2 text-break fw-medium" style={{ color: '#4a5568', fontSize: '0.95rem' }}>
                              <span className="feature-icon-wrapper" style={{ width: '22px', height: '22px' }}>
                                <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '0.7rem' }}></i>
                              </span>
                              <span style={{ minWidth: 0, paddingTop: '1px' }}>
                                <strong>{pkg.jobSeekerViewLimit === 999999 ? "Unlimited" : pkg.jobSeekerViewLimit}</strong> Profile Searches
                              </span>
                            </p>
                            
                            {pkg.chatEnabled && (
                              <p className="text-sm-muted mb-3 d-flex align-items-start gap-2 text-break fw-medium" style={{ color: '#4a5568', fontSize: '0.95rem' }}>
                                <span className="feature-icon-wrapper" style={{ width: '22px', height: '22px' }}>
                                  <i className="fa-solid fa-check" style={{ fontSize: '0.7rem' }}></i>
                                </span>
                                <span style={{ minWidth: 0, paddingTop: '1px' }}>In-App Chat Messaging</span>
                              </p>
                            )}
                            {pkg.filterShortlistEnabled && (
                              <p className="text-sm-muted mb-3 d-flex align-items-start gap-2 text-break fw-medium" style={{ color: '#4a5568', fontSize: '0.95rem' }}>
                                <span className="feature-icon-wrapper" style={{ width: '22px', height: '22px' }}>
                                  <i className="fa-solid fa-check" style={{ fontSize: '0.7rem' }}></i>
                                </span>
                                <span style={{ minWidth: 0, paddingTop: '1px' }}>Advanced Filter & Shortlist</span>
                              </p>
                            )}
                            {pkg.scheduleInterviewsEnabled && (
                              <p className="text-sm-muted mb-3 d-flex align-items-start gap-2 text-break fw-medium" style={{ color: '#4a5568', fontSize: '0.95rem' }}>
                                <span className="feature-icon-wrapper" style={{ width: '22px', height: '22px' }}>
                                  <i className="fa-solid fa-check" style={{ fontSize: '0.7rem' }}></i>
                                </span>
                                <span style={{ minWidth: 0, paddingTop: '1px' }}>Schedule Interviews</span>
                              </p>
                            )}
                            {pkg.companyBrandingEnabled && (
                              <p className="text-sm-muted mb-3 d-flex align-items-start gap-2 text-break fw-medium" style={{ color: '#4a5568', fontSize: '0.95rem' }}>
                                <span className="feature-icon-wrapper" style={{ width: '22px', height: '22px' }}>
                                  <i className="fa-solid fa-check" style={{ fontSize: '0.7rem' }}></i>
                                </span>
                                <span style={{ minWidth: 0, paddingTop: '1px' }}>Premium Company Branding</span>
                              </p>
                            )}
                            {pkg.verifiedRecruiterBadgeEnabled && (
                              <p className="text-sm-muted mb-3 d-flex align-items-start gap-2 text-break fw-medium" style={{ color: '#4a5568', fontSize: '0.95rem' }}>
                                <span className="feature-icon-wrapper" style={{ width: '22px', height: '22px' }}>
                                  <i className="fa-solid fa-check" style={{ fontSize: '0.7rem' }}></i>
                                </span>
                                <span style={{ minWidth: 0, paddingTop: '1px' }}>Verified Recruiter Badge</span>
                              </p>
                            )}
                          </div>

                          <div className="mt-auto">
                            {isCurrent ? (
                              <button className="btn btn-outline-success w-100 py-3 fw-bold rounded-pill" disabled>
                                <i className="fa-solid fa-circle-check me-2"></i> Current Plan
                              </button>
                            ) : upgradeStatus === "DOWNGRADE" ? (
                              <button className="btn btn-outline-secondary w-100 py-3 fw-bold rounded-pill" disabled title="You cannot downgrade your current plan">
                                Not Available
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleBuy(pkg)} 
                                disabled={buyingId === pkg.id || !pkg.isActive} 
                                className="btn btn-buy-now w-100 py-3 fw-bold rounded-pill fs-6"
                              >
                                {buyingId === pkg.id ? (
                                  <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Processing...</>
                                ) : (
                                  upgradeStatus === "UPGRADE" ? "Upgrade Plan" : "Choose Plan"
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
