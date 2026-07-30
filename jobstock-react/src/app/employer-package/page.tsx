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
        const list = await api.get<Package[]>("/packages?audience=EMPLOYER");
        setPackages(list);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load packages");
      } finally {
        setDataLoading(false);
      }
    })();
  }, [user]);

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
              <div className="colxl-12 col-lg-12 col-md-12">
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
                      <div className="table-responsive">
                        <table className="table">
                          <thead>
                            <tr>
                              <th scope="col">#</th>
                              <th scope="col">Package Name</th>
                              <th scope="col">Price</th>
                              <th scope="col">Features</th>
                              <th scope="col">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {packages.map((item, i) => (
                              <tr key={item.id}>
                                <td>{String(i + 1).padStart(2, "0")}</td>
                                <td>{item.name}</td>
                                <td>{(item.priceInPaisa / 100).toLocaleString(undefined, { style: "currency", currency: "INR" })}</td>
                                <td>
                                  <div className="package-descr">
                                    {Object.entries(item.featuresJson || {}).map(([k, v]) => (
                                      <p className="text-sm-muted mb-1" key={k}>{k}: {String(v)}</p>
                                    ))}
                                  </div>
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-md btn-main px-3"
                                    disabled={buyingId === item.id}
                                    onClick={() => handleBuy(item)}
                                  >
                                    {buyingId === item.id ? "Processing..." : "Buy"}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
