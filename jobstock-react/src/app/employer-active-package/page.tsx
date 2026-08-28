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
  featuresJson: Record<string, unknown>;
}

interface ActiveSubscription {
  id: string;
  packageId: string;
  package: Package;
  status: string;
  startedAt: string;
  expiresAt: string | null;
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

  function getDurationText(featuresJson: unknown) {
    if (!featuresJson) return "Unknown";
    let meta: any = null;
    if (typeof featuresJson === "object" && featuresJson !== null && !Array.isArray(featuresJson)) {
      meta = featuresJson;
    } else if (typeof featuresJson === "string") {
      try { meta = JSON.parse(featuresJson); } catch {}
    }
    if (meta && meta.duration && meta.durationType) {
      return `${meta.duration} ${meta.durationType}`;
    }
    return "Unknown";
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

  return (
    <>
      <Navbar8 />
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
        <EmployerSidebar active="active-package" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Active Package</h1>
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
                        Active Package
                      </a>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
                        
            {dataLoading ? (
              <p className="text-muted">Loading your active package...</p>
            ) : !activeSub || activeSub.status !== 'ACTIVE' ? (
              <div className="card text-center p-5">
                <div className="card-body">
                  <div className="mb-4 text-muted">
                    <i className="fa-solid fa-box-open fa-4x"></i>
                  </div>
                  <h4 className="fw-bold mb-3">No Active Package</h4>
                  <p className="text-muted mb-4">You do not have any active package at the moment.</p>
                  <button className="btn btn-main" onClick={() => router.push('/employer-package')}>
                    Browse Packages
                  </button>
                </div>
              </div>
            ) : (
              <div className="row">
                <div className="col-lg-8 col-md-10 col-sm-12">
                  <div className="card shadow-sm border-0">
                    <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                      <h5 className="mb-0 fw-bold text-dark">Your Subscription Details</h5>
                      <span className="badge bg-success px-3 py-2 fs-6 rounded-pill">Active</span>
                    </div>
                    <div className="card-body p-4">
                      <div className="row mb-4">
                        <div className="col-md-6">
                          <p className="text-muted mb-1 small">Package Name</p>
                          <h4 className="fw-bold text-dark mb-0">{activeSub.package?.name}</h4>
                        </div>
                        <div className="col-md-6 text-md-end mt-3 mt-md-0">
                          <p className="text-muted mb-1 small">Package Price</p>
                          <h4 className="fw-bold text-main mb-0">
                            {((activeSub.package?.priceInPaisa || 0) / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                          </h4>
                        </div>
                      </div>

                      <div className="bg-light rounded p-4 mb-4">
                        <div className="row g-4">
                          <div className="col-md-4 col-sm-6">
                            <div className="d-flex flex-column">
                              <span className="text-muted small mb-1">Duration</span>
                              <span className="fw-semibold text-dark">
                                {getDurationText(activeSub.package?.featuresJson)}
                              </span>
                            </div>
                          </div>
                          <div className="col-md-4 col-sm-6">
                            <div className="d-flex flex-column">
                              <span className="text-muted small mb-1">Started</span>
                              <span className="fw-semibold text-dark">
                                {new Date(activeSub.startedAt).toLocaleString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="col-md-4 col-sm-6">
                            <div className="d-flex flex-column">
                              <span className="text-muted small mb-1">Ends</span>
                              <span className="fw-semibold text-dark">
                                {activeSub.expiresAt ? new Date(activeSub.expiresAt).toLocaleString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true
                                }) : "Never"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-3 p-3 border rounded border-warning bg-warning bg-opacity-10">
                        <div className="text-warning fs-3">
                          <i className="fa-regular fa-clock"></i>
                        </div>
                        <div>
                          <p className="mb-0 text-dark fw-medium">Remaining Time</p>
                          <h5 className="mb-0 fw-bold text-warning">
                            {activeSub.expiresAt ? getRemainingTime(activeSub.expiresAt) : "Unlimited"}
                          </h5>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* footer removed */}
        </div>
      </div>
    </>
  );
}
