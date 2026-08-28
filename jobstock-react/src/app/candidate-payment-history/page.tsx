"use client";

import { useEffect, useState } from "react";
import Navbar7 from "@/components/Navbar7";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { toast, Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface Package {
  id: string;
  name: string;
  audience: string;
  priceInPaisa: number;
  featuresJson: any;
}

interface Order {
  id: string;
  amountInPaisa: number;
  refundedAmountInPaisa?: number;
  status: string;
  gatewayRef: string | null;
  createdAt: string;
  package: Package;
}

function formatMoney(paisa: number) {
  return `₹${(paisa / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default function CandidatePaymentHistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== "CANDIDATE")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "CANDIDATE") return;
    setDataLoading(true);
    api.get<Order[]>("/packages/orders/mine")
      .then(setOrders)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to load payment history"))
      .finally(() => setDataLoading(false));
  }, [user]);

  const renderFeatures = (featuresJson: any) => {
    let items: string[] = [];
    if (typeof featuresJson === "object" && featuresJson !== null && Array.isArray(featuresJson.features)) {
      items = featuresJson.features;
    } else if (Array.isArray(featuresJson)) {
      items = featuresJson;
    }
    return (
      <ul className="mb-0 ps-3 text-muted small" style={{ listStyleType: "circle" }}>
        {items.map((f, i) => (
          <li key={i}>{f}</li>
        ))}
      </ul>
    );
  };

  if (loading || !user || user.role !== "CANDIDATE") {
    return null;
  }

  return (
    <>
      <Toaster position="top-right" />
      <Navbar7 />
      <div className="dashboard-wrap bg-light">
        <CandidateSidebar active="payment-history" />
        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Payment History</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Candidate</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Payment History</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>
          
          <div className="dashboard-widg-bar d-block">
            <div className="card">
              <div className="card-header">
                <h4>My Transactions</h4>
              </div>
              <div className="card-body">
                {dataLoading && <p className="text-muted">Loading payment history...</p>}
                {!dataLoading && orders.length === 0 && (
                  <div className="text-center py-5">
                    <i className="fa-solid fa-file-invoice-dollar text-muted mb-3" style={{ fontSize: "3rem" }}></i>
                    <h5 className="text-muted">No payments found.</h5>
                    <p className="text-muted small">When you purchase a plan, your history will appear here.</p>
                  </div>
                )}
                {!dataLoading && orders.length > 0 && (
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Date & Time</th>
                          <th>Package Name</th>
                          <th>Amount</th>
                          <th>Features Included</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id}>
                            <td className="small">{new Date(order.createdAt).toLocaleString()}</td>
                            <td className="fw-medium text-dark">{order.package.name}</td>
                            <td className="small fw-bold">{formatMoney(order.amountInPaisa)}</td>
                            <td>{renderFeatures(order.package.featuresJson)}</td>
                            <td>
                              {order.status === "PAID" && (
                                <span className="badge bg-success">Active / Paid</span>
                              )}
                              {order.status === "REFUNDED" && (
                                <div>
                                  <span className="badge bg-secondary mb-1">Cancelled & Refunded</span>
                                  <br/>
                                  <span className="small text-muted" style={{ fontSize: "0.75rem" }}>
                                    Refunded: {order.refundedAmountInPaisa ? formatMoney(order.refundedAmountInPaisa) : "Full Amount"}
                                  </span>
                                </div>
                              )}
                              {order.status === "PENDING" && (
                                <span className="badge bg-warning text-dark">Pending</span>
                              )}
                              {order.status === "FAILED" && (
                                <span className="badge bg-danger">Failed</span>
                              )}
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
      </div>
    </>
  );
}
