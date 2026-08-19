"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

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

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
}

interface BaseQuestion {
  id: string;
  prompt: string;
  options?: string[];
  correctOptionIndex?: number;
  starterCode?: string;
  expectedOutput?: string;
  testCases?: TestCase[];
  schemaDescription?: string;
  expectedSqlOutput?: string;
  expectedFormulas?: string;
  workPreferences?: string;
  behavioralTendencies?: string;
  workingStyle?: string;
}

interface TestExecutionResult {
  testCaseId: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  error?: string;
  logs?: string[];
}

const executeCodeTestCases = (code: string, testCases?: TestCase[], fallbackExpectedOutput?: string): TestExecutionResult[] => {
  const effectiveTestCases: TestCase[] = (testCases && testCases.length > 0)
    ? testCases
    : [{ id: "default", input: "", expectedOutput: fallbackExpectedOutput || "" }];

  return effectiveTestCases.map((tc) => {
    let logs: string[] = [];
    let actualOutput = "";
    let passed = false;
    let error: string | undefined = undefined;

    try {
      const customConsole = {
        log: (...args: any[]) => {
          logs.push(args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" "));
        },
        error: (...args: any[]) => {
          logs.push("ERROR: " + args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" "));
        },
        warn: (...args: any[]) => {
          logs.push("WARN: " + args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" "));
        }
      };

      let parsedInput: any = tc.input;
      try {
        if (tc.input && tc.input.trim() !== "") {
          parsedInput = JSON.parse(tc.input);
        }
      } catch (e) {
        parsedInput = tc.input;
      }

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

      const normActual = actualOutput.trim();
      const normExpected = (tc.expectedOutput || "").trim();

      passed = (normActual === normExpected);
    } catch (err: any) {
      error = err.message || String(err);
      actualOutput = `Runtime Error: ${error}`;
      passed = false;
    }

    return {
      testCaseId: tc.id,
      input: tc.input,
      expectedOutput: tc.expectedOutput || "",
      actualOutput,
      passed,
      error,
      logs
    };
  });
};

interface QuestionSection {
  id: string;
  type: QuestionType;
  questions: BaseQuestion[];
}

interface Assessment {
  title: string;
  skills: string[];
  questions: QuestionSection[];
  timeLimitMinutes?: number | null;
}

