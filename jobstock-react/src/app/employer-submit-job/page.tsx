"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar8 from "@/components/Navbar8";
import EmployerSidebar from "@/components/employer-dashboard/EmployerSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface EmployerProfile {
  id: string;
  companyName: string;
  status: string;
}

const jobTypeOptions = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "FREELANCE", label: "Freelance" },
  { value: "INTERNSHIP", label: "Internship" },
  { value: "CONTRACT", label: "Contract" },
];

export default function EmployerSubmitJobPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const alertRef = useRef<HTMLDivElement>(null);

  const [employer, setEmployer] = useState<EmployerProfile | null>(null);
  const [employerLoading, setEmployerLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Web & Application");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("FULL_TIME");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const scrollToTop = () => {
    if (alertRef.current) {
      const yOffset = -110;
      const y = alertRef.current.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    } else if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (success || error) {
      scrollToTop();
      const timer = setTimeout(scrollToTop, 100);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  useEffect(() => {
    if (!loading && (!user || user.role !== "EMPLOYER")) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "EMPLOYER") return;
    (async () => {
      setEmployerLoading(true);
      try {
        const e = await api.get<EmployerProfile>("/employers/me");
        setEmployer(e);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load employer profile");
      } finally {
        setEmployerLoading(false);
      }
    })();
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!title.trim() || !description.trim() || !category.trim() || !location.trim()) {
      setError("Please fill in job title, summary, category and location.");
      scrollToTop();
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/jobs", {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        location: location.trim(),
        jobType,
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        salaryMax: salaryMax ? Number(salaryMax) : undefined,
      });
      setSuccess("Job posted successfully.");
      setTitle("");
      setDescription("");
      setLocation("");
      setSalaryMin("");
      setSalaryMax("");
      scrollToTop();
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError("Your employer account is not verified yet. Only verified employers can post jobs.");
      } else {
        setError(err instanceof ApiError ? err.message : "Failed to post job");
      }
      scrollToTop();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !user || user.role !== "EMPLOYER") {
    return null;
  }

  const notVerified = employer && employer.status !== "VERIFIED";

  return (
    <>
      <Navbar8 />

      <div className="dashboard-wrap bg-light">
        <EmployerSidebar active="submit-job" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Post Jobs</h1>
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
                        Post Jobs
                      </a>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">

            <div ref={alertRef} style={{ scrollMarginTop: "110px" }}>
              {!employerLoading && notVerified && (
                <div className="alert alert-warning">
                  Your employer account status is <strong>{employer?.status}</strong>. Only VERIFIED employers can post jobs. You can still fill this form, but submitting will be rejected until verification completes.
                </div>
              )}
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
            </div>

            {/* Card Row */}
            <form onSubmit={handleSubmit}>
            <div className="card">
              <div className="card-header">
                <h4>Basic Detail</h4>
              </div>
              <div className="card-body">
                  <div className="row">
                    <div className="col-xl-12 col-lg-12 col-md-12">
                      <div className="form-group">
                        <label>Job Title</label>
                        <input type="text" className="form-control" placeholder="ex. Senior UI/UX Designer" value={title} onChange={(e) => setTitle(e.target.value)} />
                      </div>
                    </div>

                    <div className="col-xl-12 col-lg-12 col-md-12">
                      <div className="form-group">
                        <label>Job summary</label>
                        <textarea className="form-control ht-80" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
                      </div>
                    </div>

                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label>Job Category</label>
                        <div className="select-ops">
                          <select value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option value="Web & Application">Web & Application</option>
                            <option value="Banking Services">Banking Services</option>
                            <option value="UI/UX Design">UI/UX Design</option>
                            <option value="IOS/App Application">IOS/App Application</option>
                            <option value="Education">Education</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label>Job Type</label>
                        <div className="select-ops">
                          <select value={jobType} onChange={(e) => setJobType(e.target.value)}>
                            {jobTypeOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label>Min. Sallary</label>
                        <input type="number" className="form-control" placeholder="ex. 5000" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} />
                      </div>
                    </div>

                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label>Max. Sallary</label>
                        <input type="number" className="form-control" placeholder="ex. 10000" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} />
                      </div>
                    </div>

                    <div className="col-xl-12 col-lg-12 col-md-12">
                      <div className="form-group">
                        <label>Location</label>
                        <input type="text" className="form-control" value={location} onChange={(e) => setLocation(e.target.value)} />
                      </div>
                    </div>
                  </div>
              </div>
            </div>
            {/* Card Row End */}

            {/* Submit Busston */}
            <div className="row">
              <div className="col-lg-12 col-md-12">
                <button type="submit" className="btn ft--medium btn-main px-5" disabled={submitting}>
                  {submitting ? "Posting..." : "Save & Preview"}
                </button>
              </div>
            </div>
            </form>
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
    </>
  );
}
