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
  featuresJson: Record<string, unknown>;
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

  function renderFeatures(featuresJson: unknown) {
    if (!featuresJson) return <span className="text-muted small">—</span>;

    let items: string[] = [];

    if (Array.isArray(featuresJson)) {
      items = featuresJson.map((f) => String(f));
    } else if (typeof featuresJson === "object" && featuresJson !== null) {
      items = Object.entries(featuresJson).map(([k, v]) =>
        !isNaN(Number(k)) ? String(v) : `${k}: ${String(v)}`
      );
    } else if (typeof featuresJson === "string") {
      items = [featuresJson];
    }

    if (items.length === 0) return <span className="text-muted small">—</span>;

    return (
      <div className="package-descr mt-3" style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
        {items.map((feat, idx) => (
          <p className="text-sm-muted mb-2 d-flex align-items-start gap-2 text-break fw-medium" key={idx} style={{ color: '#4a5568', fontSize: '0.9rem' }}>
            <span className="feature-icon-wrapper" style={{ width: '20px', height: '20px' }}>
              <i className="fa-solid fa-check" style={{ fontSize: '0.65rem' }}></i>
            </span>
            <span style={{ minWidth: 0, paddingTop: '1px' }}>{feat}</span>
          </p>
        ))}
      </div>
    );
  }

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
            // Clear static success message
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        .pricing-section {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        
        .package-card-hover {
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border-radius: 1.5rem;
          border: 1px solid rgba(0,0,0,0.05) !important;
          background: #ffffff;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }
        .package-card-hover::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0; height: 5px;
          background: linear-gradient(90deg, #0b8260, #13b386);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .package-card-hover:hover {
          transform: translateY(-12px);
          box-shadow: 0 20px 40px rgba(11, 130, 96, 0.12) !important;
          border-color: rgba(11, 130, 96, 0.2) !important;
        }
        .package-card-hover:hover::before {
          opacity: 1;
        }
        
        .feature-icon-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: rgba(11, 130, 96, 0.1);
          color: #0b8260;
          margin-top: 2px;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }
        .package-card-hover:hover .feature-icon-wrapper {
          background: #0b8260;
          color: #ffffff;
        }
        
        .package-price {
          font-size: 2rem;
          font-weight: 800;
          color: #1a1a1a;
          letter-spacing: -0.02em;
        }
        
        .package-price span {
          font-size: 0.85rem;
          font-weight: 500;
          color: #6c757d;
          letter-spacing: normal;
        }
        
        .btn-buy-now {
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          z-index: 1;
        }
        .btn-buy-now::after {
          content: "";
          position: absolute;
          bottom: 0; left: 0; width: 100%; height: 100%;
          background-color: rgba(255,255,255,0.15);
          z-index: -1;
          transform: scale(0);
          transform-origin: center;
          transition: transform 0.3s ease;
          border-radius: 50px;
        }
        .btn-buy-now:hover::after {
          transform: scale(2);
        }
        
        .badge-current {
          background: linear-gradient(135deg, #0b8260 0%, #13b386 100%);
          color: white !important;
          box-shadow: 0 4px 10px rgba(11,130,96,0.3);
        }
      `}</style>
      <Navbar8 />
      <Toaster 
        position="top-center" 
        containerStyle={{
          top: '100px', // Offset from the navbar
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
        <EmployerSidebar active="package" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">My Package</h1>
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
                        My Package
                      </a>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">

            
            {/* Header Wrap */}
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                <div className="card border-0 bg-transparent">
                  <div className="card-header">
                    <h6 className="mb-0">Available Packages</h6>
                  </div>
                  <div className="card-body">
                    {dataLoading && <p className="text-muted">Loading packages...</p>}
                    {!dataLoading && packages.length === 0 && <p className="text-muted">No packages available right now.</p>}
                    {!dataLoading && packages.length > 0 && (
                      <div className="row g-4 pricing-section">
                        {packages.map((item) => (
                          <div className="col-xl-4 col-lg-6 col-md-6" key={item.id}>
                            <div className="card h-100 border-0 shadow-sm package-card-hover bg-white">
                              <div className="card-body p-3 d-flex flex-column justify-content-between">
                                <div>
                                  <div className="d-flex justify-content-between align-items-center mb-3">
                                    <span className="badge bg-light text-main px-3 py-1 fw-semibold rounded-pill border border-light-subtle">
                                      <i className="fa-solid fa-layer-group me-1"></i>
                                      {item.audience || "EMPLOYER"}
                                    </span>
                                    {activeSub?.packageId === item.id && activeSub?.status === 'ACTIVE' && (
                                      <span className="badge badge-current px-3 py-1 rounded-pill fw-semibold border-0">
                                        <i className="fa-solid fa-star me-1 text-warning"></i> Current Plan
                                      </span>
                                    )}
                                  </div>
                                  <h5 className="card-title fw-bolder mb-2 text-dark fs-5" style={{ letterSpacing: '-0.01em' }}>
                                    {item.name}
                                  </h5>
                                  <div className="package-price mb-3">
                                    {(item.priceInPaisa / 100).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
                                    <span className="ms-1">/ lifetime</span>
                                  </div>
                                  
                                  <hr className="text-muted opacity-25 mb-3" />
                                  
                                  <div className="mb-2">
                                    <h6 className="fw-bold mb-2" style={{ color: '#1a1a1a', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Core Features</h6>
                                    {renderFeatures(item.featuresJson)}
                                  </div>
                                </div>
                                <div className="pt-3 mt-2">
                                  {(() => {
                                    const currentPackage = packages.find(p => p.id === activeSub?.packageId);
                                    const isCurrent = activeSub?.status === 'ACTIVE' && activeSub.packageId === item.id;
                                    const isLowerOrEqual = activeSub?.status === 'ACTIVE' && currentPackage && item.priceInPaisa <= currentPackage.priceInPaisa;
                                    const isUpgrade = activeSub?.status === 'ACTIVE' && currentPackage && item.priceInPaisa > currentPackage.priceInPaisa;
                                    
                                    let btnText = "Choose Plan";
                                    let btnIcon = "fa-solid fa-arrow-right";
                                    if (isCurrent) { btnText = "Active Package"; btnIcon = "fa-solid fa-circle-check"; }
                                    else if (buyingId === item.id) { btnText = "Processing..."; btnIcon = "fa-solid fa-spinner fa-spin"; }
                                    else if (isUpgrade) { btnText = "Upgrade Now"; btnIcon = "fa-solid fa-rocket"; }
                                    else if (isLowerOrEqual) { btnText = "Unavailable"; btnIcon = "fa-solid fa-ban"; }

                                    return (
                                      <button
                                        type="button"
                                        className={`btn w-100 py-2 fw-bold rounded-pill shadow-sm btn-buy-now d-flex justify-content-center align-items-center gap-2 ${isCurrent ? 'btn-light text-success border-success' : isLowerOrEqual ? 'btn-light text-muted' : 'btn-main'}`}
                                        disabled={buyingId === item.id}
                                        onClick={() => {
                                          if (isCurrent) {
                                            toast("You are currently on this plan.", { icon: '✅' });
                                          } else if (isLowerOrEqual) {
                                            toast("This package you taken now its not available.", { icon: '🚫' });
                                          } else {
                                            handleBuy(item);
                                          }
                                        }}
                                      >
                                        <span>{btnText}</span>
                                        <i className={btnIcon}></i>
                                      </button>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Header Wrap */}
          </div>

          {/* footer removed */}
        </div>
      </div>
    </>
  );
}
