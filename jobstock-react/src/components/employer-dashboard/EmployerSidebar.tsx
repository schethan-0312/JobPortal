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
  | "change-password"
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
    api
      .get<EmployerProfile>("/employers/me")
      .then(setProfile)
      .catch(() => setProfile(null));
    api
      .get<EmployerJob[]>("/jobs/mine")
      .then((jobs) => setOpeningsCount(jobs.filter((j) => j.status === "OPEN").length))
      .catch(() => setOpeningsCount(0));
    api
      .get<number>("/messages/unread-count")
      .then(setUnreadMessages)
      .catch(() => setUnreadMessages(0));
  }, []);

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <>
      <a
        className="mobNavigation"
        data-bs-toggle="collapse"
        href="#MobNav"
        role="button"
        aria-expanded="false"
        aria-controls="MobNav"
      >
        <i className="fas fa-bars mr-2"></i>Dashboard Navigation
      </a>
      <div className="collapse" id="MobNav">
        <div className="dashboard-nav">
          <div className="dash-user-blocks pt-5">
            <div className="jbs-grid-usrs-thumb">
              <div className="jbs-grid-yuo">
                <Link href="/employer-profile">
                  <figure>
                    <img src={assetUrl(profile?.logoUrl) || "/assets/img/l-12.png"} className="img-fluid circle" alt="" />
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
                  <Link href="/employer-profile">{profile?.companyName || "My Company"}</Link>
                </h4>
              </div>
            </div>
          </div>
          <div className="dashboard-inner">
            <ul data-submenu-title="Main Navigation">
              <li className={active === "dashboard" ? "active" : undefined}>
                <Link href="/employer-dashboard">
                  <i className="fa-solid fa-gauge-high me-2"></i>User Dashboard
                </Link>
              </li>
              <li className={active === "profile" ? "active" : undefined}>
                <Link href="/employer-profile">
                  <i className="fa-regular fa-user me-2"></i>User Profile
                </Link>
              </li>
              <li className={active === "jobs" ? "active" : undefined}>
                <Link href="/employer-jobs">
                  <i className="fa-solid fa-business-time me-2"></i>My Jobs
                </Link>
              </li>
              <li className={active === "submit-job" ? "active" : undefined}>
                <Link href="/employer-submit-job">
                  <i className="fa-solid fa-pen-ruler me-2"></i>Submit Jobs
                </Link>
              </li>
              <li className={active === "applicants-jobs" ? "active" : undefined}>
                <Link href="/employer-applicants-jobs">
                  <i className="fa-solid fa-user-group me-2"></i>Applicants Jobs
                </Link>
              </li>
              <li className={active === "candidate-search" ? "active" : undefined}>
                <Link href="/employer-candidate-search">
                  <i className="fa-solid fa-magnifying-glass me-2"></i>Find Candidates
                </Link>
              </li>
              <li className={active === "shortlist-candidates" ? "active" : undefined}>
                <Link href="/employer-shortlist-candidates">
                  <i className="fa-solid fa-user-clock me-2"></i>Shortlisted Candidates
                </Link>
              </li>
              <li className={active === "auto-shortlist" ? "active" : undefined}>
                <Link href="/employer-auto-shortlist">
                  <i className="fa-solid fa-wand-magic-sparkles me-2"></i>AI Auto-Shortlist
                </Link>
              </li>
              <li className={active === "competition" ? "active" : undefined}>
                <Link href="/employer-competition">
                  <i className="fa-solid fa-trophy me-2"></i>Competition
                </Link>
              </li>
              <li className={active === "submissions" ? "active" : undefined}>
                <Link href="/employer-submissions">
                  <i className="fa-solid fa-clipboard-list me-2"></i>Submissions
                </Link>
              </li>
              <li className={active === "package" ? "active" : undefined}>
                <Link href="/employer-package">
                  <i className="fa-solid fa-wallet me-2"></i>Package
                </Link>
              </li>
              <li className={active === "messages" ? "active" : undefined}>
                <Link href="/employer-messages">
                  <i className="fa-solid fa-comments me-2"></i>Messages
                  {unreadMessages > 0 && <span className="count-tag">{unreadMessages}</span>}
                </Link>
              </li>
              <li className={active === "change-password" ? "active" : undefined}>
                <Link href="/employer-change-password">
                  <i className="fa-solid fa-unlock-keyhole me-2"></i>Change Password
                </Link>
              </li>
              <li className={active === "delete-account" ? "active" : undefined}>
                <Link href="/employer-delete-account">
                  <i className="fa-solid fa-trash-can me-2"></i>Delete Account
                </Link>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
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
