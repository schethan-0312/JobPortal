"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface JobSummary {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

interface Payment {
  id: string;
  amountInPaisa: number;
  status: string;
  createdAt: string;
  package: { name: string };
}

interface VerificationHistoryEntry {
  id: string;
  decision: string;
  reason: string | null;
  requestedDocuments: string[];
  adminId: string;
  createdAt: string;
}

interface EmployerDetail {
  id: string;
  companyName: string;
  status: string;
  location: string | null;
  industry: string | null;
  description: string | null;
  user: { email: string; createdAt: string };
  jobs: JobSummary[];
  payments: Payment[];
  hiresCount: number;
  messageCount: number;
  verificationHistory: VerificationHistoryEntry[];
  activePackage: { package: { name: string } } | null;
}

function formatMoney(paisa: number) {
  return `₹${(paisa / 100).toLocaleString("en-IN")}`;
}

export default function AdminEmployerDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [detail, setDetail] = useState<EmployerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    (async () => {
      try {
        const res = await api.get<EmployerDetail>(`/admin/employer-management/${id}`);
        setDetail(res);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load employer detail");
      }
    })();
  }, [user, id]);

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="employer-directory" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">{detail?.companyName ?? "Employer"}</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item text-muted">
                      <a href="/admin-employer-directory">Employer Directory</a>
                    </li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">{detail?.companyName}</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}
            {!detail && !error && <p className="text-muted">Loading...</p>}

            {detail && (
              <>
                <div className="row g-4 mb-4">
                  <div className="col-md-3">
                    <div className="card h-100"><div className="card-body">
                      <div className="text-muted small">Status</div>
                      <div className="fw-bold">{detail.status}</div>
                    </div></div>
                  </div>
                  <div className="col-md-3">
                    <div className="card h-100"><div className="card-body">
                      <div className="text-muted small">Jobs posted</div>
                      <div className="fw-bold">{detail.jobs.length}</div>
                    </div></div>
                  </div>
                  <div className="col-md-3">
                    <div className="card h-100"><div className="card-body">
                      <div className="text-muted small">Hires (offered)</div>
                      <div className="fw-bold">{detail.hiresCount}</div>
                    </div></div>
                  </div>
                  <div className="col-md-3">
                    <div className="card h-100"><div className="card-body">
                      <div className="text-muted small">Messages sent/received</div>
                      <div className="fw-bold">{detail.messageCount}</div>
                    </div></div>
                  </div>
                </div>

                <div className="card mb-4">
                  <div className="card-header"><h6 className="mb-0">Company Info</h6></div>
                  <div className="card-body small">
                    <p className="mb-1"><strong>Email:</strong> {detail.user.email}</p>
                    <p className="mb-1"><strong>Location:</strong> {detail.location ?? "—"}</p>
                    <p className="mb-1"><strong>Industry:</strong> {detail.industry ?? "—"}</p>
                    <p className="mb-1"><strong>Subscription:</strong> {detail.activePackage?.package.name ?? "None"}</p>
                    <p className="mb-0"><strong>Description:</strong> {detail.description ?? "—"}</p>
                  </div>
                </div>

                <div className="card mb-4">
                  <div className="card-header"><h6 className="mb-0">Jobs Posted</h6></div>
                  <div className="card-body">
                    {detail.jobs.length === 0 && <p className="text-muted small mb-0">No jobs posted yet.</p>}
                    {detail.jobs.length > 0 && (
                      <table className="table table-sm align-middle">
                        <thead><tr><th>Title</th><th>Status</th><th>Posted</th></tr></thead>
                        <tbody>
                          {detail.jobs.map((j) => (
                            <tr key={j.id}>
                              <td className="small">{j.title}</td>
                              <td><span className="badge bg-secondary">{j.status}</span></td>
                              <td className="small text-muted">{new Date(j.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                <div className="card mb-4">
                  <div className="card-header"><h6 className="mb-0">Payment History</h6></div>
                  <div className="card-body">
                    {detail.payments.length === 0 && <p className="text-muted small mb-0">No payments yet.</p>}
                    {detail.payments.length > 0 && (
                      <table className="table table-sm align-middle">
                        <thead><tr><th>Plan</th><th>Amount</th><th>Status</th><th>When</th></tr></thead>
                        <tbody>
                          {detail.payments.map((p) => (
                            <tr key={p.id}>
                              <td className="small">{p.package.name}</td>
                              <td className="small">{formatMoney(p.amountInPaisa)}</td>
                              <td><span className="badge bg-secondary">{p.status}</span></td>
                              <td className="small text-muted">{new Date(p.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header"><h6 className="mb-0">Verification History</h6></div>
                  <div className="card-body">
                    {detail.verificationHistory.length === 0 && <p className="text-muted small mb-0">No verification decisions yet.</p>}
                    {detail.verificationHistory.length > 0 && (
                      <div className="d-flex flex-column gap-3">
                        {detail.verificationHistory.map((v) => (
                          <div key={v.id} className="border-bottom pb-2">
                            <div className="d-flex justify-content-between">
                              <span className="badge bg-main-subtle text-main border border-main">{v.decision}</span>
                              <span className="small text-muted">{new Date(v.createdAt).toLocaleString()}</span>
                            </div>
                            {v.reason && <p className="small mb-0 mt-1">{v.reason}</p>}
                            {v.requestedDocuments.length > 0 && (
                              <p className="small text-muted mb-0">Requested: {v.requestedDocuments.join(", ")}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

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
