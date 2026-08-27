"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, assetUrl } from "@/lib/api";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
import Navbar7 from "@/components/Navbar7";
import { Toaster, toast } from "react-hot-toast";

interface Job {
  title: string;
  slug?: string;
  employer: {
    companyName: string;
    logoUrl: string | null;
  };
}

interface Attempt {
  status: string;
  score: number | null;
}

interface MatchingAssessment {
  id: string; // The assessment ID
  jobId: string;
  title: string;
  skills: string[];
  timeLimitMinutes?: number | null;
  createdAt: string;
  job: Job;
  attempts: Attempt[];
}

export default function CandidateCompetitionPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [assessments, setAssessments] = useState<MatchingAssessment[]>([]);
  const [fetching, setFetching] = useState(true);
  
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }
    if (user && user.role !== "CANDIDATE") {
      router.push("/");
      return;
    }

    if (user) {
      loadAssessments();
    }
  }, [user, loading, router]);

  async function loadAssessments() {
    setFetching(true);
    try {
      const data = await api.get<MatchingAssessment[]>("/jobs/assessments/matching");
      setAssessments(data);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load assessments.");
    } finally {
      setFetching(false);
    }
  }

  if (loading || fetching) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar7 />
      <Toaster 
        position="top-center" 
        containerStyle={{
          top: '100px',
        }}
        toastOptions={{
          style: {
            padding: '16px 24px',
            fontSize: '1.1rem',
            fontWeight: '500',
            maxWidth: '600px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
          },
        }}
      />

      <div className="dashboard-wrap bg-light">
        <CandidateSidebar active="competition" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-5">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Competitions & Assessments</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Candidate</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Competition</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            <div className="card">
              <div className="card-header">
                <h4><i className="fa-solid fa-trophy me-2"></i>Available Competitions</h4>
              </div>
              <div className="card-body px-4 py-4">

                {assessments.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="mb-3">
                      <i className="fa-solid fa-folder-open text-muted" style={{ fontSize: "3rem" }}></i>
                    </div>
                    <h5>No matched assessments found.</h5>
                    <p className="text-muted">Update your profile skills to match with employer competitions.</p>
                    <Link href="/candidate-profile" className="btn btn-primary mt-2">
                      Update Profile
                    </Link>
                  </div>
                ) : (
                  <div className="row justify-content-start gx-3 gy-4">
                    {assessments.map((a) => {
                      const attempt = a.attempts && a.attempts.length > 0 ? a.attempts[0] : null;
                      return (
                        <div key={a.id} className="col-xl-12 col-lg-12 col-md-12">
                          <div className="jbs-list-box border">
                            <div className="jbs-list-head">
                              <div className="jbs-list-head-thunner">
                                <div className="jbs-list-emp-thumb jbs-verified">
                                  <Link href={`/job-detail/${a.job.slug || a.jobId}`}>
                                    <figure>
                                      <img 
                                        src={assetUrl(a.job.employer.logoUrl) || "/assets/img/l-1.png"} 
                                        className="img-fluid" 
                                        alt={a.job.employer.companyName}
                                      />
                                    </figure>
                                  </Link>
                                </div>
                                <div className="jbs-list-job-caption">
                                  <div className="jbs-job-types-wrap">
                                    {attempt?.status === "COMPLETED" ? (
                                      <span className="label text-green bg-light-green">Completed</span>
                                    ) : attempt?.status === "IN_PROGRESS" ? (
                                      <span className="label text-warning bg-light-warning">In Progress</span>
                                    ) : (
                                      <span className="label text-main bg-light-main">Available</span>
                                    )}
                                  </div>
                                  <div className="jbs-job-title-wrap">
                                    <h4>
                                      <Link href={`/job-detail/${a.job.slug || a.jobId}`} className="jbs-job-title">
                                        {a.title}
                                      </Link>
                                    </h4>
                                  </div>
                                  <div className="jbs-job-mrch-lists">
                                    <div className="single-mrch-lists">
                                      <span>{a.job.title} at {a.job.employer.companyName}</span>
                                      {a.timeLimitMinutes && (
                                        <span className="ms-3"><i className="fa-solid fa-clock me-1"></i>{a.timeLimitMinutes} min limit</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="mt-2 d-flex flex-wrap gap-2">
                                    {a.skills.map(s => (
                                      <span key={s} className="badge bg-light text-dark border">{s}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="jbs-list-head-last">
                                {attempt?.status === "COMPLETED" ? (
                                  <button className="btn btn-md btn-gray px-3 me-2" disabled>
                                    Already Attempted
                                  </button>
                                ) : attempt?.status === "IN_PROGRESS" ? (
                                  <Link href={`/candidate-competition/assessment/${a.id}`} className="btn btn-md btn-warning px-3 me-2">
                                    Resume
                                  </Link>
                                ) : (
                                  <Link href={`/candidate-competition/assessment/${a.id}`} className="btn btn-md btn-primary px-3 me-2">
                                    Attend
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* footer removed */}
        </div>
      </div>
    </>
  );
}
