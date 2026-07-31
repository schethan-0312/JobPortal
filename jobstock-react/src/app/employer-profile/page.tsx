"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar8 from "@/components/Navbar8";
import EmployerSidebar from "@/components/employer-dashboard/EmployerSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl, uploadFile } from "@/lib/api";

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
  cultureBlurb: string | null;
  photos: string[];
}

export default function EmployerProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [industry, setIndustry] = useState("");
  const [cultureBlurb, setCultureBlurb] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCulturePhoto, setUploadingCulturePhoto] = useState(false);
  const culturePhotoInputRef = useRef<HTMLInputElement>(null);

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
        setError(err instanceof ApiError ? err.message : "Failed to load profile");
      } finally {
        setDataLoading(false);
      }
    })();
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await api.patch<EmployerProfile>("/employers/me", {
        companyName,
        description,
        website,
        location,
        industry,
        cultureBlurb,
      });
      setProfile(updated);
      setSuccess("Profile saved successfully.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleCulturePhotoAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photos.length >= 12) {
      setError("You can upload up to 12 culture photos.");
      return;
    }
    setUploadingCulturePhoto(true);
    setError(null);
    try {
      const { url } = await uploadFile<{ url: string }>("/uploads/image", file);
      const nextPhotos = [...photos, url];
      const updated = await api.patch<EmployerProfile>("/employers/me", { photos: nextPhotos });
      setProfile(updated);
      setPhotos(updated.photos);
      setSuccess("Culture photo added.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to upload photo");
    } finally {
      setUploadingCulturePhoto(false);
      if (culturePhotoInputRef.current) culturePhotoInputRef.current.value = "";
    }
  }

  async function removeCulturePhoto(url: string) {
    const nextPhotos = photos.filter((p) => p !== url);
    try {
      const updated = await api.patch<EmployerProfile>("/employers/me", { photos: nextPhotos });
      setProfile(updated);
      setPhotos(updated.photos);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to remove photo");
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setError(null);
    try {
      const { url } = await uploadFile<{ url: string }>("/uploads/image", file);
      const updated = await api.patch<EmployerProfile>("/employers/me", { logoUrl: url });
      setProfile(updated);
      setSuccess("Logo updated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to upload logo");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (loading || !user || user.role !== "EMPLOYER") {
    return null;
  }

  return (
    <>
      <Navbar8 />

      <div className="dashboard-wrap bg-light">
        <EmployerSidebar active="profile" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
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

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            {dataLoading && <p className="text-muted">Loading profile...</p>}

            <div className="dashboard-profle-wrapper mb-4">
              <div className="dash-prf-start">
                <div className="profile-avatar position-ralative mb-3">
                  <img className="avatar" src={assetUrl(profile?.logoUrl) || "/assets/img/l-12.png"} alt="Avatar" />
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

            {/* Card Row */}
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <div>
                  <h4>Company Culture Page</h4>
                  <p className="text-muted mb-0 mt-1">Shown publicly on your company page to candidates browsing employers.</p>
                </div>
                {profile && (
                  <a href={`/employer-detail/${profile.id}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-main">
                    View public page
                  </a>
                )}
              </div>
              <div className="card-body">
                <div className="form-group mb-3">
                  <label>Culture &amp; values</label>
                  <textarea
                    className="form-control ht-80"
                    placeholder="What's it like to work here? Team culture, values, perks..."
                    value={cultureBlurb}
                    onChange={(e) => setCultureBlurb(e.target.value)}
                  />
                  <p className="small text-muted mt-1">
                    This is only saved when you click &quot;Save Profile&quot; above.
                  </p>
                </div>

                <label className="d-block mb-2">Photos</label>
                <div className="d-flex flex-wrap gap-3 mb-3">
                  {photos.map((url) => (
                    <div key={url} className="position-relative">
                      <img src={assetUrl(url) ?? url} alt="" width={100} height={100} style={{ objectFit: "cover", borderRadius: 8 }} />
                      <button
                        type="button"
                        className="btn btn-sm btn-danger position-absolute top-0 end-0"
                        style={{ padding: "0 6px", transform: "translate(30%,-30%)", borderRadius: "50%" }}
                        onClick={() => removeCulturePhoto(url)}
                        title="Remove photo"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" className="btn btn-sm btn-outline-main" disabled={uploadingCulturePhoto} onClick={() => culturePhotoInputRef.current?.click()}>
                  {uploadingCulturePhoto ? "Uploading..." : "Add photo"}
                </button>
                <input ref={culturePhotoInputRef} type="file" accept="image/*" onChange={handleCulturePhotoAdd} hidden />
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
