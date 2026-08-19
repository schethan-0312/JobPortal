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
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="py-3 px-4">Assessment Title</th>
                          <th className="py-3">Job Role</th>
                          <th className="py-3">Total Submissions</th>
                          <th className="py-3">Created On</th>
                          <th className="py-3 text-end px-4">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assessments.map((a) => (
                          <tr key={a.id}>
                            <td className="py-3 px-4 fw-medium text-dark">{a.title}</td>
                            <td className="py-3 text-muted">{a.job.title}</td>
                            <td className="py-3">
                              <span className={`badge ${a._count.attempts > 0 ? 'bg-success' : 'bg-secondary'}`}>
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
                        ))}
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
