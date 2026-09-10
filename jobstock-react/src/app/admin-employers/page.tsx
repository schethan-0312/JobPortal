"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl } from "@/lib/api";
import Swal from "sweetalert2";
import { Toaster, toast } from "react-hot-toast";

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

interface AdminStats {
  totalEmployers: number;
  pendingEmployers: number;
}

export default function AdminEmployersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [employers, setEmployers] = useState<PendingEmployer[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [viewingEmployer, setViewingEmployer] = useState<PendingEmployer | null>(null);
  const [filterSearch, setFilterSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const showSuccessPopup = (title: string, text: string) => {
    Swal.fire({
      icon: "success",
      title: title,
      text: text,
      confirmButtonText: "Great, Done!",
      confirmButtonColor: "#0d4f3c",
      customClass: {
        popup: "elite-pkg-popup",
        title: "elite-pkg-title",
        confirmButton: "elite-pkg-btn",
      },
    });
  };

  const showErrorPopup = (title: string, text: string) => {
    Swal.fire({
      icon: "error",
      title: title,
      text: text,
      confirmButtonText: "Got It",
      confirmButtonColor: "#d94348",
      customClass: {
        popup: "elite-pkg-popup",
        title: "elite-pkg-title",
        confirmButton: "elite-pkg-btn",
      },
    });
  };

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  const loadData = async () => {
    setDataLoading(true);
    try {
      const [empRes, statsRes] = await Promise.all([
        api.get<PendingEmployer[]>("/admin/employers/pending"),
        api.get<AdminStats>("/admin/stats").catch(() => null),
      ]);
      setEmployers(empRes);
      if (statsRes) setAdminStats(statsRes);
    } catch (err) {
      showErrorPopup("Sync Error", err instanceof ApiError ? err.message : "Failed to load pending employers");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    loadData();
  }, [user, refreshKey]);

  const handleRefresh = async () => {
    setFilterSearch("");
    setRefreshKey((prev) => prev + 1);
    toast.success("Employer verification list refreshed!", { icon: "🔄" });
  };

  async function handleDecision(id: string, decision: "VERIFIED" | "REJECTED" | "SUSPENDED") {
    const isApprove = decision === "VERIFIED";
    const result = await Swal.fire({
      title: `${isApprove ? "Verify & Approve" : "Reject"} Employer?`,
      text: isApprove 
        ? "This will grant the employer full platform access and job posting capabilities." 
        : "This employer application will be rejected.",
      icon: isApprove ? "question" : "warning",
      showCancelButton: true,
      confirmButtonColor: isApprove ? "#0d4f3c" : "#d94348",
      cancelButtonColor: "#63857d",
      confirmButtonText: isApprove ? "Yes, Verify" : "Yes, Reject",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "elite-pkg-popup",
        title: "elite-pkg-title",
        confirmButton: "elite-pkg-btn",
      },
    });

    if (!result.isConfirmed) return;

    setActingId(id);
    try {
      await api.patch(`/admin/employers/${id}/verify`, { decision });
      setEmployers((prev) => prev.filter((e) => e.id !== id));
      showSuccessPopup(
        isApprove ? "Employer Verified" : "Employer Rejected",
        `Employer was ${decision.toLowerCase()} successfully.`
      );
      setViewingEmployer(null);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      showErrorPopup("Action Failed", err instanceof ApiError ? err.message : "Failed to update employer");
    } finally {
      setActingId(null);
    }
  }

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  const pendingCount = employers.length;
  const totalRegisteredEmployers = adminStats?.totalEmployers ?? pendingCount;
  const verifiedCount = Math.max(0, totalRegisteredEmployers - pendingCount);

  const filteredEmployers = employers.filter((e) =>
    e.companyName.toLowerCase().includes(filterSearch.toLowerCase()) ||
    e.user.email.toLowerCase().includes(filterSearch.toLowerCase()) ||
    (e.industry && e.industry.toLowerCase().includes(filterSearch.toLowerCase())) ||
    (e.location && e.location.toLowerCase().includes(filterSearch.toLowerCase()))
  );

  const statCards = [
    { 
      icon: "fa-solid fa-clock-rotate-left", 
      glowColor: "#ffede8", 
      iconColor: "#b24025", 
      iconBg: "#fbebe7", 
      label: "PENDING VERIFICATION", 
      value: `${pendingCount} Employers` 
    },
    { 
      icon: "fa-solid fa-building-circle-check", 
      glowColor: "#dbfbf5", 
      iconColor: "#134d42", 
      iconBg: "#def5f0", 
      label: "TOTAL REGISTERED", 
      value: `${totalRegisteredEmployers} Companies` 
    },
    { 
      icon: "fa-solid fa-shield-halved", 
      glowColor: "#dcf4fa", 
      iconColor: "#174742", 
      iconBg: "#eef3f5", 
      label: "VERIFIED PORTFOLIO", 
      value: `${verifiedCount} Active` 
    },
  ];

  return (
    <>
      <style jsx global>{`
        .dashboard-wrap { background-color: #f4f9f8 !important; }
        .pkg-page h1 { color: #06312a; font-weight: 700; }
        .breadcrumb-item a { color: #63857d !important; }
        .breadcrumb-item a.text-main { color: #429e85 !important; }

        /* Stat cards */
        .pkg-stat-card {
          background: #fff; border: 1px solid #e1e9e7; border-radius: 0.85rem;
          box-shadow: 0 4px 12px rgba(0,0,0,.025); padding: 1.25rem 1.4rem;
          display: flex; align-items: center; gap: 1rem;
          position: relative; overflow: hidden;
          transition: transform .2s ease, box-shadow .2s ease;
        }
        .pkg-stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,.05); }
        .pkg-stat-glow {
          position: absolute; top: -20px; right: -20px;
          width: 130px; height: 130px; border-radius: 50%;
          filter: blur(35px); z-index: 0; opacity: .85;
        }
        .pkg-stat-icon {
          width: 52px; height: 52px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.15rem; position: relative; z-index: 1;
        }
        .pkg-stat-text { position: relative; z-index: 1; }
        .pkg-stat-text .slabel {
          font-size: .68rem; font-weight: 700; letter-spacing: .07em;
          color: #7a9b94; text-transform: uppercase; display: block; margin-bottom: .3rem;
        }
        .pkg-stat-text .svalue { font-size: 1.35rem; font-weight: 800; color: #0d362d; line-height: 1.15; }

        /* Employer card list */
        .emp-list-card {
          background: #fff; border: 1px solid #e1e9e7; border-radius: 0.85rem;
          box-shadow: 0 4px 14px rgba(0,0,0,.025); overflow: hidden;
        }
        .emp-list-card .card-header-custom {
          background: #f2f8f6; border-bottom: 1px solid #d6e8e4;
          padding: 1rem 1.5rem;
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;
        }
        .emp-list-card .card-header-custom h5 {
          font-size: 1rem; font-weight: 700; color: #0d362d; margin: 0;
        }

        .emp-item-row {
          background: #ffffff;
          border: 1.5px solid #d9e8e4;
          border-radius: 0.75rem;
          padding: 1.1rem 1.35rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          transition: all 0.2s ease;
        }
        .emp-item-row:hover {
          border-color: #429e85;
          box-shadow: 0 6px 20px rgba(6, 49, 42, 0.04);
          transform: translateY(-2px);
        }

        .emp-logo-frame {
          width: 58px;
          height: 58px;
          border-radius: 0.6rem;
          border: 1px solid #d0deda;
          background: #f9fdfb;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }
        .emp-logo-frame img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .btn-emp-view {
          background: #e4f5ef;
          color: #0d4f3c;
          border: 1px solid #c0ddd6;
          border-radius: 0.5rem;
          padding: 0.5rem 1.15rem;
          font-size: 0.84rem;
          font-weight: 600;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .btn-emp-view:hover {
          background: #d0ede4;
          color: #083826;
        }

        .btn-emp-verify {
          background: #0d4f3c;
          color: #fff;
          border: none;
          border-radius: 0.5rem;
          padding: 0.5rem 1.25rem;
          font-size: 0.84rem;
          font-weight: 600;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .btn-emp-verify:hover {
          background: #0a3c2e;
        }

        .btn-emp-reject {
          background: #fce8e8;
          color: #b02020;
          border: 1px solid #f0c8c8;
          border-radius: 0.5rem;
          padding: 0.5rem 1.15rem;
          font-size: 0.84rem;
          font-weight: 600;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .btn-emp-reject:hover {
          background: #f9d4d4;
        }

        .btn-pkg-ghost {
          background: #eef3f1; color: #4a6862; border: 1px solid #d0deda;
          border-radius: 0.5rem; padding: 0.58rem 1.2rem; font-size: 0.875rem; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
        }
        .btn-pkg-ghost:hover { background: #dce8e4; color: #2d4e45; }

        .pkg-search {
          border: 1.5px solid #d0deda; border-radius: 0.5rem; padding: 0.42rem 0.8rem;
          font-size: 0.82rem; color: #1a3630; background: #f9fdfb; width: 220px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .pkg-search:focus { outline: none; border-color: #429e85; box-shadow: 0 0 0 3px rgba(66,158,133,.12); }

        .btn-pkg-refresh {
          background: #f2f8f6; border: 1px solid #d0deda; color: #4a6862;
          border-radius: 0.45rem; padding: 0.42rem 0.8rem; font-size: 0.8rem; cursor: pointer; transition: all 0.2s;
        }
        .btn-pkg-refresh:hover { background: #dce8e4; }

        .doc-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.75rem;
          border-radius: 0.45rem;
          font-size: 0.8rem;
          font-weight: 600;
          text-decoration: none !important;
        }
        .doc-badge.present {
          background: #e4f5ef;
          color: #0d4f3c;
          border: 1px solid #c0ddd6;
        }
        .doc-badge.present:hover {
          background: #d0ede4;
        }
        .doc-badge.missing {
          background: #fce8e8;
          color: #b02020;
          border: 1px solid #f0c8c8;
        }

        /* Modal styling */
        .elite-modal-content {
          border-radius: 1rem !important;
          border: 1px solid #d6e8e4 !important;
          box-shadow: 0 25px 50px -12px rgba(6, 49, 42, 0.25) !important;
          overflow: hidden;
        }
        .elite-modal-header {
          background: #f2f8f6;
          border-bottom: 1px solid #d6e8e4;
          padding: 1.15rem 1.5rem;
        }
        .elite-modal-header .modal-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #0d362d;
        }

        /* SweetAlert popup styles */
        .elite-pkg-popup {
          border-radius: 1rem !important;
          border: 1px solid #d6e8e4 !important;
          box-shadow: 0 20px 40px -15px rgba(6, 49, 42, 0.18) !important;
          padding: 1.75rem 2rem !important;
          background: #ffffff !important;
          font-family: inherit !important;
        }
        .elite-pkg-title {
          font-size: 1.35rem !important;
          font-weight: 700 !important;
          color: #06312a !important;
          padding: 0 !important;
          margin-bottom: 0.5rem !important;
        }
        .elite-pkg-btn {
          border-radius: 0.5rem !important;
          padding: 0.6rem 1.6rem !important;
          font-weight: 600 !important;
          font-size: 0.88rem !important;
          box-shadow: none !important;
          transition: transform 0.15s ease, opacity 0.15s ease !important;
        }
        .elite-pkg-btn:hover {
          transform: translateY(-1px) !important;
          opacity: 0.95 !important;
        }
      `}</style>

      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: "#ffffff",
            color: "#06312a",
            border: "1px solid #d0deda",
            borderRadius: "0.6rem",
            fontSize: "0.88rem",
            fontWeight: "500",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)",
          },
        }}
      />

      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="employers" />

        <div className="dashboard-content pkg-page">
          {/* Header */}
          <div className="dashboard-tlbar d-block mb-4">
            <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
              <div>
                <h1 className="mb-1 fs-3">Verify Employers</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Employer Verification</a></li>
                  </ol>
                </nav>
              </div>
              <div className="d-flex gap-2">
                <button className="btn-pkg-ghost" onClick={() => router.back()}>
                  <i className="fa-solid fa-arrow-left me-1"></i> Back
                </button>
                <button className="btn-pkg-ghost" onClick={handleRefresh} title="Reload Data">
                  <i className={`fa-solid ${dataLoading ? "fa-spinner fa-spin" : "fa-rotate"} me-1`}></i> Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {/* Stat Boxes */}
            <div className="row gx-4 gy-4 mb-4">
              {statCards.map((card, i) => (
                <div className="col-12 col-sm-6 col-md-4" key={i}>
                  <div className="pkg-stat-card">
                    <div className="pkg-stat-glow" style={{ background: card.glowColor }}></div>
                    <div className="pkg-stat-icon" style={{ backgroundColor: card.iconBg, color: card.iconColor }}>
                      <i className={card.icon}></i>
                    </div>
                    <div className="pkg-stat-text">
                      <span className="slabel">{card.label}</span>
                      <div className="svalue">{card.value}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Employers Card */}
            <div className="emp-list-card">
              <div className="card-header-custom">
                <div>
                  <h5>
                    <i className="fa-solid fa-building-shield me-2" style={{ color: "#429e85" }}></i>
                    Pending Employer Approvals
                    <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "#7a9b94", marginLeft: "0.5rem" }}>
                      ({pendingCount} Awaiting Review)
                    </span>
                  </h5>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <input 
                    className="pkg-search" 
                    placeholder="Search company or email..." 
                    value={filterSearch} 
                    onChange={(e) => setFilterSearch(e.target.value)} 
                  />
                  <button className="btn-pkg-refresh" onClick={handleRefresh} title="Refresh">
                    <i className={`fa-solid ${dataLoading ? "fa-spinner fa-spin" : "fa-rotate"}`}></i>
                  </button>
                </div>
              </div>

              <div className="p-4">
                {dataLoading ? (
                  <div className="py-5 text-center text-muted">
                    <i className="fa-solid fa-spinner fa-spin me-2 fs-5"></i> Loading pending employers...
                  </div>
                ) : filteredEmployers.length === 0 ? (
                  <div className="py-5 text-center text-muted">
                    <i className="fa-solid fa-circle-check fs-2 d-block mb-2 text-success opacity-75"></i>
                    {employers.length === 0 
                      ? "No pending employers awaiting verification. All caught up!" 
                      : "No employers match your search filter."}
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {filteredEmployers.map((emp) => (
                      <div className="emp-item-row" key={emp.id}>
                        <div className="d-flex align-items-center gap-3">
                          <div className="emp-logo-frame">
                            <img 
                              src={assetUrl(emp.logoUrl) || "/assets/img/l-1.png"} 
                              alt={emp.companyName} 
                            />
                          </div>
                          <div>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <h5 className="mb-0" style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0d362d" }}>
                                {emp.companyName}
                              </h5>
                              <span className="badge" style={{ backgroundColor: "#ffede8", color: "#b24025", fontSize: "0.68rem", fontWeight: 700 }}>
                                Pending Review
                              </span>
                            </div>
                            <div className="text-muted small mt-1 d-flex align-items-center gap-3 flex-wrap" style={{ fontSize: "0.8rem" }}>
                              <span><i className="fa-regular fa-envelope me-1" style={{ color: "#429e85" }}></i>{emp.user.email}</span>
                              {emp.location && <span><i className="fa-solid fa-location-dot me-1" style={{ color: "#429e85" }}></i>{emp.location}</span>}
                              {emp.industry && <span><i className="fa-solid fa-briefcase me-1" style={{ color: "#429e85" }}></i>{emp.industry}</span>}
                              <span><i className="fa-regular fa-calendar me-1" style={{ color: "#429e85" }}></i>{new Date(emp.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                          <button
                            type="button"
                            className="btn-emp-view"
                            onClick={() => setViewingEmployer(emp)}
                          >
                            <i className="fa-regular fa-eye me-1"></i> Review Details
                          </button>
                          <button
                            type="button"
                            className="btn-emp-reject"
                            disabled={actingId === emp.id}
                            onClick={() => handleDecision(emp.id, "REJECTED")}
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            className="btn-emp-verify"
                            disabled={actingId === emp.id}
                            onClick={() => handleDecision(emp.id, "VERIFIED")}
                          >
                            {actingId === emp.id ? (
                              <><i className="fa-solid fa-spinner fa-spin me-1"></i> Processing...</>
                            ) : (
                              <><i className="fa-solid fa-check me-1"></i> Verify</>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {viewingEmployer && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(6, 49, 42, 0.45)', backdropFilter: 'blur(3px)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content elite-modal-content">
              <div className="modal-header elite-modal-header">
                <h5 className="modal-title">
                  <i className="fa-solid fa-clipboard-check me-2" style={{ color: "#429e85" }}></i>
                  Employer Review: {viewingEmployer.companyName}
                </h5>
                <button type="button" className="btn-close" onClick={() => setViewingEmployer(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="d-flex align-items-start mb-4 gap-3">
                  <div className="emp-logo-frame" style={{ width: "70px", height: "70px" }}>
                    <img 
                      src={assetUrl(viewingEmployer.logoUrl) || "/assets/img/l-1.png"} 
                      alt={viewingEmployer.companyName} 
                    />
                  </div>
                  <div>
                    <h4 className="mb-1" style={{ color: "#0d362d", fontWeight: 800 }}>{viewingEmployer.companyName}</h4>
                    <div className="text-muted small d-flex flex-wrap gap-3">
                      <span><i className="fa-regular fa-envelope me-1" style={{ color: "#429e85" }}></i>{viewingEmployer.user.email}</span>
                      {viewingEmployer.location && <span><i className="fa-solid fa-location-dot me-1" style={{ color: "#429e85" }}></i>{viewingEmployer.location}</span>}
                      <span><i className="fa-regular fa-calendar me-1" style={{ color: "#429e85" }}></i>Applied {new Date(viewingEmployer.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                {viewingEmployer.description && (
                  <div className="mb-4">
                    <h6 className="fw-bold" style={{ color: "#0d362d", fontSize: "0.9rem" }}>Company Description</h6>
                    <p className="text-muted small mb-0" style={{ lineHeight: "1.5" }}>{viewingEmployer.description}</p>
                  </div>
                )}
                
                <div className="mb-4 p-3 rounded" style={{ background: "#f2f8f6", border: "1px solid #d6e8e4" }}>
                  <h6 className="mb-3" style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0d362d" }}>
                    <i className="fa-solid fa-file-shield me-2" style={{ color: "#429e85" }}></i>
                    Compliance &amp; Verification Documents
                  </h6>
                  <div className="d-flex flex-wrap gap-3">
                    {viewingEmployer.gstCertificateUrl ? (
                      <a href={assetUrl(viewingEmployer.gstCertificateUrl)} target="_blank" rel="noreferrer" className="doc-badge present">
                        <i className="fa-solid fa-file-pdf"></i> GST Certificate
                      </a>
                    ) : (
                      <span className="doc-badge missing">
                        <i className="fa-solid fa-circle-xmark"></i> Missing GST
                      </span>
                    )}

                    {viewingEmployer.incorporationCertUrl ? (
                      <a href={assetUrl(viewingEmployer.incorporationCertUrl)} target="_blank" rel="noreferrer" className="doc-badge present">
                        <i className="fa-solid fa-file-pdf"></i> Incorporation Cert
                      </a>
                    ) : (
                      <span className="doc-badge missing">
                        <i className="fa-solid fa-circle-xmark"></i> Missing Inc. Cert
                      </span>
                    )}

                    {viewingEmployer.signatoryIdUrl ? (
                      <a href={assetUrl(viewingEmployer.signatoryIdUrl)} target="_blank" rel="noreferrer" className="doc-badge present">
                        <i className="fa-solid fa-file-pdf"></i> Signatory ID
                      </a>
                    ) : (
                      <span className="doc-badge missing">
                        <i className="fa-solid fa-circle-xmark"></i> Missing Signatory ID
                      </span>
                    )}
                  </div>
                  <div className="mt-3 text-muted small d-flex flex-wrap gap-3">
                    {viewingEmployer.website && (
                      <a href={viewingEmployer.website.startsWith("http") ? viewingEmployer.website : `https://${viewingEmployer.website}`} target="_blank" rel="noreferrer" className="text-decoration-none" style={{ color: "#429e85", fontWeight: 600 }}>
                        <i className="fa-solid fa-globe me-1"></i> {viewingEmployer.website}
                      </a>
                    )}
                    {viewingEmployer.industry && (
                      <span><i className="fa-solid fa-building me-1" style={{ color: "#429e85" }}></i> {viewingEmployer.industry}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer justify-content-between" style={{ background: "#f9fdfb", borderTop: "1px solid #e1ecea" }}>
                <button type="button" className="btn-pkg-ghost" onClick={() => setViewingEmployer(null)}>
                  Close
                </button>
                <div className="d-flex gap-2">
                  <button 
                    type="button" 
                    className="btn-emp-reject"
                    disabled={actingId === viewingEmployer.id}
                    onClick={() => handleDecision(viewingEmployer.id, "REJECTED")}
                  >
                    Reject Employer
                  </button>
                  <button 
                    type="button" 
                    className="btn-emp-verify"
                    disabled={actingId === viewingEmployer.id}
                    onClick={() => handleDecision(viewingEmployer.id, "VERIFIED")}
                  >
                    {actingId === viewingEmployer.id ? "Processing..." : "Verify & Approve"}
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
