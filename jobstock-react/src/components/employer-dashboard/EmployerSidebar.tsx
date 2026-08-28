"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, assetUrl, uploadFile } from "@/lib/api";

export type EmployerSidebarActive =
  | "dashboard"
  | "profile"
  | "jobs"
  | "submit-job"
  | "applicants-jobs"
  | "candidate-search"
  | "shortlist-candidates"
  | "auto-shortlist"
  | "package"
  | "active-package"
  | "messages"
  | "competition"
  | "submissions"
 
  | "delete-account";

interface EmployerSidebarProps {
  active?: EmployerSidebarActive;
}

interface EmployerProfile {
  companyName: string;
  location: string | null;
  logoUrl: string | null;
  status: string;
  gstCertificateUrl?: string;
  incorporationCertUrl?: string;
  signatoryIdUrl?: string;
}

interface EmployerJob {
  status: string;
}
export default function EmployerSidebar({ active }: EmployerSidebarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Verification Modal State
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [gstFile, setGstFile] = useState<File | null>(null);
  const [incFile, setIncFile] = useState<File | null>(null);
  const [sigFile, setSigFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let timer: NodeJS.Timeout;
    const loadProfile = () => {
      api
        .get<EmployerProfile>("/employers/me")
        .then((data) => {
          if (isMounted) {
            setProfile(data);
            if (data.status !== "VERIFIED" && (!data.gstCertificateUrl || !data.incorporationCertUrl || !data.signatoryIdUrl)) {
              const hasSeen = sessionStorage.getItem(`hasSeenVerificationModal_${user?.userId}`);
              if (!hasSeen) {
                timer = setTimeout(() => {
                  setShowVerificationModal(true);
                  sessionStorage.setItem(`hasSeenVerificationModal_${user?.userId}`, "true");
                }, 5000);
              }
            }
          }
        })
        .catch(() => {
          if (isMounted) setProfile(null);
        });
    };
    
    loadProfile();
    window.addEventListener('profile-updated', loadProfile);

    api
      .get<number>("/messages/unread-count")
      .then((data) => {
        if (isMounted) setUnreadMessages(data);
      })
      .catch(() => {
        if (isMounted) setUnreadMessages(0);
      });

    return () => {
      isMounted = false;
      window.removeEventListener('profile-updated', loadProfile);
      if (timer) clearTimeout(timer);
    };
  }, [user?.userId]);

  async function handleVerifySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gstFile || !incFile || !sigFile) {
      setUploadError("Please select all three documents.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    try {
      // 1. Upload files
      const [gstRes, incRes, sigRes] = await Promise.all([
        uploadFile<{ url: string }>("/uploads/document?save=false", gstFile),
        uploadFile<{ url: string }>("/uploads/document?save=false", incFile),
        uploadFile<{ url: string }>("/uploads/document?save=false", sigFile),
      ]);

      // 2. Update profile
      const updated = await api.patch<EmployerProfile>("/employers/me", {
        gstCertificateUrl: gstRes.url,
        incorporationCertUrl: incRes.url,
        signatoryIdUrl: sigRes.url,
      });
      setProfile(updated);
      setUploadSuccess("Documents submitted successfully. Waiting for admin verification.");
      setTimeout(() => setShowVerificationModal(false), 2000);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload documents.");
    } finally {
      setUploading(false);
    }
  }

  function handleLogout() {
    logout();
    router.push("/");
  }

  const [isOpen, setIsOpen] = useState(false);

  // Restricted navigation handler
  const handleRestrictedNav = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    if (profile && profile.status !== "VERIFIED") {
      setShowVerificationModal(true);
    } else {
      setIsOpen(false);
      router.push(path);
    }
  };

  return (
    <>
      <style jsx global>{`
        @media (max-width: 992px) {
          #MobNav {
            position: fixed !important;
            top: 0 !important;
            left: -280px !important;
            width: 280px !important;
            height: 100vh !important;
            z-index: 1050 !important;
            background: #ffffff !important;
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
            transition: left 0.3s ease !important;
            overflow-y: auto !important;
            display: block !important;
            visibility: hidden !important;
          }
          #MobNav.show {
            left: 0 !important;
            visibility: visible !important;
          }
        }
      `}</style>

      <a
        className="mobNavigation"
        role="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: "pointer" }}
      >
        <i className="fas fa-bars mr-2"></i>Dashboard Navigation
      </a>

      {isOpen && (
        <div 
          className="sidebar-backdrop d-lg-none" 
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1040,
            cursor: "pointer"
          }}
        />
      )}

      <div className={`collapse ${isOpen ? "show" : ""}`} id="MobNav">
        <div className="dashboard-nav">
          <div className="dash-user-blocks pt-5">
            <div className="jbs-grid-usrs-thumb">
              <div className="jbs-grid-yuo">
                <Link href="/employer-profile" onClick={() => setIsOpen(false)}>
                  <figure>
                    {profile?.logoUrl ? (
                      <img src={assetUrl(profile.logoUrl!)} className="img-fluid circle" alt="" />
                    ) : (
                      <div className="img-fluid circle d-flex align-items-center justify-content-center bg-light text-muted fw-semibold" style={{ aspectRatio: '1/1' }}>
                        <span className="small text-center px-1" style={{ fontSize: '0.8rem' }}>Upload Photo</span>
                      </div>
                    )}
                  </figure>
                </Link>
              </div>
            </div>
            <div className="jbs-grid-usrs-caption mb-3">
              <div className="jbs-tiosk">
                <h4 className="jbs-tiosk-title">
                  <Link href="/employer-profile" onClick={() => setIsOpen(false)}>{profile?.companyName || "My Company"}</Link>
                </h4>
              </div>
            </div>
          </div>
          <div className="dashboard-inner">
            <ul data-submenu-title="Main Navigation">
              <li className={active === "dashboard" ? "active" : undefined}>
                <Link href="/employer-dashboard" onClick={() => setIsOpen(false)}>
                  <i className="fa-solid fa-gauge-high me-2"></i>Employer Dashboard
                </Link>
              </li>
              <li className={active === "profile" ? "active" : undefined}>
                <Link href="/employer-profile" onClick={() => setIsOpen(false)}>
                  <i className="fa-regular fa-user me-2"></i>Employer Profile
                </Link>
              </li>
              <li className={active === "jobs" ? "active" : undefined}>
                <a href="/employer-jobs" onClick={(e) => handleRestrictedNav(e, "/employer-jobs")}>
                  <i className="fa-solid fa-business-time me-2"></i>My Jobs
                </a>
              </li>
              <li className={active === "submit-job" ? "active" : undefined}>
                <a href="/employer-submit-job" onClick={(e) => handleRestrictedNav(e, "/employer-submit-job")}>
                  <i className="fa-solid fa-pen-ruler me-2"></i>Submit Jobs
                </a>
              </li>
              <li className={active === "applicants-jobs" ? "active" : undefined}>
                <a href="/employer-applicants-jobs" onClick={(e) => handleRestrictedNav(e, "/employer-applicants-jobs")}>
                  <i className="fa-solid fa-user-group me-2"></i>Applicants Jobs
                </a>
              </li>
              <li className={active === "candidate-search" ? "active" : undefined}>
                <a href="/employer-candidate-search" onClick={(e) => handleRestrictedNav(e, "/employer-candidate-search")}>
                  <i className="fa-solid fa-magnifying-glass me-2"></i>Find Candidates
                </a>
              </li>
              <li className={active === "shortlist-candidates" ? "active" : undefined}>
                <a href="/employer-shortlist-candidates" onClick={(e) => handleRestrictedNav(e, "/employer-shortlist-candidates")}>
                  <i className="fa-solid fa-user-clock me-2"></i>Shortlisted Candidates
                </a>
              </li>
              <li className={active === "auto-shortlist" ? "active" : undefined}>
                <a href="/employer-auto-shortlist" onClick={(e) => handleRestrictedNav(e, "/employer-auto-shortlist")}>
                  <i className="fa-solid fa-wand-magic-sparkles me-2"></i>AI Auto-Shortlist
                </a>
              </li>
              <li className={active === "competition" ? "active" : undefined}>
                <a href="/employer-competition" onClick={(e) => handleRestrictedNav(e, "/employer-competition")}>
                  <i className="fa-solid fa-trophy me-2"></i>Competition
                </a>
              </li>
              <li className={active === "submissions" ? "active" : undefined}>
                <a href="/employer-submissions" onClick={(e) => handleRestrictedNav(e, "/employer-submissions")}>
                  <i className="fa-solid fa-clipboard-list me-2"></i>Submissions
                </a>
              </li>
              <li className={active === "package" ? "active" : undefined}>
                <a href="/employer-package" onClick={(e) => handleRestrictedNav(e, "/employer-package")}>
                  <i className="fa-solid fa-wallet me-2"></i>Package
                </a>
              </li>
              <li className={active === "active-package" ? "active" : undefined}>
                <a href="/employer-active-package" onClick={(e) => handleRestrictedNav(e, "/employer-active-package")}>
                  <i className="fa-solid fa-box-open me-2"></i>Active Package
                </a>
              </li>
              <li className={active === "messages" ? "active" : undefined}>
                <a href="/employer-messages" onClick={(e) => handleRestrictedNav(e, "/employer-messages")}>
                  <i className="fa-solid fa-comments me-2"></i>Messages
                  {unreadMessages > 0 && <span className="count-tag">{unreadMessages}</span>}
                </a>
              </li>
              <li className={active === "delete-account" ? "active" : undefined}>
                <Link href="/employer-delete-account" onClick={() => setIsOpen(false)}>
                  <i className="fa-solid fa-trash-can me-2"></i>Delete Account
                </Link>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); setIsOpen(false); handleLogout(); }}>
                  <i className="fa-solid fa-power-off me-2"></i>Log Out
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      {showVerificationModal && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
          <div className="modal fade show d-block" style={{ zIndex: 1060 }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Verification Required</h5>
                  <button type="button" className="btn-close" onClick={() => setShowVerificationModal(false)}></button>
                </div>
                <div className="modal-body">
                  <p className="text-muted mb-4">
                    Please upload the following documents for further verification. Once verified by our admin, you will have full access to the dashboard.
                  </p>
                  
                  {uploadError && <div className="alert alert-danger p-2">{uploadError}</div>}
                  {uploadSuccess && <div className="alert alert-success p-2">{uploadSuccess}</div>}

                  <form onSubmit={handleVerifySubmit}>
                    <div className="form-group mb-3">
                      <label className="fw-medium">GST Certificate <i className="text-danger">*</i></label>
                      <input 
                        type="file" 
                        className="form-control" 
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setGstFile(e.target.files?.[0] || null)}
                        required
                      />
                    </div>
                    <div className="form-group mb-3">
                      <label className="fw-medium">Incorporation Certificate <i className="text-danger">*</i></label>
                      <input 
                        type="file" 
                        className="form-control" 
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setIncFile(e.target.files?.[0] || null)}
                        required
                      />
                    </div>
                    <div className="form-group mb-4">
                      <label className="fw-medium">Signatory ID (Aadhar/PAN) <i className="text-danger">*</i></label>
                      <input 
                        type="file" 
                        className="form-control" 
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setSigFile(e.target.files?.[0] || null)}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary w-100" disabled={uploading}>
                      {uploading ? "Uploading..." : "Submit Documents"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
