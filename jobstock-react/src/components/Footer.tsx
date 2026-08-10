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
      <footer className="footer skin-dark-footer">
        <div>
          <div className="container">
            {/* Brand Header Row */}
            <div className="row align-items-center justify-content-between pb-4 mb-4 border-bottom border-secondary border-opacity-25 gy-3">
              <div className="col-lg-5 col-md-6">
                <Link href="/">
                  <img src="/assets/img/logo-light.png" className="img-footer mb-2" alt="JobStock" />
                </Link>
                <p className="text-light opacity-75 m-0 text-sm">
                  Find the right opportunities, connect with top companies, and build your career with JobStock.
                </p>
              </div>
              <div className="col-lg-5 col-md-6 text-md-end">
                <p className="text-light opacity-75 small mb-2">
                  <i className="fa-solid fa-location-dot me-2 text-main"></i> #176 jp nagar, banglore
                  <span className="mx-2">|</span>
                  <i className="fa-solid fa-envelope me-2 text-main"></i> gtech@gmail.com
                </p>
                <div className="foot-socials d-inline-block">
                  <ul className="mb-0">
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
             

              {/* Column 4: Company */}
              <div className="footer-widget mb-0">
                <h4 className="widget-title">Company</h4>
                <ul className="footer-menu">
                  <li><SmartFooterLink href="/about-us" label="About Us" /></li>
                  <li><SmartFooterLink href="/blog" label="Latest News & Blog" /></li>
                  <li><SmartFooterLink href="/faq" label="FAQs" /></li>
                  <li><SmartFooterLink href="/help" label="Help & Support" /></li>
                  <li><SmartFooterLink href="/contact" label="Contact Us" /></li>
                  <li><SmartFooterLink href="/privacy" label="Privacy & Terms" /></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .footer-nav-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 2.5rem;
            width: 100%;
          }
          @media (max-width: 991px) {
            .footer-nav-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 2rem;
            }
          }
          @media (max-width: 575px) {
            .footer-nav-grid {
              grid-template-columns: repeat(1, minmax(0, 1fr));
              gap: 1.5rem;
            }
          }
        `}</style>

        {/* Bottom Footer */}
        <div className="footer-bottom mt-4">
          <div className="container">
            <div className="row align-items-center justify-content-between gy-3">
              <div className="col-xl-4 col-lg-5 col-md-5">
                <p className="mb-0">
                  &copy; {new Date().getFullYear()} JobStock. 
                 All rights reserved.
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
