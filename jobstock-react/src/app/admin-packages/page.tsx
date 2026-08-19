"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface PackageItem {
  id: string;
  name: string;
  audience: "CANDIDATE" | "EMPLOYER" | "RESUME";
  priceInPaisa: number;
  featuresJson: string[] | Record<string, unknown> | unknown;
  isActive: boolean;
}

export default function AdminPackagesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [priceInRupees, setPriceInRupees] = useState<string>("");

  const handleDeletePackage = async (id: string, packageName: string) => {
    if (!confirm(`Are you sure you want to delete "${packageName}"?`)) {
      return;
    }
    setDeletingId(id);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.delete(`/packages/${id}`);
      setSuccessMsg(`Package "${packageName}" deleted successfully!`);
      await loadPackages();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete package.");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  const loadPackages = async () => {
    setDataLoading(true);
    setError(null);
    try {
      const data = await api.get<PackageItem[]>("/packages/all");
      setPackages(data);
    } catch (err) {
      try {
        const data = await api.get<PackageItem[]>("/packages");
        setPackages(data);
      } catch (fallbackErr) {
        setError(err instanceof ApiError ? err.message : "Failed to load packages");
      }
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    loadPackages();
  }, [user]);

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validation
    if (!name.trim()) {
      setError("Package name is required.");
      return;
    }
    if (!priceInRupees || isNaN(Number(priceInRupees)) || Number(priceInRupees) < 0) {
      setError("Please enter a valid positive price.");
      return;
    }

    const priceInPaisa = Math.round(Number(priceInRupees) * 100);

    setSubmitting(true);
    try {
      await api.post<PackageItem>("/packages", {
        name: name.trim(),
        audience: "EMPLOYER",
        priceInPaisa,
        featuresJson: [],
        isActive: true,
      });

      setSuccessMsg(`Package "${name.trim()}" created successfully!`);
      // Reset form
      setName("");
      setPriceInRupees("");

      // Reload packages
      await loadPackages();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create package.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="packages" />

        <div className="dashboard-content">
          {/* Header */}
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Package Management</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted">
                      <a href="#">Admin</a>
                    </li>
                    <li className="breadcrumb-item">
                      <a href="#" className="text-main">
                        Package
                      </a>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger mb-4">{error}</div>}
            {successMsg && <div className="alert alert-success mb-4">{successMsg}</div>}

            {/* Create Package Form Card */}
            <div className="card mb-4 border-0 shadow-sm">
              <div className="card-header bg-white py-3">
                <h5 className="mb-0 fw-semibold">
                  <i className="fa-solid fa-plus-circle text-primary me-2"></i>Add New Package
                </h5>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleCreatePackage}>
                  <div className="row g-3">
                    {/* Package Name */}
                    <div className="col-md-4">
                      <label className="form-label fw-medium">
                        Package Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Starter Plan, Premium Employer"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>

                    {/* Target Audience (Fixed to Employer) */}
                    <div className="col-md-4">
                      <label className="form-label fw-medium">Target Audience</label>
                      <input
                        type="text"
                        className="form-control bg-light"
                        value="Employer"
                        disabled
                        readOnly
                      />
                    </div>

                    {/* Price in Rupees */}
                    <div className="col-md-4">
                      <label className="form-label fw-medium">
                        Price (₹) <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-control"
                          placeholder="e.g. 999.00"
                          value={priceInRupees}
                          onChange={(e) => setPriceInRupees(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="col-md-12 mt-4">
                      <button type="submit" className="btn btn-primary px-4 py-2" disabled={submitting}>
                        {submitting ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Creating Package...
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-check me-2"></i>Create Package
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* List of Existing Packages */}
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-semibold">
                  <i className="fa-solid fa-list text-primary me-2"></i>Existing Packages
                </h5>
                <button className="btn btn-sm btn-outline-secondary" onClick={loadPackages} disabled={dataLoading}>
                  <i className="fa-solid fa-rotate me-1"></i> Refresh
                </button>
              </div>
              <div className="card-body p-4">
                {dataLoading ? (
                  <div className="p-4 text-center text-muted">Loading packages...</div>
                ) : packages.length === 0 ? (
                  <div className="p-4 text-center text-muted">No packages found. Create one above!</div>
                ) : (
                  <div className="row g-4">
                    {packages.map((pkg) => (
                      <div className="col-xl-4 col-lg-6 col-md-6" key={pkg.id}>
                        <div className="card h-100 border shadow-sm rounded-3">
                          <div className="card-body p-4 d-flex flex-column justify-content-between">
                            <div>
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <span className="badge bg-info px-2 py-1">{pkg.audience}</span>
                                <span className={`badge ${pkg.isActive ? "bg-success" : "bg-secondary"} px-2 py-1`}>
                                  {pkg.isActive ? "Active" : "Inactive"}
                                </span>
                              </div>
                              <h5 className="card-title fw-bold mb-2 text-dark">{pkg.name}</h5>
                              <div className="fs-3 fw-bold text-primary mb-3">
                                ₹{(pkg.priceInPaisa / 100).toLocaleString("en-IN")}
                              </div>
                            </div>
                            <div className="pt-3 border-top d-flex justify-content-between align-items-center">
                              <span className="small text-muted">Status: <span className="fw-medium text-success">Ready</span></span>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger px-3"
                                disabled={deletingId === pkg.id}
                                onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                              >
                                {deletingId === pkg.id ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    <i className="fa-solid fa-trash-can me-1"></i>Delete
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="row mt-4">
            <div className="col-md-12">
              <div className="py-3 text-center text-muted small">
                &copy; {new Date().getFullYear()} JobStock. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
