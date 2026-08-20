"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import RoleMismatchModal from "../RoleMismatchModal";

const candidateAiTools = [
  {
    id: "resume-builder",
    icon: "fa-solid fa-file-pen",
    image: "/img/ai-tools/resume-builder.jpg",
    title: "AI Resume Builder",
    tag: "ATS Optimized",
    badgeBg: "badge-theme-subtle",
    description: "Create professional, ATS-friendly resumes in minutes with intelligent suggestions tailored to target roles.",
    href: "/candidate-resume-builder",
    targetRole: "CANDIDATE" as const,
  },
  {
    id: "resume-scanner",
    icon: "fa-solid fa-magnifying-glass-chart",
    image: "/img/ai-tools/resume-scanner.jpg",
    title: "Resume Health Scanner",
    tag: "Instant Audit",
    badgeBg: "badge-theme-subtle",
    description: "Scan your resume against live job descriptions to uncover score gaps, missing keywords, and formatting tips.",
    href: "/candidate-resume-scanner",
    targetRole: "CANDIDATE" as const,
  },
  {
    id: "smart-match",
    icon: "fa-solid fa-wand-magic-sparkles",
    image: "/img/ai-tools/smart-match.jpg",
    title: "Smart Job Matches",
    tag: "AI Recommendations",
    badgeBg: "badge-theme-subtle",
    description: "Get AI-curated job recommendations calculated based on your unique skills, preferences, and experience.",
    href: "/candidate-smart-match",
    targetRole: "CANDIDATE" as const,
  },
];

const employerAiTools = [
  {
    id: "employer-job-posting",
    icon: "fa-solid fa-briefcase",
    image: "/img/ai-tools/career-navigator.jpg",
    title: "Employer Job Posting",
    tag: "Post Jobs",
    badgeBg: "badge-theme-subtle",
    description: "Create and publish structured job listings to reach top verified candidates across all industry categories.",
    href: "/employer-submit-job",
    targetRole: "EMPLOYER" as const,
  },
  {
    id: "manage-job-listings",
    icon: "fa-solid fa-list-check",
    image: "/img/ai-tools/skill-assessment.jpg",
    title: "Manage Job Listings",
    tag: "My Jobs",
    badgeBg: "badge-theme-subtle",
    description: "Track active and closed job postings, review applicant counts, and update job statuses in real time.",
    href: "/employer-jobs",
    targetRole: "EMPLOYER" as const,
  },
  {
    id: "employer-dashboard",
    icon: "fa-solid fa-users-gear",
    image: "/img/ai-tools/mock-interview.jpg",
    title: "Employer Dashboard & Hiring",
    tag: "Hiring Suite",
    badgeBg: "badge-theme-subtle",
    description: "Manage company profile details, review incoming candidate applications, and streamline your recruitment workflow.",
    href: "/employer-dashboard",
    targetRole: "EMPLOYER" as const,
  },
];

