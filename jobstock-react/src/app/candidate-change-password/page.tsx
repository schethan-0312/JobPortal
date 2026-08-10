"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar5 from "@/components/Navbar5";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
import UploadResumeModal from "@/components/candidate-dashboard/UploadResumeModal";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

export default function CandidateChangePasswordPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "CANDIDATE")) {
      router.push("/");
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== "CANDIDATE") {
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
      <Navbar5 />

      <div className="dashboard-wrap bg-light">
        <CandidateSidebar active="change-password" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Change Password</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Candidate</a></li>
                    <li className="breadcrumb-item text-muted"><a href="#">Dashboard</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Change Password</a></li>
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
                      <div className="position-relative">
                        <input
                          type={showCurrent ? "text" : "password"}
                          className="form-control"
                          placeholder="*******"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                        />
                        <span 
                          className="position-absolute top-50 translate-middle-y" 
                          style={{ right: '15px', cursor: 'pointer', zIndex: 10 }}
                          onClick={() => setShowCurrent(!showCurrent)}
                        >
                          <i className={`fa-solid ${showCurrent ? "fa-eye-slash" : "fa-eye"} text-muted`}></i>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-xl-2 col-md-12 col-form-label">New Password</label>
                    <div className="col-xl-7 col-md-12">
                      <div className="position-relative">
                        <input
                          type={showNew ? "text" : "password"}
                          className="form-control"
                          placeholder="*******"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={8}
                        />
                        <span 
                          className="position-absolute top-50 translate-middle-y" 
                          style={{ right: '15px', cursor: 'pointer', zIndex: 10 }}
                          onClick={() => setShowNew(!showNew)}
                        >
                          <i className={`fa-solid ${showNew ? "fa-eye-slash" : "fa-eye"} text-muted`}></i>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-xl-2 col-md-12 col-form-label">Confirm Password</label>
                    <div className="col-xl-7 col-md-12">
                      <div className="position-relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          className="form-control"
                          placeholder="*******"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                        <span 
                          className="position-absolute top-50 translate-middle-y" 
                          style={{ right: '15px', cursor: 'pointer', zIndex: 10 }}
                          onClick={() => setShowConfirm(!showConfirm)}
                        >
                          <i className={`fa-solid ${showConfirm ? "fa-eye-slash" : "fa-eye"} text-muted`}></i>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-xl-12 col-md-12">
                      <button type="submit" className="btn btn-main" disabled={status === "submitting"}>
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

      <UploadResumeModal />
    </>
  );
}
