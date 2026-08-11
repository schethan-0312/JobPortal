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
            <div className="row align-items-center justify-content-between pb-4 mb-4 footer-top-border gy-3">
              <div className="col-lg-5 col-md-6">
                <Link href="/">
                  <img
                    src="/assets/img/logo-light.png"
                    className="img-footer mb-2"
                    style={{ height: "38px", width: "auto" }}
                    alt="JobStock"
                  />
                </Link>
                <p className="m-0 text-sm" style={{ color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.6, fontSize: "0.925rem" }}>
                  Find the right opportunities, connect with top companies, and build your career with JobStock.
                </p>
              </div>
              <div className="col-lg-5 col-md-6 text-md-end">
                <p className="small mb-2" style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "0.875rem" }}>
                  <i className="fa-solid fa-location-dot me-2" style={{ color: "#5df0c2" }}></i> #176 jp nagar, banglore
                  <span className="mx-2" style={{ opacity: 0.5 }}>|</span>
                  <i className="fa-solid fa-envelope me-2" style={{ color: "#5df0c2" }}></i> gtech@gmail.com
                </p>
                <div className="foot-socials d-inline-block">
                  <ul className="mb-0 p-0 d-flex gap-2 justify-content-md-end" style={{ listStyle: "none" }}>
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
                <h4 className="widget-title">For Job Seekers</h4>
                <ul className="footer-menu">
                  <li><SmartFooterLink href="/jobs" label="Find Jobs" candidateOnly={true} /></li>
                  <li><SmartFooterLink href="/jobs" label="Quick Apply" candidateOnly={true} /></li>
                  <li><SmartFooterLink href="/employers" label="Explore Employers" candidateOnly={true} /></li>
                  <li><SmartFooterLink href="/candidate-saved-jobs" label="Saved Jobs" requiredRole="CANDIDATE" /></li>
                  <li><SmartFooterLink href="/candidate-applied-jobs" label="Applied Jobs" requiredRole="CANDIDATE" /></li>
                  <li><SmartFooterLink href="/candidate-profile" label="My Profile" requiredRole="CANDIDATE" /></li>
                  <li><SmartFooterLink href="/candidate-alert-job" label="Job Alerts" requiredRole="CANDIDATE" /></li>
                </ul>
              </div>

              {/* Column 2: For Employers */}
              <div className="footer-widget mb-0">
                <h4 className="widget-title">For Employers</h4>
                <ul className="footer-menu">
                  <li><SmartFooterLink href="/employer-submit-job" label="Post a Job" requiredRole="EMPLOYER" /></li>
                  <li><SmartFooterLink href="/employer-jobs" label="Manage Jobs" requiredRole="EMPLOYER" /></li>
                  <li><SmartFooterLink href="/employer-applicants-jobs" label="Manage Applications" requiredRole="EMPLOYER" /></li>
                  <li><SmartFooterLink href="/employer-candidate-search" label="Find Candidates" requiredRole="EMPLOYER" /></li>
                  <li><SmartFooterLink href="/employer-dashboard" label="Employer Dashboard" requiredRole="EMPLOYER" /></li>
                  <li><SmartFooterLink href="/employer-profile" label="Company Profile" requiredRole="EMPLOYER" /></li>
                </ul>
              </div>

              {/* Column 3: AI & Career Tools */}
              <div className="footer-widget mb-0">
                <h4 className="widget-title">AI &amp; Career Tools</h4>
                <ul className="footer-menu">
                  <li><SmartFooterLink href="/candidate-resume-builder" label="AI Resume Builder" requiredRole="CANDIDATE" /></li>
                  <li><SmartFooterLink href="/candidate-resume-scanner" label="AI Resume Scanner" requiredRole="CANDIDATE" /></li>
                  <li><SmartFooterLink href="/candidate-smart-match" label="Smart Job Match" requiredRole="CANDIDATE" /></li>
                  <li><SmartFooterLink href="/candidate-mock-interview" label="Mock AI Interview" requiredRole="CANDIDATE" /></li>
                  <li><SmartFooterLink href="/candidate-skill-assessment" label="Skill Assessment" requiredRole="CANDIDATE" /></li>
                  <li><SmartFooterLink href="/candidate-career-navigator" label="Career Navigator" requiredRole="CANDIDATE" /></li>
                </ul>
              </div>

              {/* Column 4: Company */}
              <div className="footer-widget mb-0">
                <h4 className="widget-title">Company</h4>
                <ul className="footer-menu">
                  <li><SmartFooterLink href="/about-us" label="About Us" /></li>
                  <li><SmartFooterLink href="/blog" label="Latest News &amp; Blog" /></li>
                  <li><SmartFooterLink href="/faq" label="FAQs" /></li>
                  <li><SmartFooterLink href="/help" label="Help &amp; Support" /></li>
                  <li><SmartFooterLink href="/contact" label="Contact Us" /></li>
                  <li><SmartFooterLink href="/privacy" label="Privacy &amp; Terms" /></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          footer.custom-theme-footer {
            background-color: #145758 !important;
            color: #ffffff !important;
            font-family: 'Inter', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important;
            padding: 45px 0 20px !important;
          }
          .footer-top-border {
            border-bottom: 1px solid rgba(255, 255, 255, 0.15) !important;
          }
          :global(.footer-widget) {
            padding: 0 !important;
          }
          :global(h4.widget-title) {
            color: #ffffff !important;
            font-size: 1.05rem !important;
            font-weight: 700 !important;
            letter-spacing: 0.3px !important;
            margin-bottom: 14px !important;
          }
          :global(.footer-menu) {
            list-style: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          :global(.footer-menu li) {
            margin-top: 8px !important;
          }
          :global(.footer-menu li a) {
            color: rgba(255, 255, 255, 0.85) !important;
            font-size: 0.925rem !important;
            font-weight: 500 !important;
            text-decoration: none !important;
            transition: all 0.2s ease !important;
          }
          :global(.footer-menu li a:hover) {
            color: #5df0c2 !important;
            padding-left: 3px !important;
          }
          :global(.foot-socials ul li a) {
            width: 36px !important;
            height: 36px !important;
            border-radius: 50% !important;
            background-color: rgba(255, 255, 255, 0.12) !important;
            color: #ffffff !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            text-decoration: none !important;
            transition: all 0.2s ease !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
          }
          :global(.foot-socials ul li a:hover) {
            background-color: #5df0c2 !important;
            color: #0e3b3c !important;
            transform: translateY(-2px) !important;
          }
          :global(.footer-bottom) {
            padding: 16px 0 0 !important;
          }
          .footer-nav-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 2rem;
            width: 100%;
          }
          @media (max-width: 991px) {
            .footer-nav-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 1.5rem;
            }
          }
          @media (max-width: 575px) {
            .footer-nav-grid {
              grid-template-columns: repeat(1, minmax(0, 1fr));
              gap: 1.25rem;
            }
          }
        `}</style>

        {/* Bottom Footer */}
        <div className="footer-bottom mt-4 border-top border-white border-opacity-15 pt-3">
          <div className="container">
            <div className="row align-items-center justify-content-between gy-2">
              <div className="col-xl-6 col-lg-6 col-md-6">
                <p className="mb-0" style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "0.875rem" }}>
                  &copy; {new Date().getFullYear()} <strong style={{ color: "#ffffff" }}>JobStock</strong>. All rights reserved.
                </p>
              </div>
              <div className="col-xl-6 col-lg-6 col-md-6 text-md-end">
                <p className="mb-0" style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "0.875rem" }}>
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
