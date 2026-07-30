"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar8 from "@/components/Navbar8";
import EmployerSidebar from "@/components/employer-dashboard/EmployerSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

export default function EmployerChangePasswordPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "EMPLOYER")) {
      router.push("/");
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== "EMPLOYER") {
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword !== confirmPassword) {
      setStatus("error");
      setErrorMsg("New password and confirm password do not match.");
      return;
    }

    setStatus("submitting");
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      setStatus("success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <>
      <Navbar8 />

      <div className="dashboard-wrap bg-light">
        <EmployerSidebar active="change-password" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Employer Update Password</h1>
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
                        Update Password
                      </a>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            <div className="card">
              <div className="card-header">
                <h4>Change Your Password</h4>
              </div>
              <div className="card-body">
                {status === "success" && (
                  <div className="alert alert-success">Your password has been updated.</div>
                )}
                {status === "error" && errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                <form onSubmit={handleSubmit}>
                  <div className="row mb-3">
                    <label className="col-xl-2 col-md-12 col-form-label">Old Password</label>
                    <div className="col-xl-7 col-md-12">
                      <input
                        type="password"
                        className="form-control"
                        placeholder="*******"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-xl-2 col-md-12 col-form-label">New Password</label>
                    <div className="col-xl-7 col-md-12">
                      <input
                        type="password"
                        className="form-control"
                        placeholder="*******"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-xl-2 col-md-12 col-form-label">Confirm Password</label>
                    <div className="col-xl-7 col-md-12">
                      <input
                        type="password"
                        className="form-control"
                        placeholder="*******"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-xl-12 col-md-12">
                      <button type="submit" className="btn btn-main px-5" disabled={status === "submitting"}>
                        {status === "submitting" ? "Updating..." : "Change Password"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
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
