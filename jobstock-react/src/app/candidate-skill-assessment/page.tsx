"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar7 from "@/components/Navbar7";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
import UploadResumeModal from "@/components/candidate-dashboard/UploadResumeModal";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface QuizQuestion {
  question: string;
  options: string[];
}

interface StartResponse {
  id: string;
  skill: string;
  totalQuestions: number;
  questions: QuizQuestion[];
}

interface SubmitResponse {
  id: string;
  skill: string;
  score: number;
  totalQuestions: number;
  passed: boolean;
  correctAnswers: number[];
}

interface HistoryItem {
  id: string;
  skill: string;
  score: number;
  totalQuestions: number;
  passed: boolean;
  completedAt: string;
}

type Stage = "idle" | "starting" | "quiz" | "submitting" | "result";

export default function CandidateSkillAssessmentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [skill, setSkill] = useState("");
  const [recommendedSkills, setRecommendedSkills] = useState<string[] | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<StartResponse | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
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
        .get<HistoryItem[]>("/skill-assessment/mine")
        .then(setHistory)
        .catch(() => setHistory([]));

      api
        .get<{ recommendedSkills: string[] }>("/skill-assessment/recommended")
        .then((res) => setRecommendedSkills(res.recommendedSkills))
        .catch(() => setRecommendedSkills([]));
    }
  }, [user]);

  if (loading || !user || user.role !== "CANDIDATE") {
    return null;
  }

  async function handleStart(selectedSkill: string) {
    setSkill(selectedSkill);
    setErrorMsg(null);
    setStage("starting");
    try {
      const data = await api.post<StartResponse>("/skill-assessment/start", { skill: selectedSkill });
      setQuiz(data);
      setSelectedAnswers(new Array(data.questions.length).fill(null));
      setResult(null);
      setStage("quiz");
    } catch (err) {
      setStage("idle");
      setErrorMsg(err instanceof ApiError ? err.message : "Could not generate the assessment. Try again.");
    }
  }

  function selectAnswer(qIndex: number, optionIndex: number) {
    setSelectedAnswers((prev) => {
      const next = [...prev];
      next[qIndex] = optionIndex;
      return next;
    });
  }

  async function handleSubmit() {
    if (!quiz || selectedAnswers.some((a) => a === null)) return;
    setErrorMsg(null);
    setStage("submitting");
    try {
      const data = await api.post<SubmitResponse>(`/skill-assessment/${quiz.id}/submit`, {
        answers: selectedAnswers,
      });
      setResult(data);
      setStage("result");
      const updatedHistory = await api.get<HistoryItem[]>("/skill-assessment/mine");
      setHistory(updatedHistory);
    } catch (err) {
      setStage("quiz");
      setErrorMsg(err instanceof ApiError ? err.message : "Could not submit your answers. Try again.");
    }
  }

  function resetToStart() {
    setQuiz(null);
    setResult(null);
    setSkill("");
    setStage("idle");
  }

  return (
    <>
      <Navbar7 />

      <div className="dashboard-wrap bg-light">
        <CandidateSidebar active="skill-assessment" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Skill Assessments</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Candidate</a></li>
                    <li className="breadcrumb-item text-muted"><a href="#">Dashboard</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Skill Assessments</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {(stage === "idle" || stage === "starting") && (
              <div className="card mb-4">
                <div className="card-header">
                  <h4>Recommended Skill Assessments</h4>
                  <p className="text-muted mb-0 mt-1">
                    Based on your profile, here are some AI-recommended skills you can assess to prove your proficiency.
                  </p>
                </div>
                <div className="card-body">
                  {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                  {recommendedSkills === null ? (
                    <p className="text-muted">Loading recommendations...</p>
                  ) : (
                    <div className="d-flex flex-wrap gap-2">
                      {recommendedSkills.map((rs) => (
                        <button
                          key={rs}
                          type="button"
                          className="btn btn-outline-main"
                          disabled={stage === "starting"}
                          onClick={() => handleStart(rs)}
                        >
                          {stage === "starting" && skill === rs ? "Generating..." : rs}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {(stage === "quiz" || stage === "submitting") && quiz && (
              <div className="card mb-4">
                <div className="card-header">
                  <h4>{quiz.skill} Assessment</h4>
                  <p className="text-muted mb-0 mt-1">{quiz.totalQuestions} questions &mdash; select one answer each</p>
                </div>
                <div className="card-body">
                  {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                  {quiz.questions.map((q, qi) => (
                    <div key={qi} className="mb-4 pb-3 border-bottom">
                      <p className="fw-medium mb-2">
                        {qi + 1}. {q.question}
                      </p>
                      {q.options.map((opt, oi) => (
                        <div className="form-check mb-1" key={oi}>
                          <input
                            className="form-check-input"
                            type="radio"
                            name={`q-${qi}`}
                            id={`q-${qi}-o-${oi}`}
                            checked={selectedAnswers[qi] === oi}
                            onChange={() => selectAnswer(qi, oi)}
                          />
                          <label className="form-check-label" htmlFor={`q-${qi}-o-${oi}`}>
                            {opt}
                          </label>
                        </div>
                      ))}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-main"
                    onClick={handleSubmit}
                    disabled={stage === "submitting" || selectedAnswers.some((a) => a === null)}
                  >
                    {stage === "submitting" ? "Submitting..." : "Submit Answers"}
                  </button>
                </div>
              </div>
            )}

            {stage === "result" && result && (
              <div className="card mb-4">
                <div className="card-header">
                  <h4>{result.skill} &mdash; Result</h4>
                </div>
                <div className="card-body text-center">
                  <div
                    className={`badge ${result.passed ? "bg-success" : "bg-danger"} p-3 fs-6 mb-3`}
                    style={{ borderRadius: 50 }}
                  >
                    {result.passed ? (
                      <>
                        <i className="fa-solid fa-award me-2"></i>Badge Earned &mdash; Passed
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-circle-xmark me-2"></i>Not Passed
                      </>
                    )}
                  </div>
                  <h2 className="mb-1">
                    {result.score} / {result.totalQuestions}
                  </h2>
                  <p className="text-muted mb-4">
                    {Math.round((result.score / result.totalQuestions) * 100)}% score &mdash; 70% required to pass
                  </p>
                  <button type="button" className="btn btn-outline-main" onClick={resetToStart}>
                    Take Another Assessment
                  </button>
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-header">
                <h4>Your Verified Skill Badges</h4>
              </div>
              <div className="card-body">
                {history.length === 0 && <p className="text-muted mb-0">No completed assessments yet.</p>}
                {history.length > 0 && (
                  <div className="row">
                    {history.map((h) => (
                      <div className="col-md-4 mb-3" key={h.id}>
                        <div
                          className={`card h-100 ${h.passed ? "border-success" : "border-secondary"}`}
                        >
                          <div className="card-body">
                            <h5 className="mb-1">
                              {h.passed && <i className="fa-solid fa-award text-success me-2"></i>}
                              {h.skill}
                            </h5>
                            <p className="mb-1">
                              {h.score}/{h.totalQuestions} ({Math.round((h.score / h.totalQuestions) * 100)}%)
                            </p>
                            <span className={`badge ${h.passed ? "bg-success" : "bg-secondary"}`}>
                              {h.passed ? "Passed" : "Not Passed"}
                            </span>
                            <div className="small text-muted mt-2">
                              {new Date(h.completedAt).toLocaleDateString()}
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
