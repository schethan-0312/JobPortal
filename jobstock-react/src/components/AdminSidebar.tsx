"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export type AdminSidebarActive = "dashboard" | "employers" | "reports" | "ai-monitoring" | "analytics" | "messages" | (string & {});

interface AdminSidebarProps {
  active?: AdminSidebarActive;
}

export default function AdminSidebar({ active }: AdminSidebarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    let isMounted = true;
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
                <Link href="/admin-dashboard" onClick={() => setIsOpen(false)}><i className="fa-solid fa-gauge-high me-2"></i>Dashboard</Link>
              </li>
              <li className={active === "packages" ? "active" : undefined}>
                <Link href="/admin-packages" onClick={() => setIsOpen(false)}><i className="fa-solid fa-box-archive me-2"></i>Package</Link>
              </li>
              <li className={active === "resume-packages" ? "active" : undefined}>
                <Link href="/admin-resume-packages" onClick={() => setIsOpen(false)}><i className="fa-solid fa-file-invoice me-2"></i>Resume Package</Link>
              </li>
              <li className={active === "employers" ? "active" : undefined}>
                <Link href="/admin-employers" onClick={() => setIsOpen(false)}><i className="fa-solid fa-user-check me-2"></i>Verify Employers</Link>
              </li>
              <li className={active === "candidates" ? "active" : undefined}>
                <Link href="/admin-candidates" onClick={() => setIsOpen(false)}><i className="fa-solid fa-users me-2"></i>Manage Candidates</Link>
              </li>
              <li className={active === "jobs" ? "active" : undefined}>
                <Link href="/admin-jobs" onClick={() => setIsOpen(false)}><i className="fa-solid fa-briefcase me-2"></i>Manage Jobs</Link>
              </li>
              <li className={active === "employer-directory" ? "active" : undefined}>
                <Link href="/admin-employer-directory" onClick={() => setIsOpen(false)}><i className="fa-solid fa-building me-2"></i>Employer Directory</Link>
              </li>
              <li className={active === "financials" ? "active" : undefined}>
                <Link href="/admin-financials" onClick={() => setIsOpen(false)}><i className="fa-solid fa-money-bill-wave me-2"></i>Financials</Link>
              </li>
              <li className={active === "reports" ? "active" : undefined}>
                <Link href="/admin-reports" onClick={() => setIsOpen(false)}><i className="fa-solid fa-flag me-2"></i>Reports</Link>
              </li>
              <li className={active === "analytics" ? "active" : undefined}>
                <Link href="/admin-analytics" onClick={() => setIsOpen(false)}><i className="fa-solid fa-chart-line me-2"></i>Analytics</Link>
              </li>
              <li className={active === "content" ? "active" : undefined}>
                <Link href="/admin-content" onClick={() => setIsOpen(false)}><i className="fa-solid fa-file-alt me-2"></i>Content Mgt</Link>
              </li>
              <li className={active === "seo" ? "active" : undefined}>
                <Link href="/admin-seo" onClick={() => setIsOpen(false)}><i className="fa-solid fa-search me-2"></i>SEO</Link>
              </li>
              <li className={active === "ai" ? "active" : undefined}>
                <Link href="/admin-ai" onClick={() => setIsOpen(false)}><i className="fa-solid fa-robot me-2"></i>AI Config</Link>
              </li>
              <li className={active === "tokens" ? "active" : undefined}>
                <Link href="/admin-tokens" onClick={() => setIsOpen(false)}><i className="fa-solid fa-calculator me-2"></i>Token Usage</Link>
              </li>
              <li className={active === "proctoring" ? "active" : undefined}>
                <Link href="/admin-proctoring" onClick={() => setIsOpen(false)}><i className="fa-solid fa-video me-2"></i>Proctoring</Link>
              </li>
              <li className={active === "support" ? "active" : undefined}>
                <Link href="/admin-support" onClick={() => setIsOpen(false)}><i className="fa-solid fa-headset me-2"></i>Support</Link>
              </li>
              <li className={active === "messages" ? "active" : undefined}>
                <Link href="/admin-messages" onClick={() => setIsOpen(false)}>
                  <i className="fa-solid fa-comments me-2"></i>Employee Messages
                  {unreadMessages > 0 && <span className="count-tag">{unreadMessages}</span>}
                </Link>
              </li>
              <li className={active === "search" ? "active" : undefined}>
                <Link href="/admin-search" onClick={() => setIsOpen(false)}><i className="fa-solid fa-magnifying-glass me-2"></i>Search Config</Link>
              </li>
              <li className={active === "integrations" ? "active" : undefined}>
                <Link href="/admin-integrations" onClick={() => setIsOpen(false)}><i className="fa-solid fa-plug me-2"></i>Integrations</Link>
              </li>
              <li className={active === "database" ? "active" : undefined}>
                <Link href="/admin-database" onClick={() => setIsOpen(false)}><i className="fa-solid fa-database me-2"></i>Database</Link>
              </li>
              <li className={active === "security" ? "active" : undefined}>
                <Link href="/admin-security" onClick={() => setIsOpen(false)}><i className="fa-solid fa-shield-halved me-2"></i>Security</Link>
              </li>
              <li className={active === "audit-log" ? "active" : undefined}>
                <Link href="/admin-audit-log" onClick={() => setIsOpen(false)}><i className="fa-solid fa-clipboard-list me-2"></i>Audit Log</Link>
              </li>
              <li className={active === "background-jobs" ? "active" : undefined}>
                <Link href="/admin-background-jobs" onClick={() => setIsOpen(false)}><i className="fa-solid fa-gears me-2"></i>Background Jobs</Link>
              </li>
              <li className={active === "legal" ? "active" : undefined}>
                <Link href="/admin-legal" onClick={() => setIsOpen(false)}><i className="fa-solid fa-scale-balanced me-2"></i>Legal & Compliance</Link>
              </li>
              <li className={active === "team" ? "active" : undefined}>
                <Link href="/admin-team" onClick={() => setIsOpen(false)}><i className="fa-solid fa-users-gear me-2"></i>Admin Team</Link>
              </li>
              <li className={active === "system-config" ? "active" : undefined}>
                <Link href="/admin-system-config" onClick={() => setIsOpen(false)}><i className="fa-solid fa-sliders me-2"></i>System Config</Link>
              </li>
              <li>
                <a href="#!" onClick={(e) => { e.preventDefault(); setIsOpen(false); handleLogout(); }}>
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

