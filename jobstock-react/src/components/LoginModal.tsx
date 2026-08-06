"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function LoginModal() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      const user = await login(email, password);
      const closeBtn = document.querySelector<HTMLElement>('#login .mod-close');
      closeBtn?.click();
      if (user.role === "CANDIDATE") router.push("/candidate-dashboard");
      else if (user.role === "EMPLOYER") router.push("/employer-dashboard");
      else router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed. Please try again.");
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
              <form onSubmit={handleSubmit}>
                {error && <div className="alert alert-danger py-2">{error}</div>}
                <div className="form-floating mb-4">
                  <input
                    type="email"
                    className="form-control"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <label>User Name</label>
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
              <Link href="/signup" className="text-main font--bold ms-1">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

