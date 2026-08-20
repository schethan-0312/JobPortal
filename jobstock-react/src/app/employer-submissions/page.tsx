"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar8 from "@/components/Navbar8";
import EmployerSidebar from "@/components/employer-dashboard/EmployerSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface AssessmentListResponse {
  id: string;
  title: string;
  skills: string[];
  timeLimitMinutes: number | null;
  createdAt: string;
  job: {
    title: string;
  };
  _count: {
    attempts: number;
  };
  questions?: Array<{ type: string }>;
}

export default function EmployerSubmissionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [assessments, setAssessments] = useState<AssessmentListResponse[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "EMPLOYER")) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "EMPLOYER") return;
    
    api
      .get<AssessmentListResponse[]>("/jobs/employer/assessments")
      .then((data) => {
        setAssessments(data);
        setDataLoading(false);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Failed to load assessments");
        setDataLoading(false);
      });
  }, [user]);

  const getParsedQuestions = (questions: any): any[] => {
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

  const calculateAssessmentAvgScore = (assessment: any): number | null => {
    const questions = getParsedQuestions(assessment.questions);
    const hasMCQ = questions.some((sec: any) => sec.type?.toLowerCase() === "mcq" || (Array.isArray(sec.questions) && sec.questions.some((q: any) => q.type?.toLowerCase() === "mcq")));
    if (!hasMCQ || !assessment.attempts || assessment.attempts.length === 0) return null;

    let scores: number[] = [];

    assessment.attempts.forEach((attempt: any) => {
      if (!attempt.answers) return;
      let totalMCQ = 0;
      let correctMCQ = 0;

      questions.forEach((section: any) => {
        if (section.type?.toLowerCase() === "mcq" && Array.isArray(section.questions)) {
          section.questions.forEach((q: any) => {
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

      if (totalMCQ > 0) {
        scores.push(Math.round((correctMCQ / totalMCQ) * 100));
      }
    });

    if (scores.length === 0) return null;
    const sum = scores.reduce((acc, curr) => acc + curr, 0);
    return Math.round(sum / scores.length);
  };

  if (loading || !user || user.role !== "EMPLOYER") {
    return null;
  }

  return (
    <>
      <Navbar8 />

      <div className="dashboard-wrap bg-light">
        <EmployerSidebar active="submissions" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Assessment Submissions</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted">
                      <a href="#">Employer</a>
                    </li>
                    <li className="breadcrumb-item">
                      <a href="#" className="text-main">
                        Submissions
                      </a>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}
            
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white py-3">
                <h4 className="mb-0 fw-bold">Select Assessment to View Submissions</h4>
              </div>
              <div className="card-body p-0">
                {dataLoading ? (
                  <div className="p-4 text-center">Loading...</div>
                ) : assessments.length === 0 ? (
                  <div className="p-5 text-center text-muted">
                    <i className="fa-solid fa-folder-open fs-1 mb-3"></i>
                    <h5>No assessments found</h5>
                    <p>You haven't created any assessments yet. Go to <Link href="/employer-competition" className="text-primary">Competition</Link> to create one.</p>
                  </div>
                ) : (
                  <div className="table-responsive" style={{ overflowX: "auto", width: "100%", display: "block" }}>
                    <table className="table table-hover align-middle mb-0" style={{ whiteSpace: "nowrap", width: "auto", minWidth: "100%" }}>
                      <thead className="table-light">
                        <tr>
                          <th className="py-3 px-4">Assessment Title</th>
                          <th className="py-3">Job Role</th>
                          <th className="py-3">Method</th>
                          <th className="py-3">Avg Score</th>
                          <th className="py-3">Total Submissions</th>
                          <th className="py-3">Created On</th>
                          <th className="py-3 text-end px-4">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assessments.map((a) => {
                          const parsedQ = getParsedQuestions(a.questions);
                          const methodType = parsedQ?.[0]?.type || a.questions?.[0]?.type || 'Unknown';
                          const avg = calculateAssessmentAvgScore(a);
                          
                          return (
                            <tr key={a.id}>
                              <td className="py-3 px-4 fw-medium text-dark">{a.title}</td>
                              <td className="py-3 text-muted">{a.job.title}</td>
                              <td className="py-3">
                                <span className="badge bg-light text-dark border">
                                  {methodType.toUpperCase()}
                                </span>
                              </td>
                              <td className="py-3">
                                {avg !== null ? (
                                  <span className={`badge ${avg >= 70 ? 'bg-success' : avg >= 40 ? 'bg-warning text-dark' : 'bg-danger'} px-2 py-1 fs-6`}>
                                    {avg}%
                                  </span>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                              <td className="py-3">
                                <span className={`badge ${a._count.attempts > 0 ? 'bg-primary' : 'bg-secondary'}`}>
                                  {a._count.attempts} attempts
                                </span>
                              </td>
                              <td className="py-3 text-muted">{new Date(a.createdAt).toLocaleDateString()}</td>
                              <td className="py-3 text-end px-4">
                                <Link href={`/employer-submissions/${a.id}`} className="btn btn-sm btn-outline-primary px-3">
                                  View Candidates
                                </Link>
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
