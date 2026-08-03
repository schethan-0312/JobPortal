"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar8 from "@/components/Navbar8";
import EmployerSidebar from "@/components/employer-dashboard/EmployerSidebar";
import LoginModal from "@/components/LoginModal";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { JOB_CATEGORIES } from "@/lib/job-categories";

interface EmployerProfile {
  id: string;
  companyName: string;
  status: string;
}

interface CreatedJob {
  id: string;
  title: string;
}

interface RazorpayOrderResponse {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const jobTypeOptions = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "FREELANCE", label: "Freelance" },
  { value: "INTERNSHIP", label: "Internship" },
  { value: "CONTRACT", label: "Contract" },
];

const workModeOptions = [
  { value: "ONSITE", label: "On-site" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "REMOTE", label: "Remote" },
];

export default function EmployerSubmitJobPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [employer, setEmployer] = useState<EmployerProfile | null>(null);
  const [employerLoading, setEmployerLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [niceToHave, setNiceToHave] = useState("");
  const [benefits, setBenefits] = useState("");
  const [category, setCategory] = useState<string>(JOB_CATEGORIES[0]);
  const [locations, setLocations] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState("");
  const [workMode, setWorkMode] = useState("ONSITE");
  const [jobType, setJobType] = useState("FULL_TIME");
  const [experienceMin, setExperienceMin] = useState("");
  const [experienceMax, setExperienceMax] = useState("");
  const [openings, setOpenings] = useState("1");
  const [salaryVisible, setSalaryVisible] = useState(true);
  const [salaryType, setSalaryType] = useState("ANNUAL");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [screeningQuestions, setScreeningQuestions] = useState<string[]>([""]);
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdJob, setCreatedJob] = useState<CreatedJob | null>(null);
  const [boosting, setBoosting] = useState(false);
  const skillInputRef = useRef<HTMLInputElement>(null);

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

  function addLocation() {
    const val = locationInput.trim();
    if (!val || locations.includes(val)) return;
    setLocations((prev) => [...prev, val]);
    setLocationInput("");
  }

  function addSkill() {
    const val = skillInput.trim();
    if (!val || skills.includes(val)) return;
    setSkills((prev) => [...prev, val]);
    setSkillInput("");
  }

  function updateScreeningQuestion(index: number, value: string) {
    setScreeningQuestions((prev) => prev.map((q, i) => (i === index ? value : q)));
  }

  function addScreeningQuestion() {
    if (screeningQuestions.length >= 10) return;
    setScreeningQuestions((prev) => [...prev, ""]);
  }

  function removeScreeningQuestion(index: number) {
    setScreeningQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setCreatedJob(null);

    if (!title.trim() || !description.trim() || !category.trim() || locations.length === 0) {
      setError("Please fill in job title, description, category, and at least one location.");
      return;
    }

    setSubmitting(true);
    try {
      const job = await api.post<CreatedJob>("/jobs", {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        location: locations[0],
        locations,
        jobType,
        department: department.trim() || undefined,
        workMode,
        experienceMin: experienceMin ? Number(experienceMin) : undefined,
        experienceMax: experienceMax ? Number(experienceMax) : undefined,
        openings: openings ? Number(openings) : undefined,
        salaryVisible,
        salaryType,
        salaryMin: salaryVisible && salaryMin ? Number(salaryMin) : undefined,
        salaryMax: salaryVisible && salaryMax ? Number(salaryMax) : undefined,
        requiredSkills: skills,
        requirements: requirements.trim() || undefined,
        niceToHave: niceToHave.trim() || undefined,
        benefits: benefits.trim() || undefined,
        screeningQuestions: screeningQuestions.map((q) => q.trim()).filter(Boolean),
        applicationDeadline: applicationDeadline || undefined,
      });
      setCreatedJob(job);
      setSuccess("Job posted successfully.");
      resetForm();
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError("Your employer account is not verified yet. Only verified employers can post jobs.");
      } else {
        setError(err instanceof ApiError ? err.message : "Failed to post job");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setTitle("");
    setDepartment("");
    setDescription("");
    setRequirements("");
    setNiceToHave("");
    setBenefits("");
    setLocations([]);
    setSkills([]);
    setScreeningQuestions([""]);
    setApplicationDeadline("");
    setSalaryMin("");
    setSalaryMax("");
  }

  async function handleBoost() {
    if (!createdJob) return;
    setBoosting(true);
    setError(null);
    try {
      const order = await api.post<{ id: string }>("/packages/orders", {
        packageId: "job-boost-30d",
        jobId: createdJob.id,
      });

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError("Could not load the payment widget. Please check your connection and try again.");
        setBoosting(false);
        return;
      }

      const rpOrder = await api.post<RazorpayOrderResponse>(`/packages/orders/${order.id}/razorpay-order`);

      const razorpay = new window.Razorpay({
        key: rpOrder.keyId,
        amount: rpOrder.amount,
        currency: rpOrder.currency,
        order_id: rpOrder.razorpayOrderId,
        name: "JobStock",
        description: `Featured listing — ${createdJob.title}`,
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            await api.post(`/packages/orders/${order.id}/verify-razorpay`, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            setSuccess(`"${createdJob.title}" is now boosted and featured for 30 days.`);
            resetForm();
            setCreatedJob(null);
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Payment verification failed");
          } finally {
            setBoosting(false);
          }
        },
        modal: { ondismiss: () => setBoosting(false) },
        theme: { color: "#0b8260" },
      });
      razorpay.open();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to start checkout");
      setBoosting(false);
    }
  }

  if (loading) {
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
            {!user ? (
              <div className="alert alert-warning d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                <div>
                  <i className="fa-solid fa-triangle-exclamation me-2"></i>
                  <strong>Sign in required:</strong> You must be signed in as an employer to post a job.
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-main"
                  data-bs-toggle="modal"
                  data-bs-target="#login"
                >
                  Sign In / Register
                </button>
              </div>
            ) : user.role !== "EMPLOYER" ? (
              <div className="alert alert-warning mb-4">
                <i className="fa-solid fa-triangle-exclamation me-2"></i>
                <strong>Employer account required:</strong> You are signed in as a {user.role}. Please sign in with an employer account to post a job.
              </div>
            ) : null}

            {!employerLoading && notVerified && (
              <div className="alert alert-warning">
                Your employer account status is <strong>{employer?.status}</strong>. Only VERIFIED employers can post jobs. You can still fill this form, but submitting will be rejected until verification completes.
              </div>
            )}
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {createdJob && !success?.includes("boosted") && (
              <div className="card mb-4 border-main">
                <div className="card-body d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <strong>Want more visibility?</strong>
                    <p className="text-muted mb-0 small">
                      Feature &quot;{createdJob.title}&quot; at the top of search results for 30 days — ₹499.
                    </p>
                  </div>
                  <button type="button" className="btn btn-main" disabled={boosting} onClick={handleBoost}>
                    {boosting ? "Processing..." : "Feature This Job — ₹499"}
                  </button>
                </div>
              </div>
            )}

            {/* Card Row */}
            <form onSubmit={handleSubmit}>
              <div className="card">
                <div className="card-header">
                  <h4>Basic Detail</h4>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-xl-8 col-lg-8 col-md-12">
                      <div className="form-group">
                        <label>Job Title</label>
                        <input type="text" className="form-control" placeholder="ex. Senior UI/UX Designer" value={title} onChange={(e) => setTitle(e.target.value)} />
                      </div>
                    </div>
                    <div className="col-xl-4 col-lg-4 col-md-12">
                      <div className="form-group">
                        <label>Department</label>
                        <input type="text" className="form-control" placeholder="ex. Engineering" value={department} onChange={(e) => setDepartment(e.target.value)} />
                      </div>
                    </div>

                    <div className="col-xl-12 col-lg-12 col-md-12">
                      <div className="form-group">
                        <label>Job Description</label>
                        <textarea className="form-control ht-80" placeholder="What will this person actually do day to day?" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
                      </div>
                    </div>
                    <div className="col-xl-12 col-lg-12 col-md-12">
                      <div className="form-group">
                        <label>Requirements</label>
                        <textarea className="form-control ht-80" placeholder="Must-have qualifications, experience, skills..." value={requirements} onChange={(e) => setRequirements(e.target.value)}></textarea>
                      </div>
                    </div>
                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label>Nice to Have</label>
                        <textarea className="form-control ht-80" placeholder="Bonus skills, not required" value={niceToHave} onChange={(e) => setNiceToHave(e.target.value)}></textarea>
                      </div>
                    </div>
                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label>Benefits &amp; Perks</label>
                        <textarea className="form-control ht-80" placeholder="Health insurance, WFH, learning budget..." value={benefits} onChange={(e) => setBenefits(e.target.value)}></textarea>
                      </div>
                    </div>

                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label>Job Category</label>
                        <div className="select-ops">
                          <select value={category} onChange={(e) => setCategory(e.target.value)}>
                            {JOB_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
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

                    <div className="col-xl-12 col-lg-12 col-md-12">
                      <div className="form-group">
                        <label>Work Mode</label>
                        <div className="d-flex gap-3">
                          {workModeOptions.map((opt) => (
                            <label key={opt.value} className="d-flex align-items-center gap-1">
                              <input type="radio" name="workMode" checked={workMode === opt.value} onChange={() => setWorkMode(opt.value)} />
                              {opt.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="col-xl-12 col-lg-12 col-md-12">
                      <div className="form-group">
                        <label>Locations</label>
                        <div className="d-flex gap-2 mb-2">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="ex. Bengaluru — press Add"
                            value={locationInput}
                            onChange={(e) => setLocationInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addLocation();
                              }
                            }}
                          />
                          <button type="button" className="btn btn-outline-main" onClick={addLocation}>Add</button>
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                          {locations.map((loc) => (
                            <span key={loc} className="badge bg-main-subtle text-main border border-main d-flex align-items-center gap-2">
                              {loc}
                              <button type="button" className="btn-close btn-close-sm" style={{ fontSize: 10 }} onClick={() => setLocations((prev) => prev.filter((l) => l !== loc))}></button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="col-xl-4 col-lg-4 col-md-12">
                      <div className="form-group">
                        <label>Min. Experience (years)</label>
                        <input type="number" min={0} className="form-control" value={experienceMin} onChange={(e) => setExperienceMin(e.target.value)} />
                      </div>
                    </div>
                    <div className="col-xl-4 col-lg-4 col-md-12">
                      <div className="form-group">
                        <label>Max. Experience (years)</label>
                        <input type="number" min={0} className="form-control" value={experienceMax} onChange={(e) => setExperienceMax(e.target.value)} />
                      </div>
                    </div>
                    <div className="col-xl-4 col-lg-4 col-md-12">
                      <div className="form-group">
                        <label>Number of Openings</label>
                        <input type="number" min={1} className="form-control" value={openings} onChange={(e) => setOpenings(e.target.value)} />
                      </div>
                    </div>

                    <div className="col-xl-12 col-lg-12 col-md-12">
                      <div className="form-group">
                        <label className="d-flex align-items-center gap-2">
                          <input type="checkbox" checked={salaryVisible} onChange={(e) => setSalaryVisible(e.target.checked)} />
                          Show salary range to candidates
                        </label>
                      </div>
                    </div>

                    {salaryVisible && (
                      <>
                        <div className="col-xl-4 col-lg-4 col-md-12">
                          <div className="form-group">
                            <label>Salary Type</label>
                            <div className="select-ops">
                              <select value={salaryType} onChange={(e) => setSalaryType(e.target.value)}>
                                <option value="MONTHLY">Per Month</option>
                                <option value="ANNUAL">Per Annum</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        <div className="col-xl-4 col-lg-4 col-md-12">
                          <div className="form-group">
                            <label>Min. Salary (₹)</label>
                            <input type="number" className="form-control" placeholder="ex. 500000" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} />
                          </div>
                        </div>
                        <div className="col-xl-4 col-lg-4 col-md-12">
                          <div className="form-group">
                            <label>Max. Salary (₹)</label>
                            <input type="number" className="form-control" placeholder="ex. 900000" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} />
                          </div>
                        </div>
                      </>
                    )}

                    <div className="col-xl-12 col-lg-12 col-md-12">
                      <div className="form-group">
                        <label>Required Skills</label>
                        <div className="d-flex gap-2 mb-2">
                          <input
                            ref={skillInputRef}
                            type="text"
                            className="form-control"
                            placeholder="ex. React — press Add"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addSkill();
                              }
                            }}
                          />
                          <button type="button" className="btn btn-outline-main" onClick={addSkill}>Add</button>
                        </div>
                        <p className="small text-muted mb-2">
                          Structured skills power Smart Match and AI Auto-Shortlist — the more specific, the better the matches.
                        </p>
                        <div className="d-flex flex-wrap gap-2">
                          {skills.map((skill) => (
                            <span key={skill} className="badge bg-main-subtle text-main border border-main d-flex align-items-center gap-2">
                              {skill}
                              <button type="button" className="btn-close btn-close-sm" style={{ fontSize: 10 }} onClick={() => setSkills((prev) => prev.filter((s) => s !== skill))}></button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label>Application Deadline</label>
                        <input type="date" className="form-control" value={applicationDeadline} onChange={(e) => setApplicationDeadline(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Card Row End */}

              {/* Card Row */}
              <div className="card">
                <div className="card-header">
                  <h4>Screening Questions</h4>
                  <p className="text-muted mb-0 mt-1 small">Optional — candidates answer these when they apply.</p>
                </div>
                <div className="card-body">
                  {screeningQuestions.map((q, i) => (
                    <div key={i} className="d-flex gap-2 mb-2">
                      <input
                        type="text"
                        className="form-control"
                        placeholder={`Question ${i + 1}`}
                        value={q}
                        onChange={(e) => updateScreeningQuestion(i, e.target.value)}
                      />
                      {screeningQuestions.length > 1 && (
                        <button type="button" className="btn btn-outline-danger" onClick={() => removeScreeningQuestion(i)}>Remove</button>
                      )}
                    </div>
                  ))}
                  {screeningQuestions.length < 10 && (
                    <button type="button" className="btn btn-sm btn-outline-main mt-1" onClick={addScreeningQuestion}>+ Add Question</button>
                  )}
                </div>
              </div>
              {/* Card Row End */}

              {/* Submit Busston */}
              <div className="row">
                <div className="col-lg-12 col-md-12">
                  <button type="submit" className="btn ft--medium btn-main px-5" disabled={submitting}>
                    {submitting ? "Posting..." : "Post Job"}
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
      <LoginModal />
    </>
  );
}
