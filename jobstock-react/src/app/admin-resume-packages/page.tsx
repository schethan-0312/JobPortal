"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, uploadFile, assetUrl } from "@/lib/api";

interface PackageItem {
  id: string;
  name: string;
  audience: "CANDIDATE" | "EMPLOYER" | "RESUME";
  priceInPaisa: number;
  featuresJson: string[] | Record<string, unknown> | unknown;
  isActive: boolean;
}

export default function AdminResumePackagesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function renderFeatures(featuresJson: unknown) {
    if (!featuresJson) return <span className="text-muted small">â€”</span>;
    let items: string[] = [];
    if (Array.isArray(featuresJson)) {
      items = featuresJson.map((f) => String(f));
    } else if (typeof featuresJson === "object" && featuresJson !== null) {
      if ("features" in featuresJson && Array.isArray((featuresJson as any).features)) {
        items = (featuresJson as any).features.map((f: any) => String(f));
      } else {
        items = Object.entries(featuresJson).map(([k, v]) =>
          !isNaN(Number(k)) ? String(v) : `${k}: ${String(v)}`
        );
      }
    } else if (typeof featuresJson === "string") {
      items = [featuresJson];
    }
    if (items.length === 0) return <span className="text-muted small">â€”</span>;
    return (
      <div className="mt-3">
        {items.map((feat, idx) => (
          <p className="text-muted small mb-1 d-flex align-items-center gap-2 flex-wrap" key={idx}>
            <i className="fa-solid fa-check text-success small"></i>
            <span>{feat}</span>
          </p>
        ))}
      </div>
    );
  }

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceInRupees, setPriceInRupees] = useState<string>("");
  const [durationType, setDurationType] = useState<"Days" | "Months" | "Years">("Days");
  const [duration, setDuration] = useState("");
  const [featuresInput, setFeaturesInput] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [packageImage, setPackageImage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleEditClick = (pkg: PackageItem) => {
    setEditingId(pkg.id);
    setName(pkg.name);
    setPriceInRupees(String(pkg.priceInPaisa / 100));
    setIsActive(pkg.isActive);

    const isObj = typeof pkg.featuresJson === "object" && pkg.featuresJson !== null && !Array.isArray(pkg.featuresJson);
    if (isObj) {
      const meta = pkg.featuresJson as any;
      setDescription(meta.description || "");
      setDurationType(meta.durationType || "Days");
      setDuration(meta.duration !== undefined ? String(meta.duration) : "");
      setPackageImage(meta.packageImage || "");
      if (Array.isArray(meta.features)) {
        setFeaturesInput(meta.features.join(", "));
      } else {
        setFeaturesInput("");
      }
    } else {
      setDescription("");
      setDurationType("Days");
      setDuration("");
      setPackageImage("");
      if (Array.isArray(pkg.featuresJson)) {
        setFeaturesInput(pkg.featuresJson.join(", "));
      } else if (typeof pkg.featuresJson === "string") {
        setFeaturesInput(pkg.featuresJson);
      } else {
        setFeaturesInput("");
      }
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
      const data = await api.get<PackageItem[]>("/packages?audience=RESUME");
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await uploadFile<{ url: string }>("/uploads/image", file);
      if (res.url) {
        const fullUrl = assetUrl(res.url) || res.url;
        setPackageImage(fullUrl);
        setSuccessMsg("Package image uploaded successfully!");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

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
    if (!duration || isNaN(Number(duration)) || Number(duration) <= 0) {
      setError("Please enter a valid positive duration.");
      return;
    }
    if (featuresInput.trim() === "") {
      setError("Please add at least one feature.");
      return;
    }

    const priceInPaisa = Math.round(Number(priceInRupees) * 100);
    const features = featuresInput.split(",").map((f) => f.trim()).filter(Boolean);

    const featuresJsonObj = {
      description: description.trim(),
      durationType,
      duration: Number(duration),
      packageImage: packageImage || undefined,
      features
    };

    setSubmitting(true);
    try {
      if (editingId) {
        await api.patch(`/packages/${editingId}`, {
          name: name.trim(),
          audience: "RESUME",
          priceInPaisa,
          featuresJson: featuresJsonObj,
          isActive,
        });
        setSuccessMsg(`Package "${name.trim()}" updated successfully!`);
      } else {
        await api.post<PackageItem>("/packages", {
          name: name.trim(),
          audience: "RESUME",
          priceInPaisa,
          featuresJson: featuresJsonObj,
          isActive,
        });
        setSuccessMsg(`Package "${name.trim()}" created successfully!`);
      }

      // Reset form
      setName("");
      setDescription("");
      setPriceInRupees("");
      setDurationType("Days");
      setDuration("");
      setFeaturesInput("");
      setIsActive(true);
      setPackageImage("");
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
        <AdminSidebar active="resume-packages" />

        <div className="dashboard-content">
          {/* Header */}
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Resume Package Management</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted">
                      <a href="#">Admin</a>
                    </li>
                    <li className="breadcrumb-item">
                      <a href="#" className="text-main">
                        Resume Packages
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
                    {/* Row 1: Package Name*, Description, Price* */}
                    <div className="col-md-4 col-sm-12">
                      <div className="form-group mb-0">
                        <label className="form-label small fw-medium">Package Name*</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Example: Premium Package"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-5 col-sm-12">
                      <div className="form-group mb-0">
                        <label className="form-label small fw-medium">Description</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Short description."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-12">
                      <div className="form-group mb-0">
                        <label className="form-label small fw-medium">Price*</label>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          placeholder="Example: 999"
                          value={priceInRupees}
                          onChange={(e) => setPriceInRupees(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Row 2: Duration Type*, Duration* */}
                    <div className="col-md-6 col-sm-12">
                      <div className="form-group mb-0">
                        <label className="form-label small fw-medium">Duration Type*</label>
                        <select
                          className="form-select form-select-sm"
                          value={durationType}
                          onChange={(e) => setDurationType(e.target.value as any)}
                        >
                          <option value="Days">Days</option>
                          <option value="Months">Months</option>
                          <option value="Years">Years</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6 col-sm-12">
                      <div className="form-group mb-0">
                        <label className="form-label small fw-medium">Duration*</label>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          placeholder="Example: 30"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Row 3: Features*, Status*, Package Image */}
                    <div className="col-md-6 col-sm-12">
                      <div className="form-group mb-0">
                        <label className="form-label small fw-medium">Features* (comma separated)</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Add multiple features."
                          value={featuresInput}
                          onChange={(e) => setFeaturesInput(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-12">
                      <div className="form-group mb-0">
                        <label className="form-label small fw-medium">Status*</label>
                        <select
                          className="form-select form-select-sm"
                          value={isActive ? "Active" : "Inactive"}
                          onChange={(e) => setIsActive(e.target.value === "Active")}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-12">
                      <div className="form-group mb-0">
                        <label className="form-label small fw-medium">Package Image (optional)</label>
                        <input
                          type="file"
                          accept="image/*"
                          className="form-control form-control-sm"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                        />
                        {isUploading && <span className="small text-muted">Uploading image...</span>}
                        {packageImage && (
                          <div className="mt-2 d-flex align-items-center gap-2 flex-wrap">
                            <img src={packageImage} alt="Package Preview" style={{ height: "40px", width: "40px", objectFit: "cover", borderRadius: "4px" }} />
                            <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => setPackageImage("")}>Remove</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="d-flex gap-2 mt-4 flex-wrap">
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
                          setDescription("");
                          setPriceInRupees("");
                          setDurationType("Days");
                          setDuration("");
                          setFeaturesInput("");
                          setPackageImage("");
                          setIsActive(true);
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
                    {packages.map((pkg) => {
                      const isObj = typeof pkg.featuresJson === "object" && pkg.featuresJson !== null && !Array.isArray(pkg.featuresJson);
                      const meta = isObj ? (pkg.featuresJson as any) : null;
                      return (
                        <div className="col-xl-4 col-lg-6 col-md-6" key={pkg.id}>
                          <div className="card h-100 border shadow-sm rounded-3 overflow-hidden">
                            {meta?.packageImage && (
                              <div style={{ height: "140px", overflow: "hidden", position: "relative", backgroundColor: "#f8f9fa" }}>
                                <img src={meta.packageImage} alt={pkg.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </div>
                            )}
                            <div className="card-body p-4 d-flex flex-column justify-content-between">
                              <div>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                  {meta?.duration ? (
                                    <span className="badge bg-light text-dark border px-2 py-1">
                                      <i className="fa-regular fa-clock me-1"></i>
                                      {meta.duration} {meta.durationType || "Days"}
                                    </span>
                                  ) : (
                                    <span className="badge bg-light text-dark border px-2 py-1">{pkg.audience}</span>
                                  )}
                                  <span className={`badge ${pkg.isActive ? "bg-success" : "bg-secondary"} px-2 py-1`}>
                                    {pkg.isActive ? "Active" : "Inactive"}
                                  </span>
                                </div>
                                <h5 className="card-title fw-bold mb-2 text-dark">{pkg.name}</h5>
                                {meta?.description && (
                                  <p className="text-muted small mb-2">{meta.description}</p>
                                )}
                                <div className="fs-3 fw-bold text-primary mb-3">
                                  {(pkg.priceInPaisa / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                                </div>

                                <div className="mb-3">
                                  {renderFeatures(pkg.featuresJson)}
                                </div>
                              </div>
                              <div className="pt-3 border-top d-flex justify-content-between align-items-center">
                                <span className="small text-muted">Status: <span className="fw-medium text-success">Ready</span></span>
                                <div className="d-flex gap-2 flex-wrap">
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
                      );
                    })}
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

