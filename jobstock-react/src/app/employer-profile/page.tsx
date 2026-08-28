"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar8 from "@/components/Navbar8";
import EmployerSidebar from "@/components/employer-dashboard/EmployerSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl, uploadFile } from "@/lib/api";
import { Toaster, toast } from "react-hot-toast";

interface EmployerProfile {
  id: string;
  userId: string;
  companyName: string;
  logoUrl: string | null;
  description: string | null;
  website: string | null;
  location: string | null;
  industry: string | null;
  status: string;
  gstCertificateUrl?: string;
  incorporationCertUrl?: string;
  signatoryIdUrl?: string;
}

export default function EmployerProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [industry, setIndustry] = useState("");

  const [dataLoading, setDataLoading] = useState(true);
      const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const scrollToTop = () => {
    if (alertRef.current) {
      const yOffset = -110; // Leaves space for sticky navbar header at top
      const y = alertRef.current.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    } else if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (!loading && (!user || user.role !== "EMPLOYER")) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "EMPLOYER") return;
    (async () => {
      setDataLoading(true);
      try {
        const p = await api.get<EmployerProfile>("/employers/me");
        setProfile(p);
        setCompanyName(p.companyName || "");
        setDescription(p.description || "");
        setWebsite(p.website || "");
        setLocation(p.location || "");
        setIndustry(p.industry || "");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to load profile");
      } finally {
        setDataLoading(false);
      }
    })();
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
            try {
      const updated = await api.patch<EmployerProfile>("/employers/me", {
        companyName,
        description,
        website,
        location,
        industry,
      });
      setProfile(updated);
      toast.success("Profile saved successfully.");
      scrollToTop();
      window.dispatchEvent(new CustomEvent('profile-updated'));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save profile");
      scrollToTop();
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { url } = await uploadFile<{ url: string }>("/uploads/image", file);
      const updated = await api.patch<EmployerProfile>("/employers/me", { logoUrl: url });
      setProfile(updated);
      toast.success("Profile photo updated successfully");
      window.dispatchEvent(new Event('profile-updated'));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDocumentUpload(field: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadFile<{ url: string }>("/uploads/document?save=false", file);
      const updated = await api.patch<EmployerProfile>("/employers/me", { [field]: res.url });
      setProfile(updated);
      toast.success("Document uploaded successfully");
      window.dispatchEvent(new Event('profile-updated'));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to upload document");
    }
  }

  if (loading || !user || user.role !== "EMPLOYER") {
    return null;
  }

  return (
    <>
      <Navbar8 />
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
        <EmployerSidebar active="profile" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Update Profile</h1>
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
                        My Profile
                      </a>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">

            <div ref={alertRef} style={{ scrollMarginTop: "110px" }}>
                                        </div>
            {dataLoading && <p className="text-muted">Loading profile...</p>}

            <div className="dashboard-profle-wrapper mb-4">
              <div className="dash-prf-start">
                <div className="profile-avatar position-ralative mb-3">
                  {profile?.logoUrl ? (
                    <img className="avatar" src={assetUrl(profile.logoUrl!)} alt="Avatar" />
                  ) : (
                    <div className="avatar d-flex align-items-center justify-content-center bg-light text-muted fw-semibold">
                      <span className="small text-center px-2">Upload Photo</span>
                    </div>
                  )}
                  <div className="position-absolute bottom-0 start-50 translate-middle-x">
                    <span className={`badge badge-md bg-white rounded-pill fw-medium shadow-sm px-3 py-2 ${profile?.status === "VERIFIED" ? "text-success" : "text-warning"}`}>{profile?.status || "PENDING"}</span>
                  </div>
                </div>
                <div className="dash-prf-start-bottom">
                  <div className="upload-btn-wrapper small">
                    <button type="button" className="btn" disabled={uploadingPhoto} onClick={() => fileInputRef.current?.click()}>
                      {uploadingPhoto ? "Uploading..." : "Change Logo"}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} hidden />
                  </div>
                </div>
              </div>
              <div className="dash-prf-end">
                <div className="dash-prfs-caption">
                  <div className="dash-prfs-title d-flex align-items-center justify-content-between">
                    <div className="avatar-title">
                      <h4>{profile?.companyName || user.email}</h4>
                    </div>
                    <div className="update-status">
                      <span className="text-sm opacity-75">Status: {profile?.status || "PENDING"}</span>
                    </div>
                  </div>
                  <div className="dash-prfs-subtitle">
                    <div className="jbs-job-mrch-lists mb-2">
                      <div className="single-mrch-lists">
                        <span>{profile?.industry || "Industry not set"}</span>
                      </div>
                    </div>
                    <div className="short-description">
                      <p>{profile?.description || "No company description added yet."}</p>
                    </div>
                  </div>
                  <div className="d-flex flex-wrap gap-4 mt-3">
                    <div className="d-flex align-items-center gap-2">
                      <i className="fa-solid fa-location-dot"></i>
                      <span>{profile?.location || "Location not set"}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <i className="fa-solid fa-globe"></i>
                      <span>{profile?.website || "Website not set"}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <i className="fa-solid fa-envelope"></i>
                      <span>{user.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Row */}
            <form onSubmit={handleSave}>
            <div className="card">
              <div className="card-header">
                <h4>Basic Detail</h4>
              </div>
              <div className="card-body">
                  <div className="row">
                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label>Employer Name</label>
                        <input type="text" className="form-control" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                      </div>
                    </div>

                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label>Email ID</label>
                        <input type="text" className="form-control" value={user.email} disabled />
                      </div>
                    </div>

                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label>Website</label>
                        <input type="text" className="form-control" value={website} onChange={(e) => setWebsite(e.target.value)} />
                      </div>
                    </div>

                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label>Location</label>
                        <input type="text" className="form-control" value={location} onChange={(e) => setLocation(e.target.value)} />
                      </div>
                    </div>

                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label>Industry</label>
                        <input type="text" className="form-control" value={industry} onChange={(e) => setIndustry(e.target.value)} />
                      </div>
                    </div>

                    <div className="col-xl-12 col-lg-12 col-md-12">
                      <div className="form-group">
                        <label>About Company</label>
                        <textarea className="form-control ht-80" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
                      </div>
                    </div>
                  </div>
              </div>
            </div>
            {/* Card Row End */}

            {/* Compliance Documents Card */}
            <div className="card mt-4">
              <div className="card-header">
                <h4>Compliance Documents</h4>
              </div>
              <div className="card-body">
                <p className="text-muted small mb-4">
                  Upload your compliance documents for admin verification. Required for full dashboard access.
                </p>
                <div className="row">
                  <div className="col-xl-4 col-lg-4 col-md-12 mb-3">
                    <label className="fw-medium">GST Certificate</label>
                    {profile?.gstCertificateUrl ? (
                      <div className="d-flex align-items-center gap-2 mt-2">
                        <i className="fa-solid fa-circle-check text-success"></i>
                        <a href={assetUrl(profile.gstCertificateUrl)} target="_blank" rel="noopener noreferrer">View Document</a>
                      </div>
                    ) : (
                      <div className="mt-2 text-warning"><i className="fa-solid fa-triangle-exclamation"></i> Missing</div>
                    )}
                    <input type="file" className="form-control mt-2" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleDocumentUpload("gstCertificateUrl", e)} />
                  </div>
                  
                  <div className="col-xl-4 col-lg-4 col-md-12 mb-3">
                    <label className="fw-medium">Incorporation Certificate</label>
                    {profile?.incorporationCertUrl ? (
                      <div className="d-flex align-items-center gap-2 mt-2">
                        <i className="fa-solid fa-circle-check text-success"></i>
                        <a href={assetUrl(profile.incorporationCertUrl)} target="_blank" rel="noopener noreferrer">View Document</a>
                      </div>
                    ) : (
                      <div className="mt-2 text-warning"><i className="fa-solid fa-triangle-exclamation"></i> Missing</div>
                    )}
                    <input type="file" className="form-control mt-2" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleDocumentUpload("incorporationCertUrl", e)} />
                  </div>

                  <div className="col-xl-4 col-lg-4 col-md-12 mb-3">
                    <label className="fw-medium">Signatory ID</label>
                    {profile?.signatoryIdUrl ? (
                      <div className="d-flex align-items-center gap-2 mt-2">
                        <i className="fa-solid fa-circle-check text-success"></i>
                        <a href={assetUrl(profile.signatoryIdUrl)} target="_blank" rel="noopener noreferrer">View Document</a>
                      </div>
                    ) : (
                      <div className="mt-2 text-warning"><i className="fa-solid fa-triangle-exclamation"></i> Missing</div>
                    )}
                    <input type="file" className="form-control mt-2" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleDocumentUpload("signatoryIdUrl", e)} />
                  </div>
                </div>
              </div>
            </div>
            {/* Card Row End */}

            {/* Submit Busston */}
            <div className="row">
              <div className="col-lg-12 col-md-12">
                <button type="submit" className="btn ft--medium btn-main px-5" disabled={saving}>
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </div>
            </form>
          </div>

          {/* footer */}
          {/* footer removed */}
        </div>
      </div>
    </>
  );
}
