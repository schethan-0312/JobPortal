"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import RoleMismatchModal from "../RoleMismatchModal";

const aiTools = [
  {
    id: "resume-builder",
    icon: "fa-solid fa-file-pen",
    image: "/img/ai-tools/resume-builder.jpg",
    title: "AI Resume Builder",
    tag: "ATS Optimized",
    badgeBg: "badge-theme-subtle",
    description: "Create professional, ATS-friendly resumes in minutes with intelligent suggestions tailored to target roles.",
    href: "/candidate-resume-builder",
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
  },
  {
    id: "mock-interview",
    icon: "fa-solid fa-video",
    image: "/img/ai-tools/mock-interview.jpg",
    title: "Mock AI Interviews",
    tag: "Real-time Prep",
    badgeBg: "badge-theme-subtle",
    description: "Practice real role-specific interview questions with instant AI-driven feedback on your voice and answers.",
    href: "/candidate-mock-interview",
  },
  {
    id: "skill-assessment",
    icon: "fa-solid fa-award",
    image: "/img/ai-tools/skill-assessment.jpg",
    title: "Skill Assessments",
    tag: "Verified Badges",
    badgeBg: "badge-theme-subtle",
    description: "Take AI-evaluated technical skill tests to earn verified candidate badges visible directly to top recruiters.",
    href: "/candidate-skill-assessment",
  },
  {
    id: "career-navigator",
    icon: "fa-solid fa-route",
    image: "/img/ai-tools/career-navigator.jpg",
    title: "Career Path Navigator",
    tag: "Growth Roadmap",
    badgeBg: "badge-theme-subtle",
    description: "Explore clear career promotion paths, skill requirements, and salary growth trajectories for your target role.",
    href: "/candidate-career-navigator",
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

  const handleCardClick = (e: React.MouseEvent, href: string) => {
    if (user?.role === "EMPLOYER") {
      e.preventDefault();
      setMismatchRole("CANDIDATE");
      return;
    }

    if (!user) {
      e.preventDefault();
      openLoginModal();
      return;
    }
  };

  return (
    <>
      <section className="gray-simple py-5 position-relative overflow-hidden">
        <div className="container py-2">
          {/* Section Heading */}
          <div className="row justify-content-center">
            <div className="col-xl-7 col-lg-8 col-md-10 text-center">
              <div className="sec-heading center mb-5">
                <span className="badge bg-main-light text-main fw-semibold px-3 py-2 rounded-pill fs-7 mb-2 d-inline-flex align-items-center gap-1">
                  <i className="fa-solid fa-wand-magic-sparkles text-main"></i> Candidate AI Suite
                </span>
                <h2 className="fw-bold fs-2 text-dark mt-2 mb-3">
                  Accelerate Your Job Search with <span className="text-main">AI Tools</span>
                </h2>
                <p className="text-muted fs-6 lh-base m-0">
                  Supercharge your career with our intelligent candidate dashboard features — from AI resume building to real-time interview prep.
                </p>
              </div>
            </div>
          </div>

          {/* AI Tools Cards Grid */}
          <div className="row justify-content-center g-4">
            {aiTools.map((tool) => (
              <div className="col-xl-4 col-lg-4 col-md-6" key={tool.id}>
                <Link
                  href={tool.href}
                  onClick={(e) => handleCardClick(e, tool.href)}
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
