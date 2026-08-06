"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar7 from "@/components/Navbar7";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
import UploadResumeModal from "@/components/candidate-dashboard/UploadResumeModal";
import TemplateRenderer, { BuiltResume } from "@/components/resume-templates/TemplateRenderer";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, uploadFile } from "@/lib/api";

const ALL_TEMPLATES = [
  { id: "ats-professional", name: "ATS Professional" },
  { id: "modern-professional", name: "Modern Professional" },
  { id: "minimal", name: "Minimal" },
  { id: "executive", name: "Executive" },
  { id: "corporate", name: "Corporate" },
  { id: "creative", name: "Creative" },
  { id: "elegant", name: "Elegant" },
  { id: "classic", name: "Classic" },
  { id: "student", name: "Student" },
  { id: "intern", name: "Intern" },
  { id: "software-engineer", name: "Software Engineer" },
  { id: "full-stack", name: "Full Stack Developer" },
  { id: "data-scientist", name: "Data Scientist" },
  { id: "ai-engineer", name: "AI Engineer" },
  { id: "ui-ux", name: "UI / UX Designer" },
  { id: "product-manager", name: "Product Manager" },
  { id: "marketing", name: "Marketing Professional" },
  { id: "finance", name: "Finance Professional" },
  { id: "healthcare", name: "Healthcare Professional" },
  { id: "portfolio", name: "Portfolio Style" },
];

const ACCENT_COLORS = [
  { name: "Blue", value: "#2563eb" },
  { name: "Green", value: "#16a34a" },
  { name: "Purple", value: "#9333ea" },
  { name: "Orange", value: "#ea580c" },
  { name: "Red", value: "#dc2626" },
  { name: "Black", value: "#000000" },
  { name: "Navy", value: "#1e3a8a" },
  { name: "Gray", value: "#4b5563" },
];

