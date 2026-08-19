"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, assetUrl } from "@/lib/api";

export type CandidateSidebarActive =
  | "dashboard"
  | "profile"
  | "resume"
  | "resume-builder"
  | "resume-scanner"
  | "skill-assessment"
  | "mock-interview"
  | "career-navigator"
  | "smart-match"
  | "applied-jobs"
  | "alert-job"
  | "saved-jobs"
  | "follow-employers"
  | "competition"
  | "messages"
  | "change-password"
  | "delete-account";

interface CandidateSidebarProps {
  active?: CandidateSidebarActive;
}

interface CandidateProfile {
  fullName: string;
  headline: string | null;
  profilePhotoUrl: string | null;
}

export default function CandidateSidebar({ active }: CandidateSidebarProps) {
  const { logout } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [alertCount, setAlertCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    api
      .get<CandidateProfile>("/candidates/me")
      .then(setProfile)
      .catch(() => setProfile(null));
    api
      .get<unknown[]>("/candidates/job-alerts")
      .then((data) => setAlertCount(data.length))
      .catch(() => setAlertCount(0));
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
                <Link href="/candidate-profile">
                  <figure>
                    <img
                      src={assetUrl(profile?.profilePhotoUrl) || "/assets/img/user-5.png"}
                      className="img-fluid circle"
                      alt=""
                    />
                  </figure>
                </Link>
              </div>
            </div>
            <div className="jbs-grid-usrs-caption mb-3">
              <div className="jbs-tiosk">
                <h4 className="jbs-tiosk-title">
                  <Link href="/candidate-profile">{profile?.fullName || "My Profile"}</Link>
                </h4>
                <div className="jbs-tiosk-subtitle">
                  <span>{profile?.headline || "Add a headline to your profile"}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="dashboard-inner">
            <ul data-submenu-title="Main Navigation">
              <li className={active === "dashboard" ? "active" : undefined}>
                <Link href="/candidate-dashboard">
                  <i className="fa-solid fa-gauge-high me-2"></i>User Dashboard
                </Link>
              </li>
              <li className={active === "profile" ? "active" : undefined}>
                <Link href="/candidate-profile">
                  <i className="fa-regular fa-user me-2"></i>My Profile
                </Link>
              </li>
              <li className={active === "resume" ? "active" : undefined}>
                <Link href="/candidate-resume">
                  <i className="fa-solid fa-file-pdf me-2"></i>My Resumes
                </Link>
              </li>
              <li className={active === "resume-builder" ? "active" : undefined}>
                <Link href="/candidate-resume-builder">
                  <i className="fa-solid fa-file-pen me-2"></i>AI Resume Builder
                </Link>
              </li>
              <li className={active === "resume-scanner" ? "active" : undefined}>
                <Link href="/candidate-resume-scanner">
                  <i className="fa-solid fa-magnifying-glass-chart me-2"></i>Resume Health Scanner
                </Link>
              </li>
              <li className={active === "skill-assessment" ? "active" : undefined}>
                <Link href="/candidate-skill-assessment">
                  <i className="fa-solid fa-award me-2"></i>Skill Assessments
                </Link>
              </li>
              <li className={active === "mock-interview" ? "active" : undefined}>
                <Link href="/candidate-mock-interview">
                  <i className="fa-solid fa-video me-2"></i>Mock Interviews
                </Link>
              </li>
              <li className={active === "career-navigator" ? "active" : undefined}>
                <Link href="/candidate-career-navigator">
                  <i className="fa-solid fa-route me-2"></i>Career Path Navigator
                </Link>
              </li>
              <li className={active === "smart-match" ? "active" : undefined}>
                <Link href="/candidate-smart-match">
                  <i className="fa-solid fa-wand-magic-sparkles me-2"></i>Smart Job Matches
                </Link>
              </li>
              <li className={active === "applied-jobs" ? "active" : undefined}>
                <Link href="/candidate-applied-jobs">
                  <i className="fa-regular fa-paper-plane me-2"></i>Applied jobs
                </Link>
              </li>
              <li className={active === "alert-job" ? "active" : undefined}>
                <Link href="/candidate-alert-job">
                  <i className="fa-solid fa-bell me-2"></i>Alert Jobs
                  {alertCount > 0 && <span className="count-tag bg-warning">{alertCount}</span>}
                </Link>
              </li>
              <li className={active === "saved-jobs" ? "active" : undefined}>
                <Link href="/candidate-saved-jobs">
                  <i className="fa-solid fa-bookmark me-2"></i>Saved Jobs
                </Link>
              </li>
              <li className={active === "follow-employers" ? "active" : undefined}>
                <Link href="/candidate-follow-employers">
                  <i className="fa-solid fa-user-clock me-2"></i>Following Employers
                </Link>
              </li>
              <li className={active === "competition" ? "active" : undefined}>
                <Link href="/candidate-competition">
                  <i className="fa-solid fa-trophy me-2"></i>Competition
                </Link>
              </li>
              <li className={active === "messages" ? "active" : undefined}>
                <Link href="/candidate-messages">
                  <i className="fa-solid fa-comments me-2"></i>Messages
                  {unreadMessages > 0 && <span className="count-tag">{unreadMessages}</span>}
                </Link>
              </li>
              <li className={active === "change-password" ? "active" : undefined}>
                <Link href="/candidate-change-password">
                  <i className="fa-solid fa-unlock-keyhole me-2"></i>Change Password
                </Link>
              </li>
              <li className={active === "delete-account" ? "active" : undefined}>
                <Link href="/candidate-delete-account">
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
