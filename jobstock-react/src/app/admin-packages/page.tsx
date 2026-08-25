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

  function renderFeatures(featuresJson: unknown) {
    if (!featuresJson) return <span className="text-muted small">—</span>;
    let items: string[] = [];
    if (Array.isArray(featuresJson)) {
      items = featuresJson.map((f) => String(f));
    } else if (typeof featuresJson === "object" && featuresJson !== null) {
      items = Object.entries(featuresJson).map(([k, v]) =>
        !isNaN(Number(k)) ? String(v) : `${k}: ${String(v)}`
      );
    } else if (typeof featuresJson === "string") {
      items = [featuresJson];
    }
    if (items.length === 0) return <span className="text-muted small">—</span>;
    return (
      <div className="mt-3">
        {items.map((feat, idx) => (
          <p className="text-muted small mb-1 d-flex align-items-center gap-2" key={idx}>
            <i className="fa-solid fa-check text-success small"></i>
            <span>{feat}</span>
          </p>
        ))}
      </div>
    );
  }

  // Form fields
  const [name, setName] = useState("");
  const [priceInRupees, setPriceInRupees] = useState<string>("");
  const [audience, setAudience] = useState<"CANDIDATE" | "EMPLOYER" | "RESUME">("EMPLOYER");
  const [featuresInput, setFeaturesInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleEditClick = (pkg: PackageItem) => {
    setEditingId(pkg.id);
    setName(pkg.name);
    setPriceInRupees(String(pkg.priceInPaisa / 100));
    setAudience(pkg.audience);
    if (Array.isArray(pkg.featuresJson)) {
      setFeaturesInput(pkg.featuresJson.join(", "));
    } else if (typeof pkg.featuresJson === "object" && pkg.featuresJson !== null) {
      setFeaturesInput(Object.values(pkg.featuresJson).join(", "));
    } else {
      setFeaturesInput("");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  const handleFormSubmit = async (e: React.FormEvent) => {
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
    const featuresJson = featuresInput.split(",").map((f) => f.trim()).filter(Boolean);

    setSubmitting(true);
    try {
      if (editingId) {
        await api.patch(`/packages/${editingId}`, {
          name: name.trim(),
          audience,
          priceInPaisa,
          featuresJson,
        });
        setSuccessMsg(`Package "${name.trim()}" updated successfully!`);
      } else {
        await api.post<PackageItem>("/packages", {
          name: name.trim(),
          audience,
          priceInPaisa,
          featuresJson,
          isActive: true,
        });
        setSuccessMsg(`Package "${name.trim()}" created successfully!`);
      }

      // Reset form
      setName("");
      setPriceInRupees("");
      setFeaturesInput("");
      setAudience("EMPLOYER");
      setEditingId(null);

      // Reload packages
      await loadPackages();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Failed to ${editingId ? "update" : "create"} package.`);
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

            {/* Create/Edit Package Form */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white py-3">
                <h5 className="mb-0 fw-semibold text-dark">
                  <i className="fa-solid fa-circle-plus text-primary me-2"></i>
                  {editingId ? "Edit Package" : "Create New Package"}
                </h5>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleFormSubmit}>
                  <div className="row g-3">
                    <div className="col-md-4 col-sm-12">
                      <div className="form-group mb-0">
                        <label className="form-label small fw-medium">Package Name</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. Premium HR Booster"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-2 col-sm-6">
                      <div className="form-group mb-0">
                        <label className="form-label small fw-medium">Price (INR)</label>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          placeholder="e.g. 499"
                          value={priceInRupees}
                          onChange={(e) => setPriceInRupees(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-2 col-sm-6">
                      <div className="form-group mb-0">
                        <label className="form-label small fw-medium">Audience</label>
                        <select
                          className="form-select form-select-sm"
                          value={audience}
                          onChange={(e) => setAudience(e.target.value as any)}
                        >
                          <option value="EMPLOYER">Employer</option>
                          <option value="CANDIDATE">Candidate</option>
                          <option value="RESUME">Resume</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4 col-sm-12">
                      <div className="form-group mb-0">
                        <label className="form-label small fw-medium">Features (comma separated)</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. 50 Job Posts, Resume Search, AI Matching"
                          value={featuresInput}
                          onChange={(e) => setFeaturesInput(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="d-flex gap-2 mt-4">
                    <button type="submit" className="btn btn-sm btn-main px-4" disabled={submitting}>
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : editingId ? (
                        "Update Package"
                      ) : (
                        "Create Package"
                      )}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary px-4"
                        onClick={() => {
                          setEditingId(null);
                          setName("");
                          setPriceInRupees("");
                          setFeaturesInput("");
                          setAudience("EMPLOYER");
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* List of Existing Packages */}
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-semibold text-dark">
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
                                {(pkg.priceInPaisa / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                              </div>
                              <div className="mb-3">
                                {renderFeatures(pkg.featuresJson)}
                              </div>
                            </div>
                            <div className="pt-3 border-top d-flex justify-content-between align-items-center">
                              <span className="small text-muted">Status: <span className="fw-medium text-success">Ready</span></span>
                              <div className="d-flex gap-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary px-3"
                                  onClick={() => handleEditClick(pkg)}
                                >
                                  <i className="fa-solid fa-pen-to-square me-1"></i>Edit
                                </button>
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