export default function CandidateResumeBuilderPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [targetRole, setTargetRole] = useState("");
  const [rawBackground, setRawBackground] = useState("");
  const [status, setStatus] = useState<"idle" | "generating" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [resume, setResume] = useState<BuiltResume | null>(null);
  
  // Customization state
  const [templateId, setTemplateId] = useState("ats-professional");
  const [accentColor, setAccentColor] = useState("#000000");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [photoAlignment, setPhotoAlignment] = useState<"left" | "center" | "right">("center");
  const [sectionOrder, setSectionOrder] = useState([
    "Summary",
    "Experience",
    "Projects",
    "Skills",
    "Education",
    "Certifications",
    "Languages",
  ]);

  const [savingToProfile, setSavingToProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Drag-and-drop state for sections
  const [draggedSection, setDraggedSection] = useState<string | null>(null);

  async function handleSaveToProfile() {
    if (!resume) return;
    setSavingToProfile(true);
    setSaveSuccess(false);
    setErrorMsg(null);
    try {
      await api.patch("/candidates/me", {
        skills: resume.skills,
        about: resume.summary,
      });

      // Saving core resume data. 
      // (The backend currently doesn't support storing templateId, accentColor, profilePhoto for the resume builder explicitly,
      // but we maintain the data format backward compatible so no backend API changes are forced.)
      await api.put("/candidates/me/resume", {
        summary: resume.summary,
        skills: resume.skills,
        languages: resume.languages,
        educations: resume.education.map((ed) => ({
          title: ed.degree,
          academy: ed.institution,
          year: ed.year,
        })),
        experiences: resume.experience.map((exp) => ({
          title: exp.title,
          company: exp.company,
          startDate: exp.duration,
          description: exp.bullets.join("\n"),
        })),
        projects: resume.projects,
        certifications: resume.certifications,
      });
      
      // Save local preferences so next load remembers them
      localStorage.setItem("resume-builder-prefs", JSON.stringify({ templateId, accentColor, sectionOrder, profilePhoto, photoAlignment }));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : "Failed to save profile");
    } finally {
      setSavingToProfile(false);
    }
  }

  async function handleSuggest(sectionType: string, text: string, onAccept: (newText: string) => void) {
    if (!text.trim()) return;
    try {
      const res = await api.post<{ suggestion: string }>("/resume-builder/suggest", { text, sectionType });
      if (res.suggestion) {
        if (window.confirm(`AI Suggestion:\n\n${res.suggestion}\n\nWould you like to replace your text with this suggestion?`)) {
          onAccept(res.suggestion);
        }
      }
    } catch (err) {
      alert("Failed to get suggestion.");
    }
  }

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "CANDIDATE")) {
      router.push("/");
    }
    
    const prefs = localStorage.getItem("resume-builder-prefs");
    if (prefs) {
      try {
        const parsed = JSON.parse(prefs);
        if (parsed.templateId) setTemplateId(parsed.templateId);
        if (parsed.accentColor) setAccentColor(parsed.accentColor);
        if (parsed.sectionOrder) setSectionOrder(parsed.sectionOrder);
        if (parsed.profilePhoto) setProfilePhoto(parsed.profilePhoto);
        if (parsed.photoAlignment) setPhotoAlignment(parsed.photoAlignment);
      } catch (e) {}
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== "CANDIDATE") {
    return null;
  }

  async function handleUploadForBuilder(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setResume(null);
    setStatus("generating");

    try {
      const { url } = await uploadFile<{ url: string }>("/uploads/document?save=false", file);
      const parsedData = await api.post<any>("/resume-parser/parse", { resumeUrl: url });
      
      const extractedText = `
Summary: ${parsedData.about || parsedData.summary || ''}
Skills: ${(parsedData.skills || []).join(', ')}
Experience: ${(parsedData.experiences || []).map((exp: any) => `${exp.title} at ${exp.company} (${exp.startDate}): ${exp.description}`).join('\n')}
Education: ${(parsedData.educations || []).map((ed: any) => `${ed.title} at ${ed.academy} (${ed.year})`).join('\n')}
      `.trim();
      
      setRawBackground(extractedText);

      const data = await api.post<BuiltResume>("/resume-builder/generate", {
        rawBackground: extractedText,
        targetRole: targetRole || undefined,
      });
      setResume(data);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof ApiError ? err.message : "Could not process uploaded resume. Try again.");
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setResume(null);
    setStatus("generating");
    try {
      const data = await api.post<BuiltResume>("/resume-builder/generate", {
        rawBackground,
        targetRole: targetRole || undefined,
      });
      setResume(data);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof ApiError ? err.message : "Could not generate your resume. Try again.");
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { url } = await uploadFile<{ url: string }>("/uploads/image", file);
      setProfilePhoto(url);
    } catch (err) {
      alert("Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  }

  // Drag & drop handlers
  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggedSection(id);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const onDrop = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (!draggedSection || draggedSection === id) return;
    const newOrder = [...sectionOrder];
    const draggedIdx = newOrder.indexOf(draggedSection);
    const dropIdx = newOrder.indexOf(id);
    newOrder.splice(draggedIdx, 1);
    newOrder.splice(dropIdx, 0, draggedSection);
    setSectionOrder(newOrder);
    setDraggedSection(null);
  };

  return (
    <>
      <style>{`
        @media print {
          html, body { height: auto !important; overflow: visible !important; background-color: white !important; }
          .no-print { display: none !important; }
          .print-resume { box-shadow: none !important; border: none !important; padding: 0 !important; overflow: visible !important; }
          .dashboard-wrap { background-color: white !important; padding: 0 !important; margin: 0 !important; overflow: visible !important; height: auto !important; }
          .dashboard-content { padding: 0 !important; margin: 0 !important; max-width: 100% !important; overflow: visible !important; height: auto !important; }
          .dashboard-nav, .mobNavigation { display: none !important; }
          .col-lg-9 { width: 100% !important; flex: 0 0 100% !important; max-width: 100% !important; overflow: visible !important; height: auto !important; }
          .resume-section { page-break-inside: avoid; }
        }
        .color-swatch {
          width: 24px; height: 24px; border-radius: 50%; display: inline-block; cursor: pointer; border: 2px solid transparent; transition: 0.2s;
        }
        .color-swatch:hover { transform: scale(1.1); }
        .color-swatch.active { border-color: #333; transform: scale(1.1); box-shadow: 0 0 0 2px #fff inset; }
        .draggable-section { cursor: grab; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; background: #f8fafc; transition: 0.2s; }
        .draggable-section:active { cursor: grabbing; background: #e2e8f0; }
        .draggable-section.drag-over { border-top: 2px solid #2563eb; }
      `}</style>
      <div className="no-print">
        <Navbar7 />
      </div>

      <div className="dashboard-wrap bg-light">
        <div className="no-print">
          <CandidateSidebar active="resume-builder" />
        </div>

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4 no-print">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">AI Resume Builder</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Candidate</a></li>
                    <li className="breadcrumb-item text-muted"><a href="#">Dashboard</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">AI Resume Builder</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            <div className="card mb-4 no-print">
              <div className="card-header">
                <h4>Tell Us About Your Background</h4>
                <p className="text-muted mb-0 mt-1">
                  Write about your work history and education in your own words, or upload your existing resume &mdash; our AI will turn it into a
                  polished, ATS-friendly resume you can print or save as a PDF.
                </p>
              </div>
              <div className="card-body">
                {status === "error" && errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                
                <form onSubmit={handleGenerate}>
                  <div className="row mb-3">
                    <label className="col-xl-2 col-md-12 col-form-label fw-bold">Target Role (optional)</label>
                    <div className="col-xl-7 col-md-12">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Digital Marketing Manager"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-xl-2 col-md-12 col-form-label fw-bold">Or Paste Background</label>
                    <div className="col-xl-7 col-md-12">
                      <textarea
                        className="form-control"
                        rows={8}
                        placeholder="e.g. I worked at X for 2 years as a... I have a degree in... My key achievements were..."
                        value={rawBackground}
                        onChange={(e) => setRawBackground(e.target.value)}
                        minLength={20}
                        required
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-xl-12 col-md-12 offset-xl-2 d-flex gap-3 align-items-center">
                      <button type="submit" className="btn btn-main" disabled={status === "generating"}>
                        {status === "generating" ? (
                          <><i className="fa-solid fa-spinner fa-spin me-2"></i>Building Resume...</>
                        ) : "Generate My Resume"}
                      </button>
                      <input 
                        type="file" 
                        className="d-none" 
                        ref={fileInputRef} 
                        accept=".pdf,.doc,.docx"
                        onChange={handleUploadForBuilder}
                      />
                      <button 
                        type="button" 
                        className="btn btn-outline-primary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={status === "generating"}
                      >
                        {status === "generating" ? (
                          <><i className="fa-solid fa-spinner fa-spin me-2"></i>Processing...</>
                        ) : (
                          <><i className="fa-solid fa-cloud-arrow-up me-2"></i>Upload Resume (PDF / DOCX) instead</>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {resume && (
              <div className="row">
                <div className="col-lg-3 col-md-12 no-print mb-4">
                  <div className="card p-3 shadow-sm border-0 sticky-top" style={{ top: 20 }}>
                    <h5 className="mb-3 border-bottom pb-2">Customization</h5>
                    
                    <div className="mb-4">
                      <label className="fw-bold mb-2">Template Gallery</label>
                      <select 
                        className="form-select mb-2" 
                        value={templateId} 
                        onChange={(e) => setTemplateId(e.target.value)}
                      >
                        {ALL_TEMPLATES.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      {templateId.includes("ats") && (
                        <small className="text-muted"><i className="fa-solid fa-info-circle me-1"></i>ATS templates automatically hide photos to ensure parsing compatibility.</small>
                      )}
                    </div>

                    <div className="mb-4">
                      <label className="fw-bold mb-2">Accent Color</label>
                      <div className="d-flex flex-wrap gap-2">
                        {ACCENT_COLORS.map(color => (
                          <div 
                            key={color.value}
                            className={`color-swatch ${accentColor === color.value ? 'active' : ''}`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                            onClick={() => setAccentColor(color.value)}
                          ></div>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="fw-bold mb-2">Profile Photo</label>
                      <input type="file" className="d-none" ref={photoInputRef} accept="image/*" onChange={handlePhotoUpload} />
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-primary w-100" onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto}>
                          {uploadingPhoto ? "Uploading..." : profilePhoto ? "Replace Photo" : "Upload Photo"}
                        </button>
                        {profilePhoto && (
                          <button className="btn btn-sm btn-outline-danger" onClick={() => setProfilePhoto(null)} title="Remove Photo">
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="fw-bold mb-2">Photo Alignment</label>
                      <select className="form-select" value={photoAlignment} onChange={(e) => setPhotoAlignment(e.target.value as any)}>
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="fw-bold mb-2">Section Order (Drag & Drop)</label>
                      <div className="d-flex flex-column gap-2">
                        {sectionOrder.map((section) => (
                          <div
                            key={section}
                            className="draggable-section d-flex align-items-center gap-2"
                            draggable
                            onDragStart={(e) => onDragStart(e, section)}
                            onDragOver={onDragOver}
                            onDrop={(e) => onDrop(e, section)}
                          >
                            <i className="fa-solid fa-grip-vertical text-muted"></i>
                            <span className="user-select-none">{section}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-auto d-flex flex-column gap-2">
                      <button type="button" className="btn btn-light w-100" onClick={() => window.print()}>
                        <i className="fa-solid fa-download me-2"></i>Download PDF
                      </button>
                      <button type="button" className="btn btn-main w-100" onClick={handleSaveToProfile} disabled={savingToProfile}>
                        <i className="fa-solid fa-cloud-arrow-up me-2"></i>
                        {savingToProfile ? "Saving..." : (saveSuccess ? "Saved Successfully!" : "Save to Profile")}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-lg-9 col-md-12">
                  <div className="card print-resume border-0 shadow-sm overflow-hidden">
                    <div className="card-body p-5">
                      <TemplateRenderer 
                        resume={resume} 
                        setResume={setResume} 
                        templateId={templateId} 
                        accentColor={accentColor} 
                        profilePhoto={profilePhoto} 
                        photoAlignment={photoAlignment}
                        sectionOrder={sectionOrder} 
                        onSuggest={handleSuggest} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="row no-print">
            <div className="col-md-12">
              <div className="py-3 text-center">
                &copy; {new Date().getFullYear()} JobStock. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="no-print">
        <UploadResumeModal />
      </div>
    </>
  );
}
