"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar7 from "@/components/Navbar7";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
import UploadResumeModal from "@/components/candidate-dashboard/UploadResumeModal";
import VerifyEmailModal from "@/components/candidate-dashboard/VerifyEmailModal";
import NotificationChannelsCard from "@/components/NotificationChannelsCard";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl, uploadFile } from "@/lib/api";

interface ExperienceEntry {
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

interface EducationEntry {
  degree: string;
  institution: string;
  startYear?: string;
  endYear?: string;
}

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
  githubUsername: string | null;
  githubProfileUrl: string | null;
  githubAvatarUrl: string | null;
  linkedinProfileUrl: string | null;
  videoProfileUrl: string | null;
  experienceEntries: ExperienceEntry[] | null;
  educationEntries: EducationEntry[] | null;
}

interface SkillAssessmentSummary {
  skill: string;
  passed: boolean | null;
  status: string;
}

interface ProfileViewsResponse {
  views: Array<{
    id: string;
    createdAt: string;
    viewer: { employer: { companyName: string; logoUrl: string | null } | null };
  }>;
  total: number;
}

interface SocialAuthStatus {
  github: boolean;
  linkedin: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
}

interface GamificationProgress {
  profileCompletionPercent: number;
  achievements: Achievement[];
  earnedCount: number;
  totalCount: number;
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
  const [socialStatus, setSocialStatus] = useState<SocialAuthStatus>({ github: false, linkedin: false });
  const [socialBusy, setSocialBusy] = useState<"github" | "linkedin" | null>(null);
  const [gamification, setGamification] = useState<GamificationProgress | null>(null);
  const [profileViews, setProfileViews] = useState<ProfileViewsResponse | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [passedSkills, setPassedSkills] = useState<Set<string>>(new Set());

  const [experienceEntries, setExperienceEntries] = useState<ExperienceEntry[]>([]);
  const [newExperience, setNewExperience] = useState<ExperienceEntry>({ title: "", company: "", startDate: "", endDate: "", description: "" });
  const [savingExperience, setSavingExperience] = useState(false);

