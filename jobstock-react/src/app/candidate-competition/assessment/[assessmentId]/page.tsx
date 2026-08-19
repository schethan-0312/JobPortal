"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

interface AssessmentDetails {
  id: string;
  title: string;
  skills: string[];
  timeLimitMinutes?: number | null;
  job: {
    title: string;
    employer: {
      companyName: string;
    };
  };
  attempt?: {
    id: string;
    status: string;
  };
}

export default function AssessmentInstructionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const assessmentId = params.assessmentId as string;

  const [details, setDetails] = useState<AssessmentDetails | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }
    if (user && user.role !== "CANDIDATE") {
      router.push("/");
      return;
    }

    if (user && assessmentId) {
      loadDetails();
    }
  }, [user, loading, router, assessmentId]);

  async function loadDetails() {
    setFetching(true);
    try {
      const data = await api.get<AssessmentDetails>(`/jobs/assessments/${assessmentId}`);
      setDetails(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load assessment details.");
    } finally {
      setFetching(false);
    }
  }

  if (loading || fetching) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !details) {
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

  const isCompleted = details.attempt?.status === "COMPLETED";
  const isInProgress = details.attempt?.status === "IN_PROGRESS";

  return (
    <div className="bg-light min-vh-100 pb-5">
      <div className="bg-white shadow-sm sticky-top">
        <div className="container py-3 d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-1 fw-bold">Assessment Instructions</h4>
            <span className="text-muted">{details.title}</span>
          </div>
          <div>
            <Link href="/candidate-competition" className="btn btn-outline-secondary btn-sm">
              <i className="fa-solid fa-arrow-left me-2"></i>Back
            </Link>
          </div>
        </div>
      </div>

      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-sm border-0">
              <div className="card-body p-5">
                <h3 className="mb-4 text-center fw-bold text-dark">{details.title}</h3>
                
                <div className="row text-center mb-5 mt-4">
                  <div className="col-md-4 mb-3 mb-md-0">
                    <div className="p-3 bg-light rounded border">
                      <i className="fa-solid fa-building text-primary fs-3 mb-2"></i>
                      <h6 className="fw-bold mb-1">Company</h6>
                      <p className="text-muted mb-0 small">{details.job.employer.companyName}</p>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3 mb-md-0">
                    <div className="p-3 bg-light rounded border">
                      <i className="fa-solid fa-briefcase text-primary fs-3 mb-2"></i>
                      <h6 className="fw-bold mb-1">Job Role</h6>
                      <p className="text-muted mb-0 small">{details.job.title}</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 bg-light rounded border">
                      <i className="fa-solid fa-stopwatch text-primary fs-3 mb-2"></i>
                      <h6 className="fw-bold mb-1">Time Limit</h6>
                      <p className="text-muted mb-0 small">
                        {details.timeLimitMinutes ? `${details.timeLimitMinutes} Minutes` : "No Time Limit"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-5">
                  <h5 className="fw-bold mb-3 border-bottom pb-2">Skills Assessed</h5>
                  <div className="d-flex flex-wrap gap-2">
                    {details.skills.map(s => (
                      <span key={s} className="badge bg-secondary px-3 py-2 fs-6">{s}</span>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <h5 className="fw-bold mb-3 border-bottom pb-2">Important Instructions</h5>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item bg-transparent px-0 py-3 d-flex">
                      <i className="fa-solid fa-circle-check text-success mt-1 me-3"></i>
                      <div>
                        <strong>Stable Connection:</strong> Ensure you have a stable internet connection before starting.
                      </div>
                    </li>
                    <li className="list-group-item bg-transparent px-0 py-3 d-flex">
                      <i className="fa-solid fa-circle-check text-success mt-1 me-3"></i>
                      <div>
                        <strong>Timer Starts Immediately:</strong> {details.timeLimitMinutes ? `Once you click start, a timer for ${details.timeLimitMinutes} minutes will begin.` : "There is no strict time limit, but complete it in one sitting."} The timer cannot be paused.
                      </div>
                    </li>
                    <li className="list-group-item bg-transparent px-0 py-3 d-flex">
                      <i className="fa-solid fa-circle-check text-success mt-1 me-3"></i>
                      <div>
                        <strong>Auto Submission:</strong> If the time expires, your current answers will be submitted automatically.
                      </div>
                    </li>
                    <li className="list-group-item bg-transparent px-0 py-3 d-flex">
                      <i className="fa-solid fa-circle-check text-success mt-1 me-3"></i>
                      <div>
                        <strong>Do Not Refresh:</strong> Please do not refresh the page or close the tab during the assessment.
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="text-center mt-5">
                  {isCompleted ? (
                    <button className="btn btn-secondary btn-lg px-5 py-3 rounded-pill shadow-sm" disabled>
                      <i className="fa-solid fa-lock me-2"></i>Already Attempted
                    </button>
                  ) : isInProgress ? (
                    <Link href={`/candidate-competition/assessment/${assessmentId}/exam`} className="btn btn-warning btn-lg px-5 py-3 rounded-pill shadow-sm text-dark fw-bold">
                      <i className="fa-solid fa-play me-2"></i>Resume Assessment
                    </Link>
                  ) : (
                    <Link href={`/candidate-competition/assessment/${assessmentId}/exam`} className="btn btn-primary btn-lg px-5 py-3 rounded-pill shadow-sm fw-bold">
                      <i className="fa-solid fa-rocket me-2"></i>Start Assessment
                    </Link>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
