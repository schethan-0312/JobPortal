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
  logoUrl?: string;
  website?: string;
  location?: string;
  industry?: string;
  description?: string;
  status: string;
}

const jobTypeOptions = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "FREELANCE", label: "Freelance" },
  { value: "INTERNSHIP", label: "Internship" },
  { value: "CONTRACT", label: "Contract" },
];

const categoryOptions = [
  "Web & Application",
  "Software Engineering",
  "UI/UX Design",
  "Banking Services",
  "IOS/App Application",
  "Education",
  "Marketing & Sales",
  "Data Science & Analytics",
  "Customer Support",
  "Human Resources",
  "Finance & Accounting",
];

const minQualificationOptions = [
  "High School",
  "Diploma",
  "Bachelor's Degree",
  "Master's Degree",
  "Doctorate / Ph.D.",
  "Any / No Degree Required",
];

const currencyOptions = ["INR", "USD", "EUR", "GBP", "AUD", "CAD", "SGD"];

const salaryPeriodOptions = [
  { value: "MONTHLY", label: "Per Month" },
  { value: "YEARLY", label: "Per Year" },
  { value: "HOURLY", label: "Per Hour" },
  { value: "WEEKLY", label: "Per Week" },
];

const workModeOptions = [
  { value: "IN_OFFICE", label: "In-Office" },
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
];

