"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar7 from "@/components/Navbar7";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
import UploadResumeModal from "@/components/candidate-dashboard/UploadResumeModal";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface CareerStep {
  roleTitle: string;
  timeframe: string;
  salaryRange: string;
  description: string;
  skillsToLearn: string[];
}

interface CareerPathResult {
  currentLevelSummary: string;
  careerPath: CareerStep[];
  recommendedSkillsNow: string[];
}

export default function CandidateCareerNavigatorPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [targetIndustry, setTargetIndustry] = useState("");
  const [status, setStatus] = useState<"idle" | "generating" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<CareerPathResult | null>(null);

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
    setResult(null);
    setStatus("generating");
    try {
      const data = await api.post<CareerPathResult>("/career-navigator/generate", {
        targetIndustry: targetIndustry || undefined,
      });
      setResult(data);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof ApiError ? err.message : "Could not generate your career path. Try again.");
    }
  }

  return (
    <>
      <Navbar7 />

      <div className="dashboard-wrap bg-light">
        <CandidateSidebar active="career-navigator" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Career Path Navigator</h1>
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
            <div className="card mb-4">
              <div className="card-header">
                <h4>Your Personalized Career Roadmap</h4>
                <p className="text-muted mb-0 mt-1">
                  Based on your profile (headline, skills, and experience), we'll map out realistic next roles, the
                  skills to learn for each, and typical salary progression.
                </p>
              </div>
              <div className="card-body">
                {status === "error" && errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                <form onSubmit={handleGenerate}>
                  <div className="row mb-3">
                    <label className="col-xl-2 col-md-12 col-form-label">Target Direction (optional)</label>
                    <div className="col-xl-7 col-md-12">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Product Management, Data Science, Engineering Leadership"
                        value={targetIndustry}
                        onChange={(e) => setTargetIndustry(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-xl-12 col-md-12">
                      <button type="submit" className="btn btn-main" disabled={status === "generating"}>
                        {status === "generating" ? "Generating Roadmap..." : "Generate My Career Path"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {result && (
              <>
                <div className="card mb-4">
                  <div className="card-body">
                    <h5 className="mb-2">Where You Are Now</h5>
                    <p className="mb-3">{result.currentLevelSummary}</p>
                    <h6>Focus on learning these skills right now:</h6>
                    <div>
                      {result.recommendedSkillsNow.map((s, i) => (
                        <span key={i} className="badge bg-main text-white me-2 mb-2 p-2">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h4>Your Roadmap</h4>
                  </div>
                  <div className="card-body">
                    {result.careerPath.map((step, i) => (
                      <div key={i} className="d-flex mb-4">
                        <div className="me-3 text-center" style={{ minWidth: 40 }}>
                          <div
                            className="rounded-circle bg-main text-white d-flex align-items-center justify-content-center"
                            style={{ width: 40, height: 40 }}
                          >
                            {i + 1}
                          </div>
                          {i < result.careerPath.length - 1 && (
                            <div style={{ width: 2, height: 60, background: "#ddd", margin: "0 auto" }} />
                          )}
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start flex-wrap">
                            <h5 className="mb-1">{step.roleTitle}</h5>
                            <span className="badge bg-light text-dark border">{step.timeframe}</span>
                          </div>
                          <p className="fw-medium text-success mb-2">{step.salaryRange}</p>
                          <p className="mb-2">{step.description}</p>
                          <div>
                            {step.skillsToLearn.map((s, si) => (
                              <span key={si} className="badge bg-light text-dark border me-2 mb-2 p-2">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
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
