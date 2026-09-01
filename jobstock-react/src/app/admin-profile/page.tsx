"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl } from "@/lib/api";
import Swal from "sweetalert2";

export default function AdminProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [photoLoading, setPhotoLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    setPasswordError(null);
    setPasswordLoading(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      Swal.fire({
        title: "Success",
        text: "Password updated successfully!",
        icon: "success",
        confirmButtonColor: "#0b8260",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/uploads/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jobstock_token")}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await res.json();

      await api.patch("/auth/me/photo", { avatarUrl: data.url });
      
      Swal.fire({
        title: "Success",
        text: "Profile photo updated!",
        icon: "success",
        confirmButtonColor: "#0b8260",
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        window.location.reload();
      });
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: "Failed to upload photo",
        icon: "error",
      });
    } finally {
      setPhotoLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  if (loading || !user || user.role !== "ADMIN") return null;

  return (
    <>
      <AdminNavbar />
      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="profile" />
        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-12">
                <h1 className="mb-1 fs-3 fw-medium">My Profile</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Profile</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            <div className="row">
              <div className="col-xl-4 col-lg-5 col-md-12">
                <div className="card border-0 mb-4 shadow-sm">
                  <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
                    <h5 className="mb-0">Profile Photo</h5>
                  </div>
                  <div className="card-body text-center pt-4">
                    <div className="position-relative d-inline-block mb-3">
                      <div 
                        className="rounded-circle overflow-hidden bg-light d-flex align-items-center justify-content-center border"
                        style={{ width: "120px", height: "120px" }}
                      >
                        {user.profilePhotoUrl ? (
                          <img src={assetUrl(user.profilePhotoUrl)} alt="Profile" className="w-100 h-100 object-fit-cover" />
                        ) : (
                          <i className="fa-solid fa-user-shield text-muted" style={{ fontSize: "3rem" }}></i>
                        )}
                      </div>
                      <button 
                        className="btn btn-sm btn-primary position-absolute bottom-0 end-0 rounded-circle shadow"
                        style={{ width: "36px", height: "36px", padding: 0 }}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={photoLoading}
                      >
                        <i className="fa-solid fa-camera"></i>
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="d-none" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                      />
                    </div>
                    <h6 className="mb-1">{user.email}</h6>
                    <p className="text-muted small mb-0">Administrator</p>
                    {photoLoading && <div className="text-success small mt-2">Uploading...</div>}
                  </div>
                </div>
              </div>

              <div className="col-xl-8 col-lg-7 col-md-12">
                <div className="card border-0 mb-4 shadow-sm">
                  <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
                    <h5 className="mb-0">Change Password</h5>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handlePasswordSubmit}>
                      {passwordError && (
                        <div className="alert alert-danger py-2">{passwordError}</div>
                      )}
                      
                      <div className="mb-3">
                        <label className="form-label">Current Password</label>
                        <input 
                          type="password" 
                          className="form-control" 
                          value={currentPassword}
                          onChange={e => setCurrentPassword(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label">New Password</label>
                        <input 
                          type="password" 
                          className="form-control" 
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="form-label">Confirm New Password</label>
                        <input 
                          type="password" 
                          className="form-control" 
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                      
                      <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
                        {passwordLoading ? "Updating..." : "Update Password"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
