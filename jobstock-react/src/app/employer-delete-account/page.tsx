"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar8 from "@/components/Navbar8";
import EmployerSidebar from "@/components/employer-dashboard/EmployerSidebar";
import { useAuth } from "@/lib/auth-context";

export default function EmployerDeleteAccountPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "EMPLOYER")) {
      router.push("/");
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== "EMPLOYER") {
    return null;
  }

  // TODO: backend delete-account endpoint not yet built
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
  }

  return (
    <>
      <Navbar8 />

      <div className="dashboard-wrap bg-light">
        <EmployerSidebar active="delete-account" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Employer Delete Profile</h1>
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
                        Delete Account
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
                <h4>Delete Account</h4>
              </div>
              <div className="card-body">
                <div className="alert alert-warning">
                  This feature is not yet connected to the backend. There is currently no delete-account endpoint in the API.
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="row mb-3">
                    <label className="col-xl-12 col-md-12 col-form-label">Enter your password To Delete Account</label>
                    <div className="col-xl-9 col-md-12">
                      <input type="password" className="form-control" placeholder="*******" disabled />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-xl-12 col-md-12">
                      <button type="submit" className="btn btn-danger px-5" disabled>
                        Delete Account (not available yet)
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
