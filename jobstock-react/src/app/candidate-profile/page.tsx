"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar7 from "@/components/Navbar7";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
import UploadResumeModal from "@/components/candidate-dashboard/UploadResumeModal";
import VerifyEmailModal from "@/components/candidate-dashboard/VerifyEmailModal";
import CityLocationInput from "@/components/CityLocationInput";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl, uploadFile } from "@/lib/api";
import { Toaster, toast } from "react-hot-toast";

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
      const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [copied, setCopied] = useState(false);

  const completedFields = [
    fullName.trim() !== "",
    headline.trim() !== "",
    location.trim() !== "",
    phone.trim() !== "",
    about.trim() !== "",
    skillsInput.trim() !== "",
    experienceYears.trim() !== "",
    !!profile?.profilePhotoUrl,
  ].filter(Boolean).length;

  const totalFields = 8;
  const completionPercentage = (completedFields / totalFields) * 100;
  const circleCircumference = 376.99;
  const strokeDashoffset = circleCircumference - (completionPercentage / 100) * circleCircumference;

  const referralLink = user
    ? typeof window !== "undefined"
      ? `${window.location.origin}/signup?ref=${user.userId}`
      : `http://localhost:3000/signup?ref=${user.userId}`
    : "";

  function handleCopyReferral() {
    if (referralLink && typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

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
        toast.error(err instanceof ApiError ? err.message : "Failed to load profile");
      } finally {
        setDataLoading(false);
      }
    })();
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
        
    if (phone && phone.trim() !== "" && !/^\d{10}$/.test(phone)) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }

    if (experienceYears !== "") {
      const expNum = Number(experienceYears);
      if (isNaN(expNum) || expNum < 0 || experienceYears.length > 2) {
        toast.error("Experience must be a positive number and cannot be more than 2 digits.");
        return;
      }
    }

    setSaving(true);
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
      toast.success("Profile saved successfully.");
      window.dispatchEvent(new CustomEvent('profile-updated'));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save profile");
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
      const updated = await api.patch<CandidateProfile>("/candidates/me", { profilePhotoUrl: url });
      setProfile(updated);
      toast.success("Profile photo updated.");
      window.dispatchEvent(new CustomEvent('profile-updated'));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to upload photo");
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
      <style jsx global>{`
        body {
          background-color: #f6fbf9 !important; /* Very light mint/cyan */
        }
        .dashboard-wrap, .dashboard-content {
          background-color: transparent !important;
        }
        .breadcrumb-item + .breadcrumb-item::before {
          content: "›" !important;
          font-size: 1.2rem;
          line-height: 1;
          vertical-align: top;
          color: #a0a8a6;
        }
        .prof-card-bg {
          position: relative;
          background: #ffffff;
          border: 1px solid #d0dad7;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }
        .prof-card-glow {
          position: absolute;
          top: -20%;
          right: -5%;
          width: 350px;
          height: 350px;
          border-radius: 50%;
          filter: blur(80px);
          background-color: #d8f5fa;
          z-index: 0;
          opacity: 0.9;
        }
        .prof-card-content {
          position: relative;
          z-index: 1;
        }
      `}</style>
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
        <CandidateSidebar active="profile" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4 pt-3">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-2 fs-2 fw-bold" style={{ color: '#0d362d' }}>Candidate Profile</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0" style={{ fontSize: '0.9rem' }}>
                    <li className="breadcrumb-item text-muted"><a href="#" className="text-decoration-none text-muted">Candidate</a></li>
                    <li className="breadcrumb-item text-muted"><a href="#" className="text-decoration-none text-muted">Dashboard</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-decoration-none fw-medium" style={{ color: '#44a388' }}>Candidate Profile</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">

            {/* Error and Success static alerts removed */}
            {dataLoading && <p className="text-muted">Loading profile...</p>}

            <form onSubmit={handleSave}>
              <div className="row gx-4 gy-4 mb-4">
                {/* Left Column */}
                <div className="col-xl-8 col-lg-7 d-flex flex-column gap-4">
                  {/* Top Profile Card */}
                  <div className="prof-card-bg p-4 p-md-5 mb-0">
                    <div className="prof-card-glow"></div>
                    <div className="prof-card-content d-flex flex-column flex-md-row gap-5">
                      {/* Left Column Avatar */}
                      <div className="d-flex flex-column align-items-center" style={{ width: '160px', flexShrink: 0 }}>
                        <div className="position-relative mb-3">
                          {profile?.profilePhotoUrl ? (
                            <img src={assetUrl(profile.profilePhotoUrl!)} alt="Avatar" className="rounded-circle border" style={{ width: '130px', height: '130px', objectFit: 'cover' }} />
                          ) : (
                            <div className="rounded-circle d-flex align-items-center justify-content-center bg-light text-muted border" style={{ width: '130px', height: '130px' }}>
                              <span className="small text-center px-2">Upload Photo</span>
                            </div>
                          )}
                          <div className="position-absolute start-50 translate-middle-x" style={{ bottom: '-15px' }}>
                            <span className="badge bg-white text-muted border rounded-pill shadow-sm px-3 py-2 fw-medium d-flex align-items-center" style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                              <i className={`fa-solid ${profile?.isVerified ? "fa-circle-check text-success" : "fa-ban"} me-2`} style={{ fontSize: '1rem', color: profile?.isVerified ? undefined : '#a0a8a6' }}></i>
                              {profile?.isVerified ? "Verified" : "Unverified"}
                            </span>
                          </div>
                        </div>
                        <div className="upload-btn-wrapper mt-4">
                          <button type="button" className="btn btn-link text-decoration-none fw-bold p-0" style={{ color: '#16574f', fontSize: '0.95rem' }} disabled={uploadingPhoto} onClick={() => fileInputRef.current?.click()}>
                            {uploadingPhoto ? "Uploading..." : "Change Profile"}
                          </button>
                          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} hidden />
                        </div>
                      </div>

                      {/* Right Column Profile Info */}
                      <div className="d-flex flex-column w-100">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <h2 className="fw-bold mb-1" style={{ color: '#161c1d', fontSize: '2rem' }}>{profile?.fullName || user.email}</h2>
                            <div className="fw-medium" style={{ color: '#27685c', fontSize: '1.1rem' }}>{profile?.headline || "No headline set"}</div>
                          </div>
                          <div className="text-end">
                            <div className="text-muted fw-bold mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>REFERRAL POINTS</div>
                            <div className="fw-bold" style={{ color: '#ff6b57', fontSize: '1.8rem', lineHeight: '1' }}>{profile?.referralPoints ?? 0}</div>
                          </div>
                        </div>

                        <div className="p-4 rounded-3 mb-4 mt-2" style={{ backgroundColor: '#f4f5f5', border: '1px solid #e1e5e5' }}>
                          <p className="mb-0 text-dark" style={{ fontSize: '1rem' }}>{profile?.about || "No bio added yet."}</p>
                        </div>

                        <div>
                          <div className="text-muted fw-bold mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>TOP SKILLS</div>
                          <div className="d-flex flex-wrap gap-2">
                            {(profile?.skills || []).length === 0 && <span className="text-muted small">No skills added</span>}
                            {(profile?.skills || []).map((s) => (
                              <span key={s} className="badge rounded-pill fw-medium px-4 py-2" style={{ backgroundColor: '#defaf8', color: '#185f52', fontSize: '0.9rem', border: '1px solid #caece8' }}>
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Basic Details Card */}
                  <div className="card mb-0" style={{ border: '1px solid #e1e5e5', borderRadius: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.01)' }}>
                    <div className="card-header bg-white border-bottom-0 pb-0 pt-4 px-4">
                      <h4 className="mb-0 fw-bold d-flex align-items-center" style={{ color: '#2b3936' }}>
                        <i className="fa-regular fa-file-lines me-2" style={{ color: '#1b5e54' }}></i>
                        Basic Details
                      </h4>
                      <hr className="mt-4 mb-0" style={{ borderTop: '1px solid #e1e5e5', opacity: 1 }} />
                    </div>
                    <div className="card-body p-4">
                      <div className="row gy-4">
                        <div className="col-xl-6 col-lg-6 col-md-12">
                          <div className="form-group mb-0">
                            <label className="fw-bold mb-2" style={{ fontSize: '0.85rem', color: '#4a5b57' }}>Your Name</label>
                            <input type="text" className="form-control" style={{ backgroundColor: '#fafbfb', borderColor: '#d0dad7' }} value={fullName} onChange={(e) => setFullName(e.target.value)} />
                          </div>
                        </div>

                        <div className="col-xl-6 col-lg-6 col-md-12">
                          <div className="form-group mb-0">
                            <label className="fw-bold mb-2" style={{ fontSize: '0.85rem', color: '#4a5b57' }}>Job Title / Headline</label>
                            <input type="text" className="form-control" style={{ backgroundColor: '#fafbfb', borderColor: '#d0dad7' }} value={headline} onChange={(e) => setHeadline(e.target.value)} />
                          </div>
                        </div>

                        <div className="col-xl-6 col-lg-6 col-md-12">
                          <div className="form-group mb-0">
                            <label className="fw-bold mb-2" style={{ fontSize: '0.85rem', color: '#4a5b57' }}>Experience (years)</label>
                            <input
                              type="number"
                              className="form-control"
                              style={{ backgroundColor: '#fafbfb', borderColor: '#d0dad7' }}
                              min="0"
                              max="99"
                              value={experienceYears}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "") {
                                  setExperienceYears("");
                                  return;
                                }
                                const clean = val.replace(/\D/g, "");
                                if (clean.length > 2) return;
                                setExperienceYears(clean);
                              }}
                            />
                          </div>
                        </div>

                        <div className="col-xl-6 col-lg-6 col-md-12">
                          <div className="form-group mb-0">
                            <label className="fw-bold mb-2" style={{ fontSize: '0.85rem', color: '#4a5b57' }}>Skills (comma separated)</label>
                            <input type="text" className="form-control" style={{ backgroundColor: '#fafbfb', borderColor: '#d0dad7' }} value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} />
                          </div>
                        </div>

                        <div className="col-xl-12 col-lg-12 col-md-12">
                          <div className="form-group mb-0">
                            <label className="d-flex justify-content-between w-100 fw-bold mb-2" style={{ fontSize: '0.85rem', color: '#4a5b57' }}>
                              <span>About Info</span>
                            </label>
                            <textarea
                              className="form-control"
                              style={{ height: '120px', backgroundColor: '#fafbfb', borderColor: '#d0dad7' }}
                              value={about}
                              maxLength={300}
                              onChange={(e) => setAbout(e.target.value)}
                            ></textarea>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="d-flex justify-content-end mt-2">
                    <button type="submit" className="btn btn-main px-4 py-2" style={{ borderRadius: '0.5rem', fontWeight: '600' }} disabled={saving}>
                      {saving ? "Saving..." : "Save Profile"}
                    </button>
                  </div>

                </div>

                {/* Right Column */}
                <div className="col-xl-4 col-lg-5 d-flex flex-column" style={{ gap: '2.5rem' }}>
                  
                  {/* Contact Info Card */}
                  <div className="card mb-0" style={{ border: '1px solid #e1e5e5', borderRadius: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.01)' }}>
                    <div className="card-header bg-white border-bottom-0 pb-0 pt-4 px-4">
                      <h4 className="mb-0 fw-bold d-flex align-items-center" style={{ color: '#2b3936' }}>
                        <i className="fa-regular fa-address-book me-2" style={{ color: '#1b5e54' }}></i>
                        Contact Info
                      </h4>
                      <hr className="mt-4 mb-0" style={{ borderTop: '1px solid #e1e5e5', opacity: 1 }} />
                    </div>
                    <div className="card-body p-4">
                      <div className="d-flex flex-column gap-4">
                        
                        <div className="d-flex align-items-center gap-3">
                          <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '48px', height: '48px', backgroundColor: '#f0f4f4', color: '#1b5e54', fontSize: '1.2rem' }}>
                            <i className="fa-regular fa-envelope"></i>
                          </div>
                          <div className="flex-grow-1">
                            <div className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>Email</div>
                            <input type="text" className="form-control form-control-sm" value={user.email} disabled style={{ backgroundColor: '#ffffff', borderColor: '#e1e5e5', color: '#4a5b57' }} />
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-3">
                          <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '48px', height: '48px', backgroundColor: '#f0f4f4', color: '#1b5e54', fontSize: '1.2rem' }}>
                            <i className="fa-solid fa-phone"></i>
                          </div>
                          <div className="flex-grow-1">
                            <div className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>Phone</div>
                            <input
                              type="tel"
                              className="form-control form-control-sm"
                              style={{ backgroundColor: '#ffffff', borderColor: '#e1e5e5', color: '#4a5b57' }}
                              maxLength={10}
                              value={phone}
                              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            />
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-3">
                          <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '48px', height: '48px', backgroundColor: '#f0f4f4', color: '#1b5e54', fontSize: '1.2rem' }}>
                            <i className="fa-solid fa-location-dot"></i>
                          </div>
                          <div className="flex-grow-1">
                            <div className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>Location</div>
                            <CityLocationInput
                              value={location}
                              onChange={setLocation}
                              placeholder=""
                              className="form-control form-control-sm"
                              openDirection="up"
                            />
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* Referral Link Card */}
                  <div className="card mb-0 position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #37957b, #195245)', border: 'none', borderRadius: '1rem', boxShadow: '0 4px 15px rgba(25, 82, 69, 0.2)' }}>
                    <div className="card-body p-4 position-relative z-1 text-white">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h4 className="mb-0 text-white fw-bold d-flex align-items-center">
                          <i className="fa-solid fa-gift me-2" style={{ opacity: 0.9 }}></i>
                          Referral<br/>Link
                        </h4>
                        <span className="badge rounded-pill px-3 py-2" style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)', color: '#ffc8be', fontWeight: '500' }}>
                          100 Pts /<br/>Sign-up
                        </span>
                      </div>
                      
                      <p className="mb-4" style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                        Share your unique link with friends to earn points.
                      </p>
                      
                      <div className="form-group mb-3">
                        <label className="text-white mb-1" style={{ fontSize: '0.8rem', opacity: 0.9 }}>Your Link</label>
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control border-0 text-white"
                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.15)', fontSize: '0.9rem' }}
                            value={referralLink}
                            readOnly
                          />
                          <button
                            type="button"
                            className="btn px-3"
                            style={{ backgroundColor: '#ff7059', color: 'white' }}
                            onClick={handleCopyReferral}
                          >
                            <i className={`fa-solid ${copied ? "fa-check" : "fa-copy"}`}></i>
                          </button>
                        </div>
                      </div>

                      <div className="form-group mb-1">
                        <label className="text-white mb-1" style={{ fontSize: '0.8rem', opacity: 0.9 }}>Referral Code</label>
                        <input
                          type="text"
                          className="form-control border-0 text-white"
                          style={{ backgroundColor: 'rgba(0, 0, 0, 0.15)', fontSize: '0.9rem' }}
                          value={user?.userId ?? ""}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </form>

          </div>

          {/* footer removed */}
        </div>

      </div>

      <VerifyEmailModal />
      <UploadResumeModal />
    </>
  );
}
