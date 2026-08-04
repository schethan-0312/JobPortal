"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar7 from "@/components/Navbar7";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
import UploadResumeModal from "@/components/candidate-dashboard/UploadResumeModal";
import VerifyEmailModal from "@/components/candidate-dashboard/VerifyEmailModal";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl, uploadFile } from "@/lib/api";

interface CandidateProfile {
  id: string;
  userId: string;
  fullName: string;
  headline: string | null;
  location: string | null;
  phone: string | null;
  about: string | null;
  skills: string[];
  experienceYears: number | null;
  resumeUrl: string | null;
  profilePhotoUrl: string | null;
  isVerified: boolean;
  referralPoints: number;
}

export default function CandidateProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [about, setAbout] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [experienceYears, setExperienceYears] = useState("");

  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "CANDIDATE")) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "CANDIDATE") return;
    (async () => {
      setDataLoading(true);
      try {
        const p = await api.get<CandidateProfile>("/candidates/me");
        setProfile(p);
        setFullName(p.fullName || "");
        setHeadline(p.headline || "");
        setLocation(p.location || "");
        setPhone(p.phone || "");
        setAbout(p.about || "");
        setSkillsInput((p.skills || []).join(", "));
        setExperienceYears(p.experienceYears != null ? String(p.experienceYears) : "");
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
      const skills = skillsInput.split(",").map((s) => s.trim()).filter(Boolean);
      const updated = await api.patch<CandidateProfile>("/candidates/me", {
        fullName,
        headline,
        location,
        phone,
        about,
        skills,
        experienceYears: experienceYears ? Number(experienceYears) : undefined,
      });
      setProfile(updated);
      setSuccess("Profile saved successfully.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setError(null);
    try {
      const { url } = await uploadFile<{ url: string }>("/uploads/image", file);
      const updated = await api.patch<CandidateProfile>("/candidates/me", { profilePhotoUrl: url });
      setProfile(updated);
      setSuccess("Profile photo updated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (loading || !user || user.role !== "CANDIDATE") {
    return null;
  }

  return (
    <>
      <Navbar7 />

      <div className="dashboard-wrap bg-light">
        <CandidateSidebar active="profile" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Candidate Profile</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Candidate</a></li>
                    <li className="breadcrumb-item text-muted"><a href="#">Dashboard</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Candidate Profile</a></li>
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
                  <svg>
                    <circle className="bg" cx={70} cy={70} r={60}></circle>
                    <circle className="progress" cx={70} cy={70} r={60} strokeDasharray="326.72" strokeDashoffset="326.72"></circle>
                  </svg>
                  <img className="avatar" src={assetUrl(profile?.profilePhotoUrl) || "/assets/img/avatar.jpg"} alt="Avatar" />
                  <div className="position-absolute bottom-0 start-50 translate-middle-x">
                    <span className="badge badge-md bg-white text-main rounded-pill fw-medium shadow-sm px-3 py-2">{profile?.isVerified ? "Verified" : "Unverified"}</span>
                  </div>
                </div>
                <div className="dash-prf-start-bottom">
                  <div className="upload-btn-wrapper small">
                    <button type="button" className="btn" disabled={uploadingPhoto} onClick={() => fileInputRef.current?.click()}>
                      {uploadingPhoto ? "Uploading..." : "Change Profile"}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} hidden />
                  </div>
                </div>
              </div>
              <div className="dash-prf-end">
                <div className="row gx-xl-5 g-4">

                  {/* Profile info */}
                  <div className="col-xl-8 col-lg-8">
                    <div className="dash-prfs-caption mb-4">
                      <div className="dash-prfs-title d-flex align-items-center justify-content-between">
                        <div className="avatar-title"><h4>{profile?.fullName || user.email}</h4></div>
                        <div className="update-status"><span className="text-sm opacity-75">Referral points: {profile?.referralPoints ?? 0}</span></div>
                      </div>
                      <div className="dash-prfs-subtitle">
                        <div className="jbs-job-mrch-lists mb-2">
                          <div className="single-mrch-lists">
                            <span>{profile?.headline || "No headline set"}</span>
                          </div>
                        </div>
                        <div className="short-description">
                          <p>{profile?.about || "No bio added yet."}</p>
                        </div>
                      </div>
                      <div className="jbs-grid-job-edrs-group mt-1">
                        {(profile?.skills || []).length === 0 && <span>No skills added</span>}
                        {(profile?.skills || []).map((s) => (
                          <span key={s}>{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Completion Profile */}
                  <div className="col-xl-4 col-lg-4">
                    <div className="card rpunded-3 p-4" style={{ background: "#fff5ee" }}>
                      <div className="completion-group d-flex flex-column gap-3 mb-3">
                        <div className="d-flex align-items-center justify-content-between gap-2">
                          <div className="task-title"><span>Email</span></div>
                          <div className="complete-status"><span className="badge badge-md bg-white text-dark fw-medium rounded-pill">{user.email}</span></div>
                        </div>
                        <div className="d-flex align-items-center justify-content-between gap-2">
                          <div className="task-title"><span>Phone</span></div>
                          <div className="complete-status"><span className="badge badge-md bg-white text-dark fw-medium rounded-pill">{profile?.phone || "-"}</span></div>
                        </div>
                        <div className="d-flex align-items-center justify-content-between gap-2">
                          <div className="task-title"><span>Location</span></div>
                          <div className="complete-status"><span className="badge badge-md bg-white text-dark fw-medium rounded-pill">{profile?.location || "-"}</span></div>
                        </div>
                      </div>
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
                        <label>Your Name</label>
                        <input type="text" className="form-control" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                      </div>
                    </div>

                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label>Job Title / Headline</label>
                        <input type="text" className="form-control" value={headline} onChange={(e) => setHeadline(e.target.value)} />
                      </div>
                    </div>

                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label>Experience (years)</label>
                        <input type="number" className="form-control" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} />
                      </div>
                    </div>

                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label>Skills (comma separated)</label>
                        <input type="text" className="form-control" value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} />
                      </div>
                    </div>

                    <div className="col-xl-12 col-lg-12 col-md-12">
                      <div className="form-group">
                        <label>About Info</label>
                        <textarea className="form-control ht-80" value={about} onChange={(e) => setAbout(e.target.value)}></textarea>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
              {/* Card Row End */}

              {/* Card Row */}
              <div className="card">
                <div className="card-header">
                  <h4>Contact Detail</h4>
                </div>
                <div className="card-body">
                  <div className="row">

                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label>Your Email</label>
                        <input type="text" className="form-control" value={user.email} disabled />
                      </div>
                    </div>

                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label>Phone no.</label>
                        <input type="text" className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} />
                      </div>
                    </div>

                    <div className="col-xl-6 col-lg-6 col-md-12">
                      <div className="form-group">
                        <label>Location</label>
                        <input type="text" className="form-control" value={location} onChange={(e) => setLocation(e.target.value)} />
                      </div>
                    </div>

                  </div>
                </div>
              </div>
              {/* Card Row End */}

              {/* Submit Busston */}
              <div className="row">
                <div className="col-lg-12 col-md-12">
                  <button type="submit" className="btn ft--medium btn-main" disabled={saving}>{saving ? "Saving..." : "Save Profile"}</button>
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

      <VerifyEmailModal />
      <UploadResumeModal />
    </>
  );
}
