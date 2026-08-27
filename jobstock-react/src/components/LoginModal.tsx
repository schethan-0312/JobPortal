"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import GoogleAuthButton from "./GoogleAuthButton";
import Swal from "sweetalert2";

export default function LoginModal() {
  const { login, googleLogin } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"CANDIDATE" | "EMPLOYER">("CANDIDATE");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(email, password, role);
      const closeBtn = document.querySelector<HTMLElement>('#login .mod-close');
      closeBtn?.click();
      if (user.role === "CANDIDATE") router.push("/candidate-dashboard");
      else if (user.role === "EMPLOYER") router.push("/employer-dashboard");
      else if (user.role === "ADMIN") router.push("/admin-dashboard");
      else router.push("/");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Login failed. Please try again.";
      Swal.fire({
        title: "Login Failed",
        text: msg,
        icon: "error",
        confirmButtonColor: "#0b8260",
      });
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div
      className="modal fade"
      id="login"
      tabIndex={-1}
      role="dialog"
      aria-labelledby="loginmodal"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered login-pop-form" role="document">
        <div className="modal-content" id="loginmodal">
          <span className="mod-close" data-bs-dismiss="modal" aria-hidden="true">
            <i className="fas fa-close"></i>
          </span>
          <div className="modal-header">
            <div className="mdl-thumb">
              <img src="/assets/img/ico.png" className="img-fluid" width={70} alt="" />
            </div>
            <div className="mdl-title">
              <h4 className="modal-header-title">Hello, Again</h4>
            </div>
          </div>
          <div className="modal-body">
            <div className="modal-login-form">
              <div className="form-group mb-3">
                <label className="fw-medium fs-6 text-dark mb-2">
                  Are you looking for a job or hiring?
                </label>
                <div className="d-flex gap-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="modalRole"
                      id="modalCandidate"
                      checked={role === "CANDIDATE"}
                      onChange={() => setRole("CANDIDATE")}
                    />
                    <label className="form-check-label" htmlFor="modalCandidate">
                      Looking for a job
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="modalRole"
                      id="modalEmployer"
                      checked={role === "EMPLOYER"}
                      onChange={() => setRole("EMPLOYER")}
                    />
                    <label className="form-check-label" htmlFor="modalEmployer">
                      Hiring talent
                    </label>
                  </div>
                </div>
              </div>

              <GoogleAuthButton 
                text="signin_with"
                onSuccess={async (credential) => {
                  try {
                    const user = await googleLogin(credential, role, true);
                    const closeBtn = document.querySelector<HTMLElement>('#login .mod-close');
                    closeBtn?.click();
                    if (user.role === "CANDIDATE") router.push("/candidate-dashboard");
                    else if (user.role === "EMPLOYER") router.push("/employer-dashboard");
                    else if (user.role === "ADMIN") router.push("/admin-dashboard");
                    else router.push("/");
                  } catch (err) {
                    const msg = err instanceof ApiError ? err.message : "Google Login failed.";
                    Swal.fire({
                      title: "Login Failed",
                      text: msg,
                      icon: "error",
                      confirmButtonColor: "#0b8260",
                    });
                  }
                }}
                onError={() => {
                  Swal.fire({
                    title: "Authentication Error",
                    text: "Google authentication failed or was cancelled.",
                    icon: "error",
                    confirmButtonColor: "#0b8260",
                  });
                }}
              />
              <div className="d-flex align-items-center justify-content-center mb-4">
                <hr className="flex-grow-1 bg-light" />
                <span className="mx-3 text-muted small">OR</span>
                <hr className="flex-grow-1 bg-light" />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-floating mb-4">
                  <input
                    type="email"
                    className="form-control"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <label>User Email</label>
                </div>

                <div className="form-floating mb-2 position-relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <label>Password</label>
                  <span 
                    onClick={() => setShowPassword(!showPassword)}
                    className="position-absolute top-50 translate-middle-y"
                    style={{ right: '15px', cursor: 'pointer', zIndex: 100 }}
                  >
                    <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} text-muted`}></i>
                  </span>
                </div>
                
                <div className="text-end mb-4">
                  <a 
                    href="/forgot-password" 
                    className="text-sm text-main text-decoration-underline"
                    onClick={(e) => {
                      e.preventDefault();
                      document.querySelector<HTMLElement>('#login .mod-close')?.click();
                      router.push('/forgot-password');
                    }}
                  >
                    Forgot Password?
                  </a>
                </div>

                <div className="form-group">
                  <button type="submit" className="btn btn-main full-width font--bold btn-lg" disabled={submitting}>
                    {submitting ? "Logging in..." : "Log In"}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="modal-footer">
            <p>
              Don&apos;t have an account yet?
              <a
                href="/signup"
                className="text-main font--bold ms-1"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector<HTMLElement>('#login .mod-close')?.click();
                  router.push('/signup');
                }}
              >
                Sign Up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

