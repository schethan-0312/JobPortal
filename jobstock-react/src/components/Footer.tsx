"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import RoleMismatchModal from "./RoleMismatchModal";

interface PublicStats {
  totalJobs: number;
  totalCandidates: number;
  totalVerifiedEmployers: number;
  totalApplications: number;
}

export default function Footer() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [mismatchRole, setMismatchRole] = useState<"CANDIDATE" | "EMPLOYER" | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    seekers: false,
    employers: false,
    tools: false,
    company: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<PublicStats>("/stats", { auth: false });
        setStats(data);
      } catch {
        // fail silently if stats unavailable
      }
    })();
  }, []);

  const openLoginModal = () => {
    const loginModalBtn = document.querySelector<HTMLElement>('[data-bs-target="#login"]');
    if (loginModalBtn) {
      loginModalBtn.click();
    } else {
      router.push("/signup");
    }
  };

  const handleLinkClick = (
    e: React.MouseEvent,
    href: string,
    requiredRole?: "CANDIDATE" | "EMPLOYER",
    candidateOnly?: boolean
  ) => {
    if (user?.role === "EMPLOYER" && (requiredRole === "CANDIDATE" || candidateOnly)) {
      e.preventDefault();
      setMismatchRole("CANDIDATE");
      return;
    }

    if (user?.role === "CANDIDATE" && requiredRole === "EMPLOYER") {
      e.preventDefault();
      setMismatchRole("EMPLOYER");
      return;
    }

    if (!user && requiredRole) {
      e.preventDefault();
      openLoginModal();
      return;
    }
  };

  function SmartFooterLink({
    href,
    label,
    requiredRole,
    candidateOnly,
  }: {
    href: string;
    label: string;
    requiredRole?: "CANDIDATE" | "EMPLOYER";
    candidateOnly?: boolean;
  }) {
    const isEmployerBlocked = user?.role === "EMPLOYER" && (requiredRole === "CANDIDATE" || candidateOnly);
    const isCandidateBlocked = user?.role === "CANDIDATE" && requiredRole === "EMPLOYER";
    const isLoggedOutBlocked = !user && !!requiredRole;

    if (isEmployerBlocked || isCandidateBlocked || isLoggedOutBlocked) {
      return (
        <a
          href={href}
          onClick={(e) => handleLinkClick(e, href, requiredRole, candidateOnly)}
          data-bs-toggle={!user ? "modal" : undefined}
          data-bs-target={!user ? "#login" : undefined}
        >
          {label}
        </a>
      );
    }

    return <Link href={href}>{label}</Link>;
  }

  return (
    <>
      <footer className="footer custom-theme-footer">
        <div>
          <div className="container">
            {/* Brand Header Row */}
            <div className="row align-items-center justify-content-between pb-3 mb-3 footer-top-border gy-2">
              <div className="col-lg-5 col-md-6">
                <Link href="/">
                  <img
                    src="/assets/img/logo-light.png"
                    className="img-footer mb-1.5"
                    style={{ height: "30px", width: "auto" }}
                    alt="JobStock"
                  />
                </Link>
                <p className="m-0 text-sm" style={{ color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.4, fontSize: "0.85rem" }}>
                  Find the right opportunities, connect with top companies, and build your career with JobStock.
                </p>
              </div>
              <div className="col-lg-5 col-md-6 text-md-end">
                <p className="small mb-1.5" style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "0.825rem" }}>
                  <i className="fa-solid fa-location-dot me-1.5" style={{ color: "#5df0c2" }}></i> #176 jp nagar, banglore
                  <span className="mx-2" style={{ opacity: 0.5 }}>|</span>
                  <i className="fa-solid fa-envelope me-1.5" style={{ color: "#5df0c2" }}></i> gtech@gmail.com
                </p>
                <div className="foot-socials d-inline-block">
                  <ul className="mb-0 p-0 d-flex gap-1.5 justify-content-md-end" style={{ listStyle: "none" }}>
                    <li>
                      <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                        <i className="fa-brands fa-facebook"></i>
                      </a>
                    </li>
                    <li>
                      <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                        <i className="fa-brands fa-linkedin"></i>
                      </a>
                    </li>
                    <li>
                      <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                        <i className="fa-brands fa-twitter"></i>
                      </a>
                    </li>
                    <li>
                      <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                        <i className="fa-brands fa-github"></i>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 4 Equal Navigation Columns Grid */}
            <div className="footer-nav-grid">
              {/* Column 1: For Job Seekers */}
              <div className="footer-widget mb-0">
                <h4
                  className={`widget-title d-flex justify-content-between align-items-center ${expandedSections.seekers ? 'active' : ''}`}
                  onClick={() => toggleSection("seekers")}
                >
                  <span>For Job Seekers</span>
                  <i className={`fa-solid fa-chevron-down chevron-icon ${expandedSections.seekers ? 'expanded' : ''}`}></i>
                </h4>
                <div className={`footer-menu-container ${expandedSections.seekers ? 'expanded' : ''}`}>
                  <ul className="footer-menu">
                    <li><SmartFooterLink href="/jobs" label="Find Jobs" /></li>
                    <li><SmartFooterLink href="/candidates" label="Explore Candidates" /></li>
                    <li><SmartFooterLink href="/employers" label="Explore Companies" /></li>
                    <li><SmartFooterLink href="/candidate-saved-jobs" label="Saved Jobs" requiredRole="CANDIDATE" /></li>
                    <li><SmartFooterLink href="/candidate-applied-jobs" label="Applied Jobs" requiredRole="CANDIDATE" /></li>
                    <li><SmartFooterLink href="/candidate-profile" label="My Profile" requiredRole="CANDIDATE" /></li>
                    <li><SmartFooterLink href="/candidate-alert-job" label="Job Alerts" requiredRole="CANDIDATE" /></li>
                  </ul>
                </div>
              </div>

              {/* Column 2: For Employers */}
              <div className="footer-widget mb-0">
                <h4
                  className={`widget-title d-flex justify-content-between align-items-center ${expandedSections.employers ? 'active' : ''}`}
                  onClick={() => toggleSection("employers")}
                >
                  <span>For Employers</span>
                  <i className={`fa-solid fa-chevron-down chevron-icon ${expandedSections.employers ? 'expanded' : ''}`}></i>
                </h4>
                <div className={`footer-menu-container ${expandedSections.employers ? 'expanded' : ''}`}>
                  <ul className="footer-menu">
                    <li><SmartFooterLink href="/employer-submit-job" label="Post a Job" requiredRole="EMPLOYER" /></li>
                    <li><SmartFooterLink href="/employer-jobs" label="Manage Jobs" requiredRole="EMPLOYER" /></li>
                    <li><SmartFooterLink href="/employer-applicants-jobs" label="Manage Applications" requiredRole="EMPLOYER" /></li>
                    <li><SmartFooterLink href="/employer-candidate-search" label="Find Candidates" requiredRole="EMPLOYER" /></li>
                    <li><SmartFooterLink href="/employer-dashboard" label="Employer Dashboard" requiredRole="EMPLOYER" /></li>
                    <li><SmartFooterLink href="/employer-profile" label="Company Profile" requiredRole="EMPLOYER" /></li>
                  </ul>
                </div>
              </div>

              {/* Column 3: AI & Career Tools */}
              <div className="footer-widget mb-0">
                <h4
                  className={`widget-title d-flex justify-content-between align-items-center ${expandedSections.tools ? 'active' : ''}`}
                  onClick={() => toggleSection("tools")}
                >
                  <span>AI &amp; Career Tools</span>
                  <i className={`fa-solid fa-chevron-down chevron-icon ${expandedSections.tools ? 'expanded' : ''}`}></i>
                </h4>
                <div className={`footer-menu-container ${expandedSections.tools ? 'expanded' : ''}`}>
                  <ul className="footer-menu">
                    <li><SmartFooterLink href="/candidate-resume-builder" label="AI Resume Builder" requiredRole="CANDIDATE" /></li>
                    <li><SmartFooterLink href="/candidate-resume-scanner" label="AI Resume Scanner" requiredRole="CANDIDATE" /></li>
                    <li><SmartFooterLink href="/candidate-smart-match" label="Smart Job Match" requiredRole="CANDIDATE" /></li>
                    <li><SmartFooterLink href="/candidate-mock-interview" label="Mock AI Interview" requiredRole="CANDIDATE" /></li>
                    <li><SmartFooterLink href="/candidate-skill-assessment" label="Skill Assessment" requiredRole="CANDIDATE" /></li>
                    <li><SmartFooterLink href="/candidate-career-navigator" label="Career Navigator" requiredRole="CANDIDATE" /></li>
                  </ul>
                </div>
              </div>

              {/* Column 4: Company */}
              <div className="footer-widget mb-0">
                <h4
                  className={`widget-title d-flex justify-content-between align-items-center ${expandedSections.company ? 'active' : ''}`}
                  onClick={() => toggleSection("company")}
                >
                  <span>Company</span>
                  <i className={`fa-solid fa-chevron-down chevron-icon ${expandedSections.company ? 'expanded' : ''}`}></i>
                </h4>
                <div className={`footer-menu-container ${expandedSections.company ? 'expanded' : ''}`}>
                  <ul className="footer-menu">
                    <li><SmartFooterLink href="/about-us" label="About Us" /></li>
                    <li><SmartFooterLink href="/blog" label="Latest News &amp; Blog" /></li>
                    <li><SmartFooterLink href="/faq" label="FAQs" /></li>
                    <li><SmartFooterLink href="/help" label="Help &amp; Support" /></li>
                    <li><SmartFooterLink href="/contact" label="Contact Us" /></li>
                    <li><SmartFooterLink href="/privacy" label="Privacy Policy" /></li>
                    <li><SmartFooterLink href="/terms" label="Terms of Service" /></li>
                    <li><SmartFooterLink href="/cookie-policy" label="Cookie Policy" /></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          footer.custom-theme-footer {
            background-color: #145758 !important;
            color: #ffffff !important;
            font-family: 'Inter', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important;
            padding: 24px 0 12px !important;
          }
          .footer-top-border {
            border-bottom: 1px solid rgba(255, 255, 255, 0.15) !important;
          }
          :global(.footer-widget) {
            padding: 0 !important;
          }
          :global(h4.widget-title) {
            color: #ffffff !important;
            font-size: 0.95rem !important;
            font-weight: 700 !important;
            letter-spacing: 0.2px !important;
            margin-bottom: 8px !important;
          }
          :global(.footer-menu) {
            list-style: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          :global(.footer-menu li) {
            margin-top: 4px !important;
          }
          :global(.footer-menu li a) {
            color: rgba(255, 255, 255, 0.85) !important;
            font-size: 0.85rem !important;
            font-weight: 500 !important;
            text-decoration: none !important;
            transition: all 0.2s ease !important;
          }
          :global(.footer-menu li a:hover) {
            color: #5df0c2 !important;
            padding-left: 3px !important;
          }
          :global(.foot-socials ul li a) {
            width: 32px !important;
            height: 32px !important;
            border-radius: 50% !important;
            background-color: rgba(255, 255, 255, 0.12) !important;
            color: #ffffff !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            text-decoration: none !important;
            transition: all 0.2s ease !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            font-size: 0.85rem !important;
          }
          :global(.foot-socials ul li a:hover) {
            background-color: #5df0c2 !important;
            color: #0e3b3c !important;
            transform: translateY(-2px) !important;
          }
          :global(.footer-bottom) {
            padding: 10px 0 0 !important;
          }
          .footer-nav-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 1.5rem;
            width: 100%;
          }
          .footer-menu-container {
            transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease-in-out;
          }
          @media (max-width: 991px) {
            .footer-nav-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 1.25rem;
            }
          }
          @media (max-width: 767px) {
            footer.custom-theme-footer {
              padding: 20px 0 10px !important;
            }
            .footer-top-border {
              padding-bottom: 1rem !important;
              margin-bottom: 1rem !important;
              text-align: center;
            }
            .footer-top-border .text-md-end {
              text-align: center !important;
              margin-top: 8px;
            }
            .footer-top-border .justify-content-md-end {
              justify-content: center !important;
            }
            .footer-nav-grid {
              grid-template-columns: 1fr !important;
              gap: 0.25rem !important;
            }
            .footer-widget {
              border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
              padding-bottom: 6px !important;
              margin-bottom: 6px !important;
            }
            .footer-widget:last-child {
              border-bottom: none !important;
              padding-bottom: 0 !important;
              margin-bottom: 0 !important;
            }
            :global(h4.widget-title) {
              margin-bottom: 0 !important;
              padding: 6px 0 !important;
              cursor: pointer !important;
              user-select: none;
            }
            :global(h4.widget-title.active) {
              color: #5df0c2 !important;
            }
            .footer-menu-container {
              max-height: 0;
              opacity: 0;
              overflow: hidden;
            }
            .footer-menu-container.expanded {
              max-height: 400px;
              opacity: 1;
              padding-bottom: 8px;
            }
            :global(.chevron-icon) {
              font-size: 0.85rem !important;
              transition: transform 0.3s ease, color 0.3s ease !important;
              color: rgba(255, 255, 255, 0.5) !important;
              display: inline-block !important;
            }
            :global(.chevron-icon.expanded) {
              transform: rotate(180deg) !important;
              color: #5df0c2 !important;
            }
            :global(.footer-bottom) {
              text-align: center;
              margin-top: 1rem !important;
            }
            :global(.footer-bottom .text-md-end) {
              text-align: center !important;
              margin-top: 4px;
            }
          }
          @media (min-width: 768px) {
            :global(.chevron-icon) {
              display: none !important;
            }
            .footer-menu-container {
              max-height: none !important;
              opacity: 1 !important;
              overflow: visible !important;
            }
          }
        `}</style>

        {/* Bottom Footer */}
        <div className="footer-bottom mt-3 border-top border-white border-opacity-15 pt-2">
          <div className="container">
            <div className="row align-items-center justify-content-between gy-1">
              <div className="col-xl-6 col-lg-6 col-md-6">
                <p className="mb-0" style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "0.825rem" }}>
                  &copy; {new Date().getFullYear()} <strong style={{ color: "#ffffff" }}>JobStock</strong>. All rights reserved.
                </p>
              </div>
              <div className="col-xl-6 col-lg-6 col-md-6 text-md-end">
                <p className="mb-0" style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "0.825rem" }}>
                  Designed &amp; Built for Career Growth
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Role Mismatch Modal */}
      <RoleMismatchModal
        show={!!mismatchRole}
        requiredRole={mismatchRole}
        onClose={() => setMismatchRole(null)}
        onOpenLogin={openLoginModal}
      />
    </>
  );
}
