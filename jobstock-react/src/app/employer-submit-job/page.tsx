"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

const fallbackCitiesByState: Record<string, string[]> = {
  Karnataka: [
    "Bengaluru", "Bangalore", "Mysore", "Mysuru", "Hassan", "Mangalore", "Mangaluru",
    "Hubli", "Hubballi", "Dharwad", "Belgaum", "Belagavi", "Davanagere", "Shimoga",
    "Shivamogga", "Tumkur", "Tumakuru", "Gulbarga", "Kalaburagi", "Bellary", "Ballari",
    "Udupi", "Bidar", "Hospet", "Hosapete", "Chitradurga", "Kolar", "Mandya", "Chikkamagaluru"
  ],
  Maharashtra: [
    "Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Chhatrapati Sambhajinagar",
    "Solapur", "Amravati", "Kolhapur", "Navi Mumbai", "Sangli", "Jalgaon", "Akola", "Latur"
  ],
  "Tamil Nadu": [
    "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tiruppur",
    "Erode", "Vellore", "Tirunelveli", "Thanjavur", "Tuticorin", "Nagercoil"
  ],
  Telangana: [
    "Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Ramagundam"
  ],
  "Andhra Pradesh": [
    "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry",
    "Tirupati", "Kakinada", "Eluru", "Anantapur"
  ],
  Kerala: [
    "Thiruvananthapuram", "Kochi", "Cochin", "Kozhikode", "Calicut", "Thrissur",
    "Kollam", "Palakkad", "Kannur", "Alappuzha", "Kottayam"
  ],
  Delhi: [
    "New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", "Central Delhi"
  ],
  Gujarat: [
    "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Junagadh"
  ],
  "Uttar Pradesh": [
    "Lucknow", "Kanpur", "Noida", "Greater Noida", "Ghaziabad", "Agra", "Varanasi",
    "Prayagraj", "Allahabad", "Meerut", "Bareilly", "Aligarh", "Moradabad"
  ],
  "West Bengal": [
    "Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Kharagpur", "Bardhaman"
  ],
  Rajasthan: [
    "Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Bhilwara", "Alwar"
  ],
  Punjab: [
    "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali"
  ],
  Haryana: [
    "Gurugram", "Gurgaon", "Faridabad", "Panipat", "Ambala", "Karnal", "Hisar", "Rohtak"
  ]
};

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
  allowCustom?: boolean;
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
  errorMsg,
  allowCustom = true,
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const trimmedQuery = searchQuery.trim();
  const showCustomOption =
    allowCustom &&
    trimmedQuery.length > 0 &&
    !options.some((opt) => opt.toLowerCase() === trimmedQuery.toLowerCase());

  return (
    <div className="form-group position-relative" ref={containerRef}>
      <label className="form-label fw-medium">{label}</label>
      <div
        className={`form-control d-flex align-items-center justify-content-between ${
          disabled ? "bg-light text-muted" : "bg-white"
        }`}
        style={{ cursor: disabled ? "not-allowed" : "pointer", height: "auto", minHeight: "48px" }}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setSearchQuery("");
          }
        }}
      >
        <span className={value ? "text-dark" : "text-muted"}>
          {disabled
            ? disabledPlaceholder || placeholder
            : value || (loading ? "Loading..." : placeholder)}
        </span>
        {loading ? (
          <span className="spinner-border spinner-border-sm text-secondary" role="status"></span>
        ) : (
          <i className={`fa-solid fa-chevron-${isOpen ? "up" : "down"} text-muted fs-8`}></i>
        )}
      </div>

      {errorMsg && (
        <div className="d-flex align-items-center justify-content-between mt-1">
          <small className="text-danger">{errorMsg}</small>
          {onRetry && (
            <button
              type="button"
              className="btn btn-link btn-sm p-0 text-primary"
              onClick={onRetry}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {isOpen && !disabled && (
        <div
          className="position-absolute start-0 end-0 bg-white border rounded shadow-lg p-2 mt-1"
          style={{ zIndex: 1050, maxHeight: "250px", overflowY: "auto" }}
        >
          <div className="mb-2">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && trimmedQuery) {
                  e.preventDefault();
                  onChange(trimmedQuery);
                  setIsOpen(false);
                }
              }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="list-group list-group-flush">
            {showCustomOption && (
              <button
                type="button"
                className="list-group-item list-group-item-action text-start border-0 py-2 px-3 small text-primary fw-medium"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  onChange(trimmedQuery);
                  setIsOpen(false);
                }}
              >
                <i className="fa-solid fa-plus me-1"></i> Use &quot;{trimmedQuery}&quot;
              </button>
            )}

            {filteredOptions.length === 0 && !showCustomOption ? (
              <div className="p-2 text-center text-muted small">No results found</div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`list-group-item list-group-item-action text-start border-0 py-2 px-3 small ${
                    opt.toLowerCase() === (value || "").toLowerCase() ? "active bg-primary text-white" : ""
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

function EmployerSubmitJobContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const [fetchingJob, setFetchingJob] = useState(!!editId);
  const [savingDraft, setSavingDraft] = useState(false);

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
  const [locations, setLocations] = useState<string[]>([]);
  const [workMode, setWorkMode] = useState("IN_OFFICE");

  // 6. Job Openings
  const [openings, setOpenings] = useState("1");
  const [applicationDeadline, setApplicationDeadline] = useState("");

  // Validation errors state
  const [errors, setErrors] = useState<Record<string, string>>({});
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

    // Instant local fallback if available
    const instantFallback = fallbackCitiesByState[stateName] || [];
    if (instantFallback.length > 0) {
      setCities(instantFallback);
    }

    if (cityCache[cacheKey] && cityCache[cacheKey].length > 0) {
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
      if (response.ok) {
        const json = await response.json();
        if (!json.error && json.data && Array.isArray(json.data) && json.data.length > 0) {
          const cityNames = json.data.sort();
          const merged = Array.from(new Set([...cityNames, ...instantFallback])).sort();
          setCityCache((prev) => ({ ...prev, [cacheKey]: merged }));
          setCities(merged);
          return;
        }
      }
    } catch (err: any) {
      // API error - ignore if instantFallback exists
    } finally {
      setCitiesLoading(false);
    }

    if (instantFallback.length > 0) {
      setCities(instantFallback);
      setCitiesError(null);
    } else {
      setCitiesError("Please type your city name manually if not listed");
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
    if (errors.country) {
      setErrors((prev) => ({ ...prev, country: "" }));
    }
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

  
  // Fetch job details for editing
  useEffect(() => {
    if (!editId || !user || user.role !== 'EMPLOYER') {
      setFetchingJob(false);
      return;
    }
    
    (async () => {
      try {
        setFetchingJob(true);
        // We find the job by looking at the employer's jobs
        const myJobs: any[] = (await api.get('/jobs/mine')) as any[];
        const job = myJobs.find((j: any) => j.id === editId);
        
        if (job) {
          setTitle(job.title || '');
          setSummary(job.summary || '');
          setCategory(job.category || 'Web & Application');
          setJobRole(job.jobRole || '');
          setJobType(job.jobType || 'FULL_TIME');
          setDescription(job.description || '');
          setResponsibilities(job.responsibilities || '');
          
          let parsedSkills: string[] = [];
          if (Array.isArray(job.skills)) {
            parsedSkills = job.skills;
          } else if (typeof job.skills === 'string') {
            try {
              parsedSkills = JSON.parse(job.skills);
            } catch (e) {
              const str = job.skills as string;
              parsedSkills = str.startsWith('{') 
                ? str.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean)
                : str.split(',').map(s => s.trim()).filter(Boolean);
            }
          }
          setSkills(parsedSkills);

          setMinExperience(job.minExperience != null ? String(job.minExperience) : '');
          setMaxExperience(job.maxExperience != null ? String(job.maxExperience) : '');
          setMinQualification(job.minQualification || "Bachelor's Degree");
          setSpecialization(job.specialization || '');
          setSalaryMin(job.salaryMin != null ? String(job.salaryMin) : '');
          setSalaryMax(job.salaryMax != null ? String(job.salaryMax) : '');
          setCurrency(job.currency || 'INR');
          setSalaryPeriod(job.salaryPeriod || 'MONTHLY');
          setCountry(job.country || 'India');
          setState(job.state || '');
          setCity(job.city || '');
          
          const existingLoc = job.location || '';
          if (existingLoc.includes(' | ')) {
            setLocations(existingLoc.split(' | '));
          } else if (existingLoc && existingLoc !== 'Remote' && existingLoc !== 'India' && existingLoc !== 'Not specified') {
            setLocations([existingLoc]);
          }

          setWorkMode(job.workMode || 'IN_OFFICE');
          setOpenings(job.openings ? String(job.openings) : '1');
          if (job.applicationDeadline) {
            setApplicationDeadline(new Date(job.applicationDeadline).toISOString().split('T')[0]);
          }
        } else {
          toast.error('Job not found or you do not have permission to edit it.');
          router.push('/employer-jobs');
        }
      } catch (err) {
        toast.error('Failed to load job details');
        router.push('/employer-jobs');
      } finally {
        setFetchingJob(false);
      }
    })();
  }, [editId, user, router]);

  // Skill management helpers
  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
      if (errors.skills) {
        setErrors((prev) => ({ ...prev, skills: "" }));
      }
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleAddLocation = () => {
    const loc = [city, state, country].filter(Boolean).join(", ").trim();
    if (loc && !locations.includes(loc)) {
      setLocations([...locations, loc]);
      setCity("");
      setState("");
    }
  };

  const handleRemoveLocation = (locToRemove: string) => {
    setLocations(locations.filter((l) => l !== locToRemove));
  };

  function validateForm(isDraft: boolean, currentSkills: string[] = skills): boolean {
    const newErrors: Record<string, string> = {};

    // 1. Basic Job Details
    if (!title.trim()) {
      newErrors.title = "Job Title is required.";
    } else if (title.trim().length < 3) {
      newErrors.title = "Job Title must be at least 3 characters.";
    }

    if (!isDraft) {
      if (!category.trim()) {
      newErrors.category = "Please select a Job Category.";
    }

    if (!jobType.trim()) {
      newErrors.jobType = "Please select a Job Type.";
    }

    // 2. Job Description
    if (!description.trim()) {
      newErrors.description = "Job Description is required.";
    } else if (description.trim().length < 20) {
      newErrors.description = `Job Description must be at least 20 characters (currently ${description.trim().length}).`;
    }

    // 3. Skills
    if (currentSkills.length === 0) {
      newErrors.skills = "Please add at least one Required Skill (type and click Add Skill or press Enter).";
    }

    // 3. Experience
    if (minExperience && (Number(minExperience) < 0 || Number(minExperience) > 50)) {
      newErrors.minExperience = "Minimum experience must be between 0 and 50 years.";
    }
    if (maxExperience && (Number(maxExperience) < 0 || Number(maxExperience) > 50)) {
      newErrors.maxExperience = "Maximum experience must be between 0 and 50 years.";
    }
    if (minExperience && maxExperience && Number(minExperience) > Number(maxExperience)) {
      newErrors.maxExperience = "Maximum Experience cannot be less than Minimum Experience.";
    }

    // 5. Salary
    if (salaryMin && Number(salaryMin) < 0) {
      newErrors.salaryMin = "Minimum Salary cannot be negative.";
    }
    if (salaryMax && Number(salaryMax) < 0) {
      newErrors.salaryMax = "Maximum Salary cannot be negative.";
    }
    if (salaryMin && salaryMax && Number(salaryMin) > Number(salaryMax)) {
      newErrors.salaryMax = "Maximum Salary cannot be less than Minimum Salary.";
    }

    // Location
    if (workMode !== "REMOTE" && locations.length === 0 && !country.trim()) {
      newErrors.country = "Please select and add a Location for on-site or hybrid work.";
    }

    // 6. Job Openings
    if (!openings || Number(openings) < 1 || Number(openings) > 1000) {
      newErrors.openings = "Number of Openings must be between 1 and 1000.";
    }

    if (applicationDeadline) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      if (new Date(applicationDeadline) < startOfToday) {
        newErrors.applicationDeadline = "Application Deadline cannot be a date in the past.";
      }
    }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrorMessage = Object.values(newErrors)[0];
      toast.error(firstErrorMessage);
      scrollToTop();
      return false;
    }

    return true;
  }

  async function handleSubmit(e: React.FormEvent, isDraft: boolean) {
    e.preventDefault();

    // Check employer verification
    if (!isDraft && employer && employer.status !== "VERIFIED") {
      toast.error("Your employer account is not verified yet. Only verified employers can post live jobs.");
      scrollToTop();
      return;
    }

    // Auto-add pending skill input
    let finalSkills = [...skills];
    const pendingSkill = skillInput.trim();
    if (pendingSkill && !finalSkills.includes(pendingSkill)) {
      finalSkills.push(pendingSkill);
      setSkills(finalSkills);
      setSkillInput("");
    }

    // Validate all fields
    if (!validateForm(isDraft, finalSkills)) {
      return;
    }

    let finalLocations = [...locations];
    const currentLoc = [city, state, country].filter(Boolean).join(", ").trim();
    if (currentLoc && !finalLocations.includes(currentLoc) && locations.length === 0) {
      finalLocations.push(currentLoc);
    }
    
    const calculatedLocation = finalLocations.length > 0 
      ? finalLocations.join(" | ") 
      : (workMode === "REMOTE" ? "Remote" : "India");

    if (isDraft) setSavingDraft(true); else setSubmitting(true);
    try {
      const payload = {
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
        skills: finalSkills,
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

        // Automatic publishing
        status: isDraft ? 'DRAFT' : 'OPEN',
      };

      if (editId) {
        await api.put(`/jobs/${editId}`, payload);
        toast.success(isDraft ? 'Draft updated successfully!' : 'Job updated successfully!');
      } else {
        await api.post("/jobs", payload);
        toast.success(isDraft ? 'Draft saved successfully!' : 'Job posted successfully!');
      }
      
      // Reset form & redirect to employer jobs
      router.push("/employer-jobs");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save job. Please check all fields.");
      scrollToTop();
    } finally {
      setSubmitting(false); setSavingDraft(false);
    }
  }

  if (loading || !user || user.role !== "EMPLOYER") {
    return null;
  }

  const notVerified = employer && employer.status !== "VERIFIED";

  
  if (fetchingJob) {
    return (
      <div className="dashboard-wrap bg-light">
        <EmployerSidebar active="submit-job" />
        <div className="dashboard-content d-flex align-items-center justify-content-center" style={{ minHeight: "50vh" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading job...</span>
          </div>
        </div>
      </div>
    );
  }

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
        }
        .form-control.is-invalid,
        .form-select.is-invalid {
          border-color: #dc3545 !important;
        }
        textarea.form-control {
          height: auto !important;
          min-height: auto !important;
          max-height: none !important;
        }
        .form-group label {
          margin-bottom: 0.4rem !important;
          font-size: 13px !important;
          color: #1e293b !important;
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
                <h1 className="mb-1 fs-3 fw-medium">{editId ? "Edit Job" : "Post a Job"}</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted">
                      <a href="#">Employer</a>
                    </li>
                    <li className="breadcrumb-item text-muted">
                      <a href="#">Dashboard</a>
                    </li>
                    <li className="breadcrumb-item">
                      <a href="#" className="text-main">{editId ? "Edit Job" : "Post Job"}</a>
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
                  Your employer account status is <strong>{employer?.status}</strong>. Only VERIFIED employers can post live jobs. You can still save it as a Draft.
                </div>
              )}
            </div>

            <form noValidate>
              {/* 1. Basic Job Details */}
              <div className="card mb-4 shadow-sm border-0 rounded-3">
                <div className="card-header bg-white py-3 border-bottom">
                  <h4 className="mb-0 fs-5 text-dark fw-semibold">1. Basic Job Details</h4>
                </div>
                <div className="card-body p-4">
                  <div className="row g-3">
                    <div className="col-xl-12 col-lg-12 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">
                          Job Title <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className={`form-control ${errors.title ? "is-invalid" : ""}`}
                          placeholder="e.g. Senior Full Stack Engineer"
                          value={title}
                          onChange={(e) => {
                            setTitle(e.target.value);
                            if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
                          }}
                        />
                        {errors.title && <small className="text-danger d-block mt-1">{errors.title}</small>}
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
                        <label className="form-label fw-medium">
                          Job Category <span className="text-danger">*</span>
                        </label>
                        <select
                          className={`form-select ${errors.category ? "is-invalid" : ""}`}
                          value={category}
                          onChange={(e) => {
                            setCategory(e.target.value);
                            if (errors.category) setErrors((prev) => ({ ...prev, category: "" }));
                          }}
                        >
                          {categoryOptions.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                        {errors.category && <small className="text-danger d-block mt-1">{errors.category}</small>}
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
                        <label className="form-label fw-medium">
                          Job Type <span className="text-danger">*</span>
                        </label>
                        <select
                          className={`form-select ${errors.jobType ? "is-invalid" : ""}`}
                          value={jobType}
                          onChange={(e) => {
                            setJobType(e.target.value);
                            if (errors.jobType) setErrors((prev) => ({ ...prev, jobType: "" }));
                          }}
                        >
                          {jobTypeOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {errors.jobType && <small className="text-danger d-block mt-1">{errors.jobType}</small>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Job Description */}
              <div className="card mb-4 shadow-sm border-0 rounded-3">
                <div className="card-header bg-white py-3 border-bottom">
                  <h4 className="mb-0 fs-5 text-dark fw-semibold">2. Job Description</h4>
                </div>
                <div className="card-body p-4">
                  <div className="row g-3">
                    <div className="col-xl-12 col-lg-12 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">
                          Full Job Description <span className="text-danger">*</span>
                        </label>
                        <textarea
                          className={`form-control ${errors.description ? "is-invalid" : ""}`}
                          rows={6}
                          placeholder="Detailed description of the position, expectations, and work environment (min 20 characters)..."
                          value={description}
                          onChange={(e) => {
                            setDescription(e.target.value);
                            if (errors.description) setErrors((prev) => ({ ...prev, description: "" }));
                          }}
                        ></textarea>
                        {errors.description && (
                          <small className="text-danger d-block mt-1">{errors.description}</small>
                        )}
                      </div>
                    </div>

                    <div className="col-xl-12 col-lg-12 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">Roles &amp; Responsibilities</label>
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
              <div className="card mb-4 shadow-sm border-0 rounded-3">
                <div className="card-header bg-white py-3 border-bottom">
                  <h4 className="mb-0 fs-5 text-dark fw-semibold">3. Skills &amp; Experience</h4>
                </div>
                <div className="card-body p-4">
                  <div className="row g-3">
                    <div className="col-xl-12 col-lg-12 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">
                          Required Skills <span className="text-danger">*</span>
                        </label>
                        <div className="input-group mb-2">
                          <input
                            type="text"
                            className={`form-control ${errors.skills ? "is-invalid" : ""}`}
                            placeholder="Type a skill and click Add Skill (e.g. React, Node.js, Python)"
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
                            className="btn btn-main px-4 fw-medium"
                            onClick={handleAddSkill}
                          >
                            Add Skill
                          </button>
                        </div>
                        {errors.skills && <small className="text-danger d-block mt-1">{errors.skills}</small>}
                        {skills.length > 0 && (
                          <div className="d-flex flex-wrap gap-2 mt-2">
                            {skills.map((skill) => (
                              <span key={skill} className="badge bg-light-main text-main border p-2 d-flex align-items-center gap-1.5 fs-7">
                                {skill}
                                <button
                                  type="button"
                                  className="btn-close ms-1"
                                  style={{ fontSize: "0.65rem" }}
                                  onClick={() => handleRemoveSkill(skill)}
                                  title="Remove skill"
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
                          className={`form-control ${errors.minExperience ? "is-invalid" : ""}`}
                          placeholder="e.g. 2"
                          min="0"
                          max="50"
                          value={minExperience}
                          onChange={(e) => {
                            setMinExperience(e.target.value);
                            if (errors.minExperience) setErrors((prev) => ({ ...prev, minExperience: "" }));
                          }}
                        />
                        {errors.minExperience && (
                          <small className="text-danger d-block mt-1">{errors.minExperience}</small>
                        )}
                      </div>
                    </div>

                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">Maximum Experience (Years)</label>
                        <input
                          type="number"
                          className={`form-control ${errors.maxExperience ? "is-invalid" : ""}`}
                          placeholder="e.g. 5"
                          min="0"
                          max="50"
                          value={maxExperience}
                          onChange={(e) => {
                            setMaxExperience(e.target.value);
                            if (errors.maxExperience) setErrors((prev) => ({ ...prev, maxExperience: "" }));
                          }}
                        />
                        {errors.maxExperience && (
                          <small className="text-danger d-block mt-1">{errors.maxExperience}</small>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Education & Qualification */}
              <div className="card mb-4 shadow-sm border-0 rounded-3">
                <div className="card-header bg-white py-3 border-bottom">
                  <h4 className="mb-0 fs-5 text-dark fw-semibold">4. Education &amp; Qualification</h4>
                </div>
                <div className="card-body p-4">
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
                        <label className="form-label fw-medium">Specialization / Degree Stream</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Computer Science, Information Technology"
                          value={specialization}
                          onChange={(e) => setSpecialization(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Salary & Location */}
              <div className="card mb-4 shadow-sm border-0 rounded-3">
                <div className="card-header bg-white py-3 border-bottom">
                  <h4 className="mb-0 fs-5 text-dark fw-semibold">5. Salary &amp; Location</h4>
                </div>
                <div className="card-body p-4">
                  <div className="row g-3">
                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">Minimum Salary</label>
                        <input
                          type="number"
                          className={`form-control ${errors.salaryMin ? "is-invalid" : ""}`}
                          placeholder="e.g. 500000"
                          min="0"
                          value={salaryMin}
                          onChange={(e) => {
                            setSalaryMin(e.target.value);
                            if (errors.salaryMin) setErrors((prev) => ({ ...prev, salaryMin: "" }));
                          }}
                        />
                        {errors.salaryMin && <small className="text-danger d-block mt-1">{errors.salaryMin}</small>}
                      </div>
                    </div>

                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">Maximum Salary</label>
                        <input
                          type="number"
                          className={`form-control ${errors.salaryMax ? "is-invalid" : ""}`}
                          placeholder="e.g. 1200000"
                          min="0"
                          value={salaryMax}
                          onChange={(e) => {
                            setSalaryMax(e.target.value);
                            if (errors.salaryMax) setErrors((prev) => ({ ...prev, salaryMax: "" }));
                          }}
                        />
                        {errors.salaryMax && <small className="text-danger d-block mt-1">{errors.salaryMax}</small>}
                      </div>
                    </div>

                    <div className="col-xl-6 col-lg-6 col-md-12">
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

                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">Salary Period</label>
                        <select
                          className="form-select"
                          value={salaryPeriod}
                          onChange={(e) => setSalaryPeriod(e.target.value)}
                        >
                          {salaryPeriodOptions.map((period) => (
                            <option key={period.value} value={period.value}>
                              {period.label}
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
                        errorMsg={countriesError || errors.country}
                        onRetry={fetchCountries}
                        searchPlaceholder="Search country..."
                      />
                    </div>

                    <div className="col-xl-4 col-lg-4 col-md-12">
                      <SearchableSelect
                        label="State"
                        value={state}
                        onChange={handleStateChange}
                        options={states}
                        placeholder="Select State"
                        disabledPlaceholder="Select a country first"
                        disabled={!country}
                        loading={statesLoading}
                        errorMsg={statesError}
                        onRetry={() => fetchStates(country)}
                        searchPlaceholder="Search state..."
                      />
                    </div>

                    <div className="col-xl-4 col-lg-4 col-md-12">
                      <SearchableSelect
                        label="City"
                        value={city}
                        onChange={setCity}
                        options={cities}
                        placeholder="Select City"
                        disabledPlaceholder={
                          !country
                            ? "Select a country first"
                            : !state
                            ? "Select a state first"
                            : "Select City"
                        }
                        disabled={!country || !state}
                        loading={citiesLoading}
                        errorMsg={citiesError}
                        onRetry={() => fetchCities(country, state)}
                        searchPlaceholder="Search city..."
                      />
                    </div>

                    <div className="col-xl-12 col-lg-12 col-md-12 mt-3">
                      <button
                        type="button"
                        className="btn btn-main px-4 fw-medium"
                        onClick={handleAddLocation}
                      >
                        Add Location
                      </button>
                      
                      {locations.length > 0 && (
                        <div className="d-flex flex-wrap gap-2 mt-3">
                          {locations.map((loc) => (
                            <span key={loc} className="badge bg-light-main text-main border p-2 d-flex align-items-center gap-1.5 fs-7">
                              {loc}
                              <button
                                type="button"
                                className="btn-close ms-1"
                                style={{ fontSize: "0.65rem" }}
                                onClick={() => handleRemoveLocation(loc)}
                                title="Remove location"
                              ></button>
                            </span>
                          ))}
                        </div>
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
              <div className="card mb-4 shadow-sm border-0 rounded-3">
                <div className="card-header bg-white py-3 border-bottom">
                  <h4 className="mb-0 fs-5 text-dark fw-semibold">6. Job Openings</h4>
                </div>
                <div className="card-body p-4">
                  <div className="row g-3">
                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">
                          Number of Openings <span className="text-danger">*</span>
                        </label>
                        <input
                          type="number"
                          className={`form-control ${errors.openings ? "is-invalid" : ""}`}
                          min="1"
                          max="1000"
                          value={openings}
                          onChange={(e) => {
                            setOpenings(e.target.value);
                            if (errors.openings) setErrors((prev) => ({ ...prev, openings: "" }));
                          }}
                        />
                        {errors.openings && <small className="text-danger d-block mt-1">{errors.openings}</small>}
                      </div>
                    </div>

                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium">Application Deadline</label>
                        <input
                          type="date"
                          className={`form-control ${errors.applicationDeadline ? "is-invalid" : ""}`}
                          min={todayStr}
                          value={applicationDeadline}
                          onChange={(e) => {
                            setApplicationDeadline(e.target.value);
                            if (errors.applicationDeadline) setErrors((prev) => ({ ...prev, applicationDeadline: "" }));
                          }}
                        />
                        {errors.applicationDeadline && (
                          <small className="text-danger d-block mt-1">{errors.applicationDeadline}</small>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 7. Company Information */}
              <div className="card mb-4 shadow-sm border-0 rounded-3">
                <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                  <h4 className="mb-0 fs-5 text-dark fw-semibold">7. Company Information</h4>
                  <span className="badge bg-light-main text-main border">Auto-Loaded</span>
                </div>
                <div className="card-body p-4">
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
                            className="rounded-circle"
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
                          <h5 className="mb-1 text-dark fw-bold">{employer.companyName}</h5>
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

              {/* Submit Buttons */}
              <div className="row mb-5">
                <div className="col-lg-12 col-md-12 d-flex gap-3">
                  <button
                    type="button"
                    className="btn btn-main px-5 py-3 fs-6 fw-medium"
                    disabled={submitting || savingDraft}
                    onClick={(e) => handleSubmit(e, false)}
                  >
                    {submitting ? "Publishing..." : editId ? "Publish Updates" : "Publish Job Listing"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-5 py-3 fs-6 fw-medium ms-3"
                    disabled={submitting || savingDraft}
                    onClick={(e) => handleSubmit(e, true)}
                  >
                    {savingDraft ? "Saving..." : "Save as Draft"}
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



export default function EmployerSubmitJobPage() {
  return (
    <Suspense fallback={
      <div className="dashboard-wrap bg-light">
        <div className="dashboard-content d-flex align-items-center justify-content-center" style={{ minHeight: "50vh" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    }>
      <EmployerSubmitJobContent />
    </Suspense>
  );
}
