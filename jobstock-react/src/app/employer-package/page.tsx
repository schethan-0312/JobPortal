"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar8 from "@/components/Navbar8";
import EmployerSidebar from "@/components/employer-dashboard/EmployerSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

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

export default function EmployerPackagePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [packages, setPackages] = useState<Package[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
        let list = await api.get<Package[]>("/packages?audience=EMPLOYER");
        if (!list || list.length === 0) {
          list = await api.get<Package[]>("/packages");
        }
        setPackages(list || []);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load packages");
      } finally {
        setDataLoading(false);
      }
    })();
  }, [user]);

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
      <div className="package-descr">
        {items.map((feat, idx) => (
          <p className="text-sm-muted mb-1 d-flex align-items-center gap-2" key={idx}>
            <i className="fa-solid fa-check text-success small"></i>
            <span>{feat}</span>
          </p>
        ))}
      </div>
    );
  }

  async function handleBuy(pkg: Package) {
    setBuyingId(pkg.id);
    setError(null);
    setSuccess(null);
    try {
      const order = await api.post<Order>("/packages/orders", { packageId: pkg.id });

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError("Could not load the payment widget. Please check your connection and try again.");
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
            setSuccess(`Payment successful — "${pkg.name}" package activated.`);
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Payment verification failed");
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
      setError(err instanceof ApiError ? err.message : "Failed to start checkout");
      setBuyingId(null);
    }
  }

  if (loading || !user || user.role !== "EMPLOYER") {
    return null;
  }

  return (
    <>
      <Navbar8 />

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

            <div className="alert alert-info">
              Secure payments powered by Razorpay. Clicking &quot;Buy&quot; opens Razorpay&apos;s checkout — your package activates automatically once payment is verified.
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Header Wrap */}
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0">Available Packages</h6>
                  </div>
                  <div className="card-body">
                    {dataLoading && <p className="text-muted">Loading packages...</p>}
                    {!dataLoading && packages.length === 0 && <p className="text-muted">No packages available right now.</p>}
                    {!dataLoading && packages.length > 0 && (
                      <div className="row g-4">
                        {packages.map((item) => (
                          <div className="col-xl-4 col-lg-6 col-md-6" key={item.id}>
                            <div className="card h-100 border shadow-sm rounded-3">
                              <div className="card-body p-4 d-flex flex-column justify-content-between">
                                <div>
                                  <div className="d-flex justify-content-between align-items-center mb-3">
                                    <span className="badge bg-main-light text-main px-2 py-1 fw-medium">{item.audience || "EMPLOYER"}</span>
                                    <span className="badge bg-success px-2 py-1">Active</span>
                                  </div>
                                  <h5 className="card-title fw-bold mb-2 text-dark">{item.name}</h5>
                                  <div className="fs-3 fw-bold text-main mb-3">
                                    {(item.priceInPaisa / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                                  </div>
                                  <div className="mb-3">
                                    {renderFeatures(item.featuresJson)}
                                  </div>
                                </div>
                                <div className="pt-3 border-top mt-2">
                                  <button
                                    type="button"
                                    className="btn btn-main w-100 py-2 fw-medium"
                                    disabled={buyingId === item.id}
                                    onClick={() => handleBuy(item)}
                                  >
                                    {buyingId === item.id ? "Processing..." : "Buy Now"}
                                  </button>
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
    </>
  );
}
