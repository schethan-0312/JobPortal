"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar7 from "@/components/Navbar7";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
import UploadResumeModal from "@/components/candidate-dashboard/UploadResumeModal";
import EducationModals, { EducationInput, ExperienceInput, CertificationInput } from "@/components/candidate-dashboard/EducationModals";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl } from "@/lib/api";
import { Toaster, toast } from "react-hot-toast";

interface CandidateProfile {
  id: string;
  resumeUrl: string | null;
  summary: string | null;
  skills: string[];
  languages: string[];
  experienceYears: number | null;
  educations: EducationInput[];
  experiences: ExperienceInput[];
  certifications: CertificationInput[];
  projects: any[];
}

export default function CandidateResumePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [resumeUrl, setResumeUrl] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [languagesInput, setLanguagesInput] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [summary, setSummary] = useState("");

  const [editEdu, setEditEdu] = useState<{ data: EducationInput; index: number } | null>(null);
  const [editExp, setEditExp] = useState<{ data: ExperienceInput; index: number } | null>(null);
  const [editCert, setEditCert] = useState<{ data: CertificationInput; index: number } | null>(null);
  const [editProj, setEditProj] = useState<{ data: any; index: number } | null>(null);

  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

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
        const draftStr = sessionStorage.getItem("resumeDraft");
        if (draftStr) {
          const draft = JSON.parse(draftStr);
          setProfile({
            ...draft,
            id: 'draft',
            educations: draft.educations || [],
            experiences: draft.experiences || [],
            certifications: draft.certifications || [],
            projects: draft.projects || [],
          } as any);
          setResumeUrl(draft.resumeUrl || "");
          setSkillsInput((draft.skills || []).join(", "));
          setLanguagesInput((draft.languages || []).join(", "));
          setExperienceYears(draft.experienceYears != null ? String(draft.experienceYears) : "");
          setSummary(draft.summary || "");
          setIsDraft(true);
        } else {
          const p = await api.get<CandidateProfile>("/candidates/me/resume");
          setProfile(p);
          setResumeUrl(p.resumeUrl || "");
          setSkillsInput((p.skills || []).join(", "));
          setLanguagesInput((p.languages || []).join(", "));
          setExperienceYears(p.experienceYears != null ? String(p.experienceYears) : "");
          setSummary(p.summary || "");
        }
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to load resume data");
      } finally {
        setDataLoading(false);
      }
    })();
  }, [user]);

  async function handleSaveFullProfile(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const skills = skillsInput.split(",").map((s) => s.trim()).filter(Boolean);
      const languages = languagesInput.split(",").map((s) => s.trim()).filter(Boolean);
      const payload = {
        resumeUrl: resumeUrl || undefined,
        summary,
        skills,
        languages,
        experienceYears: experienceYears ? Number(experienceYears) : undefined,
        educations: profile?.educations || [],
        experiences: profile?.experiences || [],
        certifications: profile?.certifications || [],
        projects: profile?.projects || [],
      };
      const updated = await api.put<CandidateProfile>("/candidates/me/resume", payload);
      setProfile(updated);
      toast.success("Resume saved successfully.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setIsDraft(false);
      sessionStorage.removeItem("resumeDraft");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save resume");
    } finally {
      setSaving(false);
    }
  }

  const syncCollections = (updates: {
    educations?: EducationInput[];
    experiences?: ExperienceInput[];
    certifications?: CertificationInput[];
    projects?: any[];
  }) => {
    if (!profile) return;
    setProfile({
      ...profile,
      ...updates,
    });
  };

  const hasBasicInfo = summary.trim().length > 0 || languagesInput.trim().length > 0 || experienceYears !== "";
  const hasExperience = profile?.experiences && profile.experiences.length > 0;
  const hasEducation = profile?.educations && profile.educations.length > 0;
  const hasSkills = skillsInput.trim().length > 0;

  let strengthScore = 25;
  if (hasBasicInfo) strengthScore += 10;
  if (hasExperience) strengthScore += 30;
  if (hasEducation) strengthScore += 20;
  if (hasSkills) strengthScore += 15;

  let strengthLabel = "Beginner";
  if (strengthScore >= 80) strengthLabel = "Expert";
  else if (strengthScore >= 50) strengthLabel = "Intermediate";

  if (loading || !user || user.role !== "CANDIDATE") {
    return null;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .resume-timeline {
          position: relative;
          margin: 2rem 0;
          padding: 0;
          list-style: none;
        }
        .resume-timeline::before {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;
          width: 1px;
          background-color: #d0dad7;
          transform: translateX(-50%);
        }
        .timeline-item {
          position: relative;
          width: 50%;
          margin-bottom: 2.5rem;
        }
        .timeline-item.left {
          left: 0;
          padding-right: 2.5rem;
        }
        .timeline-item.right {
          left: 50%;
          padding-left: 2.5rem;
        }
        .timeline-icon {
          position: absolute;
          top: 24px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #f4f5f5;
          border: 1px solid #d0dad7;
          color: #275249;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
        }
        .timeline-item.left .timeline-icon {
          right: -16px;
        }
        .timeline-item.right .timeline-icon {
          left: -16px;
        }
        .timeline-card {
          border: 1px solid #e1e5e5;
          border-radius: 0.75rem;
          background: #fff;
          box-shadow: 0 4px 15px rgba(0,0,0,0.02);
        }
        .timeline-card .card-header {
          background: #fff;
          border-bottom: 1px solid #f0f4f4;
          padding: 1.25rem 1.5rem;
          border-radius: 0.75rem 0.75rem 0 0;
        }
        .timeline-card .card-body {
          padding: 2rem 1.5rem;
        }
        
        @media (max-width: 991px) {
          .resume-timeline::before {
            left: 20px;
          }
          .timeline-item {
            width: 100%;
            padding-left: 3.5rem !important;
            padding-right: 0 !important;
            left: 0 !important;
          }
          .timeline-item.left .timeline-icon,
          .timeline-item.right .timeline-icon {
            left: 4px;
            right: auto;
          }
        }
      `}} />

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

      <div className="dashboard-wrap" style={{ backgroundColor: '#f5faf9' }}>
        <CandidateSidebar active="resume" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4 pt-2">
            <div className="row align-items-center">
              <div className="col-xl-6 col-lg-6 col-md-6">
                <h1 className="mb-2 fs-2 fw-bold" style={{ color: '#161c1d' }}>My Resume</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0" style={{ fontSize: '0.9rem' }}>
                    <li className="breadcrumb-item text-muted"><a href="#" className="text-decoration-none text-muted">Candidate</a></li>
                    <li className="breadcrumb-item text-muted"><a href="#" className="text-decoration-none text-muted">Dashboard</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-decoration-none fw-medium" style={{ color: '#44a388' }}>Resume</a></li>
                  </ol>
                </nav>
              </div>
              <div className="col-xl-6 col-lg-6 col-md-6 text-md-end mt-4 mt-md-0 d-flex flex-column align-items-end justify-content-center gap-2">
                <a href="#" className="text-decoration-none fw-medium d-flex align-items-center justify-content-end mb-1" style={{ color: '#44a388', fontSize: '0.95rem' }} onClick={(e) => {e.preventDefault(); router.back();}}>
                   <i className="fa-solid fa-arrow-left me-2"></i>Back
                </a>
                <div className="d-flex gap-3 justify-content-end">
                  <button type="button" className="btn btn-outline-secondary px-4 fw-medium d-flex align-items-center" style={{ borderRadius: '2rem', borderColor: '#d0dad7', color: '#4a5b57' }}>
                    <i className="fa-solid fa-download me-2"></i>Export PDF
                  </button>
                  <button type="button" className="btn btn-main px-4 fw-medium d-flex align-items-center" style={{ borderRadius: '2rem' }} onClick={handleSaveFullProfile} disabled={saving}>
                    <i className="fa-solid fa-floppy-disk me-2"></i>{saving ? "Saving..." : "Save Resume"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {isDraft && (
              <div className="alert alert-warning d-flex align-items-center mb-4">
                <i className="fa-solid fa-circle-info me-2 fs-4"></i>
                <div>
                  <strong>Ready for Review:</strong> You are previewing extracted information from your newly uploaded resume. 
                  Please review the sections below, make any necessary changes, and click <strong>Save Resume</strong> at the top right.
                </div>
              </div>
            )}

            {dataLoading && <p className="text-muted">Loading...</p>}

            <div className="row gx-5">
              {/* Left Column (Overview & Timeline) */}
              <div className="col-xl-8 col-lg-7">
                
                {/* Resume Overview */}
                <div className="card mb-4" style={{ border: '1px solid #e1e5e5', borderRadius: '0.75rem', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                  <div className="card-header bg-white border-bottom-0 pt-4 px-4 pb-2">
                    <h4 className="fw-bold mb-0" style={{ color: '#275249' }}>Resume Overview</h4>
                  </div>
                  <div className="card-body p-4 pt-2">
                    <div className="row gy-4">
                      {/* Resume URL */}
                      <div className="col-12">
                        <label className="fw-bold text-muted mb-2" style={{ fontSize: '0.8rem' }}>Resume URL</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0 text-muted" style={{ borderColor: '#d0dad7' }}>jobstock.com/</span>
                          <input type="text" className="form-control border-start-0 ps-0" placeholder="alexander-pierce" value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} style={{ borderColor: '#d0dad7' }} />
                        </div>
                      </div>
                      
                      {/* Experience & Languages */}
                      <div className="col-md-6">
                        <label className="fw-bold text-muted mb-2" style={{ fontSize: '0.8rem' }}>Experience (years)</label>
                        <input type="text" className="form-control" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} style={{ borderColor: '#d0dad7' }} />
                      </div>
                      <div className="col-md-6">
                        <label className="fw-bold text-muted mb-2" style={{ fontSize: '0.8rem' }}>Languages</label>
                        <input type="text" className="form-control" placeholder="English (Native), French (Fluent)" value={languagesInput} onChange={(e) => setLanguagesInput(e.target.value)} style={{ borderColor: '#d0dad7' }} />
                      </div>

                      {/* Skills */}
                      <div className="col-12">
                        <label className="fw-bold text-muted mb-2" style={{ fontSize: '0.8rem' }}>Skills</label>
                        <div className="form-control d-flex flex-wrap gap-2 align-items-center" style={{ minHeight: '50px', height: 'auto', borderColor: '#d0dad7', padding: '0.5rem' }}>
                          {skillsInput.split(',').filter(s => s.trim()).map((skill, idx) => (
                            <span key={idx} className="badge rounded-pill fw-medium px-3 py-2 d-flex align-items-center gap-1" style={{ backgroundColor: '#defaf8', color: '#185f52', fontSize: '0.85rem' }}>
                              {skill.trim()}
                              <i className="fa-solid fa-xmark ms-1" style={{ cursor: 'pointer', fontSize: '0.7rem' }} onClick={() => {
                                const newSkills = skillsInput.split(',').filter(s => s.trim());
                                newSkills.splice(idx, 1);
                                setSkillsInput(newSkills.join(', '));
                              }}></i>
                            </span>
                          ))}
                          <input type="text" className="border-0 flex-grow-1" style={{ outline: 'none', minWidth: '150px', backgroundColor: 'transparent' }} placeholder={skillsInput ? "" : "Type a skill and press enter..."} onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ',') {
                              e.preventDefault();
                              const val = e.currentTarget.value.trim().replace(',', '');
                              if (val) {
                                setSkillsInput(skillsInput ? `${skillsInput}, ${val}` : val);
                                e.currentTarget.value = '';
                              }
                            }
                          }} />
                        </div>
                      </div>

                      {/* Professional Summary */}
                      <div className="col-12">
                        <label className="fw-bold text-muted mb-2" style={{ fontSize: '0.8rem' }}>Professional Summary</label>
                        <textarea className="form-control" rows={4} placeholder="Write a brief summary of your professional background..." value={summary} onChange={(e) => setSummary(e.target.value)} style={{ borderColor: '#d0dad7' }}></textarea>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="resume-timeline">
                  
                  {/* Experience */}
                  <div className="timeline-item right">
                    <div className="timeline-icon">
                      <i className="fa-solid fa-briefcase" style={{ fontSize: '0.8rem' }}></i>
                    </div>
                    <div className="timeline-card card">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 fw-bold" style={{ color: '#275249' }}>Experience</h5>
                        <button type="button" className="btn btn-link text-decoration-none fw-bold p-0" style={{ color: '#44a388', fontSize: '0.85rem' }} data-bs-toggle="modal" data-bs-target="#experience" onClick={() => setEditExp(null)}>
                          <i className="fa-solid fa-plus me-1"></i>Add
                        </button>
                      </div>
                      <div className="card-body text-center">
                        {(!profile?.experiences || profile.experiences.length === 0) ? (
                          <>
                            <div className="mb-3">
                              <i className="fa-solid fa-briefcase text-muted" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
                            </div>
                            <p className="text-muted mb-0" style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                              No experience added yet.<br />Showcase your professional<br />journey by adding your roles.
                            </p>
                          </>
                        ) : (
                          <div className="text-start">
                            {profile.experiences.map((exp, idx) => (
                              <div className="d-flex justify-content-between mb-3 border-bottom pb-3" key={idx}>
                                <div>
                                  <h6 className="fw-bold mb-1">{exp.title}</h6>
                                  <div className="text-muted small">{exp.company} | {exp.startDate} - {exp.endDate}</div>
                                </div>
                                <div className="d-flex gap-2">
                                  <button type="button" className="btn btn-sm btn-light px-2 py-1" data-bs-toggle="modal" data-bs-target="#experience" onClick={() => setEditExp({ data: exp, index: idx })}><i className="fa-solid fa-pen"></i></button>
                                  <button type="button" className="btn btn-sm btn-danger px-2 py-1" onClick={() => { if (confirm("Remove this experience?")) { syncCollections({ experiences: profile.experiences.filter((_, i) => i !== idx) }); } }}><i className="fa-solid fa-xmark"></i></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Education */}
                  <div className="timeline-item left">
                    <div className="timeline-icon">
                      <i className="fa-solid fa-graduation-cap" style={{ fontSize: '0.8rem' }}></i>
                    </div>
                    <div className="timeline-card card">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 fw-bold" style={{ color: '#275249' }}>Education</h5>
                        <button type="button" className="btn btn-link text-decoration-none fw-bold p-0" style={{ color: '#44a388', fontSize: '0.85rem' }} data-bs-toggle="modal" data-bs-target="#education" onClick={() => setEditEdu(null)}>
                          <i className="fa-solid fa-plus me-1"></i>Add
                        </button>
                      </div>
                      <div className="card-body text-center">
                        {(!profile?.educations || profile.educations.length === 0) ? (
                          <>
                            <div className="mb-3">
                              <i className="fa-solid fa-graduation-cap text-muted" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
                            </div>
                            <p className="text-muted mb-0" style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                              No education added yet.
                            </p>
                          </>
                        ) : (
                          <div className="text-start">
                            {profile.educations.map((edu, idx) => (
                              <div className="d-flex justify-content-between mb-3 border-bottom pb-3" key={idx}>
                                <div>
                                  <h6 className="fw-bold mb-1">{edu.title}</h6>
                                  <div className="text-muted small">{edu.academy} | {edu.year}</div>
                                </div>
                                <div className="d-flex gap-2">
                                  <button type="button" className="btn btn-sm btn-light px-2 py-1" data-bs-toggle="modal" data-bs-target="#education" onClick={() => setEditEdu({ data: edu, index: idx })}><i className="fa-solid fa-pen"></i></button>
                                  <button type="button" className="btn btn-sm btn-danger px-2 py-1" onClick={() => { if (confirm("Remove this education?")) { syncCollections({ educations: profile.educations.filter((_, i) => i !== idx) }); } }}><i className="fa-solid fa-xmark"></i></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Certifications / Awards */}
                  <div className="timeline-item right">
                    <div className="timeline-icon">
                      <i className="fa-solid fa-award" style={{ fontSize: '0.8rem' }}></i>
                    </div>
                    <div className="timeline-card card">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 fw-bold" style={{ color: '#275249' }}>Certifications /<br/>Awards</h5>
                        <button type="button" className="btn btn-link text-decoration-none fw-bold p-0" style={{ color: '#44a388', fontSize: '0.85rem' }} data-bs-toggle="modal" data-bs-target="#award" onClick={() => setEditCert(null)}>
                          <i className="fa-solid fa-plus me-1"></i>Add
                        </button>
                      </div>
                      <div className="card-body text-center">
                        {(!profile?.certifications || profile.certifications.length === 0) ? (
                          <>
                            <div className="mb-3">
                              <i className="fa-solid fa-award text-muted" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
                            </div>
                            <p className="text-muted mb-0" style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                              No certifications added yet.
                            </p>
                          </>
                        ) : (
                          <div className="text-start">
                            {profile.certifications.map((cert, idx) => (
                              <div className="d-flex justify-content-between mb-3 border-bottom pb-3" key={idx}>
                                <div>
                                  <h6 className="fw-bold mb-1">{cert.title}</h6>
                                  <div className="text-muted small">{cert.year}</div>
                                </div>
                                <div className="d-flex gap-2">
                                  <button type="button" className="btn btn-sm btn-light px-2 py-1" data-bs-toggle="modal" data-bs-target="#award" onClick={() => setEditCert({ data: cert, index: idx })}><i className="fa-solid fa-pen"></i></button>
                                  <button type="button" className="btn btn-sm btn-danger px-2 py-1" onClick={() => { if (confirm("Remove this award?")) { syncCollections({ certifications: profile.certifications.filter((_, i) => i !== idx) }); } }}><i className="fa-solid fa-xmark"></i></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Projects */}
                  <div className="timeline-item left">
                    <div className="timeline-icon">
                      <i className="fa-solid fa-diagram-project" style={{ fontSize: '0.8rem' }}></i>
                    </div>
                    <div className="timeline-card card">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 fw-bold" style={{ color: '#275249' }}>Projects</h5>
                        <button type="button" className="btn btn-link text-decoration-none fw-bold p-0" style={{ color: '#44a388', fontSize: '0.85rem' }} data-bs-toggle="modal" data-bs-target="#project" onClick={() => setEditProj(null)}>
                          <i className="fa-solid fa-plus me-1"></i>Add
                        </button>
                      </div>
                      <div className="card-body text-center">
                        {(!profile?.projects || profile.projects.length === 0) ? (
                          <>
                            <div className="mb-3">
                              <i className="fa-solid fa-diagram-project text-muted" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
                            </div>
                            <p className="text-muted mb-0" style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                              No projects added yet.
                            </p>
                          </>
                        ) : (
                          <div className="text-start">
                            {profile.projects.map((proj, idx) => (
                              <div className="d-flex justify-content-between mb-3 border-bottom pb-3" key={idx}>
                                <div>
                                  <h6 className="fw-bold mb-1">{proj.title}</h6>
                                  {proj.link && <div className="text-muted small"><a href={proj.link} target="_blank" rel="noreferrer">{proj.link}</a></div>}
                                </div>
                                <div className="d-flex gap-2">
                                  <button type="button" className="btn btn-sm btn-light px-2 py-1" data-bs-toggle="modal" data-bs-target="#project" onClick={() => setEditProj({ data: proj, index: idx })}><i className="fa-solid fa-pen"></i></button>
                                  <button type="button" className="btn btn-sm btn-danger px-2 py-1" onClick={() => { if (confirm("Remove this project?")) { syncCollections({ projects: profile.projects.filter((_, i) => i !== idx) }); } }}><i className="fa-solid fa-xmark"></i></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Right Column (Resume Strength) */}
              <div className="col-xl-4 col-lg-5">
                <div className="card position-sticky" style={{ top: '100px', border: '1px solid #d0dad7', borderRadius: '0.75rem', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                  <div className="card-body p-4 pt-4">
                    <h5 className="fw-bold mb-3" style={{ color: '#275249' }}>Resume Strength</h5>
                    <div className="d-flex align-items-end gap-2 mb-2">
                      <h2 className="mb-0 fw-bold" style={{ color: '#1b5e54', fontSize: '2.5rem' }}>{strengthScore}%</h2>
                      <span className="text-muted fw-medium mb-1" style={{ fontSize: '0.9rem' }}>{strengthLabel}</span>
                    </div>
                    <div className="progress mb-4" style={{ height: '8px', backgroundColor: '#e1e5e5', borderRadius: '4px' }}>
                      <div className="progress-bar" role="progressbar" style={{ width: `${strengthScore}%`, backgroundColor: '#44a388', borderRadius: '4px' }} aria-valuenow={strengthScore} aria-valuemin={0} aria-valuemax={100}></div>
                    </div>

                    <p className="fw-bold text-dark mb-3" style={{ fontSize: '0.9rem' }}>Boost your strength:</p>
                    <ul className="list-unstyled mb-4 d-flex flex-column gap-3">
                      <li className="d-flex align-items-center gap-2">
                        <i className={`fa-regular ${hasBasicInfo ? 'fa-circle-check' : 'fa-circle'}`} style={{ color: hasBasicInfo ? '#44a388' : '#d0dad7', fontSize: '1.1rem' }}></i>
                        <span className={hasBasicInfo ? "text-muted text-decoration-line-through" : "text-muted"} style={{ fontSize: '0.9rem' }}>Add Basic Info (+10%)</span>
                      </li>
                      <li className="d-flex align-items-center gap-2">
                        <i className={`fa-regular ${hasExperience ? 'fa-circle-check' : 'fa-circle'}`} style={{ color: hasExperience ? '#44a388' : '#d0dad7', fontSize: '1.1rem' }}></i>
                        <span className={hasExperience ? "text-muted text-decoration-line-through" : "text-muted"} style={{ fontSize: '0.9rem' }}>Add Experience (+30%)</span>
                      </li>
                      <li className="d-flex align-items-center gap-2">
                        <i className={`fa-regular ${hasEducation ? 'fa-circle-check' : 'fa-circle'}`} style={{ color: hasEducation ? '#44a388' : '#d0dad7', fontSize: '1.1rem' }}></i>
                        <span className={hasEducation ? "text-muted text-decoration-line-through" : "text-muted"} style={{ fontSize: '0.9rem' }}>Add Education (+20%)</span>
                      </li>
                      <li className="d-flex align-items-center gap-2">
                        <i className={`fa-regular ${hasSkills ? 'fa-circle-check' : 'fa-circle'}`} style={{ color: hasSkills ? '#44a388' : '#d0dad7', fontSize: '1.1rem' }}></i>
                        <span className={hasSkills ? "text-muted text-decoration-line-through" : "text-muted"} style={{ fontSize: '0.9rem' }}>Add Skills (+15%)</span>
                      </li>
                    </ul>

                    
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <EducationModals
        editEduData={editEdu}
        editExpData={editExp}
        editCertData={editCert}
        editProjData={editProj}
        onAddEducation={(edu) => syncCollections({ educations: [...(profile?.educations || []), edu] })}
        onEditEducation={(edu, idx) => {
          const newArr = [...(profile?.educations || [])];
          newArr[idx] = edu;
          syncCollections({ educations: newArr });
        }}
        onAddExperience={(exp) => syncCollections({ experiences: [...(profile?.experiences || []), exp] })}
        onEditExperience={(exp, idx) => {
          const newArr = [...(profile?.experiences || [])];
          newArr[idx] = exp;
          syncCollections({ experiences: newArr });
        }}
        onAddCertification={(cert) => syncCollections({ certifications: [...(profile?.certifications || []), cert] })}
        onEditCertification={(cert, idx) => {
          const newArr = [...(profile?.certifications || [])];
          newArr[idx] = cert;
          syncCollections({ certifications: newArr });
        }}
        onAddProject={(proj) => syncCollections({ projects: [...(profile?.projects || []), proj] })}
        onEditProject={(proj, idx) => {
          const newArr = [...(profile?.projects || [])];
          newArr[idx] = proj;
          syncCollections({ projects: newArr });
        }}
      />
      <UploadResumeModal />
    </>
  );
}
