"use client";

import { Suspense, useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar2 from "@/components/Navbar2";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import Swal from "sweetalert2";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface SearchableSelectProps {
  label: React.ReactNode;
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

  const filteredOptions = options
    .filter(option => option.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 50);

  return (
    <div className="form-group mb-0 position-relative" ref={containerRef}>
      <label className="fw-medium fs-6 text-dark d-flex justify-content-between">
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
          userSelect: "none",
          height: "auto",
          minHeight: "50px",
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
                height: "36px",
                minHeight: "36px",
                padding: "4px 8px",
                fontSize: "13px"
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

function SignupForm() {
  const { register, googleLogin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams?.get("ref") || undefined;

  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<"CANDIDATE" | "EMPLOYER">("CANDIDATE");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [referralCode, setReferralCode] = useState(refCode || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  // OTP Verification state
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Countries fetching logic
  const [countries, setCountries] = useState<string[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [countriesError, setCountriesError] = useState<string | null>(null);

  const fetchLocations = async () => {
    setCountriesLoading(true);
    setCountriesError(null);
    try {
      const response = await fetch("https://countriesnow.space/api/v0.1/countries");
      if (!response.ok) {
        throw new Error("Failed to fetch locations");
      }
      const json = await response.json();
      if (json.error) {
        throw new Error(json.msg || "Failed to load locations");
      }
      
      const allLocations: string[] = [];
      json.data.forEach((item: any) => {
        // Add just the country
        allLocations.push(item.country);
        // Add city, country
        if (item.cities && Array.isArray(item.cities)) {
          item.cities.forEach((city: string) => {
            allLocations.push(`${city}, ${item.country}`);
          });
        }
      });
      
      setCountries(allLocations);
    } catch (err: any) {
      setCountriesError(err.message || "Failed to load locations");
    } finally {
      setCountriesLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleSendOtp = async () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      setErrors({ ...errors, email: "Please enter a valid email address first." });
      return;
    }
    setOtpLoading(true);
    setOtpError(null);
    try {
      await api.post("/auth/signup-otp/send", { email }, { auth: false });
      setOtpSent(true);
    } catch (err: any) {
      setOtpError(err.message || "Failed to send OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      setOtpError("Please enter the 6-digit OTP.");
      return;
    }
    setOtpLoading(true);
    setOtpError(null);
    try {
      await api.post("/auth/signup-otp/verify", { email, otp }, { auth: false });
      setIsEmailVerified(true);
      setOtpSent(false); // Hide OTP field after successful verification
    } catch (err: any) {
      setOtpError(err.message || "Invalid OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Guard against a second click/Enter landing before the `submitting` state
    // re-render has actually disabled the button (a real race, not just theoretical —
    // two near-simultaneous clicks can both fire in the same tick).
    if (submittingRef.current) return;

    const newErrors: Record<string, string> = {};

    if (/\d/.test(fullName)) {
      newErrors.fullName = "Full name cannot contain numbers.";
    }

    const invalidEmailChars = /[!#$%^&*]/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (invalidEmailChars.test(email) || !emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address (should not contain special characters like !, #, $, %, ^, &, *).";
    }

    if (role === "EMPLOYER" && !location) {
      newErrors.location = "Location is required for employers.";
    }

    if (!isEmailVerified) {
      newErrors.email = "Please verify your email address before registering.";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (!agreeTerms) {
      newErrors.agreeTerms = "You must agree to the Terms and Conditions to register.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    submittingRef.current = true;
    setErrors({});
    setSubmitting(true);
    try {
      const user = await register({
        fullName,
        email,
        password,
        role,
        location: role === "EMPLOYER" ? location : undefined,
        referralCode: referralCode.trim() || undefined,
      });
      router.push(user.role === "CANDIDATE" ? "/candidate-dashboard" : "/employer-dashboard");
    } catch (err) {
      let msg = "Registration failed. Please try again.";
      if (err instanceof ApiError) {
        msg = Array.isArray(err.body && (err.body as { message?: string[] }).message)
          ? (err.body as { message: string[] }).message.join(", ")
          : err.message || msg;
      }
      const lowerMsg = msg.toLowerCase();
      if (lowerMsg.includes("email")) {
        setErrors({ email: msg });
      } else if (lowerMsg.includes("password")) {
        setErrors({ password: msg });
      } else if (lowerMsg.includes("name")) {
        setErrors({ fullName: msg });
      } else {
        Swal.fire({
          title: "Registration Failed",
          text: msg,
          icon: "error",
          confirmButtonColor: "#0b8260",
        }).then((result) => {
          if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already exists")) {
            const loginBtn = document.querySelector<HTMLElement>('[data-bs-target="#login"]');
            if (loginBtn) {
              loginBtn.click();
            }
          }
        });
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const handleGoogleSuccess = async (credential: string) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setErrors({});
    setSubmitting(true);
    try {
      const user = await googleLogin(credential, role);
      router.push(user.role === "CANDIDATE" ? "/candidate-dashboard" : "/employer-dashboard");
    } catch (err) {
      let msg = "Google authentication failed. Please try again.";
      if (err instanceof ApiError) {
        msg = Array.isArray(err.body && (err.body as { message?: string[] }).message)
          ? (err.body as { message: string[] }).message.join(", ")
          : err.message || msg;
      }
      
      Swal.fire({
        title: "Registration Failed",
        text: msg,
        icon: "error",
        confirmButtonColor: "#0b8260",
      }).then((result) => {
        if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already exists")) {
          // Open the login modal
          const loginBtn = document.querySelector<HTMLElement>('[data-bs-target="#login"]');
          if (loginBtn) {
            loginBtn.click();
          }
        }
      });
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    Swal.fire({
      title: "Authentication Error",
      text: "Google authentication was cancelled or failed.",
      icon: "error",
      confirmButtonColor: "#0b8260",
    });
  };

  return (
    <>
      <Navbar2 />

      {/* Login Form Start */}
      <section className="gray-simple ">
        <div className="container">
          <div className="row justify-content-center">
            {/* Single blog Grid */}
            <div className="col-xl-7 col-lg-8 col-md-12">
              <div className="card rounded-4">
                <div className="card-body p-4">
                  <form className="p-md-4" onSubmit={handleSubmit}>
                    <div className="form-heads d-block mb-4">
                      <div className="d-flex align-items-center justify-content-start gap-3">
                        <div className="head-caps">
                          <h4>Create your JobStock profile</h4>
                          <p>Search & apply to jobs from India&apos;s No.1 Job Site</p>
                        </div>
                      </div>
                    </div>

                    <div className="form-group mb-4">
                      <label className="fw-medium fs-6 text-dark mb-2">
                        Work status<i className="text-danger text-md">*</i>
                      </label>
                      <div className="row g-4">
                        <div className="col-sm-6">
                          <div className="sing-btn-groups">
                            <input
                              type="radio"
                              className="btn-check"
                              name="lokingfor"
                              id="findjob"
                              checked={role === "CANDIDATE"}
                              onChange={() => {
                                setRole("CANDIDATE");
                                setFullName("");
                                setLocation("");
                                setErrors({});
                              }}
                            />
                            <label className="btn btn-md btn-outline-gray h-auto w-100" htmlFor="findjob">
                              <div className="d-flex align-items-center gap-3">
                                <div className="icons">
                                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path opacity="0.3" d="M20 15H4C2.9 15 2 14.1 2 13V7C2 6.4 2.4 6 3 6H21C21.6 6 22 6.4 22 7V13C22 14.1 21.1 15 20 15ZM13 12H11C10.5 12 10 12.4 10 13V16C10 16.5 10.4 17 11 17H13C13.6 17 14 16.6 14 16V13C14 12.4 13.6 12 13 12Z" fill="#0b8260"/>
                                    <path d="M14 6V5H10V6H8V5C8 3.9 8.9 3 10 3H14C15.1 3 16 3.9 16 5V6H14ZM20 15H14V16C14 16.6 13.5 17 13 17H11C10.5 17 10 16.6 10 16V15H4C3.6 15 3.3 14.9 3 14.7V18C3 19.1 3.9 20 5 20H19C20.1 20 21 19.1 21 18V14.7C20.7 14.9 20.4 15 20 15Z" fill="#0b8260"/>
                                  </svg>
                                </div>
                                <div className="btn-caps text-start">
                                  <h6 className="mb-0 lh-base">I&apos;m looking for a job</h6>
                                  <p className="m-0 text-md text-muted">Looking for a great opportunity</p>
                                </div>
                              </div>
                            </label>
                          </div>
                        </div>

                        <div className="col-sm-6">
                          <div className="sing-btn-groups">
                            <input
                              type="radio"
                              className="btn-check"
                              name="lokingfor"
                              id="findtalent"
                              checked={role === "EMPLOYER"}
                              onChange={() => {
                                setRole("EMPLOYER");
                                setFullName("");
                                setLocation("");
                                setErrors({});
                              }}
                            />
                            <label className="btn btn-md btn-outline-gray h-auto w-100" htmlFor="findtalent">
                              <div className="d-flex align-items-center gap-3">
                                <div className="icons">
                                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path opacity="0.3" d="M22 12C22 17.5 17.5 22 12 22C6.5 22 2 17.5 2 12C2 6.5 6.5 2 12 2C17.5 2 22 6.5 22 12ZM12 7C10.3 7 9 8.3 9 10C9 11.7 10.3 13 12 13C13.7 13 15 11.7 15 10C15 8.3 13.7 7 12 7Z" fill="#0b8260"/>
                                    <path d="M12 22C14.6 22 17 21 18.7 19.4C17.9 16.9 15.2 15 12 15C8.8 15 6.09999 16.9 5.29999 19.4C6.99999 21 9.4 22 12 22Z" fill="#0b8260"/>
                                  </svg>
                                </div>
                                <div className="btn-caps text-start">
                                  <h6 className="mb-0 lh-base">I&apos;m hiring talent</h6>
                                  <p className="m-0 text-md text-muted">Post jobs and find candidates</p>
                                </div>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <GoogleAuthButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} text="signup_with" />

                    <div className="d-flex align-items-center justify-content-center mb-4">
                      <hr className="flex-grow-1 bg-light" />
                      <span className="mx-3 text-muted small">OR</span>
                      <hr className="flex-grow-1 bg-light" />
                    </div>

                    <div className="form-float d-flex flex-column gap-4">



                      <div className="form-group mb-0">
                        <label className="fw-medium fs-6 text-dark">
                          {role === "CANDIDATE" ? "Full Name" : "Company Name"}
                          <i className="text-danger text-md">*</i>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder={role === "CANDIDATE" ? "What is your name?" : "Enter your company name"}
                          value={fullName}
                          onChange={(e) => {
                            setFullName(e.target.value);
                            if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: "" }));
                          }}
                          required
                        />
                        {errors.fullName && (
                          <div className="text-danger text-sm mt-1">{errors.fullName}</div>
                        )}
                      </div>

                      {role === "EMPLOYER" && (
                        <div>
                          <SearchableSelect
                            label={
                              <>
                                Location<i className="text-danger text-md">*</i>
                              </>
                            }
                            value={location}
                            onChange={(val) => {
                              setLocation(val);
                              if (errors.location) setErrors((prev) => ({ ...prev, location: "" }));
                            }}
                            options={countries}
                            placeholder="Select location"
                            loading={countriesLoading}
                            errorMsg={countriesError}
                            onRetry={fetchLocations}
                            searchPlaceholder="Search city or country..."
                          />
                          {errors.location && (
                            <div className="text-danger text-sm mt-1">{errors.location}</div>
                          )}
                        </div>
                      )}

                      <div className="form-group mb-0">
                        <label className="fw-medium fs-6 text-dark d-flex justify-content-between">
                          <span>Email ID<i className="text-danger text-md">*</i></span>
                          {isEmailVerified && (
                            <span className="text-success small fw-bold">
                              <i className="fa-solid fa-circle-check me-1"></i>Verified successfully
                            </span>
                          )}
                        </label>
                        <div className="input-group" style={{ display: 'flex', flexWrap: 'nowrap' }}>
                          <input
                            type="email"
                            className="form-control"
                            style={{ flex: '1 1 auto', borderTopRightRadius: isEmailVerified ? '6px' : '0', borderBottomRightRadius: isEmailVerified ? '6px' : '0' }}
                            placeholder={role === "CANDIDATE" ? "Tell us your Email ID" : "Company Email ID"}
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              setIsEmailVerified(false);
                              setOtpSent(false);
                              if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                            }}
                            disabled={isEmailVerified || otpLoading}
                            required
                          />
                          {!isEmailVerified && (
                            <button
                              type="button"
                              className="btn btn-primary px-3"
                              style={{ flex: '0 0 auto', borderTopLeftRadius: '0', borderBottomLeftRadius: '0' }}
                              onClick={handleSendOtp}
                              disabled={otpLoading || !email}
                            >
                              {otpLoading && !otpSent ? (
                                <span className="spinner-border spinner-border-sm me-2"></span>
                              ) : null}
                              {otpSent ? "Resend OTP" : "Send OTP"}
                            </button>
                          )}
                        </div>
                        {!isEmailVerified && <span className="text-sm opacity-75 d-block mt-1">We&apos;ll send relevant {role === "CANDIDATE" ? "jobs" : "updates"} to this email</span>}
                        {errors.email && (
                          <div className="text-danger text-sm mt-1">{errors.email}</div>
                        )}
                        {otpError && !otpSent && (
                          <div className="text-danger text-sm mt-1">{otpError}</div>
                        )}
                      </div>

                      {otpSent && !isEmailVerified && (
                        <div className="form-group mb-0">
                          <label className="fw-medium fs-6 text-dark">
                            Enter OTP<i className="text-danger text-md">*</i>
                          </label>
                          <div className="input-group" style={{ display: 'flex', flexWrap: 'nowrap' }}>
                            <input
                              type="text"
                              maxLength={6}
                              className="form-control"
                              style={{ flex: '1 1 auto', borderTopRightRadius: '0', borderBottomRightRadius: '0' }}
                              placeholder="Enter 6-digit OTP"
                              value={otp}
                              onChange={(e) => {
                                setOtp(e.target.value.replace(/\D/g, ''));
                                setOtpError(null);
                              }}
                              disabled={otpLoading}
                            />
                            <button
                              type="button"
                              className="btn btn-success px-4"
                              style={{ flex: '0 0 auto', borderTopLeftRadius: '0', borderBottomLeftRadius: '0' }}
                              onClick={handleVerifyOtp}
                              disabled={otpLoading || otp.length < 6}
                            >
                              {otpLoading && otpSent ? (
                                <span className="spinner-border spinner-border-sm"></span>
                              ) : (
                                "Verify"
                              )}
                            </button>
                          </div>
                          {otpError && (
                            <div className="text-danger text-sm mt-1">{otpError}</div>
                          )}
                          {!otpError && (
                            <span className="text-sm text-success mt-1 d-block">OTP sent to {email}</span>
                          )}
                        </div>
                      )}

                      <div className="form-group mb-0">
                        <label className="fw-medium fs-6 text-dark">
                          Password<i className="text-danger text-md">*</i>
                        </label>
                        <div className="position-relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            className="form-control"
                            placeholder="(Minimum 8 characters, 1 uppercase, 1 number)"
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                            }}
                            required
                            minLength={8}
                          />
                          <span
                            onClick={() => setShowPassword(!showPassword)}
                            className="position-absolute top-50 translate-middle-y"
                            style={{ right: "15px", cursor: "pointer", zIndex: 10 }}
                          >
                            <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} text-muted`}></i>
                          </span>
                        </div>
                        <span className="text-sm opacity-75 d-block">This helps your account stay protected</span>
                        {errors.password && (
                          <div className="text-danger text-sm mt-1">{errors.password}</div>
                        )}
                      </div>

                      <div className="form-group mb-0">
                        <label className="fw-medium fs-6 text-dark">
                          Confirm Password<i className="text-danger text-md">*</i>
                        </label>
                        <div className="position-relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            className="form-control"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => {
                              setConfirmPassword(e.target.value);
                              if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                            }}
                            required
                          />
                          <span
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="position-absolute top-50 translate-middle-y"
                            style={{ right: "15px", cursor: "pointer", zIndex: 10 }}
                          >
                            <i className={`fa-solid ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"} text-muted`}></i>
                          </span>
                        </div>
                        {errors.confirmPassword && (
                          <div className="text-danger text-sm mt-1">{errors.confirmPassword}</div>
                        )}
                      </div>

                      {role === "CANDIDATE" && (
                        <div className="form-group mb-0">
                          <label className="fw-medium fs-6 text-dark">
                            Referral Code <span className="text-muted text-sm fw-normal">(Optional)</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Have a referral code? Enter it here"
                            value={referralCode}
                            onChange={(e) => setReferralCode(e.target.value)}
                          />
                          <span className="text-sm opacity-75 d-block">Enter a friend&apos;s referral code to give them 100 bonus points</span>
                        </div>
                      )}

                      <div className="form-group mb-0">
                        <div className="form-check mb-3">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="agreeTerms"
                            checked={agreeTerms}
                            onChange={(e) => {
                              setAgreeTerms(e.target.checked);
                              if (errors.agreeTerms) setErrors((prev) => ({ ...prev, agreeTerms: "" }));
                            }}
                            required
                          />
                          <label className="form-check-label text-muted text-md ms-1" htmlFor="agreeTerms">
                            I agree to the{" "}
                            <a href="/terms" className="text-main">
                              Terms and Conditions
                            </a>{" "}
                            &amp;{" "}
                            <a href="/privacy" className="text-main">
                              Privacy Policy
                            </a>{" "}
                            of Jobstock.com
                          </label>
                          {errors.agreeTerms && (
                            <div className="text-danger text-sm mt-1">{errors.agreeTerms}</div>
                          )}
                        </div>
                        <button type="submit" className="btn btn-main full-width" disabled={submitting}>
                          {submitting ? "Registering..." : "Register now"}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Login Form End */}

      {/* Call To Action */}
      <section className="bg-cover bg-main" style={{ background: "url(/assets/img/footer-bg-dark.png)no-repeat" }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xl-7 col-lg-10 col-md-12 col-sm-12">
              <div className="call-action-wrap">
                <div className="sec-heading center">
                  <h2 className="lh-base mb-3 text-light">
                    Find The Perfect Job
                    <br />
                    on JobStock That is Superb For You
                  </h2>
                  <p className="fs-6 text-light">
                    Join thousands of job seekers and employers who trust JobStock to find the right fit, faster.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LoginModal />
      <Footer />
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