export default function AssessmentAttemptPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const assessmentId = params.assessmentId as string;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [remainingTimeStr, setRemainingTimeStr] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  
  // Media Tracking State
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [mediaPermissionDenied, setMediaPermissionDenied] = useState(false);
  const [requestingMedia, setRequestingMedia] = useState(true);
  
  // State for candidate answers. Structure: { [sectionId]: { [questionId]: answerValue } }
  const [answers, setAnswers] = useState<Record<string, Record<string, any>>>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }
    if (user && user.role !== "CANDIDATE") {
      router.push("/");
      return;
    }

    if (user && assessmentId && !streamRef.current && !mediaPermissionDenied) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          streamRef.current = stream;
          setMediaStream(stream);
          setRequestingMedia(false);

          // Initialize MediaRecorder for employer proctoring view
          try {
            recordedChunksRef.current = [];
            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
              ? 'video/webm;codecs=vp8,opus'
              : 'video/webm';
            const recorder = new MediaRecorder(stream, { mimeType });
            recorder.ondataavailable = (event) => {
              if (event.data && event.data.size > 0) {
                recordedChunksRef.current.push(event.data);
              }
            };
            recorder.start(1000);
            mediaRecorderRef.current = recorder;
          } catch (recErr) {
            console.warn("MediaRecorder initialization warning:", recErr);
          }

          startAttempt();
        })
        .catch(err => {
          console.error("Media access denied:", err);
          setMediaPermissionDenied(true);
          setRequestingMedia(false);
        });
    }

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [user, loading, router, assessmentId]);

  // Bind video element cleanly when mounted in DOM without flickering or black screen
  const bindVideoRef = useCallback((node: HTMLVideoElement | null) => {
    if (node && mediaStream) {
      if (node.srcObject !== mediaStream) {
        node.srcObject = mediaStream;
        node.play().catch(e => console.error("Video play error:", e));
      }
    }
  }, [mediaStream]);

  const getProctoringVideoDataUrl = (): Promise<string | null> => {
    return new Promise((resolve) => {
      const finalizeBlob = () => {
        if (!recordedChunksRef.current || recordedChunksRef.current.length === 0) {
          resolve(null);
          return;
        }
        try {
          const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        } catch (e) {
          resolve(null);
        }
      };

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.onstop = () => {
          finalizeBlob();
        };
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          finalizeBlob();
        }
      } else {
        finalizeBlob();
      }
    });
  };

  useEffect(() => {
    if (!startedAt || !assessment?.timeLimitMinutes) return;

    const limitMs = assessment.timeLimitMinutes * 60000;
    const startMs = new Date(startedAt).getTime();

    const interval = setInterval(() => {
      const elapsedMs = Date.now() - startMs;
      const leftMs = limitMs - elapsedMs;

      if (leftMs <= 0) {
        setRemainingTimeStr("00:00");
        setIsLocked(true);
        clearInterval(interval);
      } else {
        const mins = Math.floor(leftMs / 60000);
        const secs = Math.floor((leftMs % 60000) / 1000);
        setRemainingTimeStr(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, assessment]);

  async function startAttempt() {
    setFetching(true);
    try {
      const data = await api.post<{ attemptId: string, startedAt: string, assessment: Assessment }>(`/jobs/assessments/${assessmentId}/attempt`, {});
      setAttemptId(data.attemptId);
      setStartedAt(data.startedAt);
      setAssessment(data.assessment);
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("completed")) {
        setError("You have already completed this assessment.");
      } else {
        setError("Failed to load assessment. It might not exist.");
      }
    } finally {
      setFetching(false);
    }
  }

  function handleAnswerChange(sectionId: string, questionId: string, field: string, value: any) {
    setAnswers(prev => {
      const sec = prev[sectionId] || {};
      const q = sec[questionId] || {};
      return {
        ...prev,
        [sectionId]: {
          ...sec,
          [questionId]: {
            ...q,
            [field]: value
          }
        }
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payloadAnswers: Record<string, any> = { ...answers };

      try {
        const videoPromise = getProctoringVideoDataUrl();
        const timeoutPromise = new Promise<null>((res) => setTimeout(() => res(null), 2500));
        const videoBase64 = await Promise.race([videoPromise, timeoutPromise]);
        if (videoBase64) {
          payloadAnswers._proctoringVideo = videoBase64;
        }
      } catch (videoErr) {
        console.warn("Video processing warning:", videoErr);
      }

      await api.post(`/jobs/assessments/${assessmentId}/submit`, payloadAnswers);
      alert("Assessment submitted successfully!");
      router.push("/candidate-competition");
    } catch (err: any) {
      console.error("Submission error:", err);
      const errMsg = err?.message || err?.response?.data?.message || "Failed to submit assessment.";
      alert(`Submission Error: ${errMsg}`);
    } finally {
      setSubmitting(false);
    }
  }

  function handlePreventCopyPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    alert("Copying and pasting is strictly prohibited during the assessment.");
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
  }

  if (mediaPermissionDenied) {
    return (
      <div className="container py-5 mt-5">
        <div className="alert alert-danger text-center p-5 shadow">
          <h4 className="mb-3"><i className="fa-solid fa-camera me-2"></i>Camera & Microphone Required</h4>
          <p>You must grant permission to access your camera and microphone in order to take this assessment.</p>
          <p className="text-muted small mb-4">Please update your browser site settings to "Allow" access, then refresh this page to try again.</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary px-4">
            <i className="fa-solid fa-rotate-right me-2"></i>Refresh & Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading || fetching || requestingMedia) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        {requestingMedia && <h5 className="text-muted">Requesting Camera Access...</h5>}
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="container py-5 mt-5">
        <div className="alert alert-danger text-center p-5">
          <h4 className="mb-3"><i className="fa-solid fa-triangle-exclamation me-2"></i>Error</h4>
          <p>{error}</p>
          <Link href="/candidate-competition" className="btn btn-primary mt-3">Back to Competitions</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100 pb-5">
      <div className="bg-white shadow-sm sticky-top">
        <div className="container py-3 d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-1 fw-bold">{assessment.title}</h4>
            <span className="badge bg-primary">Candidate Assessment</span>
          </div>
          <div className="d-flex align-items-center">
            {remainingTimeStr && (
              <div className={`badge ${isLocked ? 'bg-danger' : 'bg-warning text-dark'} fs-6 me-4 px-3 py-2 border`}>
                <i className="fa-solid fa-stopwatch me-2"></i>
                {isLocked ? "Time Expired" : remainingTimeStr}
              </div>
            )}
            <Link href="/candidate-competition" className="btn btn-outline-secondary btn-sm">
              <i className="fa-solid fa-xmark me-2"></i>Exit
            </Link>
          </div>
        </div>
      </div>

      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <form 
              onSubmit={handleSubmit}
              onCopy={handlePreventCopyPaste}
              onPaste={handlePreventCopyPaste}
              onCut={handlePreventCopyPaste}
              onContextMenu={handleContextMenu}
              onDrop={(e) => { e.preventDefault(); alert("Drag and drop is strictly prohibited."); }}
              style={{ userSelect: "none" }}
            >
              {assessment.questions.map((section, sIndex) => (
                <div key={section.id} className="card shadow-sm border-0 mb-4">
                  <div className="card-header bg-white py-3 border-bottom">
                    <h5 className="mb-0 fw-bold">
                      Section {sIndex + 1}: {
                        section.type === "mcq" ? "Multiple Choice" :
                        section.type === "coding" ? "Coding Challenge" :
                        section.type === "short_answer" ? "Short Answer" :
                        section.type === "debugging" ? "Debugging" :
                        section.type === "sql" ? "Database / SQL" :
                        section.type === "spreadsheet" ? "Spreadsheet Challenge" :
                        section.type === "video" ? "Video Response" :
                        section.type === "whiteboard" ? "Whiteboard / Design" :
                        section.type === "personality" ? "Personality / Behavioral" : "Questions"
                      }
                    </h5>
                  </div>
                  <div className="card-body p-4">
                    {section.questions.map((q, qIndex) => {
                      const currentAnswer = answers[section.id]?.[q.id] || {};
                      
                      return (
                        <div key={q.id} className={`mb-5 ${qIndex !== section.questions.length - 1 ? 'border-bottom pb-4' : ''}`}>
                          <h6 className="fw-bold mb-3">Q{qIndex + 1}. {q.prompt}</h6>
                          
                          {/* MCQ */}
                          {section.type === "mcq" && q.options && (
                            <div className="mt-3">
                              {q.options.map((opt, oIndex) => (
                                <div key={oIndex} className="form-check mb-2">
                                  <input 
                                    className="form-check-input" 
                                    type="radio" 
                                    name={`q_${q.id}`} 
                                    id={`q_${q.id}_opt_${oIndex}`} 
                                    value={oIndex}
                                    checked={currentAnswer.selectedOption === oIndex.toString()}
                                    onChange={(e) => handleAnswerChange(section.id, q.id, "selectedOption", e.target.value)}
                                    disabled={isLocked}
                                    required
                                  />
                                  <label className="form-check-label" htmlFor={`q_${q.id}_opt_${oIndex}`}>
                                    {opt}
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Coding / Debugging */}
                          {(section.type === "coding" || section.type === "debugging") && (
                            <div className="mt-3">
                              {q.starterCode && (
                                <div className="mb-3">
                                  <label className="form-label small text-muted fw-bold">
                                    <i className="fa-solid fa-code me-1"></i>Starter Code
                                  </label>
                                  <pre className="bg-dark text-light p-3 rounded font-monospace">{q.starterCode}</pre>
                                </div>
                              )}
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <label className="form-label fw-bold mb-0">Your Solution (JavaScript)</label>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-success px-3"
                                  disabled={isLocked}
                                  onClick={() => {
                                    const codeToRun = currentAnswer.code || q.starterCode || "";
                                    const results = executeCodeTestCases(codeToRun, q.testCases, q.expectedOutput);
                                    handleAnswerChange(section.id, q.id, "testResults", results);
                                    if (!currentAnswer.code && q.starterCode) {
                                      handleAnswerChange(section.id, q.id, "code", q.starterCode);
                                    }
                                  }}
                                >
                                  <i className="fa-solid fa-play me-1"></i> Run & Test Code
                                </button>
                              </div>
                              <textarea 
                                className="form-control font-monospace bg-dark text-light p-3 mb-3" 
                                rows={8} 
                                style={{ fontFamily: "monospace", tabSize: 2 }}
                                placeholder={q.starterCode || "// Write your code solution here..."}
                                value={currentAnswer.code !== undefined ? currentAnswer.code : (q.starterCode || "")}
                                onChange={(e) => handleAnswerChange(section.id, q.id, "code", e.target.value)}
                                disabled={isLocked}
                                required
                              ></textarea>

                              {/* Test Case Results Display */}
                              {currentAnswer.testResults && Array.isArray(currentAnswer.testResults) && (
                                <div className="p-3 bg-white border rounded shadow-sm">
                                  <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="fw-bold mb-0">
                                      <i className="fa-solid fa-vials me-2 text-primary"></i>Test Case Results
                                    </h6>
                                    {(() => {
                                      const total = currentAnswer.testResults.length;
                                      const passedCount = currentAnswer.testResults.filter((r: any) => r.passed).length;
                                      const allPassed = total > 0 && passedCount === total;
                                      return (
                                        <span className={`badge ${allPassed ? 'bg-success' : passedCount > 0 ? 'bg-warning text-dark' : 'bg-danger'} px-3 py-2 fs-6`}>
                                          {passedCount} / {total} Test Cases Passed
                                        </span>
                                      );
                                    })()}
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
                                        {currentAnswer.testResults.map((tr: any, trIdx: number) => (
                                          <tr key={tr.testCaseId || trIdx} className={tr.passed ? 'table-success-subtle' : 'table-danger-subtle'}>
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
                              )}
                            </div>
                          )}

                          {/* SQL */}
                          {section.type === "sql" && (
                            <div className="mt-3">
                              {q.schemaDescription && (
                                <div className="mb-3 p-3 bg-light border rounded">
                                  <h6 className="small text-muted mb-2">Database Schema</h6>
                                  <pre className="mb-0" style={{ fontSize: "0.85rem" }}>{q.schemaDescription}</pre>
                                </div>
                              )}
                              <label className="form-label fw-medium">Your SQL Query</label>
                              <textarea 
                                className="form-control text-monospace bg-light" 
                                rows={5} 
                                style={{ fontFamily: "monospace" }}
                                value={currentAnswer.query || ""}
                                onChange={(e) => handleAnswerChange(section.id, q.id, "query", e.target.value)}
                                disabled={isLocked}
                                required
                              ></textarea>
                            </div>
                          )}

                          {/* Short Answer / Spreadsheet / Video / Whiteboard */}
                          {(section.type === "short_answer" || section.type === "spreadsheet" || section.type === "video" || section.type === "whiteboard") && (
                            <div className="mt-3">
                              {(section.type === "video" || section.type === "whiteboard") && (
                                <div className="alert alert-info py-2 px-3 small mb-3">
                                  <i className="fa-solid fa-circle-info me-2"></i>
                                  For this MVP, please provide a written description of your {section.type} response below.
                                </div>
                              )}
                              <label className="form-label fw-medium">Your Answer</label>
                              <textarea 
                                className="form-control" 
                                rows={4}
                                value={currentAnswer.text || ""}
                                onChange={(e) => handleAnswerChange(section.id, q.id, "text", e.target.value)}
                                disabled={isLocked}
                                required
                              ></textarea>
                            </div>
                          )}

                          {/* Personality */}
                          {section.type === "personality" && (
                            <div className="mt-4">
                              <div className="mb-4">
                                <label className="form-label fw-bold text-primary">Work Preferences</label>
                                <p className="small text-muted mb-2">{q.workPreferences}</p>
                                <textarea 
                                  className="form-control" 
                                  rows={3}
                                  value={currentAnswer.workPrefResponse || ""}
                                  onChange={(e) => handleAnswerChange(section.id, q.id, "workPrefResponse", e.target.value)}
                                  disabled={isLocked}
                                  required
                                ></textarea>
                              </div>
                              <div className="mb-4">
                                <label className="form-label fw-bold text-primary">Behavioral Tendencies</label>
                                <p className="small text-muted mb-2">{q.behavioralTendencies}</p>
                                <textarea 
                                  className="form-control" 
                                  rows={3}
                                  value={currentAnswer.behavTendResponse || ""}
                                  onChange={(e) => handleAnswerChange(section.id, q.id, "behavTendResponse", e.target.value)}
                                  disabled={isLocked}
                                  required
                                ></textarea>
                              </div>
                              <div className="mb-3">
                                <label className="form-label fw-bold text-primary">Working Style</label>
                                <p className="small text-muted mb-2">{q.workingStyle}</p>
                                <textarea 
                                  className="form-control" 
                                  rows={3}
                                  value={currentAnswer.workStyleResponse || ""}
                                  onChange={(e) => handleAnswerChange(section.id, q.id, "workStyleResponse", e.target.value)}
                                  disabled={isLocked}
                                  required
                                ></textarea>
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              
              {assessment.questions.length === 0 && (
                <div className="alert alert-warning">This assessment has no questions.</div>
              )}

              <div className="card shadow-sm border-0 mb-5">
                <div className="card-body p-4 text-center">
                  <h5 className="mb-3">Ready to Submit?</h5>
                  <p className="text-muted mb-4">Make sure you have reviewed all your answers. Once submitted, you cannot edit them.</p>
                  <button type="submit" className="btn btn-success btn-lg px-5" disabled={submitting || assessment.questions.length === 0}>
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Submitting...
                      </>
                    ) : (
                      "Submit Assessment"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* Floating PIP Camera View */}
      {mediaStream && (
        <div 
          className="position-fixed shadow border bg-dark"
          style={{ 
            bottom: "20px", 
            right: "20px", 
            width: "210px", 
            height: "155px", 
            borderRadius: "12px",
            overflow: "hidden",
            zIndex: 1050 
          }}
        >
          <video 
            ref={bindVideoRef}
            autoPlay 
            muted 
            playsInline
            onCanPlay={(e) => e.currentTarget.play().catch(() => {})}
            style={{ 
              width: "100%", 
              height: "100%", 
              objectFit: "cover", 
              transform: "scaleX(-1)", 
              WebkitTransform: "scaleX(-1)",
              backfaceVisibility: "hidden"
            }}
          />
          <div className="position-absolute bottom-0 start-0 w-100 bg-danger text-white text-center py-1" style={{ fontSize: "0.7rem", opacity: 0.9 }}>
            <i className="fa-solid fa-record-vinyl me-1" style={{ animation: "pulse 2s infinite" }}></i> Recording Camera & Audio
          </div>
        </div>
      )}
    </div>
  );
}
