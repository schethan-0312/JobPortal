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
  durationType: "DAYS" | "MONTHS" | "YEARS";
  duration: number;
  postJobLimit: number;
  applicantViewLimit: number;
  jobSeekerViewLimit: number;
  chatEnabled: boolean;
  filterShortlistEnabled: boolean;
  scheduleInterviewsEnabled: boolean;
  companyBrandingEnabled: boolean;
  verifiedRecruiterBadgeEnabled: boolean;
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
  const [durationType, setDurationType] = useState<"DAYS" | "MONTHS" | "YEARS">("DAYS");
  const [duration, setDuration] = useState("");
  const [postJobLimit, setPostJobLimit] = useState("");
  const [applicantViewLimit, setApplicantViewLimit] = useState("");
  const [jobSeekerViewLimit, setJobSeekerViewLimit] = useState("");
  
  const [chatEnabled, setChatEnabled] = useState(false);
  const [filterShortlistEnabled, setFilterShortlistEnabled] = useState(false);
  const [scheduleInterviewsEnabled, setScheduleInterviewsEnabled] = useState(false);
  const [companyBrandingEnabled, setCompanyBrandingEnabled] = useState(false);
  const [verifiedRecruiterBadgeEnabled, setVerifiedRecruiterBadgeEnabled] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);

  const handleEditClick = (pkg: PackageItem) => {
    setEditingId(pkg.id);
    setName(pkg.name);
    setPriceInRupees(String(pkg.priceInPaisa / 100));
    setDurationType(pkg.durationType || "DAYS");
    setDuration(String(pkg.duration ?? 0));
    setPostJobLimit(String(pkg.postJobLimit ?? 0));
    setApplicantViewLimit(String(pkg.applicantViewLimit ?? 0));
    setJobSeekerViewLimit(String(pkg.jobSeekerViewLimit ?? 0));
    setChatEnabled(pkg.chatEnabled ?? false);
    setFilterShortlistEnabled(pkg.filterShortlistEnabled ?? false);
    setScheduleInterviewsEnabled(pkg.scheduleInterviewsEnabled ?? false);
    setCompanyBrandingEnabled(pkg.companyBrandingEnabled ?? false);
    setVerifiedRecruiterBadgeEnabled(pkg.verifiedRecruiterBadgeEnabled ?? false);
    setIsActive(pkg.isActive ?? true);
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
      setError(err instanceof ApiError ? err.message : "Failed to load packages");
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
    if (!duration || isNaN(Number(duration)) || Number(duration) <= 0) {
      setError("Please enter a valid positive duration.");
      return;
    }

    const priceInPaisa = Math.round(Number(priceInRupees) * 100);

    const payload = {
      name: name.trim(),
      audience: "EMPLOYER",
      priceInPaisa,
      durationType,
      duration: Number(duration),
      postJobLimit: Number(postJobLimit) || 0,
      applicantViewLimit: Number(applicantViewLimit) || 0,
      jobSeekerViewLimit: Number(jobSeekerViewLimit) || 0,
      chatEnabled,
      filterShortlistEnabled,
      scheduleInterviewsEnabled,
      companyBrandingEnabled,
      verifiedRecruiterBadgeEnabled,
      isActive,
    };

    setSubmitting(true);
    try {
      if (editingId) {
        await api.patch(`/packages/${editingId}`, payload);
        setSuccessMsg(`Package "${name.trim()}" updated successfully!`);
      } else {
        await api.post<PackageItem>("/packages", payload);
        setSuccessMsg(`Package "${name.trim()}" created successfully!`);
      }

      // Reset form
      setName("");
      setPriceInRupees("");
      setDurationType("DAYS");
      setDuration("");
      setPostJobLimit("");
      setApplicantViewLimit("");
      setJobSeekerViewLimit("");
      setChatEnabled(false);
      setFilterShortlistEnabled(false);
      setScheduleInterviewsEnabled(false);
      setCompanyBrandingEnabled(false);
      setVerifiedRecruiterBadgeEnabled(false);
      setIsActive(true);
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
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Package Management</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Package</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger mb-4">{error}</div>}
            {successMsg && <div className="alert alert-success mb-4">{successMsg}</div>}

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
                    <div className="col-md-6 col-sm-12">
                      <div className="form-group mb-0">
                        <label className="form-label small fw-medium">Package Name*</label>
                        <input type="text" className="form-control form-control-sm" placeholder="Example: Premium Package" value={name} onChange={(e) => setName(e.target.value)} />
                      </div>
                    </div>
                    <div className="col-md-6 col-sm-12">
                      <div className="form-group mb-0">
                        <label className="form-label small fw-medium">Price (Rs)*</label>
                        <input type="number" className="form-control form-control-sm" placeholder="Example: 999" value={priceInRupees} onChange={(e) => setPriceInRupees(e.target.value)} />
                      </div>
                    </div>

                    <div className="col-md-6 col-sm-12">
                      <div className="form-group mb-0">
                        <label className="form-label small fw-medium">Duration Type*</label>
                        <select className="form-select form-select-sm" value={durationType} onChange={(e) => setDurationType(e.target.value as any)}>
                          <option value="DAYS">Days</option>
                          <option value="MONTHS">Months</option>
                          <option value="YEARS">Years</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6 col-sm-12">
                      <div className="form-group mb-0">
                        <label className="form-label small fw-medium">Duration*</label>
                        <input type="number" className="form-control form-control-sm" placeholder="Example: 30" value={duration} onChange={(e) => setDuration(e.target.value)} />
                      </div>
                    </div>

                    <div className="col-md-4 col-sm-12">
                      <div className="form-group mb-0">
                        <label className="form-label small fw-medium">Post Job Limit</label>
                        <input type="number" className="form-control form-control-sm" placeholder="Example: 10" value={postJobLimit} onChange={(e) => setPostJobLimit(e.target.value)} />
                      </div>
                    </div>
                    <div className="col-md-4 col-sm-12">
                      <div className="form-group mb-0">
                        <label className="form-label small fw-medium">Applicant View Limit</label>
                        <input type="number" className="form-control form-control-sm" placeholder="Example: 100" value={applicantViewLimit} onChange={(e) => setApplicantViewLimit(e.target.value)} />
                      </div>
                    </div>
                    <div className="col-md-4 col-sm-12">
                      <div className="form-group mb-0">
                        <label className="form-label small fw-medium">Job Seeker Search Limit</label>
                        <input type="number" className="form-control form-control-sm" placeholder="Example: 50" value={jobSeekerViewLimit} onChange={(e) => setJobSeekerViewLimit(e.target.value)} />
                      </div>
                    </div>

                    <div className="col-12 mt-4">
                      <h6 className="fw-semibold">Features</h6>
                      <hr className="my-2" />
                    </div>

                    <div className="col-md-3 col-sm-6">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="chatEnabled" checked={chatEnabled} onChange={(e) => setChatEnabled(e.target.checked)} />
                        <label className="form-check-label small" htmlFor="chatEnabled">In-App Chat</label>
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="filterShortlistEnabled" checked={filterShortlistEnabled} onChange={(e) => setFilterShortlistEnabled(e.target.checked)} />
                        <label className="form-check-label small" htmlFor="filterShortlistEnabled">Filter & Shortlist</label>
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="scheduleInterviewsEnabled" checked={scheduleInterviewsEnabled} onChange={(e) => setScheduleInterviewsEnabled(e.target.checked)} />
                        <label className="form-check-label small" htmlFor="scheduleInterviewsEnabled">Schedule Interviews</label>
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="companyBrandingEnabled" checked={companyBrandingEnabled} onChange={(e) => setCompanyBrandingEnabled(e.target.checked)} />
                        <label className="form-check-label small" htmlFor="companyBrandingEnabled">Company Branding</label>
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-6 mt-2">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="verifiedRecruiterBadgeEnabled" checked={verifiedRecruiterBadgeEnabled} onChange={(e) => setVerifiedRecruiterBadgeEnabled(e.target.checked)} />
                        <label className="form-check-label small" htmlFor="verifiedRecruiterBadgeEnabled">Verified Recruiter Badge</label>
                      </div>
                    </div>

                    <div className="col-12 mt-4">
                      <h6 className="fw-semibold">Status</h6>
                      <hr className="my-2" />
                    </div>
                    <div className="col-md-4 col-sm-12">
                      <div className="form-group mb-0">
                        <select className="form-select form-select-sm" value={isActive ? "Active" : "Inactive"} onChange={(e) => setIsActive(e.target.value === "Active")}>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex gap-2 mt-4 flex-wrap">
                    <button type="submit" className="btn btn-sm btn-main px-4" disabled={submitting}>
                      {submitting ? "Saving..." : editingId ? "Update Package" : "Create Package"}
                    </button>
                    {editingId && (
                      <button type="button" className="btn btn-sm btn-outline-secondary px-4" onClick={() => {
                        setEditingId(null);
                        setName("");
                        setPriceInRupees("");
                        setDurationType("DAYS");
                        setDuration("");
                        setPostJobLimit("");
                        setApplicantViewLimit("");
                        setJobSeekerViewLimit("");
                        setChatEnabled(false);
                        setFilterShortlistEnabled(false);
                        setScheduleInterviewsEnabled(false);
                        setCompanyBrandingEnabled(false);
                        setVerifiedRecruiterBadgeEnabled(false);
                        setIsActive(true);
                      }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

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
                        <div className="card h-100 border shadow-sm rounded-3 overflow-hidden">
                          <div className="card-body p-4 d-flex flex-column justify-content-between">
                            <div>
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <span className="badge bg-light text-dark border px-2 py-1">
                                  <i className="fa-regular fa-clock me-1"></i>
                                  {pkg.duration} {pkg.durationType}
                                </span>
                                <span className={`badge ${pkg.isActive ? "bg-success" : "bg-secondary"} px-2 py-1`}>
                                  {pkg.isActive ? "Active" : "Inactive"}
                                </span>
                              </div>
                              <h5 className="card-title fw-bold mb-2 text-dark">{pkg.name}</h5>
                              <div className="fs-3 fw-bold text-primary mb-3">
                                {(pkg.priceInPaisa / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                              </div>

                              <div className="mb-3">
                                <ul className="list-unstyled mb-0 small text-muted">
                                  <li className="mb-1"><i className="fa-solid fa-check text-success me-2"></i> {pkg.postJobLimit} Jobs Limit</li>
                                  <li className="mb-1"><i className="fa-solid fa-check text-success me-2"></i> {pkg.applicantViewLimit} Applicants Limit</li>
                                  <li className="mb-1"><i className="fa-solid fa-check text-success me-2"></i> {pkg.jobSeekerViewLimit} Profile Views Limit</li>
                                  {pkg.chatEnabled && <li className="mb-1"><i className="fa-solid fa-check text-success me-2"></i> In-App Chat</li>}
                                  {pkg.filterShortlistEnabled && <li className="mb-1"><i className="fa-solid fa-check text-success me-2"></i> Filter & Shortlist</li>}
                                  {pkg.scheduleInterviewsEnabled && <li className="mb-1"><i className="fa-solid fa-check text-success me-2"></i> Schedule Interviews</li>}
                                  {pkg.companyBrandingEnabled && <li className="mb-1"><i className="fa-solid fa-check text-success me-2"></i> Company Branding</li>}
                                  {pkg.verifiedRecruiterBadgeEnabled && <li className="mb-1"><i className="fa-solid fa-check text-success me-2"></i> Verified Recruiter Badge</li>}
                                </ul>
                              </div>
                            </div>
                            <div className="pt-3 border-top d-flex justify-content-end align-items-center">
                              <div className="d-flex gap-2 flex-wrap">
                                <button type="button" className="btn btn-sm btn-outline-primary px-3" onClick={() => handleEditClick(pkg)}>
                                  <i className="fa-solid fa-pen-to-square me-1"></i>Edit
                                </button>
                                <button type="button" className="btn btn-sm btn-outline-danger px-3" disabled={deletingId === pkg.id} onClick={() => handleDeletePackage(pkg.id, pkg.name)}>
                                  {deletingId === pkg.id ? "Deleting..." : <><i className="fa-solid fa-trash-can me-1"></i>Delete</>}
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
