"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import Swal from "sweetalert2";
import { Toaster, toast } from "react-hot-toast";

interface SkillAssessmentSummary {
  id: string;
  skill: string;
  score: number | null;
  totalQuestions: number;
  passed: boolean | null;
  status: string;
  createdAt: string;
}

interface MockInterviewSummary {
  id: string;
  jobRole: string;
  overallRating: number | null;
  status: string;
  createdAt: string;
}

interface ApplicationSummary {
  id: string;
  status: string;
  appliedAt: string;
  job: { title: string };
}

interface LoginEventSummary {
  id: string;
  ipAddress: string | null;
  createdAt: string;
}

interface CandidateDetail {
  id: string;
  email: string;
  isSuspended: boolean;
  suspendedReason: string | null;
  createdAt: string;
  candidateProfile: {
    fullName: string;
    headline: string | null;
    location: string | null;
    isVerified: boolean;
    skills: string[];
    skillAssessments: SkillAssessmentSummary[];
    mockInterviews: MockInterviewSummary[];
  } | null;
  applications: ApplicationSummary[];
  loginEvents: LoginEventSummary[];
}

export default function AdminCandidateDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [detail, setDetail] = useState<CandidateDetail | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState(false);

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

  async function loadDetail() {
    setDataLoading(true);
    try {
      const res = await api.get<CandidateDetail>(`/admin/candidate-management/${id}`);
      setDetail(res);
    } catch (err) {
      showErrorPopup("Sync Error", err instanceof ApiError ? err.message : "Failed to load candidate detail");
    } finally {
      setDataLoading(false);
    }
  }

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    loadDetail();
  }, [user, id]);

  async function handleSuspend() {
    const result = await Swal.fire({
      title: "Suspend Candidate Account?",
      text: "This user will immediately lose platform login privileges.",
      icon: "warning",
      input: "text",
      inputPlaceholder: "Optional reason for suspension...",
      inputValue: reason,
      showCancelButton: true,
      confirmButtonColor: "#d94348",
      cancelButtonColor: "#63857d",
      confirmButtonText: "Yes, Suspend",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "elite-pkg-popup",
        title: "elite-pkg-title",
        confirmButton: "elite-pkg-btn",
      },
    });

    if (!result.isConfirmed) return;

    const suspensionReason = result.value || reason || undefined;
    setActing(true);
    try {
      await api.post(`/admin/candidate-management/${id}/suspend`, { reason: suspensionReason });
      showSuccessPopup("Account Suspended", "Candidate profile has been suspended.");
      setReason("");
      await loadDetail();
    } catch (err) {
      showErrorPopup("Action Failed", err instanceof ApiError ? err.message : "Failed to suspend candidate");
    } finally {
      setActing(false);
    }
  }

  async function handleUnsuspend() {
    const result = await Swal.fire({
      title: "Unsuspend Candidate Account?",
      text: "This user will regain full access to their candidate portal.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0d4f3c",
      cancelButtonColor: "#63857d",
      confirmButtonText: "Yes, Reactivate",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "elite-pkg-popup",
        title: "elite-pkg-title",
        confirmButton: "elite-pkg-btn",
      },
    });

    if (!result.isConfirmed) return;

    setActing(true);
    try {
      await api.post(`/admin/candidate-management/${id}/unsuspend`);
      showSuccessPopup("Account Reactivated", "Candidate has been reactivated successfully.");
      await loadDetail();
    } catch (err) {
      showErrorPopup("Action Failed", err instanceof ApiError ? err.message : "Failed to unsuspend candidate");
    } finally {
      setActing(false);
    }
  }

  async function handleToggleVerified() {
    const isCurrentlyVerified = detail?.candidateProfile?.isVerified;
    setActing(true);
    try {
      await api.patch(`/admin/candidate-management/${id}/toggle-verified`);
      toast.success(
        isCurrentlyVerified ? "Candidate verification revoked" : "Candidate verified successfully!",
        { icon: isCurrentlyVerified ? "ℹ️" : "✅" }
      );
      await loadDetail();
    } catch (err) {
      showErrorPopup("Update Failed", err instanceof ApiError ? err.message : "Failed to update verification");
    } finally {
      setActing(false);
    }
  }

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  const applicationsCount = detail?.applications.length ?? 0;
  const assessmentsCount = detail?.candidateProfile?.skillAssessments.length ?? 0;
  const interviewsCount = detail?.candidateProfile?.mockInterviews.length ?? 0;

  const statCards = [
    { 
      icon: "fa-solid fa-briefcase", 
      glowColor: "#dcf4fa", 
      iconColor: "#174742", 
      iconBg: "#eef3f5", 
      label: "TOTAL APPLICATIONS", 
      value: `${applicationsCount} Submitted` 
    },
    { 
      icon: "fa-solid fa-award", 
      glowColor: "#dbfbf5", 
      iconColor: "#134d42", 
      iconBg: "#def5f0", 
      label: "SKILL ASSESSMENTS", 
      value: `${assessmentsCount} Completed` 
    },
    { 
      icon: "fa-solid fa-robot", 
      glowColor: "#fff3dc", 
      iconColor: "#b07c1a", 
      iconBg: "#fdf3e0", 
      label: "AI MOCK INTERVIEWS", 
      value: `${interviewsCount} Sessions` 
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

        /* Custom Cards */
        .cnd-card {
          background: #fff; border: 1px solid #e1e9e7; border-radius: 0.85rem;
          box-shadow: 0 4px 14px rgba(0,0,0,.025); overflow: hidden;
        }
        .cnd-card .card-header-custom {
          background: #f2f8f6; border-bottom: 1px solid #d6e8e4;
          padding: 1rem 1.5rem;
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;
        }
        .cnd-card .card-header-custom h5 {
          font-size: 1rem; font-weight: 700; color: #0d362d; margin: 0;
        }

        .btn-pkg-ghost {
          background: #eef3f1; color: #4a6862; border: 1px solid #d0deda;
          border-radius: 0.5rem; padding: 0.58rem 1.2rem; font-size: 0.875rem; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
        }
        .btn-pkg-ghost:hover { background: #dce8e4; color: #2d4e45; }

        .btn-cnd-action-verify {
          background: #e4f5ef;
          color: #0d4f3c;
          border: 1px solid #c0ddd6;
          border-radius: 0.5rem;
          padding: 0.45rem 1.1rem;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-cnd-action-verify:hover { background: #d0ede4; color: #083826; }

        .btn-cnd-action-suspend {
          background: #fce8e8;
          color: #b02020;
          border: 1px solid #f0c8c8;
          border-radius: 0.5rem;
          padding: 0.45rem 1.1rem;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-cnd-action-suspend:hover { background: #f9d4d4; }

        .btn-cnd-action-reactivate {
          background: #0d4f3c;
          color: #fff;
          border: none;
          border-radius: 0.5rem;
          padding: 0.45rem 1.1rem;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-cnd-action-reactivate:hover { background: #0a3c2e; }

        .cnd-badge-active {
          background: #d4f0e4; color: #0d6e3f; font-size: 0.7rem; font-weight: 700;
          border-radius: 0.35rem; padding: 0.3rem 0.65rem; display: inline-block;
        }
        .cnd-badge-suspended {
          background: #fce8e8; color: #b02020; font-size: 0.7rem; font-weight: 700;
          border-radius: 0.35rem; padding: 0.3rem 0.65rem; display: inline-block;
        }

        .cnd-detail-table th {
          background: #f9fdfb;
          color: #5a8578;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 0.75rem 1rem;
          border-bottom: 1.5px solid #d9e8e4;
        }
        .cnd-detail-table td {
          padding: 0.85rem 1rem;
          font-size: 0.85rem;
          color: #2d4e45;
          border-bottom: 1px solid #eaf2f0;
          vertical-align: middle;
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
        <AdminSidebar active="candidates" />

        <div className="dashboard-content pkg-page">
          {/* Header */}
          <div className="dashboard-tlbar d-block mb-4">
            <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
              <div>
                <h1 className="mb-1 fs-3">
                  {detail?.candidateProfile?.fullName ?? "Candidate Profile"}
                  {detail?.candidateProfile?.isVerified && (
                    <i className="fa-solid fa-circle-check ms-2" style={{ color: "#429e85", fontSize: "1.1rem" }} title="Verified Candidate"></i>
                  )}
                </h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item text-muted"><a href="/admin-candidates">Candidates</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">{detail?.candidateProfile?.fullName ?? "Profile"}</a></li>
                  </ol>
                </nav>
              </div>
              <div className="d-flex gap-2">
                <button className="btn-pkg-ghost" onClick={() => router.push("/admin-candidates")}>
                  <i className="fa-solid fa-arrow-left me-1"></i> Back to Directory
                </button>
                <button className="btn-pkg-ghost" onClick={loadDetail} disabled={dataLoading}>
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

            {dataLoading && !detail ? (
              <div className="p-5 text-center text-muted">
                <i className="fa-solid fa-spinner fa-spin me-2 fs-5"></i> Loading candidate details...
              </div>
            ) : !detail ? (
              <div className="p-5 text-center text-muted">
                Candidate profile not found.
              </div>
            ) : (
              <>
                {/* Account Overview */}
                <div className="cnd-card mb-4">
                  <div className="card-header-custom">
                    <h5>
                      <i className="fa-solid fa-id-badge me-2" style={{ color: "#429e85" }}></i>
                      Account &amp; Identity Overview
                    </h5>
                    <div className="d-flex gap-2 align-items-center flex-wrap">
                      <button 
                        type="button" 
                        className="btn-cnd-action-verify" 
                        disabled={acting} 
                        onClick={handleToggleVerified}
                      >
                        {detail.candidateProfile?.isVerified ? "Revoke Verification" : "Mark as Verified"}
                      </button>
                      {detail.isSuspended ? (
                        <button 
                          type="button" 
                          className="btn-cnd-action-reactivate" 
                          disabled={acting} 
                          onClick={handleUnsuspend}
                        >
                          Reactivate Account
                        </button>
                      ) : (
                        <button 
                          type="button" 
                          className="btn-cnd-action-suspend" 
                          disabled={acting} 
                          onClick={handleSuspend}
                        >
                          Suspend Account
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="row g-3">
                      <div className="col-md-4 col-sm-6">
                        <label className="text-muted small d-block mb-1" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email Address</label>
                        <div className="fw-semibold" style={{ color: "#0d362d" }}>{detail.email}</div>
                      </div>
                      <div className="col-md-4 col-sm-6">
                        <label className="text-muted small d-block mb-1" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Professional Headline</label>
                        <div className="fw-semibold" style={{ color: "#0d362d" }}>{detail.candidateProfile?.headline ?? "—"}</div>
                      </div>
                      <div className="col-md-4 col-sm-6">
                        <label className="text-muted small d-block mb-1" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Geographic Location</label>
                        <div className="fw-semibold" style={{ color: "#0d362d" }}>{detail.candidateProfile?.location ?? "—"}</div>
                      </div>
                      <div className="col-md-4 col-sm-6">
                        <label className="text-muted small d-block mb-1" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Account Status</label>
                        <div>
                          <span className={detail.isSuspended ? "cnd-badge-suspended" : "cnd-badge-active"}>
                            {detail.isSuspended ? "Suspended" : "Active & In Good Standing"}
                          </span>
                          {detail.isSuspended && detail.suspendedReason && (
                            <span className="text-muted small ms-2">({detail.suspendedReason})</span>
                          )}
                        </div>
                      </div>
                      <div className="col-md-4 col-sm-6">
                        <label className="text-muted small d-block mb-1" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Member Since</label>
                        <div className="fw-semibold" style={{ color: "#0d362d" }}>{new Date(detail.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="col-md-4 col-sm-6">
                        <label className="text-muted small d-block mb-1" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Profile Verification</label>
                        <div className="fw-semibold">
                          {detail.candidateProfile?.isVerified ? (
                            <span className="text-success"><i className="fa-solid fa-check-circle me-1"></i> Verified Profile</span>
                          ) : (
                            <span className="text-muted"><i className="fa-regular fa-circle me-1"></i> Unverified</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Applications Table */}
                <div className="cnd-card mb-4">
                  <div className="card-header-custom">
                    <h5>
                      <i className="fa-solid fa-file-invoice me-2" style={{ color: "#429e85" }}></i>
                      Submitted Job Applications ({detail.applications.length})
                    </h5>
                  </div>
                  <div>
                    {detail.applications.length === 0 ? (
                      <div className="p-4 text-center text-muted small">No job applications submitted yet.</div>
                    ) : (
                      <div className="table-responsive">
                        <table className="cnd-detail-table w-100">
                          <thead>
                            <tr>
                              <th>Applied Role</th>
                              <th>Current Status</th>
                              <th>Submission Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detail.applications.map((a) => (
                              <tr key={a.id}>
                                <td className="fw-bold" style={{ color: "#0d362d" }}>{a.job.title}</td>
                                <td>
                                  <span className="cnd-badge-active" style={{ background: "#e4f5ef", color: "#0d4f3c" }}>
                                    {a.status}
                                  </span>
                                </td>
                                <td className="text-muted small">{new Date(a.appliedAt).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Assessments & Mock Interviews Split */}
                <div className="row g-4 mb-4">
                  <div className="col-lg-6 col-12">
                    <div className="cnd-card h-100">
                      <div className="card-header-custom">
                        <h5>
                          <i className="fa-solid fa-clipboard-check me-2" style={{ color: "#429e85" }}></i>
                          Skill Assessments
                        </h5>
                      </div>
                      <div className="p-3">
                        {(!detail.candidateProfile || detail.candidateProfile.skillAssessments.length === 0) ? (
                          <div className="p-3 text-center text-muted small">No skill tests completed.</div>
                        ) : (
                          <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                            {detail.candidateProfile.skillAssessments.map((a) => (
                              <li key={a.id} className="d-flex justify-content-between align-items-center p-2 rounded" style={{ background: "#f9fdfb", border: "1px solid #e1ecea" }}>
                                <span className="fw-semibold" style={{ color: "#0d362d", fontSize: "0.85rem" }}>{a.skill}</span>
                                <span className="badge" style={{ background: a.passed ? "#d4f0e4" : "#fce8e8", color: a.passed ? "#0d6e3f" : "#b02020", fontSize: "0.75rem" }}>
                                  {a.score !== null ? `${a.score}/${a.totalQuestions}` : a.status}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-6 col-12">
                    <div className="cnd-card h-100">
                      <div className="card-header-custom">
                        <h5>
                          <i className="fa-solid fa-headset me-2" style={{ color: "#429e85" }}></i>
                          AI Mock Interviews
                        </h5>
                      </div>
                      <div className="p-3">
                        {(!detail.candidateProfile || detail.candidateProfile.mockInterviews.length === 0) ? (
                          <div className="p-3 text-center text-muted small">No mock interviews conducted.</div>
                        ) : (
                          <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                            {detail.candidateProfile.mockInterviews.map((m) => (
                              <li key={m.id} className="d-flex justify-content-between align-items-center p-2 rounded" style={{ background: "#f9fdfb", border: "1px solid #e1ecea" }}>
                                <span className="fw-semibold" style={{ color: "#0d362d", fontSize: "0.85rem" }}>{m.jobRole}</span>
                                <span className="badge" style={{ background: "#e4f5ef", color: "#0d4f3c", fontSize: "0.75rem" }}>
                                  {m.overallRating !== null ? `⭐ ${m.overallRating}/5` : m.status}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Login Audit Trail */}
                <div className="cnd-card">
                  <div className="card-header-custom">
                    <h5>
                      <i className="fa-solid fa-clock-rotate-left me-2" style={{ color: "#429e85" }}></i>
                      Security &amp; Recent Login History
                    </h5>
                  </div>
                  <div className="p-3">
                    {detail.loginEvents.length === 0 ? (
                      <div className="p-3 text-center text-muted small">No recent login events recorded.</div>
                    ) : (
                      <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                        {detail.loginEvents.map((l) => (
                          <li key={l.id} className="d-flex justify-content-between align-items-center p-2 rounded" style={{ background: "#f9fdfb", border: "1px solid #e1ecea" }}>
                            <span className="small font-monospace" style={{ color: "#0d362d" }}>
                              <i className="fa-solid fa-network-wired me-2" style={{ color: "#429e85" }}></i>
                              {l.ipAddress ?? "unknown IP"}
                            </span>
                            <span className="text-muted small">{new Date(l.createdAt).toLocaleString()}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
