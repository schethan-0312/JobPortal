"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar7 from "@/components/Navbar7";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
import UploadResumeModal from "@/components/candidate-dashboard/UploadResumeModal";
import EducationModals, { EducationInput, ExperienceInput, CertificationInput } from "@/components/candidate-dashboard/EducationModals";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl } from "@/lib/api";

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
        setError(err instanceof ApiError ? err.message : "Failed to load resume data");
      } finally {
        setDataLoading(false);
      }
    })();
  }, [user]);

  async function handleSaveFullProfile(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
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
      setSuccess("Resume saved successfully.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setIsDraft(false);
      sessionStorage.removeItem("resumeDraft");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save resume");
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

  if (loading || !user || user.role !== "CANDIDATE") {
    return null;
  }

  return (
    <>
      <Navbar7 />

      <div className="dashboard-wrap bg-light">
        <CandidateSidebar active="resume" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">My Resume</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Candidate</a></li>
                    <li className="breadcrumb-item text-muted"><a href="#">Dashboard</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">My Resume</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">

            {isDraft && (
              <div className="alert alert-warning d-flex align-items-center">
                <i className="bi bi-info-circle-fill me-2 fs-4"></i>
                <div>
                  <strong>Ready for Review:</strong> You are previewing extracted information from your newly uploaded resume. 
                  Please review the sections below, make any necessary changes, and click <strong>Save Resume</strong> at the bottom.
                </div>
              </div>
            )}

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            {dataLoading && <p className="text-muted">Loading...</p>}

            <div className="card">
              <div className="card-header">
                <h4>My Resume Overview</h4>
              </div>
              <div className="card-body">
                <div className="row gx-4 gy-4 mb-3">
                  <div className="col-xl-12 col-lg-12 col-md-12">
                    <div className="form-group">
                      <label>Resume URL</label>
                      <input type="text" className="form-control" placeholder="https://..." value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} />
                      {profile?.resumeUrl && !isDraft && (
                        <div className="mt-2">
                          <a href={assetUrl(profile.resumeUrl) || "#"} target="_blank" rel="noreferrer"><i className="fa-solid fa-file-pdf me-1"></i>View current resume</a>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-xl-6 col-lg-6 col-md-6">
                    <div className="form-group">
                      <label>Experience (years)</label>
                      <input type="number" className="form-control" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} />
                    </div>
                  </div>
                  <div className="col-xl-6 col-lg-6 col-md-6">
                    <div className="form-group">
                      <label>Skills (comma separated)</label>
                      <input type="text" className="form-control" value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} />
                    </div>
                  </div>
                  <div className="col-xl-6 col-lg-6 col-md-6">
                    <div className="form-group">
                      <label>Languages (comma separated)</label>
                      <input type="text" className="form-control" value={languagesInput} onChange={(e) => setLanguagesInput(e.target.value)} />
                    </div>
                  </div>
                  <div className="col-xl-12 col-lg-12 col-md-12">
                    <div className="form-group">
                      <label>Summary</label>
                      <textarea className="form-control ht-80" value={summary} onChange={(e) => setSummary(e.target.value)}></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Education Row */}
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4>Education</h4>
                <button type="button" className="btn btn-sm btn-light" data-bs-toggle="modal" data-bs-target="#education" onClick={() => setEditEdu(null)}>
                  <i className="fa-solid fa-plus me-1"></i>Add Education
                </button>
              </div>
              <div className="card-body">
                {(!profile?.educations || profile.educations.length === 0) && (
                  <p className="text-muted">No education added yet.</p>
                )}
                {profile?.educations?.map((edu, idx) => (
                  <div className="single-edc-wrap" key={idx}>
                    <div className="single-edc-box">
                      <div className="single-edc-remove-box d-flex gap-2 flex-wrap">
                        <button
                          type="button"
                          className="btn btn-sm btn-light px-2 py-1"
                          data-bs-toggle="modal"
                          data-bs-target="#education"
                          onClick={() => setEditEdu({ data: edu, index: idx })}
                        >
                          Edit
                        </button>
                        <div className="cd-resume-cancel">
                          <button
                            type="button"
                            className="btn btn-sm btn-danger px-2 py-1"
                            onClick={() => {
                              if (confirm("Remove this education?")) {
                                syncCollections({ educations: profile.educations.filter((_, i) => i !== idx) });
                              }
                            }}
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      </div>
                      <div className="single-edc-title-box">
                        <a className="btn btn-collapse" data-bs-toggle="collapse" href={`#edu${idx}`} role="button" aria-expanded="false">{edu.title}</a>
                      </div>
                    </div>
                    <div className="single-edc-caption">
                      <div className="collapse show" id={`edu${idx}`}>
                        <div className="card card-body mt-3">
                          <div className="row mb-3">
                            <label className="col-md-2 col-form-label">Title</label>
                            <div className="col-md-10"><input type="text" className="form-control" value={edu.title} disabled /></div>
                          </div>
                          <div className="row mb-3">
                            <label className="col-md-2 col-form-label">Academy Name</label>
                            <div className="col-md-10"><input type="text" className="form-control" value={edu.academy} disabled /></div>
                          </div>
                          <div className="row mb-3">
                            <label className="col-md-2 col-form-label">Passing year</label>
                            <div className="col-md-10"><input type="text" className="form-control" value={edu.year} disabled /></div>
                          </div>
                          {edu.description && (
                            <div className="row mb-3">
                              <label className="col-md-2 col-form-label">Description</label>
                              <div className="col-md-10"><textarea className="form-control ht-80" value={edu.description} disabled /></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Experience Row */}
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4>Experience</h4>
                <button type="button" className="btn btn-sm btn-light" data-bs-toggle="modal" data-bs-target="#experience" onClick={() => setEditExp(null)}>
                  <i className="fa-solid fa-plus me-1"></i>Add Experience
                </button>
              </div>
              <div className="card-body">
                {(!profile?.experiences || profile.experiences.length === 0) && (
                  <p className="text-muted">No experience added yet.</p>
                )}
                {profile?.experiences?.map((exp, idx) => (
                  <div className="single-edc-wrap" key={idx}>
                    <div className="single-edc-box">
                      <div className="single-edc-remove-box d-flex gap-2 flex-wrap">
                        <button
                          type="button"
                          className="btn btn-sm btn-light px-2 py-1"
                          data-bs-toggle="modal"
                          data-bs-target="#experience"
                          onClick={() => setEditExp({ data: exp, index: idx })}
                        >
                          Edit
                        </button>
                        <div className="cd-resume-cancel">
                          <button
                            type="button"
                            className="btn btn-sm btn-danger px-2 py-1"
                            onClick={() => {
                              if (confirm("Remove this experience?")) {
                                syncCollections({ experiences: profile.experiences.filter((_, i) => i !== idx) });
                              }
                            }}
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      </div>
                      <div className="single-edc-title-box">
                        <a className="btn btn-collapse" data-bs-toggle="collapse" href={`#exp${idx}`} role="button" aria-expanded="true">{exp.title} {exp.company ? `at ${exp.company}` : ''}</a>
                      </div>
                    </div>
                    <div className="single-edc-caption">
                      <div className="collapse show" id={`exp${idx}`}>
                        <div className="card card-body mt-3">
                          <div className="row mb-3">
                            <label className="col-md-2 col-form-label">Job Title</label>
                            <div className="col-md-10"><input type="text" className="form-control" value={exp.title} disabled /></div>
                          </div>
                          <div className="row mb-3">
                            <label className="col-md-2 col-form-label">Company Name</label>
                            <div className="col-md-10"><input type="text" className="form-control" value={exp.company} disabled /></div>
                          </div>
                          <div className="row mb-3">
                            <label className="col-md-2 col-form-label">Dates</label>
                            <div className="col-md-10"><input type="text" className="form-control" value={`${exp.startDate || ''} - ${exp.endDate || ''}`} disabled /></div>
                          </div>
                          {exp.description && (
                            <div className="row mb-3">
                              <label className="col-md-2 col-form-label">Description</label>
                              <div className="col-md-10"><textarea className="form-control ht-80" value={exp.description} disabled /></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications Row */}
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4>Certifications / Awards</h4>
                <button type="button" className="btn btn-sm btn-light" data-bs-toggle="modal" data-bs-target="#award" onClick={() => setEditCert(null)}>
                  <i className="fa-solid fa-plus me-1"></i>Add Award
                </button>
              </div>
              <div className="card-body">
                {(!profile?.certifications || profile.certifications.length === 0) && (
                  <p className="text-muted">No certifications or awards added yet.</p>
                )}
                {profile?.certifications?.map((cert, idx) => (
                  <div className="single-edc-wrap" key={idx}>
                    <div className="single-edc-box">
                      <div className="single-edc-remove-box d-flex gap-2 flex-wrap">
                        <button
                          type="button"
                          className="btn btn-sm btn-light px-2 py-1"
                          data-bs-toggle="modal"
                          data-bs-target="#award"
                          onClick={() => setEditCert({ data: cert, index: idx })}
                        >
                          Edit
                        </button>
                        <div className="cd-resume-cancel">
                          <button
                            type="button"
                            className="btn btn-sm btn-danger px-2 py-1"
                            onClick={() => {
                              if (confirm("Remove this award?")) {
                                syncCollections({ certifications: profile.certifications.filter((_, i) => i !== idx) });
                              }
                            }}
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      </div>
                      <div className="single-edc-title-box">
                        <a className="btn btn-collapse" data-bs-toggle="collapse" href={`#cert${idx}`} role="button" aria-expanded="true">{cert.title}</a>
                      </div>
                    </div>
                    <div className="single-edc-caption">
                      <div className="collapse show" id={`cert${idx}`}>
                        <div className="card card-body mt-3">
                          <div className="row mb-3">
                            <label className="col-md-2 col-form-label">Title</label>
                            <div className="col-md-10"><input type="text" className="form-control" value={cert.title} disabled /></div>
                          </div>
                          <div className="row mb-3">
                            <label className="col-md-2 col-form-label">Year</label>
                            <div className="col-md-10"><input type="text" className="form-control" value={cert.year} disabled /></div>
                          </div>
                          {cert.description && (
                            <div className="row mb-3">
                              <label className="col-md-2 col-form-label">Description</label>
                              <div className="col-md-10"><textarea className="form-control ht-80" value={cert.description} disabled /></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Projects Row */}
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4>Projects</h4>
                <button type="button" className="btn btn-sm btn-light" data-bs-toggle="modal" data-bs-target="#project" onClick={() => setEditProj(null)}>
                  <i className="fa-solid fa-plus me-1"></i>Add Project
                </button>
              </div>
              <div className="card-body">
                {(!profile?.projects || profile.projects.length === 0) && (
                  <p className="text-muted">No projects added yet.</p>
                )}
                {profile?.projects?.map((proj, idx) => (
                  <div className="single-edc-wrap" key={idx}>
                    <div className="single-edc-box">
                      <div className="single-edc-remove-box d-flex gap-2 flex-wrap">
                        <button
                          type="button"
                          className="btn btn-sm btn-light px-2 py-1"
                          data-bs-toggle="modal"
                          data-bs-target="#project"
                          onClick={() => setEditProj({ data: proj, index: idx })}
                        >
                          Edit
                        </button>
                        <div className="cd-resume-cancel">
                          <button
                            type="button"
                            className="btn btn-sm btn-danger px-2 py-1"
                            onClick={() => {
                              if (confirm("Remove this project?")) {
                                syncCollections({ projects: profile.projects.filter((_, i) => i !== idx) });
                              }
                            }}
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      </div>
                      <div className="single-edc-title-box">
                        <a className="btn btn-collapse" data-bs-toggle="collapse" href={`#proj${idx}`} role="button" aria-expanded="true">{proj.title}</a>
                      </div>
                    </div>
                    <div className="single-edc-caption">
                      <div className="collapse show" id={`proj${idx}`}>
                        <div className="card card-body mt-3">
                          <div className="row mb-3">
                            <label className="col-md-2 col-form-label">Title</label>
                            <div className="col-md-10"><input type="text" className="form-control" value={proj.title} disabled /></div>
                          </div>
                          {proj.link && (
                            <div className="row mb-3">
                              <label className="col-md-2 col-form-label">Link</label>
                              <div className="col-md-10"><input type="text" className="form-control" value={proj.link} disabled /></div>
                            </div>
                          )}
                          {proj.description && (
                            <div className="row mb-3">
                              <label className="col-md-2 col-form-label">Description</label>
                              <div className="col-md-10"><textarea className="form-control ht-80" value={proj.description} disabled /></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="row mt-4 mb-5">
              <div className="col-12 text-end">
                <button 
                  type="button" 
                  className="btn btn-lg btn-main px-5" 
                  onClick={() => handleSaveFullProfile()} 
                  disabled={saving}
                >
                  {saving ? "Saving Resume..." : "Save Resume"}
                </button>
              </div>
            </div>

          </div>

          <div className="row">
            <div className="col-md-12">
              <div className="py-3 text-center">
                &copy; {new Date().getFullYear()} JobStock. All rights reserved.
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
