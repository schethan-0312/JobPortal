"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, assetUrl } from "@/lib/api";

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
}

interface EmployerJob {
  status: string;
}

export default function EmployerSidebar({ active }: EmployerSidebarProps) {
  const { logout } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [openingsCount, setOpeningsCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const loadProfile = () => {
      api
        .get<EmployerProfile>("/employers/me")
        .then(setProfile)
        .catch(() => setProfile(null));
    };
    
    loadProfile();
    window.addEventListener('profile-updated', loadProfile);

    api
      .get<EmployerJob[]>("/jobs/mine")
      .then((jobs) => setOpeningsCount(jobs.filter((j) => j.status === "OPEN").length))
      .catch(() => setOpeningsCount(0));
    api
      .get<number>("/messages/unread-count")
      .then(setUnreadMessages)
      .catch(() => setUnreadMessages(0));

    return () => {
      window.removeEventListener('profile-updated', loadProfile);
    };
  }, []);

  function handleLogout() {
    logout();
    router.push("/");
  }

  const [isOpen, setIsOpen] = useState(false);

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
              <div className="jbs-kioyer">
                <span className="label text-light bg-main">
                  {openingsCount} Opening{openingsCount !== 1 ? "s" : ""}
                </span>
              </div>
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
                  <i className="fa-solid fa-gauge-high me-2"></i>User Dashboard
                </Link>
              </li>
              <li className={active === "profile" ? "active" : undefined}>
                <Link href="/employer-profile" onClick={() => setIsOpen(false)}>
                  <i className="fa-regular fa-user me-2"></i>User Profile
                </Link>
              </li>
              <li className={active === "jobs" ? "active" : undefined}>
                <Link href="/employer-jobs" onClick={() => setIsOpen(false)}>
                  <i className="fa-solid fa-business-time me-2"></i>My Jobs
                </Link>
              </li>
              <li className={active === "submit-job" ? "active" : undefined}>
                <Link href="/employer-submit-job" onClick={() => setIsOpen(false)}>
                  <i className="fa-solid fa-pen-ruler me-2"></i>Submit Jobs
                </Link>
              </li>
              <li className={active === "applicants-jobs" ? "active" : undefined}>
                <Link href="/employer-applicants-jobs" onClick={() => setIsOpen(false)}>
                  <i className="fa-solid fa-user-group me-2"></i>Applicants Jobs
                </Link>
              </li>
              <li className={active === "candidate-search" ? "active" : undefined}>
                <Link href="/employer-candidate-search" onClick={() => setIsOpen(false)}>
                  <i className="fa-solid fa-magnifying-glass me-2"></i>Find Candidates
                </Link>
              </li>
              <li className={active === "shortlist-candidates" ? "active" : undefined}>
                <Link href="/employer-shortlist-candidates" onClick={() => setIsOpen(false)}>
                  <i className="fa-solid fa-user-clock me-2"></i>Shortlisted Candidates
                </Link>
              </li>
              <li className={active === "auto-shortlist" ? "active" : undefined}>
                <Link href="/employer-auto-shortlist" onClick={() => setIsOpen(false)}>
                  <i className="fa-solid fa-wand-magic-sparkles me-2"></i>AI Auto-Shortlist
                </Link>
              </li>
              <li className={active === "competition" ? "active" : undefined}>
                <Link href="/employer-competition" onClick={() => setIsOpen(false)}>
                  <i className="fa-solid fa-trophy me-2"></i>Competition
                </Link>
              </li>
              <li className={active === "submissions" ? "active" : undefined}>
                <Link href="/employer-submissions" onClick={() => setIsOpen(false)}>
                  <i className="fa-solid fa-clipboard-list me-2"></i>Submissions
                </Link>
              </li>
              <li className={active === "package" ? "active" : undefined}>
                <Link href="/employer-package" onClick={() => setIsOpen(false)}>
                  <i className="fa-solid fa-wallet me-2"></i>Package
                </Link>
              </li>
              <li className={active === "messages" ? "active" : undefined}>
                <Link href="/employer-messages" onClick={() => setIsOpen(false)}>
                  <i className="fa-solid fa-comments me-2"></i>Messages
                  {unreadMessages > 0 && <span className="count-tag">{unreadMessages}</span>}
                </Link>
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
    </>
  );
}
