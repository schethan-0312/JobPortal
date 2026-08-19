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
              <p className={optIndex === q.correctOptionIndex ? "text-success" : "text-danger"}>
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
        return (
          <pre className="bg-dark text-light p-3 rounded" style={{ whiteSpace: "pre-wrap" }}>
            {currentAnswer.code}
          </pre>
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
            
            <div className="row">
              <div className="col-lg-12">
                <div className="card shadow-sm border-0 mb-4">
                  <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                    <h4 className="mb-0 fw-bold">Candidates</h4>
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
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th className="py-3 px-4">Candidate</th>
                              <th className="py-3">Status</th>
                              <th className="py-3">Started At</th>
                              <th className="py-3">Completed At</th>
                              <th className="py-3 text-end px-4">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attempts.map((attempt) => (
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
                                <td className="py-3 text-end px-4">
                                  <button 
                                    className="btn btn-sm btn-primary px-3"
                                    onClick={() => setSelectedAttempt(attempt)}
                                    disabled={attempt.status !== "COMPLETED"}
                                  >
                                    View Answers
                                  </button>
                                </td>
                              </tr>
                            ))}
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
