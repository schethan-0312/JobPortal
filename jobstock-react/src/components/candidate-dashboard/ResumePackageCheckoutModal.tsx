"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { toast } from "react-hot-toast";

interface PackageItem {
  id: string;
  name: string;
  priceInPaisa: number;
  featuresJson: any;
}

interface ResumePackageCheckoutModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
  activePackageId?: string;
  title?: string;
  description?: string;
}

export default function ResumePackageCheckoutModal({ 
  show, onClose, onSuccess, activePackageId, 
  title = "Upgrade to Download", 
  description = "To download your resume as a PDF and access premium features, please choose a package." 
}: ResumePackageCheckoutModalProps) {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (show && packages.length === 0) {
      setLoading(true);
      api.get<PackageItem[]>("/packages?audience=RESUME")
        .then(setPackages)
        .catch(() => toast.error("Failed to load packages"))
        .finally(() => setLoading(false));
    }
  }, [show]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePurchase = async (pkg: PackageItem) => {
    setProcessingId(pkg.id);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) throw new Error("Failed to load Razorpay SDK. Please check your connection.");

      // 1. Create order in our backend
      const order = await api.post<{ id: string }>("/packages/orders", { packageId: pkg.id });

      // 2. Create Razorpay order
      const rpOrder = await api.post<any>(`/packages/orders/${order.id}/razorpay-order`, {});

      // 3. Configure Razorpay UI
      const options = {
        key: rpOrder.keyId,
        amount: rpOrder.amount,
        currency: rpOrder.currency,
        name: "JobStock Resume Builder",
        description: pkg.name,
        order_id: rpOrder.razorpayOrderId,
        handler: async (response: any) => {
          try {
            await api.post(`/packages/orders/${order.id}/verify-razorpay`, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success("Package purchased successfully!");
            onSuccess();
          } catch (verifyErr) {
            toast.error(verifyErr instanceof ApiError ? verifyErr.message : "Payment verification failed.");
          }
        },
        theme: { color: "#2563eb" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (res: any) => {
        toast.error(res.error.description || "Payment failed");
      });
      rzp.open();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error initiating checkout");
    } finally {
      setProcessingId(null);
    }
  };

  const renderFeatures = (featuresJson: any) => {
    let items: string[] = [];
    if (typeof featuresJson === "object" && featuresJson !== null && Array.isArray(featuresJson.features)) {
      items = featuresJson.features;
    } else if (Array.isArray(featuresJson)) {
      items = featuresJson;
    }
    return (
      <ul className="list-unstyled mt-3 mb-4 text-start">
        {items.map((f, i) => (
          <li key={i} className="mb-2 text-muted small">
            <i className="fa-solid fa-check text-success me-2"></i>{f}
          </li>
        ))}
      </ul>
    );
  };

  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header border-bottom-0 pb-0">
              <h5 className="modal-title fw-bold">{title}</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body p-4 text-center">
              <p className="text-muted mb-4">
                {description}
              </p>
              
              {loading ? (
                <div className="py-5"><div className="spinner-border text-primary" role="status"></div></div>
              ) : (
                <div className="row g-4 justify-content-center">
                  {packages.map((pkg) => (
                    <div className="col-md-6" key={pkg.id}>
                      <div className="card h-100 border shadow-sm">
                        <div className="card-body p-4 d-flex flex-column">
                          <h4 className="fw-bold mb-3">{pkg.name}</h4>
                          <h2 className="text-primary mb-4">
                            {(pkg.priceInPaisa / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                          </h2>
                          {renderFeatures(pkg.featuresJson)}
                          <div className="mt-auto">
                            {activePackageId === pkg.id ? (
                              <button className="btn btn-success w-100" disabled>
                                Current Plan
                              </button>
                            ) : (
                              <button
                                className="btn btn-main w-100"
                                onClick={() => handlePurchase(pkg)}
                                disabled={processingId !== null}
                              >
                                {processingId === pkg.id ? "Processing..." : "Select Plan"}
                              </button>
                            )}
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
    </>
  );
}
