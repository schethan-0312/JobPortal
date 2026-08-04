"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar7 from "@/components/Navbar7";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
import UploadResumeModal from "@/components/candidate-dashboard/UploadResumeModal";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface ExperienceEntry {
  title: string;
  company: string;
  duration: string;
  bullets: string[];
}

interface EducationEntry {
  degree: string;
  institution: string;
  year: string;
}

interface BuiltResume {
  fullName: string;
  headline: string;
  contact: { email?: string; phone?: string; location?: string };
  summary: string;
  skills: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
}

export default function CandidateResumeBuilderPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [targetRole, setTargetRole] = useState("");
  const [rawBackground, setRawBackground] = useState("");
  const [status, setStatus] = useState<"idle" | "generating" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resume, setResume] = useState<BuiltResume | null>(null);
  const [savingToProfile, setSavingToProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  async function handleSaveToProfile() {
    if (!resume) return;
    setSavingToProfile(true);
    setSaveSuccess(false);
    setErrorMsg(null);
    try {
      await api.patch("/candidates/me", {
        skills: resume.skills,
        about: resume.summary,
      });

      await api.put("/candidates/me/resume-data", {
        educations: resume.education.map((ed) => ({
          title: ed.degree,
          academy: ed.institution,
          year: ed.year,
        })),
        experiences: resume.experience.map((exp) => ({
          title: exp.title,
          company: exp.company,
          startDate: exp.duration,
          description: exp.bullets.join("\n"),
        })),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : "Failed to save profile");
    } finally {
      setSavingToProfile(false);
    }
  }

  useEffect(() => {
    if (!loading && (!user || user.role !== "CANDIDATE")) {
      router.push("/");
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== "CANDIDATE") {
    return null;
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setResume(null);
    setStatus("generating");
    try {
      const data = await api.post<BuiltResume>("/resume-builder/generate", {
        rawBackground,
        targetRole: targetRole || undefined,
      });
      setResume(data);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof ApiError ? err.message : "Could not generate your resume. Try again.");
    }
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-resume { box-shadow: none !important; border: none !important; }
          .dashboard-nav, .mobNavigation { display: none !important; }
        }
      `}</style>
      <Navbar7 />

      <div className="dashboard-wrap bg-light">
        <div className="no-print">
          <CandidateSidebar active="resume-builder" />
        </div>

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4 no-print">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">AI Resume Builder</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Candidate</a></li>
                    <li className="breadcrumb-item text-muted"><a href="#">Dashboard</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">AI Resume Builder</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            <div className="card mb-4 no-print">
              <div className="card-header">
                <h4>Tell Us About Your Background</h4>
                <p className="text-muted mb-0 mt-1">
                  Write about your work history and education in your own words &mdash; our AI will turn it into a
                  polished, ATS-friendly resume you can print or save as a PDF.
                </p>
              </div>
              <div className="card-body">
                {status === "error" && errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                <form onSubmit={handleGenerate}>
                  <div className="row mb-3">
                    <label className="col-xl-2 col-md-12 col-form-label">Target Role (optional)</label>
                    <div className="col-xl-7 col-md-12">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Digital Marketing Manager"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-xl-2 col-md-12 col-form-label">Your Background</label>
                    <div className="col-xl-7 col-md-12">
                      <textarea
                        className="form-control"
                        rows={8}
                        placeholder="e.g. I worked at X for 2 years as a... I have a degree in... My key achievements were..."
                        value={rawBackground}
                        onChange={(e) => setRawBackground(e.target.value)}
                        minLength={20}
                        required
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-xl-12 col-md-12">
                      <button type="submit" className="btn btn-main" disabled={status === "generating"}>
                        {status === "generating" ? "Building Resume..." : "Generate My Resume"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {resume && (
              <div className="card print-resume">
                <div className="card-body p-5" style={{ maxWidth: 800, margin: "0 auto" }}>
                  <div className="text-center mb-4">
                    <h2 className="mb-1">{resume.fullName}</h2>
                    <p className="text-muted mb-1">{resume.headline}</p>
                    <p className="small text-muted mb-0">
                      {[resume.contact.email, resume.contact.phone, resume.contact.location].filter(Boolean).join(" | ")}
                    </p>
                  </div>

                  <h5 className="border-bottom pb-1 mb-2">Professional Summary</h5>
                  <p className="mb-4">{resume.summary}</p>

                  <h5 className="border-bottom pb-1 mb-2">Skills</h5>
                  <p className="mb-4">{resume.skills.join(" • ")}</p>

                  <h5 className="border-bottom pb-1 mb-2">Experience</h5>
                  {resume.experience.map((exp, i) => (
                    <div className="mb-3" key={i}>
                      <div className="d-flex justify-content-between">
                        <strong>{exp.title}</strong>
                        <span className="text-muted small">{exp.duration}</span>
                      </div>
                      <div className="text-muted mb-1">{exp.company}</div>
                      <ul className="mb-0">
                        {exp.bullets.map((b, bi) => (
                          <li key={bi}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  <h5 className="border-bottom pb-1 mb-2 mt-4">Education</h5>
                  {resume.education.map((ed, i) => (
                    <div className="d-flex justify-content-between mb-2" key={i}>
                      <div>
                        <strong>{ed.degree}</strong>
                        <div className="text-muted">{ed.institution}</div>
                      </div>
                      <span className="text-muted small">{ed.year}</span>
                    </div>
                  ))}
                </div>
                <div className="card-footer text-center no-print d-flex justify-content-center gap-3">
                  <button type="button" className="btn btn-light" onClick={() => window.print()}>
                    <i className="fa-solid fa-download me-2"></i>Print / Save as PDF
                  </button>
                  <button type="button" className="btn btn-main" onClick={handleSaveToProfile} disabled={savingToProfile}>
                    <i className="fa-solid fa-cloud-arrow-up me-2"></i>
                    {savingToProfile ? "Saving..." : (saveSuccess ? "Saved Successfully!" : "Save to Profile")}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="row no-print">
            <div className="col-md-12">
              <div className="py-3 text-center">
                &copy; {new Date().getFullYear()} JobStock. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="no-print">
        <UploadResumeModal />
      </div>
    </>
  );
}
