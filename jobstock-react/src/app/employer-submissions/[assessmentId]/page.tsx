"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Navbar8 from "@/components/Navbar8";
import EmployerSidebar from "@/components/employer-dashboard/EmployerSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

type QuestionType = 
  | "mcq" 
  | "coding" 
  | "short_answer" 
  | "debugging" 
  | "sql" 
  | "spreadsheet" 
  | "video"
  | "whiteboard"
  | "personality";

interface QuestionSection {
  id: string;
  type: QuestionType;
  questions: any[];
}

interface Attempt {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  answers: Record<string, Record<string, any>> | null;
  candidate: {
    id: string;
    fullName: string;
    user: {
      email: string;
    };
  };
  assessment: {
    title: string;
    questions: QuestionSection[];
  };
}

export default function EmployerSubmissionDetailsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const assessmentId = params.assessmentId as string;

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedAttempt, setSelectedAttempt] = useState<Attempt | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "EMPLOYER")) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "EMPLOYER" || !assessmentId) return;
    
    api
      .get<Attempt[]>(`/jobs/assessments/${assessmentId}/submissions`)
      .then((data) => {
        setAttempts(data);
        setDataLoading(false);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Failed to load submissions");
        setDataLoading(false);
      });
  }, [user, assessmentId]);

  if (loading || !user || user.role !== "EMPLOYER") {
    return null;
  }

  const assessmentTitle = attempts.length > 0 ? attempts[0].assessment.title : "Assessment";

  // Helper to parse questions safely
  const getParsedQuestions = (questions: any): QuestionSection[] => {
    if (!questions) return [];
    if (typeof questions === "string") {
      try {
        return JSON.parse(questions);
      } catch (e) {
        return [];
      }
    }
    if (Array.isArray(questions)) return questions;
    return [];
  };

  const getAttemptMCQScore = (attempt: Attempt): { scorePercent: number; correct: number; total: number } | null => {
    if (!attempt.answers) return null;

    const sections = getParsedQuestions(attempt.assessment?.questions);
    let totalMCQ = 0;
    let correctMCQ = 0;

    sections.forEach((section) => {
      if (section.type?.toLowerCase() === "mcq" && Array.isArray(section.questions)) {
        section.questions.forEach((q) => {
          totalMCQ++;
          const currentAnswer = attempt.answers?.[section.id]?.[q.id];
          if (currentAnswer && currentAnswer.selectedOption !== undefined && currentAnswer.selectedOption !== null && currentAnswer.selectedOption !== "") {
            const optIndex = parseInt(currentAnswer.selectedOption, 10);
            if (!isNaN(optIndex) && optIndex === q.correctOptionIndex) {
              correctMCQ++;
            }
          }
        });
      }
    });

    if (totalMCQ === 0) return null;
    const scorePercent = Math.round((correctMCQ / totalMCQ) * 100);
    return { scorePercent, correct: correctMCQ, total: totalMCQ };
  };

  const hasMCQ = attempts.length > 0 && attempts.some(a => {
    const sections = getParsedQuestions(a.assessment?.questions);
    return sections.some(sec => sec.type?.toLowerCase() === "mcq" || (Array.isArray(sec.questions) && sec.questions.some((q: any) => q.type?.toLowerCase() === "mcq")));
  });

  const completedAttempts = attempts.filter(a => a.status === "COMPLETED");

  const calculateAvgScore = () => {
    const scores = completedAttempts
      .map(a => getAttemptMCQScore(a))
      .filter((s): s is { scorePercent: number; correct: number; total: number } => s !== null);
    
    if (scores.length === 0) return null;
    const sum = scores.reduce((acc, curr) => acc + curr.scorePercent, 0);
    return Math.round(sum / scores.length);
  };

  const avgScore = calculateAvgScore();

  const handleDeleteAttempt = async (attemptId: string, candidateName: string) => {
    if (!confirm(`Are you sure you want to delete the submission result for ${candidateName}?`)) {
      return;
    }

    try {
      await api.delete(`/jobs/assessments/attempts/${attemptId}`);
      setAttempts(prev => prev.filter(a => a.id !== attemptId));
      if (selectedAttempt?.id === attemptId) {
        setSelectedAttempt(null);
      }
    } catch (err: any) {
      alert(err instanceof ApiError ? err.message : "Failed to delete submission result");
    }
  };

  // Render specific answer based on question type
  const renderAnswer = (sectionType: string, q: any, currentAnswer: any) => {
    if (!currentAnswer) return <p className="text-muted fst-italic">No answer provided.</p>;

    switch (sectionType) {
      case "mcq":
        const optIndex = parseInt(currentAnswer.selectedOption);
        return (
          <div>
            <p><strong>Selected Option:</strong> {isNaN(optIndex) ? "None" : q.options?.[optIndex] || "Unknown"}</p>
            {q.correctOptionIndex !== undefined && (
              <p className={optIndex === q.correctOptionIndex ? "text-success fw-bold" : "text-danger fw-bold"}>
                {optIndex === q.correctOptionIndex ? (
                  <><i className="fa-solid fa-check me-2"></i>Correct</>
                ) : (
                  <><i className="fa-solid fa-xmark me-2"></i>Incorrect (Correct: {q.options?.[q.correctOptionIndex]})</>
                )}
              </p>
            )}
          </div>
        );
      case "coding":
      case "debugging":
        const codeText = currentAnswer.code || "";
        
        const evalCodeForEmployer = (code: string, testCases?: any[], fallbackExpected?: string) => {
          const effectiveTC = (testCases && testCases.length > 0)
            ? testCases
            : [{ id: "default", input: "", expectedOutput: fallbackExpected || "" }];

          return effectiveTC.map((tc: any) => {
            let actualOutput = "";
            let passed = false;
            let error: string | undefined = undefined;

            try {
              let parsedInput: any = tc.input;
              try {
                if (tc.input && tc.input.trim() !== "") {
                  parsedInput = JSON.parse(tc.input);
                }
              } catch (e) {
                parsedInput = tc.input;
              }

              const logs: string[] = [];
              const customConsole = {
                log: (...args: any[]) => logs.push(args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ")),
                error: (...args: any[]) => logs.push("ERROR: " + args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ")),
                warn: (...args: any[]) => logs.push("WARN: " + args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" "))
              };

              const runnerFn = new Function("console", "input", `
                "use strict";
                ${code}
                if (typeof solution === "function") {
                  return solution(input);
                }
              `);

              const result = runnerFn(customConsole, parsedInput);
              if (result !== undefined) {
                actualOutput = typeof result === "object" ? JSON.stringify(result) : String(result);
              } else if (logs.length > 0) {
                actualOutput = logs.join("\n");
              } else {
                actualOutput = "undefined";
              }

              passed = (actualOutput.trim() === (tc.expectedOutput || "").trim());
            } catch (err: any) {
              error = err.message || String(err);
              actualOutput = `Runtime Error: ${error}`;
              passed = false;
            }

            return {
              input: tc.input || "",
              expectedOutput: tc.expectedOutput || "",
              actualOutput,
              passed,
              error
            };
          });
        };

        const testCaseResults = currentAnswer.testResults || evalCodeForEmployer(codeText, q.testCases, q.expectedOutput);
        const passedCount = testCaseResults.filter((r: any) => r.passed).length;
        const totalCount = testCaseResults.length;

        return (
          <div>
            <div className="mb-3">
              <label className="form-label fw-bold small text-muted">Submitted Solution Code</label>
              <pre className="bg-dark text-light p-3 rounded font-monospace" style={{ whiteSpace: "pre-wrap" }}>
                {codeText || "(No code submitted)"}
              </pre>
            </div>

            <div className="card border-0 shadow-sm bg-white p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0 text-primary">
                  <i className="fa-solid fa-vial-circle-check me-2"></i>Test Cases Evaluation Report
                </h6>
                <span className={`badge ${passedCount === totalCount && totalCount > 0 ? 'bg-success' : passedCount > 0 ? 'bg-warning text-dark' : 'bg-danger'} px-3 py-2 fs-6`}>
                  {passedCount} / {totalCount} Test Cases Passed
                </span>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered align-middle small mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Status</th>
                      <th>Input</th>
                      <th>Expected Output</th>
                      <th>Actual Output</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testCaseResults.map((tr: any, trIdx: number) => (
                      <tr key={trIdx} className={tr.passed ? 'table-success-subtle' : 'table-danger-subtle'}>
                        <td className="fw-bold">{trIdx + 1}</td>
                        <td>
                          {tr.passed ? (
                            <span className="badge bg-success"><i className="fa-solid fa-check me-1"></i>PASSED</span>
                          ) : (
                            <span className="badge bg-danger"><i className="fa-solid fa-xmark me-1"></i>FAILED</span>
                          )}
                        </td>
                        <td><code className="text-dark">{tr.input || "(None)"}</code></td>
                        <td><code className="text-dark">{tr.expectedOutput || "(None)"}</code></td>
                        <td>
                          <code className={tr.passed ? "text-success fw-bold" : "text-danger fw-bold"}>
                            {tr.actualOutput}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case "sql":
        return (
          <pre className="bg-dark text-light p-3 rounded" style={{ whiteSpace: "pre-wrap" }}>
            {currentAnswer.query}
          </pre>
        );
      case "personality":
        return (
          <div>
            <div className="mb-2"><strong>Work Preferences:</strong> <p>{currentAnswer.workPrefResponse}</p></div>
            <div className="mb-2"><strong>Behavioral Tendencies:</strong> <p>{currentAnswer.behavTendResponse}</p></div>
            <div className="mb-2"><strong>Working Style:</strong> <p>{currentAnswer.workStyleResponse}</p></div>
          </div>
        );
      default:
        // short_answer, spreadsheet, video, whiteboard (currently all return text)
        return <p style={{ whiteSpace: "pre-wrap" }}>{currentAnswer.text}</p>;
    }
  };

  return (
    <>
      <Navbar8 />

      <div className="dashboard-wrap bg-light">
        <EmployerSidebar active="submissions" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">{assessmentTitle} Submissions</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted">
                      <Link href="/employer-dashboard">Employer</Link>
                    </li>
                    <li className="breadcrumb-item text-muted">
                      <Link href="/employer-submissions">Submissions</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <a href="#" className="text-main">
                        Details
                      </a>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}

            {/* MCQ Summary Cards */}
            {hasMCQ && attempts.length > 0 && (
              <div className="row mb-4">
                <div className="col-md-4 col-sm-6 mb-3 mb-md-0">
                  <div className="card border-0 shadow-sm bg-white p-3 d-flex flex-row align-items-center">
                    <div className="rounded-circle bg-primary-subtle p-3 text-primary me-3 d-flex align-items-center justify-content-center" style={{ width: 52, height: 52 }}>
                      <i className="fa-solid fa-chart-pie fs-4"></i>
                    </div>
                    <div>
                      <div className="text-muted small fw-medium">Average Score</div>
                      <div className="fs-3 fw-bold text-primary">
                        {avgScore !== null ? `${avgScore}%` : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-4 col-sm-6 mb-3 mb-md-0">
                  <div className="card border-0 shadow-sm bg-white p-3 d-flex flex-row align-items-center">
                    <div className="rounded-circle bg-success-subtle p-3 text-success me-3 d-flex align-items-center justify-content-center" style={{ width: 52, height: 52 }}>
                      <i className="fa-solid fa-circle-check fs-4"></i>
                    </div>
                    <div>
                      <div className="text-muted small fw-medium">Completed Submissions</div>
                      <div className="fs-3 fw-bold text-dark">{completedAttempts.length}</div>
                    </div>
                  </div>
                </div>

                <div className="col-md-4 col-sm-6">
                  <div className="card border-0 shadow-sm bg-white p-3 d-flex flex-row align-items-center">
                    <div className="rounded-circle bg-info-subtle p-3 text-info me-3 d-flex align-items-center justify-content-center" style={{ width: 52, height: 52 }}>
                      <i className="fa-solid fa-users fs-4"></i>
                    </div>
                    <div>
                      <div className="text-muted small fw-medium">Total Candidates</div>
                      <div className="fs-3 fw-bold text-dark">{attempts.length}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="row">
              <div className="col-lg-12">
                <div className="card shadow-sm border-0 mb-4">
                  <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-3">
                      <h4 className="mb-0 fw-bold">Candidates</h4>
                      {hasMCQ && avgScore !== null && (
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 fs-6">
                          <i className="fa-solid fa-chart-line me-2"></i>
                          Avg Score: {avgScore}%
                        </span>
                      )}
                    </div>
                    <Link href="/employer-submissions" className="btn btn-sm btn-outline-secondary">
                      &larr; Back to Assessments
                    </Link>
                  </div>
                  <div className="card-body p-0">
                    {dataLoading ? (
                      <div className="p-4 text-center">Loading...</div>
                    ) : attempts.length === 0 ? (
                      <div className="p-5 text-center text-muted">
                        <i className="fa-solid fa-users-slash fs-1 mb-3"></i>
                        <h5>No submissions yet</h5>
                        <p>No candidates have taken this assessment.</p>
                      </div>
                    ) : (
                      <div className="table-responsive" style={{ overflowX: "auto", width: "100%", display: "block" }}>
                        <table className="table table-hover align-middle mb-0" style={{ whiteSpace: "nowrap", width: "100%" }}>
                          <thead className="table-light">
                            <tr>
                              <th className="py-3 px-4">Candidate</th>
                              <th className="py-3">Status</th>
                              <th className="py-3">Started At</th>
                              <th className="py-3">Completed At</th>
                              {hasMCQ && <th className="py-3">Score</th>}
                              <th className="py-3 text-end px-4">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attempts.map((attempt) => {
                              const scoreObj = getAttemptMCQScore(attempt);
                              return (
                                <tr key={attempt.id} className={selectedAttempt?.id === attempt.id ? "table-primary" : ""}>
                                  <td className="py-3 px-4">
                                    <div className="fw-medium text-dark">{attempt.candidate.fullName}</div>
                                    <div className="small text-muted">{attempt.candidate.user.email}</div>
                                  </td>
                                  <td className="py-3">
                                    {attempt.status === "COMPLETED" ? (
                                      <span className="badge bg-success">Completed</span>
                                    ) : (
                                      <span className="badge bg-warning text-dark">In Progress</span>
                                    )}
                                  </td>
                                  <td className="py-3 text-muted">{new Date(attempt.startedAt).toLocaleString()}</td>
                                  <td className="py-3 text-muted">
                                    {attempt.completedAt ? new Date(attempt.completedAt).toLocaleString() : "-"}
                                  </td>
                                  {hasMCQ && (
                                    <td className="py-3 fw-bold">
                                      {attempt.status === "COMPLETED" && scoreObj ? (
                                        <span className={`badge ${scoreObj.scorePercent >= 70 ? 'bg-success' : scoreObj.scorePercent >= 40 ? 'bg-warning text-dark' : 'bg-danger'} fs-6 px-3 py-2`}>
                                          {scoreObj.scorePercent}% ({scoreObj.correct}/{scoreObj.total})
                                        </span>
                                      ) : (
                                        <span className="text-muted">-</span>
                                      )}
                                    </td>
                                  )}
                                  <td className="py-3 text-end px-4">
                                    <div className="d-flex justify-content-end gap-2">
                                      <button 
                                        className="btn btn-sm btn-primary px-3"
                                        onClick={() => setSelectedAttempt(attempt)}
                                        disabled={attempt.status !== "COMPLETED"}
                                      >
                                        View Answers
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger px-2"
                                        title="Delete Candidate Result"
                                        onClick={() => handleDeleteAttempt(attempt.id, attempt.candidate.fullName)}
                                      >
                                        <i className="fa-solid fa-trash me-1"></i> Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Answer Viewing Area */}
            {selectedAttempt && (
              <div className="card shadow-sm border-0 border-top border-primary border-4 mb-5">
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                  <h4 className="mb-0 fw-bold">Answers: {selectedAttempt.candidate.fullName}</h4>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedAttempt(null)}>
                    <i className="fa-solid fa-xmark me-2"></i>Close
                  </button>
                </div>
                <div className="card-body p-4 bg-light">
                  {/* Candidate Proctoring & Camera/Audio Feed */}
                  <div className="card shadow-sm border-0 border-start border-4 border-info mb-4">
                    <div className="card-header bg-white py-3">
                      <h5 className="mb-0 fw-bold text-info">
                        <i className="fa-solid fa-video me-2"></i>Candidate Proctoring Feed (Camera & Audio Recording)
                      </h5>
                    </div>
                    <div className="card-body p-4">
                      {typeof selectedAttempt.answers?._proctoringVideo === "string" ? (
                        <div>
                          <p className="small text-muted mb-3">
                            <i className="fa-solid fa-circle-check text-success me-1"></i>
                            Recorded webcam and audio stream captured during candidate's exam session:
                          </p>
                          <video 
                            controls 
                            playsInline
                            src={selectedAttempt.answers._proctoringVideo} 
                            style={{ width: "100%", maxHeight: "400px", borderRadius: "8px", backgroundColor: "#000" }}
                          >
                            Your browser does not support HTML video playback.
                          </video>
                        </div>
                      ) : (
                        <div className="alert alert-secondary mb-0">
                          <i className="fa-solid fa-triangle-exclamation me-2"></i>
                          No camera/audio recording was saved for this submission (or media permissions were not granted by the candidate).
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedAttempt.assessment.questions.map((section, sIndex) => (
                    <div key={section.id} className="card shadow-sm border-0 mb-4">
                      <div className="card-header bg-white py-3 border-bottom">
                        <h5 className="mb-0 fw-bold text-primary">
                          Section {sIndex + 1}: {section.type.toUpperCase()}
                        </h5>
                      </div>
                      <div className="card-body p-4">
                        {section.questions.map((q, qIndex) => {
                          const currentAnswer = selectedAttempt.answers?.[section.id]?.[q.id];
                          return (
                            <div key={q.id} className={`mb-4 ${qIndex !== section.questions.length - 1 ? 'border-bottom pb-4' : ''}`}>
                              <h6 className="fw-bold mb-3">Q{qIndex + 1}. {q.prompt}</h6>
                              <div className="ps-3 border-start border-3 border-light">
                                {renderAnswer(section.type, q, currentAnswer)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  
                  {selectedAttempt.assessment.questions.length === 0 && (
                    <div className="alert alert-info">This assessment had no sections/questions to answer.</div>
                  )}
                </div>
              </div>
            )}
            
          </div>

          {/* footer */}
          <div className="row mt-5">
            <div className="col-md-12">
              <div className="py-3 text-center">
                &copy; {new Date().getFullYear()} JobStock. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