  const [educationEntries, setEducationEntries] = useState<EducationEntry[]>([]);
  const [newEducation, setNewEducation] = useState<EducationEntry>({ degree: "", institution: "", startYear: "", endYear: "" });
  const [savingEducation, setSavingEducation] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "CANDIDATE")) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    api.get<SocialAuthStatus>("/social-auth/status").then(setSocialStatus).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user || user.role !== "CANDIDATE") return;
    api.get<GamificationProgress>("/gamification/me").then(setGamification).catch(() => {});
  }, [user, profile]);

  useEffect(() => {
    if (!user || user.role !== "CANDIDATE") return;
    api.get<ProfileViewsResponse>("/candidates/profile-views/mine").then(setProfileViews).catch(() => {});
  }, [user]);

  async function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    setError(null);
    try {
      const { url } = await uploadFile<{ url: string }>("/uploads/video", file);
      const updated = await api.patch<CandidateProfile>("/candidates/me", { videoProfileUrl: url });
      setProfile(updated);
      setSuccess("Video profile uploaded.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to upload video");
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  }

  // Handle the redirect back from the OAuth callback (?github=connected|error, ?linkedin=connected|error).
  useEffect(() => {
    if (!user || user.role !== "CANDIDATE") return;
    const params = new URLSearchParams(window.location.search);
    const github = params.get("github");
    const linkedin = params.get("linkedin");
    if (github === "connected") setSuccess("GitHub account connected successfully.");
    else if (github === "error") setError("Could not connect your GitHub account. Please try again.");
    if (linkedin === "connected") setSuccess("LinkedIn account connected successfully.");
    else if (linkedin === "error") setError("Could not connect your LinkedIn account. Please try again.");
    if (github || linkedin) {
      window.history.replaceState({}, "", window.location.pathname);
      api.get<CandidateProfile>("/candidates/me").then(setProfile).catch(() => {});
    }
  }, [user]);

  async function connectGithub() {
    setSocialBusy("github");
    try {
      const { url } = await api.get<{ url: string }>("/social-auth/github/start");
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not start GitHub connection");
      setSocialBusy(null);
    }
  }

  async function disconnectGithub() {
    setSocialBusy("github");
    try {
      const updated = await api.delete<CandidateProfile>("/social-auth/github");
      setProfile(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not disconnect GitHub");
    } finally {
      setSocialBusy(null);
    }
  }

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
        setExperienceEntries(p.experienceEntries || []);
        setEducationEntries(p.educationEntries || []);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load profile");
      } finally {
        setDataLoading(false);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== "CANDIDATE") return;
    api
      .get<SkillAssessmentSummary[]>("/skill-assessment/mine")
      .then((assessments) => {
        setPassedSkills(new Set(assessments.filter((a) => a.passed).map((a) => a.skill.toLowerCase())));
      })
      .catch(() => {});
  }, [user]);

  async function saveExperience(entries: ExperienceEntry[]) {
    setSavingExperience(true);
    setError(null);
    try {
      const updated = await api.patch<CandidateProfile>("/candidates/me", { experienceEntries: entries });
      setProfile(updated);
      setExperienceEntries(updated.experienceEntries || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save experience");
    } finally {
      setSavingExperience(false);
    }
  }

  async function addExperience() {
    if (!newExperience.title.trim() || !newExperience.company.trim() || !newExperience.startDate.trim()) return;
    const next = [...experienceEntries, newExperience];
    await saveExperience(next);
    setNewExperience({ title: "", company: "", startDate: "", endDate: "", description: "" });
  }

  async function removeExperience(index: number) {
    const next = experienceEntries.filter((_, i) => i !== index);
    await saveExperience(next);
  }

  async function saveEducation(entries: EducationEntry[]) {
    setSavingEducation(true);
    setError(null);
    try {
      const updated = await api.patch<CandidateProfile>("/candidates/me", { educationEntries: entries });
      setProfile(updated);
      setEducationEntries(updated.educationEntries || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save education");
    } finally {
      setSavingEducation(false);
    }
  }

  async function addEducation() {
    if (!newEducation.degree.trim() || !newEducation.institution.trim()) return;
    const next = [...educationEntries, newEducation];
    await saveEducation(next);
    setNewEducation({ degree: "", institution: "", startYear: "", endYear: "" });
  }

  async function removeEducation(index: number) {
    const next = educationEntries.filter((_, i) => i !== index);
    await saveEducation(next);
  }

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
                        <div className="update-status d-flex align-items-center gap-3">
                          <span className="text-sm opacity-75">Referral points: {profile?.referralPoints ?? 0}</span>
                          {profileViews && (
                            <span className="text-sm opacity-75" title="Employers who opened your profile">
                              <i className="fa-solid fa-eye me-1"></i>{profileViews.total} profile view{profileViews.total === 1 ? "" : "s"}
                            </span>
                          )}
                        </div>
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
                      <div className="jbs-grid-job-edrs-group mt-1 d-flex flex-wrap gap-2">
                        {(profile?.skills || []).length === 0 && <span>No skills added</span>}
                        {(profile?.skills || []).map((s) => {
                          const verified = passedSkills.has(s.toLowerCase());
                          return (
                            <span
                              key={s}
                              title={verified ? "Verified via a passed skill assessment" : "Self-declared"}
                              className={verified ? "text-success fw-medium" : ""}
                            >
                              {verified && <i className="fa-solid fa-circle-check me-1"></i>}
                              {s}
                            </span>
                          );
                        })}
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

            {gamification && (
              <div className="card mb-4">
                <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <h4 className="mb-0">Your Progress</h4>
                  <span className="badge bg-main-subtle text-main border border-main">
                    {gamification.earnedCount}/{gamification.totalCount} badges earned
                  </span>
                </div>
                <div className="card-body">
                  <div className="mb-4">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="small fw-medium">Profile Completion</span>
                      <span className="small fw-medium">{gamification.profileCompletionPercent}%</span>
                    </div>
                    <div className="progress" style={{ height: 8 }}>
                      <div
                        className="progress-bar bg-main"
                        role="progressbar"
                        style={{ width: `${gamification.profileCompletionPercent}%` }}
                        aria-valuenow={gamification.profileCompletionPercent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                  </div>
                  <div className="row g-3">
                    {gamification.achievements.map((a) => (
                      <div className="col-md-3 col-sm-6" key={a.id}>
                        <div
                          className={`text-center p-3 border rounded h-100 ${a.earned ? "border-success bg-success-subtle" : "border-secondary opacity-50"}`}
                          title={a.description}
                        >
                          <i className={`${a.icon} fs-3 mb-2 d-block ${a.earned ? "text-success" : "text-secondary"}`}></i>
                          <div className="small fw-medium">{a.title}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {profileViews && profileViews.views.length > 0 && (
              <div className="card mb-4">
                <div className="card-header">
                  <h4 className="mb-0">Who Viewed Your Profile</h4>
                </div>
                <div className="card-body">
                  <div className="d-flex flex-column gap-2">
                    {profileViews.views.slice(0, 8).map((v) => (
                      <div key={v.id} className="d-flex align-items-center justify-content-between border-bottom pb-2">
                        <div className="d-flex align-items-center gap-2">
                          <img
                            src={assetUrl(v.viewer.employer?.logoUrl) || "/assets/img/l-1.png"}
                            width={28}
                            height={28}
                            style={{ objectFit: "cover", borderRadius: 4 }}
                            alt=""
                          />
                          <span className="small">{v.viewer.employer?.companyName ?? "An employer"}</span>
                        </div>
                        <span className="small text-muted">{new Date(v.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Experience Timeline */}
            <div className="card mb-4">
              <div className="card-header">
                <h4 className="mb-0">Experience</h4>
              </div>
              <div className="card-body">
                {experienceEntries.length === 0 && <p className="text-muted small mb-3">No experience added yet.</p>}
                <div className="position-relative ps-4 mb-4" style={{ borderLeft: experienceEntries.length > 0 ? "2px solid #e9ecef" : "none" }}>
                  {experienceEntries.map((exp, i) => (
                    <div key={i} className="position-relative mb-4" style={{ marginLeft: -1 }}>
                      <div
                        className="position-absolute bg-main rounded-circle"
                        style={{ width: 10, height: 10, left: -25, top: 4 }}
                      />
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-0">{exp.title}</h6>
                          <div className="small text-muted">{exp.company}</div>
                          <div className="small text-muted">{exp.startDate} &ndash; {exp.endDate || "Present"}</div>
                          {exp.description && <p className="small mt-1 mb-0">{exp.description}</p>}
                        </div>
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeExperience(i)} disabled={savingExperience}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="row g-2 align-items-end border-top pt-3">
                  <div className="col-md-3">
                    <label className="form-label small">Title</label>
                    <input type="text" className="form-control form-control-sm" value={newExperience.title} onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small">Company</label>
                    <input type="text" className="form-control form-control-sm" value={newExperience.company} onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })} />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small">Start</label>
                    <input type="text" className="form-control form-control-sm" placeholder="Jan 2022" value={newExperience.startDate} onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })} />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small">End</label>
                    <input type="text" className="form-control form-control-sm" placeholder="Present" value={newExperience.endDate} onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })} />
                  </div>
                  <div className="col-md-2">
                    <button type="button" className="btn btn-sm btn-main w-100" disabled={savingExperience} onClick={addExperience}>
                      {savingExperience ? "Saving..." : "+ Add"}
                    </button>
                  </div>
                  <div className="col-md-12">
                    <label className="form-label small">Description (optional)</label>
                    <textarea className="form-control form-control-sm" value={newExperience.description} onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>

            {/* Education */}
            <div className="card mb-4">
              <div className="card-header">
                <h4 className="mb-0">Education</h4>
              </div>
              <div className="card-body">
                {educationEntries.length === 0 && <p className="text-muted small mb-3">No education added yet.</p>}
                <div className="d-flex flex-column gap-3 mb-3">
                  {educationEntries.map((edu, i) => (
                    <div key={i} className="d-flex justify-content-between align-items-start border-bottom pb-2">
                      <div>
                        <h6 className="mb-0">{edu.degree}</h6>
                        <div className="small text-muted">{edu.institution}</div>
                        {(edu.startYear || edu.endYear) && (
                          <div className="small text-muted">{edu.startYear} &ndash; {edu.endYear || "Present"}</div>
                        )}
                      </div>
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeEducation(i)} disabled={savingEducation}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <div className="row g-2 align-items-end border-top pt-3">
                  <div className="col-md-4">
                    <label className="form-label small">Degree</label>
                    <input type="text" className="form-control form-control-sm" value={newEducation.degree} onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small">Institution</label>
                    <input type="text" className="form-control form-control-sm" value={newEducation.institution} onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })} />
                  </div>
                  <div className="col-md-1">
                    <label className="form-label small">Start</label>
                    <input type="text" className="form-control form-control-sm" placeholder="2018" value={newEducation.startYear} onChange={(e) => setNewEducation({ ...newEducation, startYear: e.target.value })} />
                  </div>
                  <div className="col-md-1">
                    <label className="form-label small">End</label>
                    <input type="text" className="form-control form-control-sm" placeholder="2022" value={newEducation.endYear} onChange={(e) => setNewEducation({ ...newEducation, endYear: e.target.value })} />
                  </div>
                  <div className="col-md-2">
                    <button type="button" className="btn btn-sm btn-main w-100" disabled={savingEducation} onClick={addEducation}>
                      {savingEducation ? "Saving..." : "+ Add"}
                    </button>
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

              {/* Card Row */}
              <div className="card">
                <div className="card-header">
                  <h4>Connected Accounts</h4>
                  <p className="text-muted mb-0 mt-1">
                    Link your GitHub and LinkedIn to build trust with employers viewing your profile.
                  </p>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="d-flex align-items-center justify-content-between border rounded p-3">
                        <div className="d-flex align-items-center gap-3">
                          {profile?.githubAvatarUrl ? (
                            <img src={profile.githubAvatarUrl} alt="GitHub avatar" width={40} height={40} style={{ borderRadius: "50%" }} />
                          ) : (
                            <i className="fa-brands fa-github fs-3"></i>
                          )}
                          <div>
                            <div className="fw-medium">GitHub</div>
                            {profile?.githubUsername ? (
                              <a href={profile.githubProfileUrl ?? undefined} target="_blank" rel="noreferrer" className="small text-muted">
                                @{profile.githubUsername}
                              </a>
                            ) : (
                              <span className="small text-muted">Not connected</span>
                            )}
                          </div>
                        </div>
                        {profile?.githubUsername ? (
                          <button type="button" className="btn btn-sm btn-outline-danger" disabled={socialBusy === "github"} onClick={disconnectGithub}>
                            {socialBusy === "github" ? "..." : "Disconnect"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm btn-main"
                            disabled={!socialStatus.github || socialBusy === "github"}
                            onClick={connectGithub}
                            title={!socialStatus.github ? "GitHub connection is not configured yet" : undefined}
                          >
                            {socialBusy === "github" ? "..." : socialStatus.github ? "Connect" : "Unavailable"}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="d-flex align-items-center justify-content-between border rounded p-3">
                        <div className="d-flex align-items-center gap-3">
                          <i className="fa-brands fa-linkedin fs-3"></i>
                          <div>
                            <div className="fw-medium">LinkedIn</div>
                            {profile?.linkedinProfileUrl ? (
                              <a href={profile.linkedinProfileUrl} target="_blank" rel="noreferrer" className="small text-muted">
                                View profile
                              </a>
                            ) : (
                              <span className="small text-muted">Not connected</span>
                            )}
                          </div>
                        </div>
                        <button type="button" className="btn btn-sm btn-outline-secondary" disabled>
                          Coming soon
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Card Row End */}

              {/* Card Row */}
              <div className="card">
                <div className="card-header">
                  <h4>Video Profile</h4>
                  <p className="text-muted mb-0 mt-1">A short intro video — employers remember faces, not just resumes.</p>
                </div>
                <div className="card-body">
                  {profile?.videoProfileUrl && (
                    <video
                      src={assetUrl(profile.videoProfileUrl) ?? undefined}
                      controls
                      style={{ maxWidth: 360, borderRadius: 8 }}
                      className="mb-3 d-block"
                    />
                  )}
                  <button type="button" className="btn btn-sm btn-outline-main" disabled={uploadingVideo} onClick={() => videoInputRef.current?.click()}>
                    {uploadingVideo ? "Uploading..." : profile?.videoProfileUrl ? "Replace video" : "Upload video"}
                  </button>
                  <input ref={videoInputRef} type="file" accept="video/mp4,video/webm" onChange={handleVideoChange} hidden />
                  <p className="small text-muted mt-2 mb-0">MP4 or WEBM, up to 50MB.</p>
                </div>
              </div>
              {/* Card Row End */}

              <NotificationChannelsCard />

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
