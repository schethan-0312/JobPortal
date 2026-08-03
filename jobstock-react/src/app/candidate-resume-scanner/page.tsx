"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar7 from "@/components/Navbar7";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
import UploadResumeModal from "@/components/candidate-dashboard/UploadResumeModal";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface Suggestion {
  text: string;
  priority: "high" | "medium" | "low";
}

interface ResumeScanResult {
  overallScore: number;
  summary: string;
  structureScore: number;
  keywordScore: number;
  atsScore: number;
  achievementScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: Suggestion[];
  missingKeywords: string[];
}

function scoreColor(score: number) {
  if (score >= 75) return "#28a745";
  if (score >= 50) return "#f0ad4e";
  return "#dc3545";
}

const priorityColors: Record<Suggestion["priority"], string> = {
  high: "#dc3545",
  medium: "#f0ad4e",
  low: "#6c757d",
};

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="mb-3">
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

  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [status, setStatus] = useState<"idle" | "scanning" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ResumeScanResult | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "CANDIDATE")) {
      router.push("/");
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== "CANDIDATE") {
    return null;
  }

  async function runScan() {
    setErrorMsg(null);
    setStatus("scanning");
    try {
      const data = await api.post<ResumeScanResult>("/resume-scanner/scan", {
        resumeText,
        targetRole: targetRole || undefined,
      });
      setResult(data);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    await runScan();
  }

  return (
    <>
      <Navbar7 />

      <div className="dashboard-wrap bg-light">
        <CandidateSidebar active="resume-scanner" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Resume Health Scanner</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Candidate</a></li>
                    <li className="breadcrumb-item text-muted"><a href="#">Dashboard</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Resume Health Scanner</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            <div className="card mb-4">
              <div className="card-header">
                <h4>Paste Your Resume Text</h4>
                <p className="text-muted mb-0 mt-1">
                  Our AI will score your resume on structure, keyword match, ATS compatibility, and achievement
                  quantification, then suggest concrete improvements.
                </p>
              </div>
              <div className="card-body">
                {status === "error" && errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                <form onSubmit={handleScan}>
                  <div className="row mb-3">
                    <label className="col-xl-2 col-md-12 col-form-label">Target Role (optional)</label>
                    <div className="col-xl-7 col-md-12">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Frontend Developer"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-xl-2 col-md-12 col-form-label">Resume Text</label>
                    <div className="col-xl-7 col-md-12">
                      <textarea
                        className="form-control"
                        rows={10}
                        placeholder="Paste the full text of your resume here (minimum 50 characters)..."
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        minLength={50}
                        required
                      />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-xl-12 col-md-12 d-flex gap-2">
                      <button type="submit" className="btn btn-main" disabled={status === "scanning"}>
                        {status === "scanning" ? "Scanning..." : "Scan My Resume"}
                      </button>
                      {result && (
                        <button
                          type="button"
                          className="btn btn-outline-main"
                          disabled={status === "scanning"}
                          onClick={runScan}
                        >
                          {status === "scanning" ? "Rescanning..." : "Rescan After Edits"}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {result && (
              <div className="card">
                <div className="card-header">
                  <h4>Scan Results</h4>
                </div>
                <div className="card-body">
                  <div className="row mb-4 align-items-center">
                    <div className="col-md-3 text-center">
                      <div
                        style={{
                          width: 110,
                          height: 110,
                          borderRadius: "50%",
                          border: `6px solid ${scoreColor(result.overallScore)}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto",
                        }}
                      >
                        <div>
                          <div className="fs-3 fw-bold">{result.overallScore}</div>
                          <div className="small text-muted">/ 100</div>
                        </div>
                      </div>
                      <div className="mt-2 fw-medium">Overall Score</div>
                    </div>
                    <div className="col-md-9">
                      <p className="fs-6 mb-3">{result.summary}</p>
                      <ScoreBar label="Formatting & Structure" score={result.structureScore} />
                      <ScoreBar label="Keyword Match" score={result.keywordScore} />
                      <ScoreBar label="ATS Compatibility" score={result.atsScore} />
                      <ScoreBar label="Achievement Quantification" score={result.achievementScore} />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-4">
                      <h6 className="text-success">
                        <i className="fa-solid fa-circle-check me-2"></i>Strengths
                      </h6>
                      <ul>
                        {result.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="col-md-6 mb-4">
                      <h6 className="text-danger">
                        <i className="fa-solid fa-triangle-exclamation me-2"></i>Weaknesses
                      </h6>
                      <ul>
                        {result.weaknesses.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <h6>
                    <i className="fa-solid fa-lightbulb me-2 text-warning"></i>Suggested Fixes
                  </h6>
                  <ul className="list-unstyled">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="d-flex align-items-start gap-2 mb-2">
                        <span
                          className="rounded-circle flex-shrink-0 mt-1"
                          style={{ width: 8, height: 8, backgroundColor: priorityColors[s.priority] }}
                          title={`${s.priority} priority`}
                        />
                        <span>{s.text}</span>
                      </li>
                    ))}
                  </ul>

                  {result.missingKeywords.length > 0 && (
                    <>
                      <h6 className="mt-4">
                        <i className="fa-solid fa-magnifying-glass me-2"></i>Missing Keywords
                      </h6>
                      <div>
                        {result.missingKeywords.map((k, i) => (
                          <span key={i} className="badge bg-light text-dark border me-2 mb-2 p-2">
                            {k}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="row">
            <div className="col-md-12">
              <div className="py-3 text-center">
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
