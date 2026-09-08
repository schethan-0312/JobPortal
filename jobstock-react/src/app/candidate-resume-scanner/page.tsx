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
          <div className="dashboard-tlbar d-block mb-4 pt-2 no-print">
            <div className="row align-items-center">
              <div className="col-xl-12 col-lg-12 col-md-12">
                <h1 className="mb-2 fs-2 fw-bold" style={{ color: '#161c1d' }}>AI Resume Health Scanner</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0" style={{ fontSize: '0.9rem' }}>
                    <li className="breadcrumb-item text-muted"><a href="#" className="text-decoration-none text-muted">Candidate</a></li>
                    <li className="breadcrumb-item text-muted"><a href="#" className="text-decoration-none text-muted">Dashboard</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-decoration-none fw-medium" style={{ color: '#44a388' }}>AI Resume Health Scanner</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            <p className="text-muted mb-4 pe-4 no-print" style={{ fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '800px' }}>
              Optimize your resume for applicant tracking systems. Our AI analyzes your document against target job descriptions to identify missing keywords and formatting issues.
            </p>
            <div className="row gx-5 no-print mb-4">
              {/* Left Column Form */}
              <div className="col-xl-7 col-lg-7">
                {status === "error" && errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                
                <form onSubmit={handleScan}>
                  
                  {/* Card 1: Choose Resume Source */}
                  <div className="card border-0 mb-4" style={{ borderRadius: '0.75rem', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                    <div className="card-header bg-white border-bottom-0 pt-4 px-4 pb-0 d-flex align-items-center gap-3">
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#defaf8', color: '#1b5e54', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>1</div>
                      <h5 className="fw-bold mb-0" style={{ color: '#275249' }}>Choose Resume Source</h5>
                    </div>
                    <div className="card-body p-4">
                      
                      <div className="row gx-3 mb-4">
                        <div className="col-4">
                          <div 
                            className="position-relative border rounded p-3 text-center cursor-pointer h-100 d-flex flex-column justify-content-center align-items-center"
                            style={{ 
                              cursor: 'pointer',
                              borderColor: sourceType === "saved" ? '#275249' : '#e1e5e5', 
                              backgroundColor: sourceType === "saved" ? '#f5faf9' : '#fff',
                              borderWidth: sourceType === "saved" ? '2px' : '1px'
                            }}
                            onClick={() => setSourceType("saved")}
                          >
                            {sourceType === "saved" && (
                              <div className="position-absolute" style={{ top: '6px', right: '6px', color: '#1b5e54' }}>
                                <i className="fa-solid fa-circle-check"></i>
                              </div>
                            )}
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eef5f4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                              <i className="fa-regular fa-folder-open text-secondary"></i>
                            </div>
                            <span className="fw-medium text-dark" style={{ fontSize: '0.85rem' }}>Analyze Saved</span>
                          </div>
                        </div>
                        <div className="col-4">
                          <div 
                            className="position-relative border rounded p-3 text-center cursor-pointer h-100 d-flex flex-column justify-content-center align-items-center"
                            style={{ 
                              cursor: 'pointer',
                              borderColor: sourceType === "upload" ? '#275249' : '#e1e5e5', 
                              backgroundColor: sourceType === "upload" ? '#f5faf9' : '#fff',
                              borderWidth: sourceType === "upload" ? '2px' : '1px'
                            }}
                            onClick={() => setSourceType("upload")}
                          >
                            {sourceType === "upload" && (
                              <div className="position-absolute" style={{ top: '6px', right: '6px', color: '#1b5e54' }}>
                                <i className="fa-solid fa-circle-check"></i>
                              </div>
                            )}
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eef5f4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                              <i className="fa-regular fa-file-pdf text-secondary"></i>
                            </div>
                            <span className="fw-medium text-dark" style={{ fontSize: '0.85rem' }}>Upload<br/>PDF/DOCX</span>
                          </div>
                        </div>
                        <div className="col-4">
                          <div 
                            className="position-relative border rounded p-3 text-center cursor-pointer h-100 d-flex flex-column justify-content-center align-items-center"
                            style={{ 
                              cursor: 'pointer',
                              borderColor: sourceType === "paste" ? '#275249' : '#e1e5e5', 
                              backgroundColor: sourceType === "paste" ? '#f5faf9' : '#fff',
                              borderWidth: sourceType === "paste" ? '2px' : '1px'
                            }}
                            onClick={() => setSourceType("paste")}
                          >
                            {sourceType === "paste" && (
                              <div className="position-absolute" style={{ top: '6px', right: '6px', color: '#1b5e54' }}>
                                <i className="fa-solid fa-circle-check"></i>
                              </div>
                            )}
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eef5f4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                              <i className="fa-regular fa-clipboard text-secondary"></i>
                            </div>
                            <span className="fw-medium text-dark" style={{ fontSize: '0.85rem' }}>Paste Text</span>
                          </div>
                        </div>
                      </div>

                      {sourceType === "saved" && (
                        <div className="alert alert-info border-0 shadow-sm d-flex align-items-start gap-2 mb-0" style={{ backgroundColor: '#eef9f8', color: '#145c50' }}>
                          <i className="fa-solid fa-circle-info mt-1"></i>
                          <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                            Currently selected: Default Profile Resume. This will analyze the structured resume you created in the "My Resume" section. Ensure it is up to date before scanning.
                          </span>
                        </div>
                      )}

                      {sourceType === "upload" && (
                        <div className="border border-dashed rounded p-4 text-center bg-light shadow-sm mb-0">
                          <input type="file" className="d-none" ref={fileInputRef} accept=".pdf,.doc,.docx" onChange={handleFileUpload} />
                          {resumeUrl ? (
                            <div className="text-success fw-bold"><i className="fa-solid fa-check-circle me-2"></i>File Uploaded Successfully</div>
                          ) : (
                            <>
                              <button type="button" className="btn btn-outline-secondary px-4 rounded-pill" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                                {uploading ? "Uploading..." : "Click to Upload Resume"}
                              </button>
                              <div className="small text-muted mt-2">Supports PDF, DOC, DOCX</div>
                            </>
                          )}
                        </div>
                      )}

                      {sourceType === "paste" && (
                        <div className="mb-0">
                          <textarea 
                            className="form-control bg-light shadow-sm" 
                            rows={6} 
                            placeholder="Paste your full resume text here..."
                            value={pastedText}
                            onChange={(e) => setPastedText(e.target.value)}
                            style={{ borderColor: '#e1e5e5' }}
                          />
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Card 2: Target Job Description */}
                  <div className="card border-0 mb-4" style={{ borderRadius: '0.75rem', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                    <div className="card-header bg-white border-bottom-0 pt-4 px-4 pb-0 d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-3">
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#defaf8', color: '#1b5e54', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>2</div>
                        <h5 className="fw-bold mb-0" style={{ color: '#275249' }}>Target Job Description</h5>
                      </div>
                    </div>
                    <div className="card-body p-4">
                      <div className="position-relative">
                        <textarea
                          className="form-control bg-light shadow-sm"
                          rows={6}
                          placeholder="Paste the target job description or role requirements here to get tailored keyword matching and semantic gap analysis..."
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          style={{ borderColor: '#e1e5e5', paddingBottom: '30px' }}
                        />
                        <div className="position-absolute text-muted" style={{ bottom: '10px', right: '15px', fontSize: '0.7rem' }}>
                          {jobDescription.length} / 5000 chars
                        </div>
                      </div>

                      <div className="d-flex justify-content-end mt-4">
                        <button type="submit" className="btn fw-medium px-4 py-2" style={{ backgroundColor: '#4dae94', color: '#fff', borderRadius: '2rem' }} disabled={status === "scanning" || (sourceType === "upload" && !resumeUrl) || (sourceType === "paste" && !pastedText)}>
                          {status === "scanning" ? <><i className="fa-solid fa-circle-notch fa-spin me-2"></i>Scanning...</> : <>Start AI Scan <i className="fa-solid fa-arrow-right ms-2"></i></>}
                        </button>
                      </div>
                    </div>
                  </div>

                </form>
              </div>

              {/* Right Column (AI Evaluation info) */}
              <div className="col-xl-5 col-lg-5">
                
                {/* Semantic Evaluation Card */}
                <div className="card border-0 mb-4" style={{ borderRadius: '0.75rem', padding: '1.5rem', background: 'linear-gradient(145deg, #d2ece5 0%, #daf0eb 100%)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                  <div className="card-body p-0">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <i className="fa-solid fa-microchip" style={{ color: '#275249', fontSize: '1.1rem' }}></i>
                      <h6 className="fw-bold mb-0" style={{ color: '#161c1d' }}>AI Semantic Evaluation</h6>
                    </div>
                    <p className="mb-4" style={{ fontSize: '0.85rem', lineHeight: '1.6', color: '#275249' }}>
                      Our AI goes beyond simple keyword matching to deeply understand context and capability.
                    </p>
                    
                    <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
                      <li className="d-flex align-items-start gap-3">
                        <i className="fa-solid fa-layer-group mt-1" style={{ color: '#4a5b57', fontSize: '0.8rem' }}></i>
                        <div>
                          <div className="fw-bold" style={{ color: '#161c1d', fontSize: '0.85rem' }}>Semantic Matching</div>
                          <div style={{ color: '#4a5b57', fontSize: '0.75rem', lineHeight: '1.4' }}>Understands synonyms and implied skills.</div>
                        </div>
                      </li>
                      <li className="d-flex align-items-start gap-3">
                        <i className="fa-solid fa-magnifying-glass-chart mt-1" style={{ color: '#4a5b57', fontSize: '0.8rem' }}></i>
                        <div>
                          <div className="fw-bold" style={{ color: '#161c1d', fontSize: '0.85rem' }}>Gap Analysis</div>
                          <div style={{ color: '#4a5b57', fontSize: '0.75rem', lineHeight: '1.4' }}>Identifies crucial missing experiences.</div>
                        </div>
                      </li>
                      <li className="d-flex align-items-start gap-3">
                        <i className="fa-solid fa-arrow-trend-up mt-1" style={{ color: '#4a5b57', fontSize: '0.8rem' }}></i>
                        <div>
                          <div className="fw-bold" style={{ color: '#161c1d', fontSize: '0.85rem' }}>Actionable Suggestions</div>
                          <div style={{ color: '#4a5b57', fontSize: '0.75rem', lineHeight: '1.4' }}>Concrete recommendations to improve phrasing.</div>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Recent Scans Card */}
                <div className="card border-0 mb-4" style={{ borderRadius: '0.75rem', padding: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                  <div className="card-header bg-white border-bottom-0 d-flex justify-content-between align-items-center pb-0">
                    <h6 className="fw-bold mb-0" style={{ color: '#275249' }}>Recent Scans</h6>
                    <i className="fa-solid fa-clock-rotate-left text-muted" style={{ fontSize: '0.9rem' }}></i>
                  </div>
                  <div className="card-body p-4 text-center">
                    <div className="mb-3">
                      <i className="fa-solid fa-file-magnifying-glass text-muted" style={{ fontSize: '2.5rem', opacity: 0.3 }}></i>
                    </div>
                    <div className="fw-medium text-dark" style={{ fontSize: '0.9rem' }}>No recent scans found.</div>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>Your history will appear here.</div>
                  </div>
                </div>

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

          {/* footer removed */}
        </div>
      </div>

      <div className="no-print">
        <UploadResumeModal />
      </div>
    </>
  );
}
