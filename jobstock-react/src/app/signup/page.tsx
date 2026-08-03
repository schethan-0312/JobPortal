"use client";

import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar2 from "@/components/Navbar2";
import Footer2 from "@/components/Footer2";
import LoginModal from "@/components/LoginModal";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageInner />
    </Suspense>
  );
}

function SignupPageInner() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<"CANDIDATE" | "EMPLOYER">(
    searchParams.get("role") === "EMPLOYER" ? "EMPLOYER" : "CANDIDATE",
  );
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{fullName?: string, email?: string, confirmPassword?: string}>({});
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Guard against a second click/Enter landing before the `submitting` state
    // re-render has actually disabled the button (a real race, not just theoretical —
    // two near-simultaneous clicks can both fire in the same tick).
    if (submittingRef.current) return;
    
    setFieldErrors({});
    const errors: {fullName?: string, email?: string, confirmPassword?: string} = {};
    
    const nameRegex = /^[A-Za-z\s\-']+$/;
    if (!nameRegex.test(fullName)) {
      errors.fullName = "Full Name can only contain alphabets, spaces, hyphens and apostrophes.";
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    submittingRef.current = true;
    setError(null);
    setSubmitting(true);
    try {
      const user = await register({ fullName, email, password, role });
      router.push(user.role === "CANDIDATE" ? "/candidate-dashboard" : "/employer-dashboard");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? Array.isArray(err.body && (err.body as { message?: string[] }).message)
            ? (err.body as { message: string[] }).message.join(", ")
            : err.message
          : "Registration failed. Please try again.",
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

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

                    <div className="form-float d-flex flex-column gap-4">
                      {error && <div className="alert alert-danger py-2">{error}</div>}

                      <div className="form-group mb-0">
                        <label className="fw-medium fs-6 text-dark">Full Name</label>
                        <input
                          type="text"
                          className={`form-control ${fieldErrors.fullName ? 'is-invalid' : ''}`}
                          placeholder="What is your name?"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                        {fieldErrors.fullName && <div className="text-danger small mt-1">{fieldErrors.fullName}</div>}
                      </div>

                      <div className="form-group mb-0">
                        <label className="fw-medium fs-6 text-dark">
                          Email ID<i className="text-danger text-md">*</i>
                        </label>
                        <input
                          type="email"
                          className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                          placeholder="Tell us your Email ID"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                        {fieldErrors.email && <div className="text-danger small mt-1">{fieldErrors.email}</div>}
                        {!fieldErrors.email && <span className="text-sm opacity-75">We&apos;ll send relevant jobs and updates to this email</span>}
                      </div>

                      <div className="form-group mb-0">
                        <label className="fw-medium fs-6 text-dark">
                          Password<i className="text-danger text-md">*</i>
                        </label>
                        <div className="position-relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            className="form-control pe-5"
                            placeholder="(Minimum 8 characters, 1 uppercase, 1 number)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                          />
                          <span 
                            className="position-absolute top-50 end-0 translate-middle-y pe-3 cursor-pointer text-muted"
                            style={{ cursor: "pointer" }}
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            )}
                          </span>
                        </div>
                        <span className="text-sm opacity-75">This helps your account stay protected</span>
                      </div>

                      <div className="form-group mb-0">
                        <label className="fw-medium fs-6 text-dark">
                          Confirm Password<i className="text-danger text-md">*</i>
                        </label>
                        <div className="position-relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            className={`form-control pe-5 ${fieldErrors.confirmPassword ? 'is-invalid' : ''}`}
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={8}
                          />
                          <span 
                            className="position-absolute top-50 end-0 translate-middle-y pe-3 cursor-pointer text-muted"
                            style={{ cursor: "pointer" }}
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            )}
                          </span>
                        </div>
                        {fieldErrors.confirmPassword && <div className="text-danger small mt-1">{fieldErrors.confirmPassword}</div>}
                      </div>

                      <div className="form-group mb-0">
                        <label className="fw-medium fs-6 text-dark">
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
                                onChange={() => setRole("CANDIDATE")}
                              />
                              <label className="btn btn-md btn-outline-gray h-auto" htmlFor="findjob">
                                <div className="d-flex align-items-center gap-3">
                                  <div className="icons">
                                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path
                                        opacity="0.3"
                                        d="M20 15H4C2.9 15 2 14.1 2 13V7C2 6.4 2.4 6 3 6H21C21.6 6 22 6.4 22 7V13C22 14.1 21.1 15 20 15ZM13 12H11C10.5 12 10 12.4 10 13V16C10 16.5 10.4 17 11 17H13C13.6 17 14 16.6 14 16V13C14 12.4 13.6 12 13 12Z"
                                        fill="#0b8260"
                                      />
                                      <path
                                        d="M14 6V5H10V6H8V5C8 3.9 8.9 3 10 3H14C15.1 3 16 3.9 16 5V6H14ZM20 15H14V16C14 16.6 13.5 17 13 17H11C10.5 17 10 16.6 10 16V15H4C3.6 15 3.3 14.9 3 14.7V18C3 19.1 3.9 20 5 20H19C20.1 20 21 19.1 21 18V14.7C20.7 14.9 20.4 15 20 15Z"
                                        fill="#0b8260"
                                      />
                                    </svg>
                                  </div>
                                  <div className="btn-caps text-start">
                                    <h6 className="mb-0 lh-base">I&apos;am looking job</h6>
                                    <p className="m-0 text-md text-muted">Looking great opportunity for my career</p>
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
                                onChange={() => setRole("EMPLOYER")}
                              />
                              <label className="btn btn-md btn-outline-gray h-auto" htmlFor="findtalent">
                                <div className="d-flex align-items-center gap-3">
                                  <div className="icons">
                                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path
                                        opacity="0.3"
                                        d="M22 12C22 17.5 17.5 22 12 22C6.5 22 2 17.5 2 12C2 6.5 6.5 2 12 2C17.5 2 22 6.5 22 12ZM12 7C10.3 7 9 8.3 9 10C9 11.7 10.3 13 12 13C13.7 13 15 11.7 15 10C15 8.3 13.7 7 12 7Z"
                                        fill="#0b8260"
                                      />
                                      <path
                                        d="M12 22C14.6 22 17 21 18.7 19.4C17.9 16.9 15.2 15 12 15C8.8 15 6.09999 16.9 5.29999 19.4C6.99999 21 9.4 22 12 22Z"
                                        fill="#0b8260"
                                      />
                                    </svg>
                                  </div>
                                  <div className="btn-caps text-start">
                                    <h6 className="mb-0 lh-base">I&apos;am hiring talent</h6>
                                    <p className="m-0 text-md text-muted">Post jobs and find great candidates</p>
                                  </div>
                                </div>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="form-group mb-0">
                        <p className="confirmTex">
                          By clicking Register, you agree to the
                          <a href="/privacy" className="text-main">
                            {" "}
                            Terms and Conditions{" "}
                          </a>
                          &amp;
                          <a href="/privacy" className="text-main">
                            {" "}
                            Privacy Policy{" "}
                          </a>
                          of Jobstock.com
                        </p>
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
      <Footer2 />
    </>
  );
}
