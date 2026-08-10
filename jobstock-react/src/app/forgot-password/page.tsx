"use client";

import { useState, useEffect } from "react";
import PublicNavbar from "@/components/PublicNavbar";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import { api, ApiError } from "@/lib/api";
import Link from "next/link";

type Step = "EMAIL" | "OTP" | "RESET";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("EMAIL");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  // Handle countdown for Resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  // Step 1: Submit Email to get OTP
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setError(null);
    setSubmitting(true);
    setSuccessMessage(null);

    try {
      await api.post("/auth/forgot-password", { email });
      setSuccessMessage("OTP has been sent to your email.");
      setStep("OTP");
      setResendTimer(60); // 60s cooldown
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send OTP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Step 1.5: Resend OTP
  async function handleResendOtp() {
    if (resendTimer > 0 || !email.trim()) return;

    setError(null);
    setSubmitting(true);
    setSuccessMessage(null);

    try {
      await api.post("/auth/forgot-password", { email });
      setSuccessMessage("A new OTP has been sent to your email.");
      setResendTimer(60);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to resend OTP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Step 2: Verify OTP to get Reset Token
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) {
      setError("OTP must be exactly 6 digits.");
      return;
    }

    setError(null);
    setSubmitting(true);
    setSuccessMessage(null);

    try {
      const response = await api.post<{ token: string }>("/auth/verify-otp", { email, otp });
      setResetToken(response.token);
      setSuccessMessage("OTP verified successfully. Please enter your new password.");
      setStep("RESET");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid or expired OTP.");
    } finally {
      setSubmitting(false);
    }
  }

  // Step 3: Reset Password using Reset Token
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError(null);
    setSubmitting(true);
    setSuccessMessage(null);

    try {
      await api.post("/auth/reset-password", { token: resetToken, newPassword: password });
      setStep("EMAIL"); // Reset wizard
      setEmail("");
      setOtp("");
      setPassword("");
      setConfirmPassword("");
      setResetToken("");
      // Set overall success
      setSuccessMessage("Password reset successfully! You can now log in.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reset failed. The token may have expired.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PublicNavbar />
      <section className="gray-simple py-5 min-vh-100 d-flex align-items-center">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xl-5 col-lg-6 col-md-8 col-sm-12">
              <div className="card shadow-sm border-0">
                <div className="card-body p-5">
                  <div className="text-center mb-4">
                    <h2 className="m-0 fw-bold">Forgot Password</h2>
                    <p className="text-muted mt-2">
                      {step === "EMAIL" && "Enter your registered email address to receive a 6-digit OTP."}
                      {step === "OTP" && `We've sent a 6-digit verification code to ${email}.`}
                      {step === "RESET" && "Create a new strong password for your account."}
                    </p>
                  </div>

                  {error && (
                    <div className="alert alert-danger py-2 mb-4 d-flex align-items-center">
                      <i className="fa-solid fa-circle-exclamation me-2"></i>
                      <span>{error}</span>
                    </div>
                  )}

                  {successMessage && !error && (
                    <div className="alert alert-success py-2 mb-4 d-flex align-items-center">
                      <i className="fa-solid fa-circle-check me-2"></i>
                      <span>{successMessage}</span>
                    </div>
                  )}

                  {/* STEP 1: Enter Email */}
                  {step === "EMAIL" && (
                    <form onSubmit={handleSendOtp}>
                      <div className="form-floating mb-4">
                        <input
                          type="email"
                          className="form-control"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={submitting}
                        />
                        <label>Email Address</label>
                      </div>

                      <div className="form-group">
                        <button
                          type="submit"
                          className="btn btn-main full-width font--bold btn-lg"
                          disabled={submitting || !email.trim()}
                        >
                          {submitting ? "Sending OTP..." : "Send OTP"}
                        </button>
                      </div>

                      <div className="text-center mt-4">
                        <Link href="/" className="text-muted text-decoration-underline text-sm">
                          Back to Home
                        </Link>
                      </div>
                    </form>
                  )}

                  {/* STEP 2: Enter OTP */}
                  {step === "OTP" && (
                    <form onSubmit={handleVerifyOtp}>
                      <div className="form-floating mb-4">
                        <input
                          type="text"
                          className="form-control text-center"
                          style={{ letterSpacing: "8px", fontSize: "20px" }}
                          maxLength={6}
                          placeholder="000000"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                          required
                          disabled={submitting}
                        />
                        <label>6-Digit OTP</label>
                      </div>

                      <div className="form-group mb-3">
                        <button
                          type="submit"
                          className="btn btn-main full-width font--bold btn-lg"
                          disabled={submitting || otp.length !== 6}
                        >
                          {submitting ? "Verifying..." : "Verify OTP"}
                        </button>
                      </div>

                      <div className="text-center">
                        <button
                          type="button"
                          className="btn btn-link text-main text-decoration-none p-0"
                          onClick={handleResendOtp}
                          disabled={submitting || resendTimer > 0}
                        >
                          {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
                        </button>
                      </div>

                      <div className="text-center mt-4">
                        <button
                          type="button"
                          className="btn btn-link text-muted text-decoration-underline p-0 text-sm"
                          onClick={() => {
                            setStep("EMAIL");
                            setError(null);
                            setSuccessMessage(null);
                          }}
                        >
                          Change Email Address
                        </button>
                      </div>
                    </form>
                  )}

                  {/* STEP 3: Reset Password */}
                  {step === "RESET" && (
                    <form onSubmit={handleResetPassword}>
                      <div className="position-relative mb-4">
                        <div className="form-floating">
                          <input
                            type={showPassword ? "text" : "password"}
                            className="form-control pe-5"
                            placeholder="New Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={submitting}
                          />
                          <label>New Password</label>
                        </div>
                        <button
                          type="button"
                          className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted me-3 p-0 border-0"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ zIndex: 10, textDecoration: "none", boxShadow: "none" }}
                        >
                          <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                        </button>
                      </div>

                      <div className="position-relative mb-4">
                        <div className="form-floating">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            className="form-control pe-5"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={submitting}
                          />
                          <label>Confirm Password</label>
                        </div>
                        <button
                          type="button"
                          className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted me-3 p-0 border-0"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={{ zIndex: 10, textDecoration: "none", boxShadow: "none" }}
                        >
                          <i className={`fa-solid ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                        </button>
                      </div>

                      <div className="form-group mb-3">
                        <button
                          type="submit"
                          className="btn btn-main full-width font--bold btn-lg"
                          disabled={submitting}
                        >
                          {submitting ? "Resetting..." : "Reset Password"}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* If password has been reset successfully, show a clear login option */}
                  {successMessage === "Password reset successfully! You can now log in." && step === "EMAIL" && (
                    <div className="mt-4">
                      <button
                        type="button"
                        className="btn btn-outline-main full-width font--bold btn-lg"
                        data-bs-toggle="modal"
                        data-bs-target="#login"
                      >
                        Log In Now
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
      <LoginModal />
    </>
  );
}
