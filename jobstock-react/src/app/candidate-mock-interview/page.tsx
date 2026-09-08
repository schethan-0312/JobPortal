"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar7 from "@/components/Navbar7";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
import UploadResumeModal from "@/components/candidate-dashboard/UploadResumeModal";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface StartResponse {
  id: string;
  jobRole: string;
  questions: string[];
}

interface QuestionFeedback {
  rating: number;
  feedback: string;
}

interface SubmitResponse {
  id: string;
  jobRole: string;
  questions: string[];
  answers: string[];
  perQuestion: QuestionFeedback[];
  overallRating: number;
  overallSummary: string;
}

interface HistoryItem {
  id: string;
  jobRole: string;
  overallRating: number;
  completedAt: string;
}

type Stage = "idle" | "starting" | "interview" | "submitting" | "result";

function ratingStars(rating: number) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export default function CandidateMockInterviewPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [jobRole, setJobRole] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [interview, setInterview] = useState<StartResponse | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (!loading && (!user || user.role !== "CANDIDATE")) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user && user.role === "CANDIDATE") {
      api
        .get<HistoryItem[]>("/mock-interview/mine")
        .then(setHistory)
        .catch(() => setHistory([]));
    }
  }, [user]);

  if (loading || !user || user.role !== "CANDIDATE") {
    return null;
  }

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setStage("starting");
    try {
      const data = await api.post<StartResponse>("/mock-interview/start", { jobRole });
      setInterview(data);
      setAnswers(new Array(data.questions.length).fill(""));
      setResult(null);
      setStage("interview");
    } catch (err) {
      setStage("idle");
      setErrorMsg(err instanceof ApiError ? err.message : "Could not generate interview questions. Try again.");
    }
  }

  function updateAnswer(index: number, value: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  async function handleSubmit() {
    if (!interview) return;
    setErrorMsg(null);
    setStage("submitting");
    try {
      const data = await api.post<SubmitResponse>(`/mock-interview/${interview.id}/submit`, { answers });
      setResult(data);
      setStage("result");
      const updatedHistory = await api.get<HistoryItem[]>("/mock-interview/mine");
      setHistory(updatedHistory);
    } catch (err) {
      setStage("interview");
      setErrorMsg(err instanceof ApiError ? err.message : "Could not submit your answers. Try again.");
    }
  }

  function resetToStart() {
    setInterview(null);
    setResult(null);
    setJobRole("");
    setStage("idle");
  }

  return (
    <>
      <Navbar7 />

      <div className="dashboard-wrap bg-light">
        <CandidateSidebar active="mock-interview" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-5 pt-2">
            <div className="row align-items-center">
              <div className="col-xl-6 col-lg-6 col-md-6">
                <h1 className="mb-2 fs-2 fw-bold" style={{ color: '#161c1d' }}>Mock Interviews</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0" style={{ fontSize: '0.9rem' }}>
                    <li className="breadcrumb-item text-muted"><a href="#" className="text-decoration-none text-muted">Candidate</a></li>
                    <li className="breadcrumb-item text-muted"><a href="#" className="text-decoration-none text-muted">Dashboard</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-decoration-none fw-medium" style={{ color: '#4dae94' }}>Mock Interview</a></li>
                  </ol>
                </nav>
              </div>
              <div className="col-xl-6 col-lg-6 col-md-6 text-md-end mt-4 mt-md-0">
                <button className="btn px-4 py-2 fw-medium rounded" style={{ backgroundColor: '#0f6e4a', color: '#fff', fontSize: '0.9rem' }} onClick={() => router.back()}>
                  <i className="fa-solid fa-arrow-left me-2"></i> Back
                </button>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {(stage === "idle" || stage === "starting") && (
              <div className="card mb-5" style={{ borderRadius: '0.5rem', border: '1px solid #e5e9ea', overflow: 'hidden' }}>
                <div className="card-header py-4 px-4 d-flex align-items-center justify-content-between flex-wrap" style={{ backgroundColor: '#f8fbfb', borderBottom: '1px solid #e5e9ea' }}>
                  <h6 className="fw-bold mb-0" style={{ fontSize: '1.05rem', color: '#0d362d' }}>Practice a Mock Interview</h6>
                  <p className="text-muted mb-0 mt-2 mt-md-0" style={{ fontSize: '0.85rem', maxWidth: '400px', textAlign: 'right', lineHeight: '1.5' }}>
                    Get AI-generated interview questions for any job role, answer them in your
                    own words, and receive honest, specific feedback on each answer.
                  </p>
                </div>
                <div className="card-body p-4 bg-white">
                  {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                  <form onSubmit={handleStart}>
                    <div className="mb-4" style={{ maxWidth: '600px' }}>
                      <label className="fw-bold mb-2 text-dark" style={{ fontSize: '0.85rem' }}>Job Role</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Backend Developer, Product Manager"
                        value={jobRole}
                        onChange={(e) => setJobRole(e.target.value)}
                        required
                        minLength={2}
                        style={{ borderColor: '#e1e5e5' }}
                      />
                    </div>
                    <div>
                      <button type="submit" className="btn px-4 py-2 fw-medium rounded" style={{ backgroundColor: '#0f6e4a', color: '#fff', fontSize: '0.9rem' }} disabled={stage === "starting"}>
                        {stage === "starting" ? <><i className="fa-solid fa-spinner fa-spin me-2"></i>Generating...</> : "Start Mock Interview"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {(stage === "interview" || stage === "submitting") && interview && (
              <div className="card mb-5" style={{ borderRadius: '0.5rem', border: '1px solid #e5e9ea', overflow: 'hidden' }}>
                <div className="card-header py-4 px-4" style={{ backgroundColor: '#f8fbfb', borderBottom: '1px solid #e5e9ea' }}>
                  <h6 className="fw-bold mb-0" style={{ fontSize: '1.05rem', color: '#0d362d' }}>{interview.jobRole} Mock Interview</h6>
                  <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.85rem' }}>Answer each question in your own words, then submit for feedback.</p>
                </div>
                <div className="card-body p-4 bg-white">
                  {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                  {interview.questions.map((q, qi) => (
                    <div key={qi} className="mb-4">
                      <p className="fw-medium mb-2 text-dark" style={{ fontSize: '0.95rem' }}>
                        {qi + 1}. {q}
                      </p>
                      <textarea
                        className="form-control bg-light"
                        rows={3}
                        placeholder="Type your answer here..."
                        value={answers[qi]}
                        onChange={(e) => updateAnswer(qi, e.target.value)}
                        style={{ borderColor: '#e1e5e5' }}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn px-4 py-2 fw-medium rounded" style={{ backgroundColor: '#0f6e4a', color: '#fff', fontSize: '0.9rem' }}
                    onClick={handleSubmit}
                    disabled={stage === "submitting"}
                  >
                    {stage === "submitting" ? <><i className="fa-solid fa-spinner fa-spin me-2"></i>Getting Feedback...</> : "Submit for Feedback"}
                  </button>
                </div>
              </div>
            )}

            {stage === "result" && result && (
              <div className="card mb-5" style={{ borderRadius: '0.5rem', border: '1px solid #e5e9ea', overflow: 'hidden' }}>
                <div className="card-header py-4 px-4" style={{ backgroundColor: '#f8fbfb', borderBottom: '1px solid #e5e9ea' }}>
                  <h6 className="fw-bold mb-0" style={{ fontSize: '1.05rem', color: '#0d362d' }}>{result.jobRole} &mdash; Feedback</h6>
                </div>
                <div className="card-body p-4 bg-white">
                  <div className="text-center mb-5 p-4 rounded" style={{ backgroundColor: '#fff9e6' }}>
                    <div className="fs-3 text-warning mb-2">{ratingStars(result.overallRating)}</div>
                    <p className="text-dark fw-medium mb-0" style={{ fontSize: '0.95rem' }}>{result.overallSummary}</p>
                  </div>

                  {result.questions.map((q, qi) => (
                    <div key={qi} className="mb-4 pb-4 border-bottom" style={{ borderColor: '#f0f0f0' }}>
                      <p className="fw-bold mb-2 text-dark" style={{ fontSize: '0.95rem' }}>
                        {qi + 1}. {q}
                      </p>
                      <div className="p-3 bg-light rounded mb-3">
                        <p className="text-muted mb-0 fst-italic" style={{ fontSize: '0.9rem' }}>
                          Your answer: {result.answers[qi] || <em>No answer given</em>}
                        </p>
                      </div>
                      <div className="text-warning mb-1" style={{ fontSize: '0.9rem' }}>{ratingStars(result.perQuestion[qi]?.rating ?? 0)}</div>
                      <p className="mb-0 text-dark" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>{result.perQuestion[qi]?.feedback}</p>
                    </div>
                  ))}

                  <button type="button" className="btn px-4 py-2 fw-medium rounded" style={{ border: '1px solid #0f6e4a', color: '#0f6e4a', backgroundColor: 'transparent', fontSize: '0.9rem' }} onClick={resetToStart}>
                    Practice Another Interview
                  </button>
                </div>
              </div>
            )}

            <div className="card mb-4" style={{ borderRadius: '0.5rem', border: '1px solid #e5e9ea', overflow: 'hidden' }}>
              <div className="card-header py-4 px-4" style={{ backgroundColor: '#f8fbfb', borderBottom: '1px solid #e5e9ea' }}>
                <h6 className="fw-bold mb-0" style={{ fontSize: '1.05rem', color: '#0d362d' }}>Your Past Mock Interviews</h6>
              </div>
              <div className="card-body p-5 bg-white text-center">
                {history.length === 0 && (
                  <div className="py-4">
                    <div className="mx-auto mb-3" style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#eef2fa', color: '#5b6b7a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-clock-rotate-left fs-5"></i>
                    </div>
                    <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>No completed mock interviews yet.</p>
                  </div>
                )}
                {history.length > 0 && (
                  <div className="row text-start">
                    {history.map((h) => (
                      <div className="col-md-6 mb-3" key={h.id}>
                        <div 
                          className="card h-100" 
                          style={{ backgroundColor: '#f8fbfb', borderRadius: '0.5rem', border: '1px solid #e5e9ea', overflow: 'hidden' }}
                        >
                          <div className="card-body p-4 d-flex flex-column">
                            <h6 className="mb-1 fw-bold" style={{ color: '#0d362d', fontSize: '1.05rem' }}>{h.jobRole}</h6>
                            <div className="text-warning mb-3 mt-1" style={{ fontSize: '0.9rem' }}>{ratingStars(h.overallRating)}</div>
                            <div className="d-flex align-items-center text-muted mt-auto" style={{ fontSize: '0.85rem' }}>
                              <i className="fa-regular fa-calendar me-2"></i> {new Date(h.completedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* footer removed */}
        </div>
      </div>

      <UploadResumeModal />
    </>
  );
}
