"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar7 from "@/components/Navbar7";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { Toaster, toast } from "react-hot-toast";

export default function CandidateDeleteAccountPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && user.role === 'CANDIDATE') {
      const hasShown = sessionStorage.getItem('deleteWarningShown2');
      if (!hasShown) {
        setTimeout(() => {
          toast('Warning: Deleting your account is permanent. All your data will be erased and cannot be recovered.', {
            duration: 5000,
            icon: '⚠️',
            style: { background: '#fff3cd', color: '#856404' }
          });
        }, 500);
        sessionStorage.setItem('deleteWarningShown2', 'true');
      }
    }
  }, [user]);


  useEffect(() => {
    if (!loading && (!user || user.role !== "CANDIDATE")) {
      router.push("/");
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== "CANDIDATE") {
    return null;
  }

  function openConfirmModal(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return toast.error("Password is required to delete account.");
        if (typeof window !== "undefined" && (window as any).bootstrap) {
      const modal = new (window as any).bootstrap.Modal(modalRef.current);
      modal.show();
    }
  }

  async function handleConfirmDelete() {
    setIsDeleting(true);
    try {
      await api.post("/auth/me/delete", { password });
      
      if (typeof window !== "undefined" && (window as any).bootstrap) {
        const modal = (window as any).bootstrap.Modal.getInstance(modalRef.current);
        if (modal) modal.hide();
      }
      
      logout();
      router.push("/");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete account");
      if (typeof window !== "undefined" && (window as any).bootstrap) {
        const modal = (window as any).bootstrap.Modal.getInstance(modalRef.current);
        if (modal) modal.hide();
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Navbar7 />
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
        <CandidateSidebar active="delete-account" />
        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Delete Profile</h1>
              </div>
            </div>
          </div>
          <div className="dashboard-widg-bar d-block">
            <div className="card">
              <div className="card-header">
                <h4>Delete Account</h4>
              </div>
              <div className="card-body">
                                
                <form onSubmit={openConfirmModal}>
                  <div className="row mb-3">
                    <label className="col-xl-12 col-md-12 col-form-label">Enter your password to confirm deletion</label>
                    <div className="col-xl-9 col-md-12 position-relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        className="form-control" 
                        placeholder="*******" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button 
                        type="button" 
                        className="btn position-absolute" 
                        style={{ right: "10px", top: "50%", transform: "translateY(-50%)", border: "none", background: "none" }}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-muted`}></i>
                      </button>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-xl-12 col-md-12">
                      <button type="submit" className="btn btn-danger px-5" disabled={!password}>
                        Delete Account
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" ref={modalRef} tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-danger text-white">
              <h5 className="modal-title">Confirm Deletion</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              Are you absolutely sure you want to delete your account? This action cannot be undone.
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" data-bs-dismiss="modal" disabled={isDeleting}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={handleConfirmDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Yes, Delete My Account"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
