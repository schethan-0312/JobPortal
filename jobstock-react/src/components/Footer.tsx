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
      {/* JOBSTOCK Watermark — sits on white bg above the dark footer */}
      <div style={{
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        lineHeight: 0.85,
        textAlign: 'center',
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        <h1 style={{
          fontSize: '16vw',
          fontWeight: 900,
          color: 'rgba(19, 78, 74, 0.08)',
          margin: 0,
          lineHeight: 0.85,
          letterSpacing: '4px',
          display: 'block',
        }}>JOBSTOCK</h1>
      </div>

      <footer className="footer custom-theme-footer position-relative" style={{ backgroundColor: '#134e4a', overflow: 'hidden', padding: '10px 0 5px', color: '#a8c6c4' }}>

        <div className="container position-relative" style={{ zIndex: 1 }}>

          {/* Top Row: Logo | Tagline | Contact | Socials — all in one line */}
          <div className="row align-items-center mb-2 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {/* Logo */}
            <div className="col-auto">
              <Link href="/">
                <img src="/assets/img/logo-light.png" style={{ height: '22px', width: 'auto' }} alt="JobStock" />
              </Link>
            </div>
            {/* Tagline */}
            <div className="col">
              <p className="m-0" style={{ color: '#a8c6c4', fontSize: '0.73rem', lineHeight: 1.3 }}>
                Find the right opportunities and build your career with JobStock.
              </p>
            </div>
            {/* Contact */}
            <div className="col-auto d-none d-md-flex gap-3 align-items-center" style={{ fontSize: '0.73rem', color: '#a8c6c4' }}>
              <span><i className="fa-solid fa-location-dot me-1"></i>#176 jp nagar, banglore</span>
              <span><i className="fa-solid fa-envelope me-1"></i>gtech@gmail.com</span>
            </div>
            {/* Socials */}
            <div className="col-auto">
              <div className="d-inline-flex gap-2">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="f-social-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="f-social-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="f-social-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="f-social-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="currentColor" viewBox="0 0 24 24"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
                </a>
              </div>
            </div>
          </div>

          {/* 4 Navigation Columns */}
          <div className="row g-1 mb-1">
            <div className="col-lg-3 col-md-6 footer-widget">
              <h4 className="widget-title">FOR JOB SEEKERS</h4>
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
            <div className="col-lg-3 col-md-6 footer-widget">
              <h4 className="widget-title">FOR EMPLOYERS</h4>
              <ul className="footer-menu">
                <li><SmartFooterLink href="/employer-submit-job" label="Post a Job" requiredRole="EMPLOYER" /></li>
                <li><SmartFooterLink href="/employer-jobs" label="Manage Jobs" requiredRole="EMPLOYER" /></li>
                <li><SmartFooterLink href="/employer-applicants-jobs" label="Manage Applications" requiredRole="EMPLOYER" /></li>
                <li><SmartFooterLink href="/employer-candidate-search" label="Find Candidates" requiredRole="EMPLOYER" /></li>
                <li><SmartFooterLink href="/employer-dashboard" label="Employer Dashboard" requiredRole="EMPLOYER" /></li>
                <li><SmartFooterLink href="/employer-profile" label="Company Profile" requiredRole="EMPLOYER" /></li>
              </ul>
            </div>
            <div className="col-lg-3 col-md-6 footer-widget">
              <h4 className="widget-title">AI &amp; CAREER TOOLS</h4>
              <ul className="footer-menu">
                <li><SmartFooterLink href="/candidate-resume-builder" label="AI Resume Builder" requiredRole="CANDIDATE" /></li>
                <li><SmartFooterLink href="/candidate-resume-scanner" label="AI Resume Scanner" requiredRole="CANDIDATE" /></li>
                <li><SmartFooterLink href="/candidate-smart-match" label="Smart Job Match" requiredRole="CANDIDATE" /></li>
                <li><SmartFooterLink href="/candidate-mock-interview" label="Mock AI Interview" requiredRole="CANDIDATE" /></li>
                <li><SmartFooterLink href="/candidate-skill-assessment" label="Skill Assessment" requiredRole="CANDIDATE" /></li>
                <li><SmartFooterLink href="/candidate-career-navigator" label="Career Navigator" requiredRole="CANDIDATE" /></li>
              </ul>
            </div>
            <div className="col-lg-3 col-md-6 footer-widget">
              <h4 className="widget-title">COMPANY</h4>
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

          {/* Bottom Copyright */}
          <div className="row pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="col-12 text-center">
              <p className="m-0" style={{ fontSize: '0.75rem', color: '#a8c6c4' }}>&copy; 2026 JobStock. All rights reserved.</p>
            </div>
          </div>
        </div>

        <style jsx>{`
          .footer-widget .widget-title {
            color: #ffffff;
            font-size: 0.72rem;
            font-weight: 700;
            letter-spacing: 1px;
            margin-bottom: 3px;
            text-transform: uppercase;
          }
          .footer-menu {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .footer-menu li {
            margin-bottom: 0;
            padding: 0;
          }
          .footer-menu li :global(a) {
            color: #a8c6c4;
            text-decoration: none;
            font-size: 0.76rem;
            transition: color 0.2s ease;
            line-height: 1.15;
            display: block;
            padding: 1px 0;
          }
          .footer-menu li :global(a:hover) {
            color: #ffffff;
          }
          .f-social-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.25);
            color: #a8c6c4;
            text-decoration: none;
            transition: all 0.2s ease;
          }
          .f-social-btn:hover {
            border-color: #ffffff;
            color: #ffffff;
            background-color: rgba(255,255,255,0.1);
          }
        `}</style>
      </footer>

      <RoleMismatchModal
        show={!!mismatchRole}
        requiredRole={mismatchRole}
        onClose={() => setMismatchRole(null)}
        onOpenLogin={openLoginModal}
      />
    </>
  );
}