export default function EmployerSubmitJobPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const alertRef = useRef<HTMLDivElement>(null);

  const todayStr = new Date().toLocaleDateString("en-CA");

  const [employer, setEmployer] = useState<EmployerProfile | null>(null);
  const [employerLoading, setEmployerLoading] = useState(true);

  // 1. Basic Job Details
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("Web & Application");
  const [jobRole, setJobRole] = useState("");
  const [jobType, setJobType] = useState("FULL_TIME");

  // 2. Job Description
  const [description, setDescription] = useState("");
  const [responsibilities, setResponsibilities] = useState("");

  // 3. Skills & Experience
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [minExperience, setMinExperience] = useState("");
  const [maxExperience, setMaxExperience] = useState("");

  // 4. Education & Qualification
  const [minQualification, setMinQualification] = useState("Bachelor's Degree");
  const [specialization, setSpecialization] = useState("");

  // 5. Salary & Location
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [salaryPeriod, setSalaryPeriod] = useState("MONTHLY");
  const [country, setCountry] = useState("India");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [workMode, setWorkMode] = useState("IN_OFFICE");

  // 6. Job Openings
  const [openings, setOpenings] = useState("1");
  const [applicationDeadline, setApplicationDeadline] = useState("");

  // 8. Publishing
  const [status, setStatus] = useState("OPEN");
  const [publishDate, setPublishDate] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);

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

  // Skill management helpers
  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Front-end validations
    if (!title.trim()) {
      setError("Please enter a Job Title.");
      scrollToTop();
      return;
    }
    if (!description.trim() || description.trim().length < 20) {
      setError("Please enter a Job Description with at least 20 characters.");
      scrollToTop();
      return;
    }

    if (salaryMin && salaryMax && Number(salaryMin) > Number(salaryMax)) {
      setError("Minimum Salary cannot be greater than Maximum Salary.");
      scrollToTop();
      return;
    }

    if (minExperience && maxExperience && Number(minExperience) > Number(maxExperience)) {
      setError("Minimum Experience cannot be greater than Maximum Experience.");
      scrollToTop();
      return;
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    if (applicationDeadline && new Date(applicationDeadline) < startOfToday) {
      setError("Application Deadline cannot be a date in the past.");
      scrollToTop();
      return;
    }

    if (publishDate && new Date(publishDate) < startOfToday) {
      setError("Publish Date cannot be a date in the past.");
      scrollToTop();
      return;
    }

    const calculatedLocation = [city, state, country].filter(Boolean).join(", ").trim() || "Remote / Various";

    setSubmitting(true);
    try {
      await api.post("/jobs", {
        // 1. Basic Job Details
        title: title.trim(),
        summary: summary.trim() || undefined,
        category: category.trim(),
        jobRole: jobRole.trim() || undefined,
        jobType,

        // 2. Job Description
        description: description.trim(),
        responsibilities: responsibilities.trim() || undefined,

        // 3. Skills & Experience
        skills,
        minExperience: minExperience ? Number(minExperience) : undefined,
        maxExperience: maxExperience ? Number(maxExperience) : undefined,

        // 4. Education & Qualification
        minQualification: minQualification || undefined,
        specialization: specialization.trim() || undefined,

        // 5. Salary & Location
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        salaryMax: salaryMax ? Number(salaryMax) : undefined,
        currency,
        salaryPeriod,
        location: calculatedLocation,
        country: country.trim() || undefined,
        state: state.trim() || undefined,
        city: city.trim() || undefined,
        workMode,

        // 6. Job Openings
        openings: openings ? Number(openings) : 1,
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline).toISOString() : undefined,

        // 8. Publishing
        status,
        publishDate: publishDate ? new Date(publishDate).toISOString() : undefined,
        isFeatured,
      });

      setSuccess("Job posted successfully!");
      // Reset form
      setTitle("");
      setSummary("");
      setJobRole("");
      setDescription("");
      setResponsibilities("");
      setSkills([]);
      setMinExperience("");
      setMaxExperience("");
      setSpecialization("");
      setSalaryMin("");
      setSalaryMax("");
      setState("");
      setCity("");
      setApplicationDeadline("");
      setPublishDate("");
      setIsFeatured(false);
      scrollToTop();
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError("Your employer account is not verified yet. Only verified employers can post jobs.");
      } else {
        setError(err instanceof ApiError ? err.message : "Failed to post job.");
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
      <style jsx global>{`
        .form-control,
        .form-select {
          height: 50px !important;
          min-height: 50px !important;
          max-height: 50px !important;
          font-size: 14px !important;
          border: 1px solid #e7edf1 !important;
          border-radius: 6px !important;
          padding: 0.6rem 0.85rem !important;
          box-shadow: none !important;
          box-sizing: border-box !important;
          vertical-align: middle !important;
          display: block !important;
          width: 100% !important;
          line-height: 1.4 !important;
        }
        textarea.form-control {
          height: auto !important;
          min-height: 90px !important;
          max-height: none !important;
        }
        .form-group {
          margin-bottom: 1.25rem !important;
        }
        .form-group label,
        .form-label {
          display: block !important;
          margin-bottom: 6px !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          color: #333333 !important;
          line-height: 1.2 !important;
          min-height: 18px !important;
        }
        .input-group {
          display: flex !important;
          flex-wrap: nowrap !important;
          align-items: stretch !important;
          width: 100% !important;
        }
        .input-group .form-control {
          flex: 1 1 auto !important;
          width: 1% !important;
          min-width: 0 !important;
          border-top-right-radius: 0 !important;
          border-bottom-right-radius: 0 !important;
        }
        .input-group .btn {
          height: 50px !important;
          flex: 0 0 auto !important;
          white-space: nowrap !important;
          line-height: 1.2 !important;
          border-top-left-radius: 0 !important;
          border-bottom-left-radius: 0 !important;
        }
        .switch-align-box {
          height: 50px !important;
          display: flex !important;
          align-items: center !important;
          border: 1px solid #e7edf1 !important;
          border-radius: 6px !important;
          padding: 0 1rem 0 3.2rem !important;
          position: relative !important;
          background-color: #fff !important;
          margin: 0 !important;
        }
        .switch-align-box .form-check-input {
          position: absolute !important;
          left: 0.9rem !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          margin: 0 !important;
          cursor: pointer !important;
          float: none !important;
        }
        .switch-align-box .form-check-label {
          margin-left: 0 !important;
          cursor: pointer !important;
        }
      `}</style>

      <Navbar8 />

      <div className="dashboard-wrap bg-light">
        <EmployerSidebar active="submit-job" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Post a Job</h1>
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
                        Post Job
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
                  Your employer account status is <strong>{employer?.status}</strong>. Only VERIFIED employers can post live jobs. You can still fill out this form, but submission requires account verification.
                </div>
              )}
              {error && <div className="alert alert-danger mb-4">{error}</div>}
              {success && <div className="alert alert-success mb-4">{success}</div>}
            </div>

            <form onSubmit={handleSubmit}>
              {/* 1. Basic Job Details */}
              <div className="card mb-4">
                <div className="card-header bg-white py-3">
                  <h4 className="mb-0 fs-5 text-dark fw-semibold">1. Basic Job Details</h4>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-xl-12 col-lg-12 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">Job Title <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Senior Full Stack Engineer"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="col-xl-12 col-lg-12 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">Job Summary</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          placeholder="Brief high-level overview of the role..."
                          value={summary}
                          onChange={(e) => setSummary(e.target.value)}
                        ></textarea>
                      </div>
                    </div>

                    <div className="col-xl-4 col-lg-4 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">Job Category <span className="text-danger">*</span></label>
                        <select
                          className="form-select"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          {categoryOptions.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="col-xl-4 col-lg-4 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">Job Role</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Backend Developer"
                          value={jobRole}
                          onChange={(e) => setJobRole(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-xl-4 col-lg-4 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">Job Type <span className="text-danger">*</span></label>
                        <select
                          className="form-select"
                          value={jobType}
                          onChange={(e) => setJobType(e.target.value)}
                        >
                          {jobTypeOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Job Description */}
              <div className="card mb-4">
                <div className="card-header bg-white py-3">
                  <h4 className="mb-0 fs-5 text-dark fw-semibold">2. Job Description</h4>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-xl-12 col-lg-12 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">Full Job Description <span className="text-danger">*</span></label>
                        <textarea
                          className="form-control"
                          rows={6}
                          placeholder="Detailed description of the position, expectations, and work environment..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          required
                        ></textarea>
                      </div>
                    </div>

                    <div className="col-xl-12 col-lg-12 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">Roles & Responsibilities</label>
                        <textarea
                          className="form-control"
                          rows={4}
                          placeholder="Key responsibilities and day-to-day duties..."
                          value={responsibilities}
                          onChange={(e) => setResponsibilities(e.target.value)}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Skills & Experience */}
              <div className="card mb-4">
                <div className="card-header bg-white py-3">
                  <h4 className="mb-0 fs-5 text-dark fw-semibold">3. Skills & Experience</h4>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-xl-12 col-lg-12 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">Required Skills</label>
                        <div className="input-group mb-2">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Type a skill and click Add (e.g. React, Node.js, PostgreSQL)"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddSkill();
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={handleAddSkill}
                          >
                            Add Skill
                          </button>
                        </div>
                        {skills.length > 0 && (
                          <div className="d-flex flex-wrap gap-2 mt-2">
                            {skills.map((skill) => (
                              <span key={skill} className="badge bg-primary text-white p-2 d-flex align-items-center gap-1">
                                {skill}
                                <button
                                  type="button"
                                  className="btn-close btn-close-white ms-1"
                                  style={{ fontSize: "0.65rem" }}
                                  onClick={() => handleRemoveSkill(skill)}
                                ></button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">Minimum Experience (Years)</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="e.g. 2"
                          min="0"
                          max="50"
                          value={minExperience}
                          onChange={(e) => setMinExperience(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">Maximum Experience (Years)</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="e.g. 5"
                          min="0"
                          max="50"
                          value={maxExperience}
                          onChange={(e) => setMaxExperience(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Education & Qualification */}
              <div className="card mb-4">
                <div className="card-header bg-white py-3">
                  <h4 className="mb-0 fs-5 text-dark fw-semibold">4. Education & Qualification</h4>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">Minimum Qualification</label>
                        <select
                          className="form-select"
                          value={minQualification}
                          onChange={(e) => setMinQualification(e.target.value)}
                        >
                          {minQualificationOptions.map((qual) => (
                            <option key={qual} value={qual}>
                              {qual}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">Specialization</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Computer Science, Information Technology, Finance"
                          value={specialization}
                          onChange={(e) => setSpecialization(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Salary & Location */}
              <div className="card mb-4">
                <div className="card-header bg-white py-3">
                  <h4 className="mb-0 fs-5 text-dark fw-semibold">5. Salary & Location</h4>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-xl-3 col-lg-3 col-md-6">
                      <div className="form-group">
                        <label className="form-label fw-medium">Minimum Salary</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="e.g. 50000"
                          value={salaryMin}
                          onChange={(e) => setSalaryMin(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-xl-3 col-lg-3 col-md-6">
                      <div className="form-group">
                        <label className="form-label fw-medium">Maximum Salary</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="e.g. 100000"
                          value={salaryMax}
                          onChange={(e) => setSalaryMax(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-xl-3 col-lg-3 col-md-6">
                      <div className="form-group">
                        <label className="form-label fw-medium">Currency</label>
                        <select
                          className="form-select"
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                        >
                          {currencyOptions.map((curr) => (
                            <option key={curr} value={curr}>
                              {curr}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="col-xl-3 col-lg-3 col-md-6">
                      <div className="form-group">
                        <label className="form-label fw-medium">Salary Period</label>
                        <select
                          className="form-select"
                          value={salaryPeriod}
                          onChange={(e) => setSalaryPeriod(e.target.value)}
                        >
                          {salaryPeriodOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="col-xl-4 col-lg-4 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">Country</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. India"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-xl-4 col-lg-4 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">State</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Maharashtra"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-xl-4 col-lg-4 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">City</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Mumbai"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-xl-12 col-lg-12 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">Work Mode</label>
                        <select
                          className="form-select"
                          value={workMode}
                          onChange={(e) => setWorkMode(e.target.value)}
                        >
                          {workModeOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Job Openings */}
              <div className="card mb-4">
                <div className="card-header bg-white py-3">
                  <h4 className="mb-0 fs-5 text-dark fw-semibold">6. Job Openings</h4>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">Number of Openings</label>
                        <input
                          type="number"
                          className="form-control"
                          min="1"
                          max="1000"
                          value={openings}
                          onChange={(e) => setOpenings(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">Application Deadline</label>
                        <input
                          type="date"
                          className="form-control"
                          min={todayStr}
                          value={applicationDeadline}
                          onChange={(e) => setApplicationDeadline(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 7. Company Information */}
              <div className="card mb-4">
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                  <h4 className="mb-0 fs-5 text-dark fw-semibold">7. Company Information</h4>
                  <span className="badge bg-info text-dark">Auto-Loaded</span>
                </div>
                <div className="card-body">
                  {employerLoading ? (
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading employer info...</span>
                    </div>
                  ) : employer ? (
                    <div className="p-3 border rounded bg-light">
                      <div className="d-flex align-items-center gap-3 mb-3">
                        {employer.logoUrl ? (
                          <img
                            src={employer.logoUrl}
                            alt={employer.companyName}
                            className="rounded circle"
                            style={{ width: "60px", height: "60px", objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center fw-bold"
                            style={{ width: "60px", height: "60px", fontSize: "1.5rem" }}
                          >
                            {employer.companyName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h5 className="mb-1 text-dark font-weight-bold">{employer.companyName}</h5>
                          <span className="badge bg-success me-2">{employer.status}</span>
                          {employer.industry && (
                            <span className="badge bg-secondary me-2">{employer.industry}</span>
                          )}
                          {employer.location && <small className="text-muted">{employer.location}</small>}
                        </div>
                      </div>
                      {employer.website && (
                        <p className="mb-1 text-muted fs-6">
                          <strong>Website:</strong>{" "}
                          <a href={employer.website} target="_blank" rel="noopener noreferrer" className="text-main">
                            {employer.website}
                          </a>
                        </p>
                      )}
                      {employer.description && (
                        <p className="mb-0 text-secondary fs-6">
                          <strong>About Company:</strong> {employer.description}
                        </p>
                      )}
                      <small className="text-muted d-block mt-3 fst-italic">
                        * Note: Company details are automatically fetched from your active Employer Profile.
                      </small>
                    </div>
                  ) : (
                    <div className="alert alert-warning mb-0">
                      Employer profile details could not be loaded.
                    </div>
                  )}
                </div>
              </div>

              {/* 8. Publishing Options */}
              <div className="card mb-4">
                <div className="card-header bg-white py-3">
                  <h4 className="mb-0 fs-5 text-dark fw-semibold">8. Publishing Options</h4>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">Job Status</label>
                        <select
                          className="form-select"
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                        >
                          <option value="OPEN">Publish Immediately (OPEN)</option>
                          <option value="DRAFT">Save as Draft (DRAFT)</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">Publish Date</label>
                        <input
                          type="date"
                          className="form-control"
                          min={todayStr}
                          value={publishDate}
                          onChange={(e) => setPublishDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-xl-12 col-lg-12 col-md-12 pt-2">
                      <div className="form-group mb-0">
                        <div className="form-check form-switch switch-align-box">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="featuredCheck"
                            checked={isFeatured}
                            onChange={(e) => setIsFeatured(e.target.checked)}
                          />
                          <label className="form-check-label fw-medium ms-2 mb-0" htmlFor="featuredCheck">
                            Mark as Featured Job (Promote at top of job listings)
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="row mb-5">
                <div className="col-lg-12 col-md-12">
                  <button type="submit" className="btn btn-main px-5 py-3 fs-6 font-weight-medium" disabled={submitting}>
                    {submitting ? "Posting Job..." : "Submit Job Listing"}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* footer */}
          <div className="row">
            <div className="col-md-12">
              <div className="py-3 text-center text-muted">
                &copy; {new Date().getFullYear()} JobStock. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
