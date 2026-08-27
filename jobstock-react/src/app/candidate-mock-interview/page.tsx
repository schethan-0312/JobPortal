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
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Mock Interviews</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Candidate</a></li>
                    <li className="breadcrumb-item text-muted"><a href="#">Dashboard</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Mock Interviews</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {(stage === "idle" || stage === "starting") && (
              <div className="card mb-4">
                <div className="card-header">
                  <h4>Practice a Mock Interview</h4>
                  <p className="text-muted mb-0 mt-1">
                    Get AI-generated interview questions for any job role, answer them in your own words, and
                    receive honest, specific feedback on each answer.
                  </p>
                </div>
                <div className="card-body">
                  {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                  <form onSubmit={handleStart}>
                    <div className="row mb-3">
                      <label className="col-xl-2 col-md-12 col-form-label">Job Role</label>
                      <div className="col-xl-7 col-md-12">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Backend Developer, Product Manager"
                          value={jobRole}
                          onChange={(e) => setJobRole(e.target.value)}
                          required
                          minLength={2}
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-xl-12 col-md-12">
                        <button type="submit" className="btn btn-main" disabled={stage === "starting"}>
                          {stage === "starting" ? "Generating Questions..." : "Start Mock Interview"}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {(stage === "interview" || stage === "submitting") && interview && (
              <div className="card mb-4">
                <div className="card-header">
                  <h4>{interview.jobRole} Mock Interview</h4>
                  <p className="text-muted mb-0 mt-1">Answer each question in your own words, then submit for feedback.</p>
                </div>
                <div className="card-body">
                  {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                  {interview.questions.map((q, qi) => (
                    <div key={qi} className="mb-4">
                      <p className="fw-medium mb-2">
                        {qi + 1}. {q}
                      </p>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Type your answer here..."
                        value={answers[qi]}
                        onChange={(e) => updateAnswer(qi, e.target.value)}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-main"
                    onClick={handleSubmit}
                    disabled={stage === "submitting"}
                  >
                    {stage === "submitting" ? "Getting Feedback..." : "Submit for Feedback"}
                  </button>
                </div>
              </div>
            )}

            {stage === "result" && result && (
              <div className="card mb-4">
                <div className="card-header">
                  <h4>{result.jobRole} &mdash; Feedback</h4>
                </div>
                <div className="card-body">
                  <div className="text-center mb-4">
                    <div className="fs-3 text-warning">{ratingStars(result.overallRating)}</div>
                    <p className="text-muted mb-0">{result.overallSummary}</p>
                  </div>

                  {result.questions.map((q, qi) => (
                    <div key={qi} className="mb-4 pb-3 border-bottom">
                      <p className="fw-medium mb-1">
                        {qi + 1}. {q}
                      </p>
                      <p className="text-muted mb-2 fst-italic">
                        Your answer: {result.answers[qi] || <em>No answer given</em>}
                      </p>
                      <div className="text-warning mb-1">{ratingStars(result.perQuestion[qi]?.rating ?? 0)}</div>
                      <p className="mb-0">{result.perQuestion[qi]?.feedback}</p>
                    </div>
                  ))}

                  <button type="button" className="btn btn-outline-main" onClick={resetToStart}>
                    Practice Another Interview
                  </button>
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-header">
                <h4>Your Past Mock Interviews</h4>
              </div>
              <div className="card-body">
                {history.length === 0 && <p className="text-muted mb-0">No completed mock interviews yet.</p>}
                {history.length > 0 && (
                  <div className="row">
                    {history.map((h) => (
                      <div className="col-md-4 mb-3" key={h.id}>
                        <div className="card h-100">
                          <div className="card-body">
                            <h5 className="mb-1">{h.jobRole}</h5>
                            <div className="text-warning mb-2">{ratingStars(h.overallRating)}</div>
                            <div className="small text-muted">{new Date(h.completedAt).toLocaleDateString()}</div>
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
