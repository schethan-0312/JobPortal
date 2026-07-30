"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar7 from "@/components/Navbar7";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
import UploadResumeModal from "@/components/candidate-dashboard/UploadResumeModal";
import EducationModals from "@/components/candidate-dashboard/EducationModals";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl } from "@/lib/api";

interface CandidateProfile {
  id: string;
  fullName: string;
  skills: string[];
  experienceYears: number | null;
  resumeUrl: string | null;
  about: string | null;
}

// Note: the backend has no dedicated education/experience/award endpoints yet.
// This page wires resumeUrl / skills / experienceYears / about via the candidate profile
// GET/PATCH endpoints; education/experience/award sections below remain static placeholders.
const educations = [
  { id: "secondarySchool", label: "Secondary School", title: "High School", academy: "Awadh main School", year: "2008" },
  { id: "intermediate", label: "Intermediate", title: "Intermidiate", academy: "Awadh main School", year: "2010" },
];

const experiences = [
  { id: "exp1", label: "Front-End Developer", title: "Front-End Developer", join: "10-06-2008", end: "15-04-2010", company: "Shreethemes Technology" },
];

export default function CandidateResumePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [resumeUrl, setResumeUrl] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [about, setAbout] = useState("");

  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
        setResumeUrl(p.resumeUrl || "");
        setSkillsInput((p.skills || []).join(", "));
        setExperienceYears(p.experienceYears != null ? String(p.experienceYears) : "");
        setAbout(p.about || "");
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load resume data");
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
        resumeUrl: resumeUrl || undefined,
        skills,
        experienceYears: experienceYears ? Number(experienceYears) : undefined,
        about,
      });
      setProfile(updated);
      setSuccess("Resume details saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save resume details");
    } finally {
      setSaving(false);
    }
  }

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
              <div className="colxl-12 col-lg-12 col-md-12">
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

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            {dataLoading && <p className="text-muted">Loading...</p>}

            <form onSubmit={handleSave}>

            {/* Row Start */}
            <div className="card">
              <div className="card-header">
                <h4>My Resume</h4>
              </div>
              <div className="card-body">
                <div className="row gx-4 gy-4 mb-3">
                  <div className="col-xl-12 col-lg-12 col-md-12">
                    <div className="form-group">
                      <label>Resume URL</label>
                      <input type="text" className="form-control" placeholder="https://..." value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} />
                      {profile?.resumeUrl && (
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
                  <div className="col-xl-12 col-lg-12 col-md-12">
                    <div className="form-group">
                      <label>About</label>
                      <textarea className="form-control ht-80" value={about} onChange={(e) => setAbout(e.target.value)}></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* End Row */}

            {/* Row Start */}
            <div className="card">
              <div className="card-header">
                <h4>Education <span className="text-muted small">(not yet backed by API — display only)</span></h4>
              </div>
              <div className="card-body">

                {educations.map((edu) => (
                  <div className="single-edc-wrap" key={edu.id}>
                    <div className="single-edc-box">
                      <div className="single-edc-remove-box"><div className="cd-resume-cancel"><a href="JavaScript:Void(0);" className="cancel-link"><i className="fa-solid fa-xmark"></i></a></div></div>
                      <div className="single-edc-title-box">
                        <a className="btn btn-collapse" data-bs-toggle="collapse" href={`#${edu.id}`} role="button" aria-expanded="false" aria-controls={edu.id}>{edu.label}</a>
                      </div>
                    </div>
                    <div className="single-edc-caption">
                      <div className="collapse" id={edu.id}>
                        <div className="card card-body">
                          <div className="row mb-3">
                            <label className="col-md-2 col-form-label">Education Title</label>
                            <div className="col-md-10">
                              <input type="text" className="form-control" defaultValue={edu.title} disabled />
                            </div>
                          </div>
                          <div className="row mb-3">
                            <label className="col-md-2 col-form-label">Academy Name</label>
                            <div className="col-md-10">
                              <input type="text" className="form-control" defaultValue={edu.academy} disabled />
                            </div>
                          </div>
                          <div className="row mb-3">
                            <label className="col-md-2 col-form-label">Passing year</label>
                            <div className="col-md-10">
                              <input type="text" className="form-control" defaultValue={edu.year} disabled />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

              </div>
            </div>
            {/* End Row */}

            {/* Row Start */}
            <div className="card">
              <div className="card-header">
                <h4>Experience <span className="text-muted small">(not yet backed by API — display only)</span></h4>
              </div>
              <div className="card-body">
                {experiences.map((exp) => (
                  <div className="single-edc-wrap" key={exp.id}>
                    <div className="single-edc-box">
                      <div className="single-edc-remove-box"><div className="cd-resume-cancel"><a href="JavaScript:Void(0);" className="cancel-link"><i className="fa-solid fa-xmark"></i></a></div></div>
                      <div className="single-edc-title-box">
                        <a className="btn btn-collapse" data-bs-toggle="collapse" href={`#${exp.id}`} role="button" aria-expanded="false" aria-controls={exp.id}>{exp.label}</a>
                      </div>
                    </div>
                    <div className="single-edc-caption">
                      <div className="collapse" id={exp.id}>
                        <div className="card card-body">
                          <div className="row mb-3">
                            <label className="col-md-2 col-form-label">Job Title</label>
                            <div className="col-md-10">
                              <input type="text" className="form-control" defaultValue={exp.title} disabled />
                            </div>
                          </div>
                          <div className="row mb-3">
                            <label className="col-md-2 col-form-label">Company Name</label>
                            <div className="col-md-10">
                              <input type="text" className="form-control" defaultValue={exp.company} disabled />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* End Row */}

            {/* Submit Busston */}
            <div className="row">
              <div className="col-lg-12 col-md-12">
                <button type="submit" className="btn ft--medium btn-main" disabled={saving}>{saving ? "Saving..." : "Save Resume"}</button>
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

      <EducationModals />
      <UploadResumeModal />
    </>
  );
}
