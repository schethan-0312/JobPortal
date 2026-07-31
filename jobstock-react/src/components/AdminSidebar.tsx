"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export type AdminSidebarActive = "dashboard" | "employers" | "employer-directory" | "reports" | "audit-log" | "financials" | "integrations" | "security";

interface AdminSidebarProps {
  active?: AdminSidebarActive;
}

export default function AdminSidebar({ active }: AdminSidebarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

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
                <figure>
                  <img src="/assets/img/l-1.png" className="img-fluid circle" alt="" />
                </figure>
              </div>
            </div>
            <div className="jbs-grid-usrs-caption mb-3">
              <div className="jbs-kioyer">
                <span className="label text-light bg-main">Admin</span>
              </div>
              <div className="jbs-tiosk">
                <h4 className="jbs-tiosk-title">{user?.email || "Admin Panel"}</h4>
              </div>
            </div>
          </div>
          <div className="dashboard-inner">
            <ul data-submenu-title="Main Navigation">
              <li className={active === "dashboard" ? "active" : undefined}>
                <Link href="/admin-dashboard">
                  <i className="fa-solid fa-gauge-high me-2"></i>Dashboard
                </Link>
              </li>
              <li className={active === "employers" ? "active" : undefined}>
                <Link href="/admin-employers">
                  <i className="fa-solid fa-user-check me-2"></i>Verify Employers
                </Link>
              </li>
              <li className={active === "employer-directory" ? "active" : undefined}>
                <Link href="/admin-employer-directory">
                  <i className="fa-solid fa-building me-2"></i>Employer Directory
                </Link>
              </li>
              <li className={active === "reports" ? "active" : undefined}>
                <Link href="/admin-reports">
                  <i className="fa-solid fa-flag me-2"></i>Reports
                </Link>
              </li>
              <li className={active === "financials" ? "active" : undefined}>
                <Link href="/admin-financials">
                  <i className="fa-solid fa-sack-dollar me-2"></i>Financials
                </Link>
              </li>
              <li className={active === "audit-log" ? "active" : undefined}>
                <Link href="/admin-audit-log">
                  <i className="fa-solid fa-clock-rotate-left me-2"></i>Audit Log
                </Link>
              </li>
              <li className={active === "integrations" ? "active" : undefined}>
                <Link href="/admin-integrations">
                  <i className="fa-solid fa-plug me-2"></i>Integration Health
                </Link>
              </li>
              <li className={active === "security" ? "active" : undefined}>
                <Link href="/admin-security">
                  <i className="fa-solid fa-shield-halved me-2"></i>Security &amp; Access
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
