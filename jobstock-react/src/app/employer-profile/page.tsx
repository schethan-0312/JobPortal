"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar8 from "@/components/Navbar8";
import EmployerSidebar from "@/components/employer-dashboard/EmployerSidebar";
import CityLocationInput from "@/components/CityLocationInput";
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
  cultureBlurb: string | null;
  photos: string[];
  status: string;
  gstCertificateUrl?: string;
  incorporationCertUrl?: string;
  signatoryIdUrl?: string;
}

export default function EmployerProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [industry, setIndustry] = useState("");
  const [cultureBlurb, setCultureBlurb] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const scrollToTop = () => {
    if (alertRef.current) {
      const yOffset = -110;
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
        setCultureBlurb(p.cultureBlurb || "");
        setPhotos(p.photos || []);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to load profile");
      } finally {
        setDataLoading(false);
      }
    })();
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    
    if (!companyName.trim() || !location?.trim() || !industry?.trim() || !website?.trim() || !description?.trim()) {
      toast.error("Please fill out all basic details (Company Name, Website, Location, Industry, and About).");
      scrollToTop();
      return;
    }

    if (!profile?.gstCertificateUrl || !profile?.incorporationCertUrl || !profile?.signatoryIdUrl) {
      toast.error("Please upload all compliance documents for verification.");
      scrollToTop();
      return;
    }

    setSaving(true);
    try {
      const updated = await api.patch<EmployerProfile>("/employers/me", {
        companyName,
        description,
        website,
        location,
        industry,
        cultureBlurb,
        photos,
      });
      setProfile(updated);
      toast.success("Profile saved successfully.");
      scrollToTop();
      window.dispatchEvent(new CustomEvent("profile-updated"));
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
      window.dispatchEvent(new Event("profile-updated"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Upload one or multiple workplace / culture photos
  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingGallery(true);
    const newUploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadFile<{ url: string }>("/uploads/image", file);
        if (res?.url) {
          newUploadedUrls.push(res.url);
        }
      }

      if (newUploadedUrls.length > 0) {
        const updatedPhotos = [...photos, ...newUploadedUrls];
        setPhotos(updatedPhotos);
        // Persist immediately
        await api.patch("/employers/me", { photos: updatedPhotos });
        toast.success(`Uploaded ${newUploadedUrls.length} photo(s) successfully!`);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to upload photos");
    } finally {
      setUploadingGallery(false);
      if (photosInputRef.current) photosInputRef.current.value = "";
    }
  }

  // Remove photo from gallery
  async function handleRemovePhoto(indexToRemove: number) {
    const updatedPhotos = photos.filter((_, idx) => idx !== indexToRemove);
    setPhotos(updatedPhotos);
    try {
      await api.patch("/employers/me", { photos: updatedPhotos });
      toast.success("Photo removed");
    } catch {
      // If saving fails, rollback will happen on save
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
      window.dispatchEvent(new Event("profile-updated"));
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
          top: "100px",
        }}
        toastOptions={{
          style: {
            padding: "16px 24px",
            fontSize: "1.1rem",
            fontWeight: "500",
            maxWidth: "600px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            borderRadius: "12px",
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
            <div ref={alertRef} style={{ scrollMarginTop: "110px" }}></div>
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
                    <span
                      className={`badge badge-md bg-white rounded-pill fw-medium shadow-sm px-3 py-2 ${
                        profile?.status === "VERIFIED" ? "text-success" : "text-warning"
                      }`}
                    >
                      {profile?.status || "PENDING"}
                    </span>
                  </div>
                </div>
                <div className="dash-prf-start-bottom">
                  <div className="upload-btn-wrapper small">
                    <button
                      type="button"
                      className="btn"
                      disabled={uploadingPhoto}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadingPhoto ? "Uploading..." : "Change Logo"}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      hidden
                    />
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

            {/* Form */}
            <form onSubmit={handleSave}>
              {/* Basic Detail Card */}
              <div className="card shadow-sm border-0 rounded-4 mb-4" style={{ overflow: "visible" }}>
                <div className="card-header bg-white py-3 border-bottom">
                  <h4 className="mb-0 fw-bold">Basic Detail</h4>
                </div>
                <div className="card-body p-4" style={{ overflow: "visible" }}>
                  <div className="row g-3">
                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label className="fw-medium mb-1">Company Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g. Acme Technologies"
                          required
                        />
                      </div>
                    </div>

                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label className="fw-medium mb-1">Email ID</label>
                        <input type="text" className="form-control" value={user.email} disabled />
                      </div>
                    </div>

                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label className="fw-medium mb-1">Website <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          value={website || ""}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="e.g. https://www.acme.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group" style={{ position: "relative" }}>
                        <label className="fw-medium mb-1">Location / Headquarter <span className="text-danger">*</span></label>
                        <CityLocationInput
                          value={location}
                          onChange={(val) => setLocation(val)}
                          placeholder="e.g. Bangalore, Karnataka, India"
                        />
                      </div>
                    </div>

                    <div className="col-xl-12 col-lg-12 col-md-12">
                      <div className="form-group">
                        <label className="fw-medium mb-1">Industry <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          value={industry || ""}
                          onChange={(e) => setIndustry(e.target.value)}
                          placeholder="e.g. Software, Healthcare"
                          required
                        />
                      </div>
                    </div>

                    <div className="col-xl-12 col-lg-12 col-md-12">
                      <div className="form-group">
                        <label className="fw-medium mb-1">About Company <span className="text-danger">*</span></label>
                        <textarea
                          className="form-control"
                          rows={4}
                          value={description || ""}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Write a brief overview of your company..."
                          required
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Culture & Workplace Life Card */}
              <div className="card shadow-sm border-0 rounded-4 mb-4">
                <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
                  <div>
                    <h4 className="mb-0 fw-bold">Culture &amp; Workplace Life</h4>
                    <p className="text-muted small mb-0">
                      Showcase your company culture, values, team events, and office photos on your public profile.
                    </p>
                  </div>
                  <span className="badge bg-light-primary text-primary px-3 py-2 rounded-pill">
                    <i className="fa-solid fa-heart me-1"></i>Public Showcase
                  </span>
                </div>
                <div className="card-body p-4">
                  {/* Culture & Values Textarea */}
                  <div className="form-group mb-4">
                    <label className="fw-medium mb-1">Culture, Values &amp; Life at Company</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={cultureBlurb}
                      onChange={(e) => setCultureBlurb(e.target.value)}
                      placeholder="Share what makes working at your company special (e.g., work-life balance, collaborative team, perks, regular hackathons, growth opportunities)..."
                    ></textarea>
                  </div>

                  {/* Company Photos Section */}
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                      <div>
                        <label className="fw-medium mb-0 d-block">Workplace &amp; Team Photos</label>
                        <span className="text-muted small">
                          Upload office, team, and culture images ({photos.length} uploaded)
                        </span>
                      </div>
                      <div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-main px-3 py-2 fw-medium rounded-3"
                          disabled={uploadingGallery}
                          onClick={() => photosInputRef.current?.click()}
                        >
                          {uploadingGallery ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>Uploading...
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-cloud-arrow-up me-2"></i>Add Photos
                            </>
                          )}
                        </button>
                        <input
                          ref={photosInputRef}
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleGalleryUpload}
                          hidden
                        />
                      </div>
                    </div>

                    {/* Photos Gallery Grid */}
                    {photos.length === 0 ? (
                      <div className="border border-dashed rounded-4 p-4 text-center bg-light">
                        <div className="mb-2">
                          <i className="fa-regular fa-images fs-2 text-muted"></i>
                        </div>
                        <p className="text-muted small mb-0">
                          No company photos added yet. Click &quot;Add Photos&quot; to upload workplace or team images.
                        </p>
                      </div>
                    ) : (
                      <div className="row g-3">
                        {photos.map((photoUrl, index) => (
                          <div className="col-xl-3 col-lg-4 col-md-6 col-6" key={index}>
                            <div
                              className="position-relative rounded-3 overflow-hidden border shadow-sm bg-white"
                              style={{ height: "160px" }}
                            >
                              <img
                                src={assetUrl(photoUrl) || photoUrl}
                                alt={`Company photo ${index + 1}`}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                              <button
                                type="button"
                                className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 rounded-circle p-1 d-flex align-items-center justify-content-center shadow"
                                style={{ width: "28px", height: "28px", fontSize: "12px" }}
                                onClick={() => handleRemovePhoto(index)}
                                title="Remove photo"
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Compliance Documents Card */}
              <div className="card shadow-sm border-0 rounded-4 mb-4">
                <div className="card-header bg-white py-3 border-bottom">
                  <h4 className="mb-0 fw-bold">Compliance Documents</h4>
                </div>
                <div className="card-body p-4">
                  <p className="text-muted small mb-4">
                    Upload your compliance documents for admin verification. Required for full dashboard access.
                  </p>
                  <div className="row g-3">
                    <div className="col-xl-4 col-lg-4 col-md-12">
                      <label className="fw-medium">GST Certificate</label>
                      {profile?.gstCertificateUrl ? (
                        <div className="d-flex align-items-center gap-2 mt-2">
                          <i className="fa-solid fa-circle-check text-success"></i>
                          <a
                            href={assetUrl(profile.gstCertificateUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View Document
                          </a>
                        </div>
                      ) : (
                        <div className="mt-2 text-warning">
                          <i className="fa-solid fa-triangle-exclamation"></i> Missing
                        </div>
                      )}
                      <input
                        type="file"
                        className="form-control mt-2"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleDocumentUpload("gstCertificateUrl", e)}
                      />
                    </div>

                    <div className="col-xl-4 col-lg-4 col-md-12">
                      <label className="fw-medium">Incorporation Certificate</label>
                      {profile?.incorporationCertUrl ? (
                        <div className="d-flex align-items-center gap-2 mt-2">
                          <i className="fa-solid fa-circle-check text-success"></i>
                          <a
                            href={assetUrl(profile.incorporationCertUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View Document
                          </a>
                        </div>
                      ) : (
                        <div className="mt-2 text-warning">
                          <i className="fa-solid fa-triangle-exclamation"></i> Missing
                        </div>
                      )}
                      <input
                        type="file"
                        className="form-control mt-2"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleDocumentUpload("incorporationCertUrl", e)}
                      />
                    </div>

                    <div className="col-xl-4 col-lg-4 col-md-12">
                      <label className="fw-medium">Signatory ID</label>
                      {profile?.signatoryIdUrl ? (
                        <div className="d-flex align-items-center gap-2 mt-2">
                          <i className="fa-solid fa-circle-check text-success"></i>
                          <a
                            href={assetUrl(profile.signatoryIdUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View Document
                          </a>
                        </div>
                      ) : (
                        <div className="mt-2 text-warning">
                          <i className="fa-solid fa-triangle-exclamation"></i> Missing
                        </div>
                      )}
                      <input
                        type="file"
                        className="form-control mt-2"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleDocumentUpload("signatoryIdUrl", e)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="row mb-5">
                <div className="col-lg-12 col-md-12">
                  <button
                    type="submit"
                    className="btn btn-main px-5 py-2.5 rounded-3 fw-medium"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>Saving...
                      </>
                    ) : (
                      "Save Profile"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
