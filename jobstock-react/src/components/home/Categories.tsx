"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import RoleMismatchModal from "../RoleMismatchModal";

const aiSuiteTools = [
  {
    id: "mock-interview",
    icon: "fa-solid fa-microphone-lines",
    image: "/img/ai-tools/INTERVEW (1).jpg",
    title: "Mock AI Interview",
    tag: "AI Practice",
    description: "Practice real-time technical and behavioral interview questions with instant intelligent feedback.",
    href: "/candidate-mock-interview",
    targetRole: "CANDIDATE" as const,
  },
  {
    id: "resume-builder",
    icon: "fa-solid fa-file-pen",
    image: "/img/ai-tools/resume-builder-v2.jpg",
    title: "AI Resume Builder",
    tag: "ATS Optimized",
    description: "Create professional, ATS-friendly resumes in minutes with intelligent suggestions tailored to target roles.",
    href: "/candidate-resume-builder",
    targetRole: "CANDIDATE" as const,
  },
  {
    id: "smart-match",
    icon: "fa-solid fa-wand-magic-sparkles",
    image: "/img/ai-tools/smart-match-v2.jpg",
    title: "Smart Job Matches",
    tag: "AI Recommendations",
    description: "Get AI-curated job recommendations calculated based on your unique skills, preferences, and experience.",
    href: "/candidate-smart-match",
    targetRole: "CANDIDATE" as const,
  },
  {
    id: "skill-assessment",
    icon: "fa-solid fa-list-check",
    image: "/img/ai-tools/skill-assessment-v2.jpg",
    title: "Skills Assessments",
    tag: "Verified Skills",
    description: "Take interactive skill challenges and earn verified badges to prove your expertise to top recruiters.",
    href: "/candidate-skill-assessment",
    targetRole: "CANDIDATE" as const,
  },
  {
    id: "career-navigator",
    icon: "fa-solid fa-compass",
    image: "/img/ai-tools/career-navigator-v2.jpg",
    title: "Career Path Navigator",
    tag: "Career Growth",
    description: "Discover growth trajectories, salary benchmarks, and actionable next steps for your career journey.",
    href: "/candidate-career-navigator",
    targetRole: "CANDIDATE" as const,
  },
  {
    id: "resume-scanner",
    icon: "fa-solid fa-magnifying-glass-chart",
    image: "/img/ai-tools/resume-scanner-v2.jpg",
    title: "Resume Health Scanner",
    tag: "Instant Audit",
    description: "Scan your resume against live job descriptions to uncover score gaps, missing keywords, and formatting tips.",
    href: "/candidate-resume-scanner",
    targetRole: "CANDIDATE" as const,
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
      <section className="py-5 bg-white position-relative overflow-hidden">
        <div className="container py-2">
          
          {/* Section Headline */}
          <div className="row justify-content-center mb-4 pb-2">
            <div className="col-xl-8 col-lg-9 col-md-10 text-center">
              <span className="badge bg-main-light text-main fw-semibold px-3 py-2 rounded-pill fs-8 mb-2 d-inline-flex align-items-center gap-1.5">
                <i className="fa-solid fa-wand-magic-sparkles text-main"></i> Intelligent Career Tools
              </span>
              <h2 className="fw-bold fs-2 text-dark mt-1 mb-2">
                Accelerate Your Success with <span className="text-main">AI Career Suite</span>
              </h2>
              <p className="text-muted fs-6 lh-base m-0">
                Explore intelligent AI-driven tools tailored to supercharge resume building, interview preparation, and job matching.
              </p>
            </div>
          </div>

          {/* 2 Rows x 3 Cards Grid */}
          <div className="row justify-content-center g-4">
            {aiSuiteTools.map((tool) => (
              <div className="col-12 col-md-6 col-lg-4" key={tool.id}>
                <Link
                  href={tool.href}
                  onClick={(e) => handleCardClick(e, tool.href, tool.targetRole)}
                  className="pro-feature-card text-decoration-none bg-white d-flex flex-column h-100 position-relative"
                  data-bs-toggle={!user ? "modal" : undefined}
                  data-bs-target={!user ? "#login" : undefined}
                >
                  {/* Top Image Banner */}
                  <div className="pro-feature-img-box position-relative">
                    <img src={tool.image} alt={tool.title} className="w-100 h-100 pro-feature-img" />
                    <span className="badge pro-glass-tag position-absolute top-0 end-0 m-3">
                      {tool.tag}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 d-flex flex-column flex-grow-1">
                    
                    {/* Header: Icon + Title */}
                    <div className="d-flex align-items-center gap-2.5 mb-2.5">
                      <div className="pro-feature-icon rounded-3 d-flex align-items-center justify-content-center flex-shrink-0">
                        <i className={`${tool.icon} fs-6`}></i>
                      </div>
                      <h3 className="fs-6 fw-bold text-dark mb-0 pro-feature-title text-truncate">
                        {tool.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-secondary fs-8 mb-3.5 lh-base flex-grow-1">
                      {tool.description}
                    </p>

                    {/* Footer Action */}
                    <div className="d-flex align-items-center justify-content-between pt-3 border-top border-light-subtle mt-auto">
                      <span className="fw-semibold text-main fs-8 d-flex align-items-center gap-1.5 pro-action-link">
                        Launch Tool <i className="fa-solid fa-arrow-right fs-9 pro-arrow-icon"></i>
                      </span>
                      <span className="pro-circle-chevron rounded-circle d-inline-flex align-items-center justify-content-center">
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
            background-color: rgba(56, 165, 129, 0.1) !important;
            color: #38a581 !important;
          }
          .text-main {
            color: #38a581 !important;
          }
          .fs-8 {
            font-size: 0.85rem !important;
          }
          .fs-9 {
            font-size: 0.7rem !important;
          }

          /* Professional Feature Card Design */
          .pro-feature-card {
            border: 1px solid #e8eef3;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease;
          }
          .pro-feature-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 16px 36px rgba(56, 165, 129, 0.14) !important;
            border-color: rgba(56, 165, 129, 0.35) !important;
          }

          .pro-feature-img-box {
            height: 160px;
            overflow: hidden;
            background-color: #f8fafc;
          }
          .pro-feature-img {
            object-fit: cover;
            transition: transform 0.4s ease;
          }
          .pro-feature-card:hover .pro-feature-img {
            transform: scale(1.05);
          }

          .pro-glass-tag {
            background-color: rgba(255, 255, 255, 0.94);
            color: #0f172a;
            font-weight: 600;
            font-size: 0.74rem;
            padding: 4px 12px;
            border-radius: 20px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(6px);
          }

          .pro-feature-icon {
            width: 38px;
            height: 38px;
            background-color: #ecfdf5;
            color: #059669;
            transition: all 0.25s ease;
          }
          .pro-feature-card:hover .pro-feature-icon {
            background-color: #38a581;
            color: #ffffff;
            transform: scale(1.05);
          }

          .pro-feature-title {
            font-size: 1.05rem !important;
            letter-spacing: -0.2px;
            transition: color 0.2s ease;
          }
          .pro-feature-card:hover .pro-feature-title {
            color: #38a581 !important;
          }

          .pro-arrow-icon {
            transition: transform 0.25s ease;
          }
          .pro-feature-card:hover .pro-arrow-icon {
            transform: translateX(4px);
          }

          .pro-circle-chevron {
            width: 26px;
            height: 26px;
            background-color: #f1f5f9;
            color: #64748b;
            transition: all 0.2s ease;
          }
          .pro-feature-card:hover .pro-circle-chevron {
            background-color: #38a581;
            color: #ffffff;
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
