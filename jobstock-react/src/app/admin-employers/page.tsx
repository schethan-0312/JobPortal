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

  async function handleDecision(id: string, decision: "VERIFIED" | "REJECTED") {
    setActingId(id);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.patch(`/admin/employers/${id}/verify`, { decision });
      setEmployers((prev) => prev.filter((e) => e.id !== id));
      setSuccessMsg(`Employer ${decision === "VERIFIED" ? "verified" : "rejected"} successfully.`);
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
                          <div className="jbs-list-box border">
                            <div className="jbs-list-head">
                              <div className="jbs-list-head-thunner">
                                <div className="jbs-list-emp-thumb">
                                  <figure>
                                    <img src={assetUrl(emp.logoUrl) || "/assets/img/l-1.png"} className="img-fluid" alt="" />
                                  </figure>
                                </div>
                                <div className="jbs-list-job-caption">
                                  <div className="jbs-job-title-wrap">
                                    <h4>
                                      <span className="jbs-job-title">{emp.companyName}</span>
                                    </h4>
                                  </div>
                                  <div className="jbs-job-mrch-lists">
                                    <div className="single-mrch-lists">
                                      <span>{emp.user.email}</span>
                                      {emp.location ? (
                                        <>
                                          .<span><i className="fa-solid fa-location-dot me-1"></i>{emp.location}</span>
                                        </>
                                      ) : null}
                                      .<span>Applied {new Date(emp.createdAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                  {emp.description && <p className="text-muted mb-0 mt-2">{emp.description}</p>}
                                </div>
                              </div>
                              <div className="jbs-list-head-last">
                                <button
                                  type="button"
                                  className="btn btn-md btn-main px-3 me-2"
                                  disabled={actingId === emp.id}
                                  onClick={() => handleDecision(emp.id, "VERIFIED")}
                                >
                                  {actingId === emp.id ? "Please wait..." : "Verify"}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-md btn-gray px-3"
                                  disabled={actingId === emp.id}
                                  onClick={() => handleDecision(emp.id, "REJECTED")}
                                >
                                  Reject
                                </button>
                              </div>
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

