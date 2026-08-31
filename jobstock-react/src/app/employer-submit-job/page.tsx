"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar8 from "@/components/Navbar8";
import EmployerSidebar from "@/components/employer-dashboard/EmployerSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { Toaster, toast } from "react-hot-toast";

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

interface SearchableSelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
  disabledPlaceholder?: string;
  disabled?: boolean;
  loading?: boolean;
  searchPlaceholder?: string;
  onRetry?: () => void;
  errorMsg?: string | null;
}

function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabledPlaceholder,
  disabled,
  loading,
  searchPlaceholder = "Search...",
  onRetry,
  errorMsg
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="form-group position-relative" ref={containerRef}>
      <label className="form-label fw-medium d-flex justify-content-between">
        <span>{label}</span>
        {errorMsg && (
          <button
            type="button"
            className="btn btn-link p-0 text-danger border-0 small font-weight-medium"
            style={{ fontSize: "11px", textDecoration: "none" }}
            onClick={(e) => {
              e.stopPropagation();
              onRetry?.();
            }}
          >
            <i className="fa-solid fa-arrows-rotate me-1"></i>Retry
          </button>
        )}
      </label>
      
      <div
        className="form-control d-flex align-items-center justify-content-between"
        style={{
          cursor: disabled ? "not-allowed" : "pointer",
          backgroundColor: disabled ? "#f8f9fa" : "#fff",
          opacity: disabled ? 0.7 : 1,
          userSelect: "none"
        }}
        onClick={() => {
          if (!disabled && !loading) {
            setIsOpen(!isOpen);
            setSearchQuery("");
          }
        }}
      >
        <span className="text-truncate d-flex align-items-center gap-2">
          {loading && (
            <span
              className="spinner-border spinner-border-sm text-primary"
              style={{ width: "14px", height: "14px" }}
              role="status"
              aria-hidden="true"
            ></span>
          )}
          <span style={{ color: !value && !loading ? "#9ea8b6" : "inherit" }}>
            {loading
              ? "Loading..."
              : value || (disabled ? disabledPlaceholder : placeholder)}
          </span>
        </span>
        <i className="fa-solid fa-chevron-down text-muted" style={{ fontSize: "10px" }}></i>
      </div>

      {isOpen && !disabled && (
        <div
          className="position-absolute w-100 bg-white border rounded shadow mt-1"
          style={{
            maxHeight: "260px",
            overflowY: "auto",
            zIndex: 1050,
            left: 0,
            top: "100%"
          }}
        >
          <div className="p-2 border-bottom sticky-top bg-white">
            <input
              type="text"
              className="form-control form-control-sm w-100"
              style={{
                height: "36px !important",
                minHeight: "36px !important",
                padding: "4px 8px !important",
                fontSize: "13px !important"
              }}
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
          <div className="list-group list-group-flush" style={{ maxHeight: "200px", overflowY: "auto" }}>
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-muted text-center small">No matches found</div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`list-group-item list-group-item-action text-start border-0 py-2 px-3 small ${
                    opt.toLowerCase() === value.toLowerCase() ? "active bg-primary text-white" : ""
                  }`}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                >
                  {opt}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
    
  // Location selection states (CountriesNow API)
  const [countries, setCountries] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const [countriesLoading, setCountriesLoading] = useState(false);
  const [statesLoading, setStatesLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);

  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [statesError, setStatesError] = useState<string | null>(null);
  const [citiesError, setCitiesError] = useState<string | null>(null);

  const [stateCache, setStateCache] = useState<Record<string, string[]>>({});
  const [cityCache, setCityCache] = useState<Record<string, string[]>>({});

  const fetchCountries = async () => {
    setCountriesLoading(true);
    setCountriesError(null);
    try {
      const response = await fetch("https://countriesnow.space/api/v0.1/countries/iso");
      if (!response.ok) {
        throw new Error("Failed to fetch countries");
      }
      const json = await response.json();
      if (json.error) {
        throw new Error(json.msg || "Failed to load countries");
      }
      const countryNames = json.data.map((c: any) => c.name).sort();
      setCountries(countryNames);
    } catch (err: any) {
      setCountriesError(err.message || "Failed to load countries");
    } finally {
      setCountriesLoading(false);
    }
  };

  const fetchStates = async (countryName: string) => {
    if (!countryName) {
      setStates([]);
      return;
    }
    if (stateCache[countryName]) {
      setStates(stateCache[countryName]);
      return;
    }

    setStatesLoading(true);
    setStatesError(null);
    try {
      const response = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ country: countryName }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch states");
      }
      const json = await response.json();
      if (json.error) {
        throw new Error(json.msg || "Failed to load states");
      }
      const stateNames = json.data.states.map((s: any) => s.name).sort();
      setStateCache((prev) => ({ ...prev, [countryName]: stateNames }));
      setStates(stateNames);
    } catch (err: any) {
      setStatesError(err.message || "Failed to load states");
      setStates([]);
    } finally {
      setStatesLoading(false);
    }
  };

  const fetchCities = async (countryName: string, stateName: string) => {
    if (!countryName || !stateName) {
      setCities([]);
      return;
    }
    const cacheKey = `${countryName}_${stateName}`;
    if (cityCache[cacheKey]) {
      setCities(cityCache[cacheKey]);
      return;
    }

    setCitiesLoading(true);
    setCitiesError(null);
    try {
      const response = await fetch("https://countriesnow.space/api/v0.1/countries/state/cities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ country: countryName, state: stateName }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch cities");
      }
      const json = await response.json();
      if (json.error) {
        throw new Error(json.msg || "Failed to load cities");
      }
      const cityNames = json.data.sort();
      setCityCache((prev) => ({ ...prev, [cacheKey]: cityNames }));
      setCities(cityNames);
    } catch (err: any) {
      setCitiesError(err.message || "Failed to load cities");
      setCities([]);
    } finally {
      setCitiesLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (country) {
      fetchStates(country);
    } else {
      setStates([]);
    }
  }, [country]);

  useEffect(() => {
    if (country && state) {
      fetchCities(country, state);
    } else {
      setCities([]);
    }
  }, [country, state]);

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    setState("");
    setCity("");
    setStates([]);
    setCities([]);
  };

  const handleStateChange = (newState: string) => {
    setState(newState);
    setCity("");
    setCities([]);
  };

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
        toast.error(err instanceof ApiError ? err.message : "Failed to load employer profile");
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
        
    // Front-end validations
    if (!title.trim()) {
      toast.error("Please enter a Job Title.");
      scrollToTop();
      return;
    }
    if (!description.trim() || description.trim().length < 20) {
      toast.error("Please enter a Job Description with at least 20 characters.");
      scrollToTop();
      return;
    }

    if (salaryMin && salaryMax && Number(salaryMin) > Number(salaryMax)) {
      toast.error("Minimum Salary cannot be greater than Maximum Salary.");
      scrollToTop();
      return;
    }

    if (minExperience && maxExperience && Number(minExperience) > Number(maxExperience)) {
      toast.error("Minimum Experience cannot be greater than Maximum Experience.");
      scrollToTop();
      return;
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    if (applicationDeadline && new Date(applicationDeadline) < startOfToday) {
      toast.error("Application Deadline cannot be a date in the past.");
      scrollToTop();
      return;
    }

    if (publishDate && new Date(publishDate) < startOfToday) {
      toast.error("Publish Date cannot be a date in the past.");
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

      toast.success("Job posted successfully!");
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
      setStatus("OPEN");
      scrollToTop();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to post job.");
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
                      <SearchableSelect
                        label="Country"
                        value={country}
                        onChange={handleCountryChange}
                        options={countries}
                        placeholder="Select Country"
                        loading={countriesLoading}
                        errorMsg={countriesError}
                        onRetry={fetchCountries}
                        searchPlaceholder="Search country..."
                      />
                    </div>

                    <div className="col-xl-4 col-lg-4 col-md-12">
                      {!statesLoading && country && states.length === 0 ? (
                        <div className="form-group">
                          <label className="form-label fw-medium">State</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter State"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                          />
                        </div>
                      ) : (
                        <SearchableSelect
                          label="State"
                          value={state}
                          onChange={handleStateChange}
                          options={states}
                          placeholder="Select State"
                          disabledPlaceholder="Select Country First"
                          disabled={!country}
                          loading={statesLoading}
                          errorMsg={statesError}
                          onRetry={() => fetchStates(country)}
                          searchPlaceholder="Search state..."
                        />
                      )}
                    </div>

                    <div className="col-xl-4 col-lg-4 col-md-12">
                      {!citiesLoading && ((state && cities.length === 0) || (country && states.length === 0 && !statesLoading && cities.length === 0)) ? (
                        <div className="form-group">
                          <label className="form-label fw-medium">City</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter City"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                          />
                        </div>
                      ) : (
                        <SearchableSelect
                          label="City"
                          value={city}
                          onChange={setCity}
                          options={cities}
                          placeholder="Select City"
                          disabledPlaceholder="Select State First"
                          disabled={!state && !(country && states.length === 0 && !statesLoading)}
                          loading={citiesLoading}
                          errorMsg={citiesError}
                          onRetry={() => fetchCities(country, state)}
                          searchPlaceholder="Search city..."
                        />
                      )}
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

          {/* footer removed */}
        </div>
      </div>
    </>
  );
}
