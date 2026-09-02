"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl } from "@/lib/api";

interface PendingEmployer {
  id: string;
  userId: string;
  companyName: string;
  logoUrl: string | null;
  description: string | null;
  website: string | null;
  location: string | null;
  industry: string | null;
  status: string;
  createdAt: string;
  gstCertificateUrl?: string;
  incorporationCertUrl?: string;
  signatoryIdUrl?: string;
  user: { email: string; createdAt: string };
}

export default function AdminEmployersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [employers, setEmployers] = useState<PendingEmployer[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [viewingEmployer, setViewingEmployer] = useState<PendingEmployer | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    (async () => {
      setDataLoading(true);
      try {
        const res = await api.get<PendingEmployer[]>("/admin/employers/pending");
        setEmployers(res);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load pending employers");
      } finally {
        setDataLoading(false);
      }
    })();
  }, [user]);

  async function handleDecision(id: string, decision: "VERIFIED" | "REJECTED" | "SUSPENDED") {
    setActingId(id);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.patch(`/admin/employers/${id}/verify`, { decision });
      setEmployers((prev) => prev.filter((e) => e.id !== id));
      setSuccessMsg(`Employer ${decision.toLowerCase()} successfully.`);
      setViewingEmployer(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update employer");
    } finally {
      setActingId(null);
    }
  }

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="employers" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Verify Employers</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted">
                      <a href="#">Admin</a>
                    </li>
                    <li className="breadcrumb-item">
                      <a href="#" className="text-main">
                        Verify Employers
                      </a>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}
            {successMsg && <div className="alert alert-success">{successMsg}</div>}

            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0">Pending Employers</h6>
                  </div>
                  <div className="card-body">
                    {dataLoading && <p className="text-muted">Loading...</p>}
                    {!dataLoading && employers.length === 0 && (
                      <p className="text-muted">No pending employers to verify.</p>
                    )}

                    <div className="row justify-content-start gx-3 gy-4">
                      {employers.map((emp) => (
                        <div className="col-xl-12 col-lg-12 col-md-12" key={emp.id}>
                          <div className="jbs-list-box border d-flex justify-content-between align-items-center p-3">
                            <div className="d-flex align-items-center">
                              <div className="me-3">
                                <img src={assetUrl(emp.logoUrl) || "/assets/img/l-1.png"} className="img-fluid rounded" alt="" style={{ width: '60px', height: '60px', objectFit: 'cover' }} />
                              </div>
                              <div>
                                <h4 className="mb-0 fs-5">{emp.companyName}</h4>
                                <span className="text-muted small">{emp.user.email}</span>
                              </div>
                            </div>
                            <div>
                              <button
                                type="button"
                                className="btn btn-md btn-light border px-4"
                                onClick={() => setViewingEmployer(emp)}
                              >
                                View
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {viewingEmployer && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Review Employer: {viewingEmployer.companyName}</h5>
                <button type="button" className="btn-close" onClick={() => setViewingEmployer(null)}></button>
              </div>
              <div className="modal-body">
                <div className="d-flex align-items-start mb-4">
                  <img src={assetUrl(viewingEmployer.logoUrl) || "/assets/img/l-1.png"} className="img-fluid rounded me-3" alt="" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                  <div>
                    <h4 className="mb-1">{viewingEmployer.companyName}</h4>
                    <div className="text-muted small">
                      <span className="me-3"><i className="fa-regular fa-envelope me-1"></i>{viewingEmployer.user.email}</span>
                      {viewingEmployer.location && <span className="me-3"><i className="fa-solid fa-location-dot me-1"></i>{viewingEmployer.location}</span>}
                      <span><i className="fa-regular fa-calendar me-1"></i>Applied {new Date(viewingEmployer.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                {viewingEmployer.description && (
                  <div className="mb-4">
                    <h6 className="fw-medium">Description</h6>
                    <p className="text-muted small">{viewingEmployer.description}</p>
                  </div>
                )}
                
                <div className="mb-4 p-3 bg-light rounded border">
                  <h6 className="mb-3 fs-6">Compliance Documents</h6>
                  <div className="d-flex flex-wrap gap-4">
                    {viewingEmployer.gstCertificateUrl ? (
                      <a href={assetUrl(viewingEmployer.gstCertificateUrl)} target="_blank" rel="noreferrer" className="text-primary fw-medium text-decoration-underline">
                        <i className="fa-solid fa-file-pdf me-1"></i> GST Certificate
                      </a>
                    ) : (
                      <span className="text-danger fw-medium"><i className="fa-solid fa-circle-xmark me-1"></i> Missing GST</span>
                    )}

                    {viewingEmployer.incorporationCertUrl ? (
                      <a href={assetUrl(viewingEmployer.incorporationCertUrl)} target="_blank" rel="noreferrer" className="text-primary fw-medium text-decoration-underline">
                        <i className="fa-solid fa-file-pdf me-1"></i> Incorporation Cert
                      </a>
                    ) : (
                      <span className="text-danger fw-medium"><i className="fa-solid fa-circle-xmark me-1"></i> Missing Inc. Cert</span>
                    )}

                    {viewingEmployer.signatoryIdUrl ? (
                      <a href={assetUrl(viewingEmployer.signatoryIdUrl)} target="_blank" rel="noreferrer" className="text-primary fw-medium text-decoration-underline">
                        <i className="fa-solid fa-file-pdf me-1"></i> Signatory ID
                      </a>
                    ) : (
                      <span className="text-danger fw-medium"><i className="fa-solid fa-circle-xmark me-1"></i> Missing Signatory ID</span>
                    )}
                  </div>
                  <div className="mt-3 text-muted small">
                    {viewingEmployer.website && <span className="me-3"><i className="fa-solid fa-globe me-1"></i> {viewingEmployer.website}</span>}
                    {viewingEmployer.industry && <span><i className="fa-solid fa-building me-1"></i> {viewingEmployer.industry}</span>}
                  </div>
                </div>

                {error && <div className="alert alert-danger py-2">{error}</div>}
              </div>
              <div className="modal-footer justify-content-between">
                <button type="button" className="btn btn-secondary" onClick={() => setViewingEmployer(null)}>Cancel</button>
                <div>

                  <button 
                    type="button" 
                    className="btn btn-warning me-2 text-white"
                    disabled={actingId === viewingEmployer.id}
                    onClick={() => handleDecision(viewingEmployer.id, "REJECTED")}
                  >
                    Reject
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-success"
                    disabled={actingId === viewingEmployer.id}
                    onClick={() => handleDecision(viewingEmployer.id, "VERIFIED")}
                  >
                    Verify
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

