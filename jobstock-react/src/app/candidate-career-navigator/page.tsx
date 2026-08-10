"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar5 from "@/components/Navbar5";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
import UploadResumeModal from "@/components/candidate-dashboard/UploadResumeModal";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, uploadFile } from "@/lib/api";

interface CareerStep {
  roleTitle: string;
  timeframe: string;
  salaryRange: string;
  description: string;
  skillsToLearn: string[];
  technologies: string[];
  projects: string[];
  certifications: string[];
}

interface CareerPathResult {
  currentLevelSummary: string;
  currentCareerLevel: string;
  currentSkills: string[];
  currentStrengths: string[];
  currentWeaknesses: string[];
  skillGaps: string[];
  recommendedSkillsNow: string[];
  careerPath: CareerStep[];
  interviewReadiness: {
    score: number;
    topics: string[];
  };
}

export default function CandidateCareerNavigatorPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [sourceType, setSourceType] = useState<"profile" | "resume" | "upload">("profile");
  const [targetIndustry, setTargetIndustry] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const [status, setStatus] = useState<"idle" | "generating" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<CareerPathResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "CANDIDATE")) {
      router.push("/");
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== "CANDIDATE") {
    return null;
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErrorMsg(null);
    try {
      const { url } = await uploadFile<{ url: string }>("/uploads/document", file);
      setResumeUrl(url);
    } catch (err) {
      setErrorMsg("Failed to upload file.");
    } finally {
      setUploading(false);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setResult(null);
    setStatus("generating");
    try {
      if (sourceType === "upload" && !resumeUrl) {
        throw new Error("Please upload a resume first.");
      }

      const data = await api.post<CareerPathResult>("/career-navigator/generate", {
        sourceType,
        targetIndustry: targetIndustry || undefined,
        sourceText: sourceType === "upload" ? resumeUrl : undefined,
      });
      setResult(data);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof ApiError ? err.message : (err as Error).message || "Could not generate your career path.");
    }
  }

  return (
    <>
      <Navbar5 />

      <div className="dashboard-wrap bg-light">
        <CandidateSidebar active="career-navigator" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">AI Career Path Navigator</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Candidate</a></li>
                    <li className="breadcrumb-item text-muted"><a href="#">Dashboard</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Career Path Navigator</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            <div className="card mb-4 border-0 shadow-sm">
              <div className="card-header bg-white border-bottom pt-4 pb-3">
                <h4 className="mb-1 text-dark">Your Personalized Career Roadmap</h4>
                <p className="text-muted mb-0">
                  Select your profile data source, and our AI will build a comprehensive, step-by-step roadmap for your future.
                </p>
              </div>
              <div className="card-body p-4">
                {status === "error" && errorMsg && <div className="alert alert-danger mb-4">{errorMsg}</div>}
                <form onSubmit={handleGenerate}>
                  <div className="row mb-4">
                    <label className="col-xl-3 col-md-12 col-form-label fw-bold">Target Direction <span className="text-muted fw-normal">(Optional)</span></label>
                    <div className="col-xl-9 col-md-12">
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        placeholder="e.g. AI Engineer, Product Management, Cyber Security"
                        value={targetIndustry}
                        onChange={(e) => setTargetIndustry(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-xl-9 offset-xl-3 col-md-12">
                      <div className="d-flex flex-wrap gap-3">
                        <button type="submit" className="btn btn-main btn-lg px-4" disabled={status === "generating" || uploading}>
                          {status === "generating" ? (
                            <><i className="fa-solid fa-circle-notch fa-spin me-2"></i>Generating Roadmap...</>
                          ) : (
                            <><i className="fa-solid fa-wand-magic-sparkles me-2"></i>Generate My Career Path</>
                          )}
                        </button>
                        
                        <div className="position-relative">
                          <input 
                            type="file" 
                            className="position-absolute top-0 start-0 w-100 h-100" 
                            style={{ opacity: 0, cursor: 'pointer' }}
                            accept=".pdf,.doc,.docx" 
                            onChange={(e) => {
                              setSourceType("upload");
                              handleFileUpload(e);
                            }} 
                            ref={fileInputRef} 
                            disabled={status === "generating" || uploading}
                          />
                          <button type="button" className="btn btn-outline-main btn-lg px-4" disabled={status === "generating" || uploading}>
                            {uploading ? (
                              <><i className="fa-solid fa-circle-notch fa-spin me-2"></i>Uploading...</>
                            ) : resumeUrl ? (
                              <><i className="fa-solid fa-check me-2"></i>Resume Ready</>
                            ) : (
                              <><i className="fa-solid fa-upload me-2"></i>Upload Resume</>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {sourceType === "upload" && resumeUrl && (
                        <div className="text-success mt-2 small">
                          <i className="fa-solid fa-check-circle me-1"></i> File uploaded. Click 'Generate My Career Path' to analyze it.
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {result && (
              <div className="roadmap-results animation-fade-in">
                {/* Where You Are Now Section */}
                <div className="card mb-4 border-0 shadow-sm border-top border-4 border-main">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h4 className="mb-0 text-dark"><i className="fa-solid fa-location-dot text-main me-2"></i>Where You Are Now</h4>
                      <span className="badge bg-light text-dark border px-3 py-2 fs-6">{result.currentCareerLevel}</span>
                    </div>
                    
                    <p className="fs-5 text-muted mb-4 lh-base">{result.currentLevelSummary}</p>

                    <div className="row g-4">
                      <div className="col-md-6">
                        <div className="p-3 bg-light rounded h-100 border">
                          <h6 className="text-success fw-bold mb-3"><i className="fa-solid fa-arrow-trend-up me-2"></i>Current Strengths</h6>
                          <ul className="mb-0 ps-3 text-muted">
                            {result.currentStrengths.map((str, i) => <li key={i} className="mb-1">{str}</li>)}
                          </ul>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 bg-light rounded h-100 border">
                          <h6 className="text-danger fw-bold mb-3"><i className="fa-solid fa-triangle-exclamation me-2"></i>Skill Gaps & Weaknesses</h6>
                          <ul className="mb-0 ps-3 text-muted">
                            {result.skillGaps.map((gap, i) => <li key={i} className="mb-1">{gap}</li>)}
                            {result.currentWeaknesses.map((w, i) => <li key={i} className="mb-1">{w}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-top">
                      <h6 className="fw-bold mb-3 text-dark">Focus on learning these skills immediately:</h6>
                      <div className="d-flex flex-wrap gap-2">
                        {result.recommendedSkillsNow.map((s, i) => (
                          <span key={i} className="badge bg-main text-white p-2 px-3 rounded-pill fs-6">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline / Roadmap Section */}
                <h4 className="mb-4 mt-5 fw-bold text-dark"><i className="fa-solid fa-route text-main me-2"></i>Your Progression Roadmap</h4>
                
                <div className="position-relative ms-2">
                  <div className="position-absolute top-0 bottom-0 start-0 border-start border-3 border-main" style={{ left: '20px', zIndex: 0, opacity: 0.2 }}></div>
                  
                  {result.careerPath.map((step, i) => (
                    <div key={i} className="card border-0 shadow-sm mb-4 position-relative" style={{ zIndex: 1 }}>
                      <div className="position-absolute rounded-circle bg-main border border-4 border-white d-flex align-items-center justify-content-center text-white fw-bold shadow-sm" style={{ width: '44px', height: '44px', left: '-2px', top: '20px' }}>
                        {i + 1}
                      </div>
                      <div className="card-body p-4 ps-5 ms-3">
                        <div className="d-flex justify-content-between align-items-start flex-wrap mb-3">
                          <div>
                            <h4 className="mb-1 fw-bold text-dark">{step.roleTitle}</h4>
                            <span className="text-success fw-bold fs-5 d-flex align-items-center">
                              <i className="fa-solid fa-indian-rupee-sign me-1"></i> {step.salaryRange}
                            </span>
                          </div>
                          <span className="badge bg-light text-dark border px-3 py-2 fs-6 shadow-sm"><i className="fa-regular fa-clock me-2"></i>{step.timeframe}</span>
                        </div>
                        
                        <p className="text-muted mb-4 fs-5">{step.description}</p>
                        
                        <div className="row g-4">
                          <div className="col-md-6">
                            <h6 className="fw-bold text-dark mb-2"><i className="fa-solid fa-screwdriver-wrench me-2"></i>Technologies to Master</h6>
                            <div className="d-flex flex-wrap gap-1">
                              {step.technologies.map((t, ti) => (
                                <span key={ti} className="badge bg-light text-dark border">{t}</span>
                              ))}
                            </div>
                          </div>
                          <div className="col-md-6">
                            <h6 className="fw-bold text-dark mb-2"><i className="fa-solid fa-graduation-cap me-2"></i>Recommended Certifications</h6>
                            <ul className="mb-0 ps-3 text-muted small">
                              {step.certifications.map((c, ci) => <li key={ci}>{c}</li>)}
                            </ul>
                          </div>
                          <div className="col-12">
                            <h6 className="fw-bold text-dark mb-2"><i className="fa-solid fa-laptop-code me-2"></i>Projects to Build</h6>
                            <ul className="mb-0 ps-3 text-muted small">
                              {step.projects.map((p, pi) => <li key={pi}>{p}</li>)}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Interview Readiness Section */}
                <div className="card mt-5 border-0 shadow-sm bg-main-light border border-main">
                  <div className="card-body p-4 text-center">
                    <h4 className="fw-bold mb-3"><i className="fa-solid fa-clipboard-user me-2"></i>Interview Readiness</h4>
                    <div className="display-4 fw-bold text-main mb-3">{result.interviewReadiness.score}%</div>
                    <p className="text-muted mb-4">Based on your current profile, here are the topics you should prepare for immediately:</p>
                    <div className="d-flex justify-content-center flex-wrap gap-2">
                      {result.interviewReadiness.topics.map((t, i) => (
                        <span key={i} className="badge bg-white text-dark border p-2 px-3 fs-6 shadow-sm">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          <div className="row mt-5">
            <div className="col-md-12">
              <div className="py-3 text-center text-muted">
                &copy; {new Date().getFullYear()} JobStock. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>

      <UploadResumeModal />
    </>
  );
}