export default function Categories() {
  const { user } = useAuth();
  const router = useRouter();
  const [mismatchRole, setMismatchRole] = useState<"CANDIDATE" | "EMPLOYER" | null>(null);

  const openLoginModal = () => {
    const loginModalBtn = document.querySelector<HTMLElement>('[data-bs-target="#login"]');
    if (loginModalBtn) {
      loginModalBtn.click();
    } else {
      router.push("/signup");
    }
  };

  const handleCardClick = (e: React.MouseEvent, href: string, targetRole: "CANDIDATE" | "EMPLOYER") => {
    if (!user) {
      e.preventDefault();
      openLoginModal();
      return;
    }

    if (user.role !== targetRole) {
      e.preventDefault();
      setMismatchRole(targetRole);
      return;
    }
  };

  return (
    <>
      <section className="gray-simple py-5 position-relative overflow-hidden">
        <div className="container py-2">
          {/* Candidate Section Headline */}
          <div className="row justify-content-center mb-4">
            <div className="col-xl-8 col-lg-9 col-md-10 text-center">
              <div className="sec-heading center mb-4">
                <span className="badge bg-main-light text-main fw-semibold px-3 py-2 rounded-pill fs-7 mb-2 d-inline-flex align-items-center gap-1">
                  <i className="fa-solid fa-user-astronaut text-main"></i> For Candidates / Job Seekers
                </span>
                <h2 className="fw-bold fs-2 text-dark mt-2 mb-2">
                  Accelerate Your Job Search with <span className="text-main">Candidate AI Suite</span>
                </h2>
                <p className="text-muted fs-6 lh-base m-0">
                  Supercharge your career with intelligent tools — from AI resume building to real-time skill matching.
                </p>
              </div>
            </div>
          </div>

          {/* Row 1: Candidate AI Tools Cards (3 Cards) */}
          <div className="row justify-content-center g-4 mb-5">
            {candidateAiTools.map((tool) => (
              <div className="col-xl-4 col-lg-4 col-md-6" key={tool.id}>
                <Link
                  href={tool.href}
                  onClick={(e) => handleCardClick(e, tool.href, tool.targetRole)}
                  className="ai-suite-card h-100 d-flex flex-column justify-content-between text-decoration-none rounded-4 bg-white border position-relative"
                  data-bs-toggle={!user ? "modal" : undefined}
                  data-bs-target={!user ? "#login" : undefined}
                >
                  {/* Top Hover Gradient Bar */}
                  <div className="card-hover-bar" style={{ zIndex: 2 }}></div>

                  {/* Top Image */}
                  <div className="w-100 position-relative" style={{ height: "180px", overflow: "hidden", borderTopLeftRadius: "1rem", borderTopRightRadius: "1rem" }}>
                    <img src={tool.image} alt={tool.title} className="w-100 h-100 ai-card-image" style={{ objectFit: "cover", transition: "transform 0.4s ease" }} />
                    <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0) 60%, rgba(255,255,255,1) 100%)" }}></div>
                  </div>

                  <div className="p-4 pt-2 d-flex flex-column flex-grow-1">
                    {/* Header: Icon + Badge Tag */}
                    <div className="d-flex align-items-center justify-content-between mb-3 position-relative" style={{ marginTop: "-24px", zIndex: 1 }}>
                      <div className="ai-card-icon rounded-3 d-flex align-items-center justify-content-center border border-white border-2">
                        <i className={`${tool.icon} fs-4`}></i>
                      </div>
                      <span className={`badge rounded-pill px-3 py-2 fw-medium fs-8 ${tool.badgeBg}`}>
                        {tool.tag}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="fs-5 fw-bold text-dark mb-2 ai-card-title">
                      {tool.title}
                    </h3>
                    <p className="text-secondary fs-7 mb-4 lh-base flex-grow-1">
                      {tool.description}
                    </p>

                    {/* Footer Action Link */}
                    <div className="d-flex align-items-center justify-content-between pt-3 border-top border-light-subtle">
                      <span className="fw-semibold text-main fs-7 d-flex align-items-center gap-2 ai-card-action">
                        Launch Tool <i className="fa-solid fa-arrow-right fs-8 btn-arrow-icon"></i>
                      </span>
                      <span className="badge bg-light text-secondary border rounded-circle p-2 d-inline-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
                        <i className="fa-solid fa-chevron-right fs-9"></i>
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* Employer Section Headline */}
          <div className="row justify-content-center mb-4 pt-4 border-top">
            <div className="col-xl-8 col-lg-9 col-md-10 text-center mt-2">
              <div className="sec-heading center mb-4">
                <span className="badge bg-main-light text-main fw-semibold px-3 py-2 rounded-pill fs-7 mb-2 d-inline-flex align-items-center gap-1">
                  <i className="fa-solid fa-building-user text-main"></i> For Employers & Companies
                </span>
                <h2 className="fw-bold fs-2 text-dark mt-2 mb-2">
                  Streamline Recruitment with <span className="text-main">Employer Hiring Suite</span>
                </h2>
                <p className="text-muted fs-6 lh-base m-0">
                  Manage your hiring workflow with job posting tools, real-time application tracking, and employer portal controls.
                </p>
              </div>
            </div>
          </div>

          {/* Row 2: Employer AI Tools Cards (3 Cards) */}
          <div className="row justify-content-center g-4">
            {employerAiTools.map((tool) => (
              <div className="col-xl-4 col-lg-4 col-md-6" key={tool.id}>
                <Link
                  href={tool.href}
                  onClick={(e) => handleCardClick(e, tool.href, tool.targetRole)}
                  className="ai-suite-card h-100 d-flex flex-column justify-content-between text-decoration-none rounded-4 bg-white border position-relative"
                  data-bs-toggle={!user ? "modal" : undefined}
                  data-bs-target={!user ? "#login" : undefined}
                >
                  {/* Top Hover Gradient Bar */}
                  <div className="card-hover-bar" style={{ zIndex: 2 }}></div>

                  {/* Top Image */}
                  <div className="w-100 position-relative" style={{ height: "180px", overflow: "hidden", borderTopLeftRadius: "1rem", borderTopRightRadius: "1rem" }}>
                    <img src={tool.image} alt={tool.title} className="w-100 h-100 ai-card-image" style={{ objectFit: "cover", transition: "transform 0.4s ease" }} />
                    <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0) 60%, rgba(255,255,255,1) 100%)" }}></div>
                  </div>

                  <div className="p-4 pt-2 d-flex flex-column flex-grow-1">
                    {/* Header: Icon + Badge Tag */}
                    <div className="d-flex align-items-center justify-content-between mb-3 position-relative" style={{ marginTop: "-24px", zIndex: 1 }}>
                      <div className="ai-card-icon rounded-3 d-flex align-items-center justify-content-center border border-white border-2">
                        <i className={`${tool.icon} fs-4`}></i>
                      </div>
                      <span className={`badge rounded-pill px-3 py-2 fw-medium fs-8 ${tool.badgeBg}`}>
                        {tool.tag}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="fs-5 fw-bold text-dark mb-2 ai-card-title">
                      {tool.title}
                    </h3>
                    <p className="text-secondary fs-7 mb-4 lh-base flex-grow-1">
                      {tool.description}
                    </p>

                    {/* Footer Action Link */}
                    <div className="d-flex align-items-center justify-content-between pt-3 border-top border-light-subtle">
                      <span className="fw-semibold text-main fs-7 d-flex align-items-center gap-2 ai-card-action">
                        Launch Tool <i className="fa-solid fa-arrow-right fs-8 btn-arrow-icon"></i>
                      </span>
                      <span className="badge bg-light text-secondary border rounded-circle p-2 d-inline-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
                        <i className="fa-solid fa-chevron-right fs-9"></i>
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        <style jsx global>{`
          .bg-main-light {
            background-color: rgba(11, 130, 96, 0.08) !important;
            color: #0b8260 !important;
          }
          .fs-7 {
            font-size: 0.875rem !important;
          }
          .fs-8 {
            font-size: 0.785rem !important;
          }
          .fs-9 {
            font-size: 0.7rem !important;
          }
          .badge-theme-subtle {
            background-color: rgba(11, 130, 96, 0.08);
            color: #0b8260;
            border: 1px solid rgba(11, 130, 96, 0.2);
          }
          .ai-suite-card {
            border-color: rgba(0, 0, 0, 0.08) !important;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
            overflow: hidden;
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease;
          }
          .card-hover-bar {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #0b8260, #10b981);
            border-radius: 1rem 1rem 0 0;
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          .ai-suite-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(11, 130, 96, 0.14) !important;
            border-color: rgba(11, 130, 96, 0.35) !important;
          }
          .ai-suite-card:hover .card-hover-bar {
            opacity: 1;
          }
          .ai-card-icon {
            width: 48px;
            height: 48px;
            background-color: rgba(11, 130, 96, 0.08);
            color: #0b8260;
            transition: background-color 0.3s ease, color 0.3s ease, transform 0.3s ease;
          }
          .ai-suite-card:hover .ai-card-icon {
            background-color: #0b8260;
            color: #ffffff;
            transform: scale(1.05);
          }
          .ai-card-title {
            transition: color 0.2s ease;
          }
          .ai-suite-card:hover .ai-card-title {
            color: #0b8260 !important;
          }
          .btn-arrow-icon {
            transition: transform 0.3s ease;
          }
          .ai-suite-card:hover .ai-card-image {
            transform: scale(1.08);
          }
          .ai-suite-card:hover .btn-arrow-icon {
            transform: translateX(4px);
          }
        `}</style>
      </section>

      <RoleMismatchModal
        show={!!mismatchRole}
        requiredRole={mismatchRole}
        onClose={() => setMismatchRole(null)}
        onOpenLogin={openLoginModal}
      />
    </>
  );
}
