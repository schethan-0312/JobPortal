"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Select from "react-select";
import Navbar8 from "@/components/Navbar8";
import EmployerSidebar from "@/components/employer-dashboard/EmployerSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl } from "@/lib/api";

interface EmployerJob {
  id: string;
  title: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex?: number;
}

interface JobAssessmentAttempt {
  score: number | null;
  answers: number[] | null;
  assessment: {
    title: string;
    totalQuestions: number;
    questions: QuizQuestion[];
  };
}

interface Applicant {
  id: string;
  status: string;
  coverNote: string | null;
  appliedAt: string;
  candidate: {
    email: string;
    candidateProfile: {
      fullName: string;
      headline: string | null;
      resumeUrl: string | null;
      profilePhotoUrl: string | null;
      skills: string[];
      location: string | null;
      jobAssessmentAttempts?: JobAssessmentAttempt[];
    } | null;
  };
}

export default function EmployerApplicantsJobsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [viewingAnswersFor, setViewingAnswersFor] = useState<JobAssessmentAttempt | null>(null);
  const [viewingCandidate, setViewingCandidate] = useState<Applicant | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [jobSearchText, setJobSearchText] = useState("");
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "EMPLOYER")) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "EMPLOYER") return;
    (async () => {
      setJobsLoading(true);
      try {
        const list = await api.get<EmployerJob[]>("/jobs/mine");
        setJobs(list);
        if (list.length > 0) {
          setSelectedJobId(list[0].id);
          setJobSearchText(list[0].title);
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load jobs");
      } finally {
        setJobsLoading(false);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!selectedJobId) return;
    (async () => {
      setApplicantsLoading(true);
      setError(null);
      try {
        const list = await api.get<Applicant[]>(`/applications/for-job/${selectedJobId}`);
        setApplicants(list);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load applicants");
      } finally {
        setApplicantsLoading(false);
      }
    })();
  }, [selectedJobId]);

  async function updateStatus(applicationId: string, status: string) {
    setUpdatingId(applicationId);
    setError(null);
    try {
      await api.patch(`/applications/${applicationId}/status`, { status });
      setApplicants((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status } : a)));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to update applicant status";
      if (msg.includes("Subscription required") || msg.includes("limit of 20 hired candidates")) {
        setShowSubscriptionModal(true);
      } else {
        setError(msg);
      }
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteApplication(applicationId: string) {
    setUpdatingId(applicationId);
    setError(null);
    try {
      await api.delete(`/applications/${applicationId}`);
      setApplicants((prev) => prev.filter((a) => a.id !== applicationId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete candidate");
    } finally {
      setUpdatingId(null);
      setCandidateToDelete(null);
    }
  }

  const handleDownloadResume = async (e: React.MouseEvent, url: string, name: string) => {
    e.preventDefault();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Extract the correct extension from the URL
      let ext = "pdf";
      const parts = url.split('.');
      if (parts.length > 1) {
        ext = parts[parts.length - 1].split('?')[0]; // Handle query params if any
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${name.replace(/\s+/g, '_')}_Resume.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
      window.open(url, "_blank"); // Fallback
    }
  };

  if (loading || !user || user.role !== "EMPLOYER") {
    return null;
  }

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  return (
    <>
      <Navbar8 />

      <div className="dashboard-wrap bg-light">
        <EmployerSidebar active="applicants-jobs" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Manage Applicants</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted">
                      <a href="#">Employer</a>
                    </li>
                    <li className="breadcrumb-item text-muted">
                      <a href="#">Dashboard</a>
                    </li>
                    <li className="breadcrumb-item">
                      <a href="#" className="text-main">
                        All Applicants
                      </a>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">

            {error && <div className="alert alert-danger">{error}</div>}

            {/* Header Wrap */}
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                <div className="card">
                  <div className="card-header">
                    <div className="_mp-inner-content elior">
                      <div className="_mp-inner-first" style={{ display: 'flex', alignItems: 'center' }}>
                        <label className="me-2 mb-0">Job:</label>
                        <div style={{ width: "300px" }}>
                          <Select
                            options={jobs.map(j => ({ value: j.id, label: j.title }))}
                            value={jobs.find(j => j.id === selectedJobId) ? { value: selectedJobId, label: jobs.find(j => j.id === selectedJobId)!.title } : null}
                            onChange={(option) => setSelectedJobId(option?.value || "")}
                            isDisabled={jobsLoading || jobs.length === 0}
                            placeholder={jobsLoading ? "Loading jobs..." : "Search and select job..."}
                            isSearchable
                            styles={{
                              control: (baseStyles) => ({
                                ...baseStyles,
                                minHeight: '40px',
                              }),
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="card-body">
                    {/* Row */}
                    <div className="row mb-3">
                      <div className="col-xl-12 col-lg-12 col-md-12">
                        <div className="duster-flex-row  align-items-center d-flex justify-content-between">
                          <div className="duster-flex-first">
                            <h6 className="mb-0">{selectedJob?.title || "Select a job"}</h6>
                          </div>
                          <div className="duster-flex-end">
                            <h6 className="mb-0">Total: {applicants.length}</h6>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* End Row */}

                    {jobsLoading && <p className="text-muted">Loading jobs...</p>}
                    {!jobsLoading && jobs.length === 0 && <p className="text-muted">You haven&apos;t posted any jobs yet.</p>}
                    {applicantsLoading && <p className="text-muted">Loading applicants...</p>}
                    {!applicantsLoading && selectedJobId && applicants.length === 0 && <p className="text-muted">No applicants yet for this job.</p>}

                    {/* Start All List */}
                    <div className="row justify-content-start gx-3 gy-4">
                      {applicants.map((item) => (
                        <div className="col-xl-12 col-lg-12 col-md-12 col-12" key={item.id}>
                          <div className="jbs-list-box border">
                            <div className="jbs-list-head m-0">
                              <div className="jbs-list-head-thunner center">
                                <div className="jbs-list-usrs-thumb jbs-verified">
                                  <figure style={{ display: "flex", width: "100%", height: "100%", margin: 0 }}>
                                    {item.candidate.candidateProfile?.profilePhotoUrl ? (
                                      <img 
                                        src={assetUrl(item.candidate.candidateProfile.profilePhotoUrl)} 
                                        className="img-fluid circle" 
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        alt="" 
                                      />
                                    ) : (
                                      <div className="img-fluid circle d-flex align-items-center justify-content-center bg-light text-muted fw-semibold" style={{ width: "100%", height: "100%", borderRadius: "50%" }}>
                                        <span className="small text-center px-1" style={{ fontSize: "11px", lineHeight: "1.2" }}>No Photo</span>
                                      </div>
                                    )}
                                  </figure>
                                </div>
                                <div className="jbs-list-job-caption">
                                  <div className="jbs-job-title-wrap">
                                    <h4 className="jbs-job-title">{item.candidate.candidateProfile?.fullName || item.candidate.email}</h4>
                                  </div>
                                  <div className="jbs-job-mrch-lists">
                                    <div className="single-mrch-lists">
                                      <span>{item.candidate.candidateProfile?.headline || "No headline"}</span>.
                                      <span>
                                        <i className="fa-solid fa-location-dot me-1"></i>
                                        {item.candidate.candidateProfile?.location || "Unknown"}
                                      </span>
                                      <span>Applied: {new Date(item.appliedAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                  <div className="mt-1">
                                    <span className="label text-light bg-secondary">{item.status}</span>
                                    {item.candidate.candidateProfile?.jobAssessmentAttempts && item.candidate.candidateProfile.jobAssessmentAttempts.length > 0 && (
                                      <span className="label text-light bg-success ms-2">
                                        Assessment Score: {Math.max(...item.candidate.candidateProfile.jobAssessmentAttempts.map(a => a.score || 0))} / {item.candidate.candidateProfile.jobAssessmentAttempts[0].assessment.totalQuestions}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="jbs-list-head-last">
                                <button
                                  type="button"
                                  className={`rounded btn-md px-3 me-2 ${item.status === 'OFFERED' ? 'btn-outline-success bg-white' : 'btn-success'}`}
                                  disabled={updatingId === item.id || item.status === 'OFFERED'}
                                  onClick={() => {
                                    if (item.status !== "OFFERED") {
                                      updateStatus(item.id, "OFFERED");
                                    }
                                  }}
                                  title={item.status === "OFFERED" ? "Hired" : "Hire Candidate (Offer)"}
                                >
                                  <i className="fa-solid fa-user-check me-1"></i> 
                                  {item.status === "OFFERED" ? "Hired" : "Hire"}
                                </button>
                                <button
                                  type="button"
                                  className="rounded btn-md btn-main px-3 me-2"
                                  disabled={updatingId === item.id || item.status === 'OFFERED'}
                                  onClick={() => updateStatus(item.id, "SHORTLISTED")}
                                  title="Shortlist Candidate"
                                >
                                  <i className="fa-solid fa-check-double"></i>
                                </button>
                                <button
                                  type="button"
                                  className="rounded btn-md btn-dark px-3 me-2"
                                  disabled={updatingId === item.id}
                                  onClick={() => {
                                    setViewingCandidate(item);
                                    if (item.status === "APPLIED") {
                                      updateStatus(item.id, "REVIEWED");
                                    }
                                  }}
                                  title="View Profile"
                                >
                                  <i className="fa-solid fa-eye"></i>
                                </button>
                                {item.candidate.candidateProfile?.resumeUrl && (
                                  <a
                                    href={assetUrl(item.candidate.candidateProfile.resumeUrl)}
                                    onClick={(e) => handleDownloadResume(e, assetUrl(item.candidate.candidateProfile!.resumeUrl)!, item.candidate.candidateProfile?.fullName || 'candidate')}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded btn-md btn-dark px-3 me-2"
                                    title="Download Resume"
                                  >
                                    <i className="fa-solid fa-download"></i>
                                  </a>
                                )}
                                <button
                                  type="button"
                                  className="rounded btn-md btn-red px-3"
                                  disabled={updatingId === item.id}
                                  onClick={() => setCandidateToDelete(item.id)}
                                  title="Reject Candidate"
                                >
                                  <i className="fa-solid fa-trash-can"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* End All Job List */}
                  </div>
                </div>
              </div>
            </div>
            {/* Header Wrap */}
          </div>

          {/* footer */}
          <div className="row">
            <div className="col-md-12">
              <div className="py-3 text-center">
                &copy; {new Date().getFullYear()} JobStock. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>

      {viewingCandidate && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Candidate Details</h5>
                <button type="button" className="btn-close" onClick={() => setViewingCandidate(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="d-flex align-items-center mb-4 pb-3 border-bottom">
                  <div style={{ width: "80px", height: "80px" }} className="me-3">
                    {viewingCandidate.candidate.candidateProfile?.profilePhotoUrl ? (
                      <img
                        src={assetUrl(viewingCandidate.candidate.candidateProfile.profilePhotoUrl)}
                        className="img-fluid rounded-circle"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        alt=""
                      />
                    ) : (
                      <div className="img-fluid rounded-circle d-flex align-items-center justify-content-center bg-light text-muted fw-semibold" style={{ width: "100%", height: "100%" }}>
                        <span className="small text-center px-1" style={{ fontSize: "11px", lineHeight: "1.2" }}>No Photo</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="mb-1">{viewingCandidate.candidate.candidateProfile?.fullName || viewingCandidate.candidate.email}</h4>
                    <p className="mb-0 text-muted">{viewingCandidate.candidate.candidateProfile?.headline || "No headline"}</p>
                    <p className="mb-0 small text-muted"><i className="fa-solid fa-location-dot me-1"></i>{viewingCandidate.candidate.candidateProfile?.location || "Unknown location"}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <h6 className="fw-bold">Contact Info</h6>
                  <p className="mb-1"><strong>Email:</strong> {viewingCandidate.candidate.email}</p>
                </div>

                <div className="mb-4">
                  <h6 className="fw-bold">Application Details</h6>
                  <p className="mb-1"><strong>Status:</strong> <span className="badge bg-secondary">{viewingCandidate.status}</span></p>
                  <p className="mb-1"><strong>Applied On:</strong> {new Date(viewingCandidate.appliedAt).toLocaleString()}</p>
                </div>

                {viewingCandidate.coverNote && (
                  <div className="mb-4">
                    <h6 className="fw-bold">Cover Note</h6>
                    <div className="p-3 bg-light rounded">
                      <p className="mb-0 text-dark" style={{ whiteSpace: "pre-wrap" }}>{viewingCandidate.coverNote}</p>
                    </div>
                  </div>
                )}

                {viewingCandidate.candidate.candidateProfile?.skills && viewingCandidate.candidate.candidateProfile.skills.length > 0 && (
                  <div className="mb-4">
                    <h6 className="fw-bold">Skills</h6>
                    <div className="d-flex flex-wrap gap-2">
                      {viewingCandidate.candidate.candidateProfile.skills.map((skill) => (
                        <span key={skill} className="badge bg-primary px-3 py-2">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                {viewingCandidate.candidate.candidateProfile?.resumeUrl && (
                  <div className="mt-2">
                    <a 
                      href={assetUrl(viewingCandidate.candidate.candidateProfile.resumeUrl)} 
                      onClick={(e) => handleDownloadResume(e, assetUrl(viewingCandidate.candidate.candidateProfile!.resumeUrl)!, viewingCandidate.candidate.candidateProfile?.fullName || 'candidate')}
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn btn-outline-dark"
                    >
                      <i className="fa-solid fa-download me-2"></i> Download Resume
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingAnswersFor && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Assessment Answers: {viewingAnswersFor.assessment.title}</h5>
                <button type="button" className="btn-close" onClick={() => setViewingAnswersFor(null)}></button>
              </div>
              <div className="modal-body">
                <h4 className="mb-4 text-center">Score: {viewingAnswersFor.score} / {viewingAnswersFor.assessment.totalQuestions}</h4>
                {viewingAnswersFor.assessment.questions.map((q, i) => {
                  const candidateAnswer = viewingAnswersFor.answers ? viewingAnswersFor.answers[i] : null;
                  return (
                    <div key={i} className="mb-4 pb-3 border-bottom">
                      <p className="fw-medium mb-2">{i + 1}. {q.question}</p>
                      {q.options.map((opt, oi) => {
                        const isCandidateChoice = candidateAnswer === oi;
                        const isCorrect = q.correctIndex === oi;
                        
                        let bgClass = "bg-light";
                        let textClass = "text-dark";
                        if (isCandidateChoice && isCorrect) {
                          bgClass = "bg-success";
                          textClass = "text-white";
                        } else if (isCandidateChoice && !isCorrect) {
                          bgClass = "bg-danger";
                          textClass = "text-white";
                        } else if (isCorrect) {
                          bgClass = "bg-success";
                          textClass = "text-white opacity-75";
                        }

                        return (
                          <div key={oi} className={`p-2 mb-1 rounded ${bgClass} ${textClass}`}>
                            {opt} {isCandidateChoice && <strong>(Candidate's Answer)</strong>} {isCorrect && !isCandidateChoice && <em>(Correct Answer)</em>}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {showSubscriptionModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-center p-4">
              <div className="modal-header border-0 pb-0 justify-content-end">
                <button type="button" className="btn-close" onClick={() => setShowSubscriptionModal(false)}></button>
              </div>
              <div className="modal-body py-2">
                <div className="mb-3 text-warning">
                  <i className="fa-solid fa-crown fa-3x"></i>
                </div>
                <h4 className="fw-bold mb-2">Subscription Required</h4>
                <p className="text-muted mb-4">
                  You have reached the maximum limit of <strong>20 hired candidates</strong> on your free tier.
                  Please upgrade your package to hire additional candidates.
                </p>
                <button
                  type="button"
                  className="btn btn-main btn-lg px-4 rounded"
                  onClick={() => router.push("/employer-package")}
                >
                  Upgrade Subscription Package
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {candidateToDelete && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-center p-4">
              <div className="modal-header border-0 pb-0 justify-content-end">
                <button type="button" className="btn-close" onClick={() => setCandidateToDelete(null)}></button>
              </div>
              <div className="modal-body py-2">
                <div className="mb-3 text-danger">
                  <i className="fa-solid fa-triangle-exclamation fa-3x"></i>
                </div>
                <h4 className="fw-bold mb-2">Delete Candidate</h4>
                <p className="text-muted mb-4">
                  Are you sure you want to delete this candidate? This action cannot be undone.
                </p>
                <div className="d-flex justify-content-center gap-3">
                  <button type="button" className="btn btn-secondary px-4 rounded" onClick={() => setCandidateToDelete(null)}>Cancel</button>
                  <button type="button" className="btn btn-danger px-4 rounded" onClick={() => deleteApplication(candidateToDelete)}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
