"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar7 from "@/components/Navbar7";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
import UploadResumeModal from "@/components/candidate-dashboard/UploadResumeModal";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, uploadFile } from "@/lib/api";

interface ResumeScanResult {
  overallScore: number;
  atsScore: number;
  skillScore: number;
  experienceScore: number;
  completenessScore: number;
  grammarScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  missingSkills: string[];
  missingKeywords: string[];
  missingSections: string[];
  interviewReadiness: string;
}

function scoreColor(score: number) {
  if (score >= 75) return "#28a745";
  if (score >= 50) return "#f0ad4e";
  return "#dc3545";
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="mb-3 print-avoid-break">
      <div className="d-flex justify-content-between mb-1">
        <span className="fw-medium">{label}</span>
        <span className="fw-medium">{score}/100</span>
      </div>
      <div className="progress" style={{ height: "8px" }}>
        <div
          className="progress-bar"
          role="progressbar"
          style={{ width: `${score}%`, backgroundColor: scoreColor(score) }}
        />
      </div>
    </div>
  );
}

export default function CandidateResumeScannerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [sourceType, setSourceType] = useState<"saved" | "upload" | "paste">("saved");
  const [jobDescription, setJobDescription] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const [status, setStatus] = useState<"idle" | "scanning" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ResumeScanResult | null>(null);

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

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setResult(null);
    setStatus("scanning");

    try {
      const data = await api.post<any>("/resume-scanner/scan", {
        sourceType,
        jobDescription,
        pastedText: sourceType === "paste" ? pastedText : undefined,
        resumeUrl: sourceType === "upload" ? resumeUrl : undefined,
      });

      if (data.success === false || data.message) {
        setStatus("error");
        setErrorMsg(data.message || "Failed to scan resume.");
        setResult(null);
      } else {
        setResult(data as ResumeScanResult);
        setStatus("idle");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <>
      <style>{`
        @media print {
          body { background-color: white !important; }
          .no-print { display: none !important; }
          .dashboard-wrap { background-color: white !important; padding: 0 !important; margin: 0 !important; }
          .dashboard-content { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
          .print-avoid-break { page-break-inside: avoid; }
        }
      `}</style>
      <div className="no-print">
        <Navbar7 />
      </div>

      <div className="dashboard-wrap bg-light">
        <CandidateSidebar active="resume-scanner" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4 no-print">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">AI Resume Health Scanner</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Candidate</a></li>
                    <li className="breadcrumb-item text-muted"><a href="#">Dashboard</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">AI Resume Health Scanner</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            <div className="card mb-4 no-print">
              <div className="card-header">
                <h4>AI Semantic Evaluation</h4>
                <p className="text-muted mb-0 mt-1">
                  Our AI will semantically compare your resume against the target job description to compute detailed matches, detect missing skills, and give concrete suggestions.
                </p>
              </div>
              <div className="card-body">
                {status === "error" && errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                
                <form onSubmit={handleScan}>
                  
                  <div className="mb-4">
                    <label className="fw-bold mb-2">1. Choose Resume Source</label>
                    <ul className="nav nav-pills mb-3">
                      <li className="nav-item">
                        <button type="button" className={`nav-link fw-bold me-2 border ${sourceType === "saved" ? "active bg-main text-white border-0" : ""}`} style={sourceType !== "saved" ? { backgroundColor: "#ffffff", color: "#28a745", borderColor: "#28a745" } : {}} onClick={() => setSourceType("saved")}>
                          <i className="fa-regular fa-file-lines me-2"></i>Analyze Saved Resume
                        </button>
                      </li>
                      <li className="nav-item">
                        <button type="button" className={`nav-link fw-bold me-2 border ${sourceType === "upload" ? "active bg-main text-white border-0" : ""}`} style={sourceType !== "upload" ? { backgroundColor: "#ffffff", color: "#28a745", borderColor: "#28a745" } : {}} onClick={() => setSourceType("upload")}>
                          <i className="fa-solid fa-cloud-arrow-up me-2"></i>Upload PDF/DOCX
                        </button>
                      </li>
                      <li className="nav-item">
                        <button type="button" className={`nav-link fw-bold me-2 border ${sourceType === "paste" ? "active bg-main text-white border-0" : ""}`} style={sourceType !== "paste" ? { backgroundColor: "#ffffff", color: "#28a745", borderColor: "#28a745" } : {}} onClick={() => setSourceType("paste")}>
                          <i className="fa-solid fa-paste me-2"></i>Paste Text
                        </button>
                      </li>
                    </ul>

                    {sourceType === "saved" && (
                      <div className="alert alert-info border-0 shadow-sm">
                        <i className="fa-solid fa-circle-info me-2"></i>
                        This will analyze the structured resume you created in the "My Resume" section. Ensure it is up to date before scanning.
                      </div>
                    )}

                    {sourceType === "upload" && (
                      <div className="border rounded p-4 text-center bg-white shadow-sm">
                        <input type="file" className="d-none" ref={fileInputRef} accept=".pdf,.doc,.docx" onChange={handleFileUpload} />
                        {resumeUrl ? (
                          <div className="text-success fw-bold"><i className="fa-solid fa-check-circle me-2"></i>File Uploaded Successfully</div>
                        ) : (
                          <>
                            <button type="button" className="btn btn-outline-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                              {uploading ? "Uploading..." : "Click to Upload Resume"}
                            </button>
                            <div className="small text-muted mt-2">Supports PDF, DOC, DOCX</div>
                          </>
                        )}
                      </div>
                    )}

                    {sourceType === "paste" && (
                      <div>
                        <textarea 
                          className="form-control bg-white shadow-sm" 
                          rows={6} 
                          placeholder="Paste your full resume text here..."
                          value={pastedText}
                          onChange={(e) => setPastedText(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="fw-bold mb-2">2. Target Job Description</label>
                    <textarea
                      className="form-control bg-white shadow-sm"
                      rows={4}
                      placeholder="Paste the target job description or role title here to get tailored keyword matching and semantic gap analysis..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                    />
                  </div>

                  <div>
                    <button type="submit" className="btn btn-main btn-lg" disabled={status === "scanning" || (sourceType === "upload" && !resumeUrl) || (sourceType === "paste" && !pastedText)}>
                      {status === "scanning" ? <><i className="fa-solid fa-circle-notch fa-spin me-2"></i>Scanning...</> : "Scan My Resume"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {result && (
              <div className="card shadow-sm border-0">
                <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                  <h4 className="mb-0 text-dark">AI Resume Health Report</h4>
                  <div className="no-print gap-2 d-flex">
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => window.print()}>
                      <i className="fa-solid fa-print me-1"></i> Download
                    </button>
                    <button className="btn btn-outline-primary btn-sm" onClick={() => router.push("/candidate-resume-builder")}>
                      <i className="fa-solid fa-wand-magic-sparkles me-1"></i> Improve in Builder
                    </button>
                  </div>
                </div>
                <div className="card-body p-4 p-md-5">
                  <div className="row mb-5 align-items-center print-avoid-break">
                    <div className="col-md-3 text-center mb-4 mb-md-0">
                      <div
                        style={{
                          width: 140,
                          height: 140,
                          borderRadius: "50%",
                          border: `8px solid ${scoreColor(result?.overallScore ?? 0)}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto",
                          backgroundColor: "#f8fafc"
                        }}
                      >
                        <div>
                          <div className="display-4 fw-bold text-dark">{result?.overallScore ?? 0}</div>
                          <div className="small text-muted fw-bold">/ 100</div>
                        </div>
                      </div>
                      <div className="mt-3 fs-5 fw-bold text-dark">AI Health Score</div>
                    </div>
                    <div className="col-md-9 ps-md-4">
                      <div className="row">
                        <div className="col-md-6">
                          <ScoreBar label="ATS Compatibility" score={result?.atsScore ?? 0} />
                          <ScoreBar label="Semantic Skill Match" score={result?.skillScore ?? 0} />
                          <ScoreBar label="Experience Relevance" score={result?.experienceScore ?? 0} />
                        </div>
                        <div className="col-md-6">
                          <ScoreBar label="Grammar & Readability" score={result?.grammarScore ?? 0} />
                          <ScoreBar label="Resume Completeness" score={result?.completenessScore ?? 0} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr className="mb-4 text-muted" />

                  <div className="row">
                    <div className="col-md-6 mb-4 print-avoid-break">
                      <div className="card h-100 border-success shadow-none bg-light">
                        <div className="card-body">
                          <h5 className="text-success mb-3 fw-bold">
                            <i className="fa-solid fa-circle-check me-2"></i>Strengths
                          </h5>
                          <ul className="mb-0 ps-3 text-dark">
                            {(result?.strengths ?? []).map((s, i) => (
                              <li key={i} className="mb-2">{s}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-6 mb-4 print-avoid-break">
                      <div className="card h-100 border-danger shadow-none bg-light">
                        <div className="card-body">
                          <h5 className="text-danger mb-3 fw-bold">
                            <i className="fa-solid fa-triangle-exclamation me-2"></i>Weaknesses
                          </h5>
                          <ul className="mb-0 ps-3 text-dark">
                            {(result?.weaknesses ?? []).map((w, i) => (
                              <li key={i} className="mb-2">{w}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card mb-4 border-warning shadow-none bg-light print-avoid-break">
                    <div className="card-body">
                      <h5 className="text-warning-dark mb-3 fw-bold text-dark">
                        <i className="fa-solid fa-lightbulb me-2 text-warning"></i>Actionable Improvement Suggestions
                      </h5>
                      <ul className="mb-0 ps-3 text-dark">
                        {(result?.suggestions ?? []).map((s, i) => (
                          <li key={i} className="mb-2">{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="row print-avoid-break">
                    <div className="col-md-6 mb-4">
                      <h5 className="fw-bold mb-3 text-dark">
                        <i className="fa-solid fa-magnifying-glass-minus text-muted me-2"></i>Missing Skills
                      </h5>
                      {result?.missingSkills && result.missingSkills.length > 0 ? (
                        <div className="d-flex flex-wrap gap-2">
                          {result.missingSkills.map((k, i) => (
                            <span key={i} className="badge bg-white text-danger border border-danger p-2">{k}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted">None identified.</p>
                      )}
                    </div>

                    <div className="col-md-6 mb-4">
                      <h5 className="fw-bold mb-3 text-dark">
                        <i className="fa-solid fa-file-circle-xmark text-muted me-2"></i>Missing ATS Keywords
                      </h5>
                      {result?.missingKeywords && result.missingKeywords.length > 0 ? (
                        <div className="d-flex flex-wrap gap-2">
                          {result.missingKeywords.map((k, i) => (
                            <span key={i} className="badge bg-white text-secondary border border-secondary p-2">{k}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted">None identified.</p>
                      )}
                    </div>
                  </div>

                  <div className="row print-avoid-break">
                    <div className="col-md-6 mb-4">
                      <h5 className="fw-bold mb-3 text-dark">
                        <i className="fa-solid fa-puzzle-piece text-muted me-2"></i>Missing Sections
                      </h5>
                      {result?.missingSections && result.missingSections.length > 0 ? (
                        <ul className="ps-3 text-dark mb-0">
                          {result.missingSections.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted">None identified.</p>
                      )}
                    </div>

                    <div className="col-md-6 mb-4">
                      <h5 className="fw-bold mb-3 text-dark">
                        <i className="fa-solid fa-handshake-angle text-primary me-2"></i>Interview Readiness
                      </h5>
                      <div className="p-3 bg-white border rounded">
                        <p className="mb-0 text-dark">{result?.interviewReadiness}</p>
                      </div>
                    </div>
                  </div>

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
