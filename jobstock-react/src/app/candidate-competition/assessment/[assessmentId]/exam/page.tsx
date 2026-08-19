"use client";

import { useEffect, useState, useRef } from "react";
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

interface BaseQuestion {
  id: string;
  prompt: string;
  options?: string[];
  correctOptionIndex?: number;
  starterCode?: string;
  expectedOutput?: string;
  schemaDescription?: string;
  expectedSqlOutput?: string;
  expectedFormulas?: string;
  workPreferences?: string;
  behavioralTendencies?: string;
  workingStyle?: string;
}

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
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
          startAttempt();
        })
        .catch(err => {
          console.error("Media access denied:", err);
          setMediaPermissionDenied(true);
          setRequestingMedia(false);
        });
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [user, loading, router, assessmentId]);

  const handleVideoRef = (node: HTMLVideoElement | null) => {
    if (node && mediaStream) {
      node.srcObject = mediaStream;
      node.onloadedmetadata = () => {
        node.play().catch(e => console.error("Video play error:", e));
      };
    }
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
      await api.post(`/jobs/assessments/${assessmentId}/submit`, answers);
      alert("Assessment submitted successfully!");
      router.push("/candidate-competition");
    } catch (err: any) {
      console.error(err);
      alert("Failed to submit assessment.");
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
                                  <label className="form-label small text-muted">Starter Code</label>
                                  <pre className="bg-dark text-light p-3 rounded">{q.starterCode}</pre>
                                </div>
                              )}
                              <label className="form-label fw-medium">Your Solution</label>
                              <textarea 
                                className="form-control text-monospace bg-light" 
                                rows={8} 
                                style={{ fontFamily: "monospace" }}
                                value={currentAnswer.code || ""}
                                onChange={(e) => handleAnswerChange(section.id, q.id, "code", e.target.value)}
                                disabled={isLocked}
                                required
                              ></textarea>
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
            width: "200px", 
            height: "150px", 
            borderRadius: "10px",
            overflow: "hidden",
            zIndex: 1050 
          }}
        >
          <video 
            ref={handleVideoRef}
            autoPlay 
            muted 
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
          />
          <div className="position-absolute bottom-0 start-0 w-100 bg-danger text-white text-center py-1" style={{ fontSize: "0.7rem", opacity: 0.8 }}>
            <i className="fa-solid fa-record-vinyl me-1" style={{ animation: "pulse 2s infinite" }}></i> Recording
          </div>
        </div>
      )}
    </div>
  );
}
