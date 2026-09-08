"use client";

import React from "react";
import { assetUrl } from "@/lib/api";

export interface ExperienceEntry {
  title: string;
  company: string;
  duration: string;
  bullets: string[];
}

export interface EducationEntry {
  degree: string;
  institution: string;
  year: string;
}

export interface ProjectEntry {
  title: string;
  link?: string;
  description: string;
}

export interface CertificationEntry {
  title: string;
  year: string;
  description: string;
}

export interface BuiltResume {
  fullName: string;
  headline: string;
  contact: { email?: string; phone?: string; location?: string };
  summary: string;
  skills: string[];
  languages: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
}

interface TemplateRendererProps {
  resume: BuiltResume;
  setResume: (resume: BuiltResume) => void;
  templateId: string;
  accentColor: string;
  profilePhoto: string | null;
  photoAlignment?: "left" | "center" | "right";
  sectionOrder: string[];
  onSuggest: (type: string, text: string, onAccept: (newText: string) => void) => void;
}

export default function TemplateRenderer({
  resume,
  setResume,
  templateId,
  accentColor,
  profilePhoto,
  photoAlignment = "center",
  sectionOrder,
  onSuggest,
}: TemplateRendererProps) {
  
  const isAts = templateId.includes("ats");

  // Auto-resize textareas so content is never cut off
  React.useEffect(() => {
    const resizeTextareas = () => {
      const textareas = document.querySelectorAll(".editable-textarea") as NodeListOf<HTMLTextAreaElement>;
      const scrollPos = window.scrollY;
      textareas.forEach(t => {
        t.style.height = 'auto';
        t.style.height = (t.scrollHeight + 5) + 'px'; // +5px buffer to prevent clipping
      });
      window.scrollTo(0, scrollPos);
    };

    resizeTextareas();
    // Run again slightly later to account for fonts loading
    const timer1 = setTimeout(resizeTextareas, 100);
    const timer2 = setTimeout(resizeTextareas, 500);
    const timer3 = setTimeout(resizeTextareas, 1500);

    const handleInput = (e: Event) => {
      const t = e.target as HTMLTextAreaElement;
      if (t.classList.contains("editable-textarea")) {
        const scrollPos = window.scrollY;
        t.style.height = 'auto';
        t.style.height = (t.scrollHeight + 5) + 'px';
        window.scrollTo(0, scrollPos);
      }
    };
    
    document.addEventListener("input", handleInput);
    window.addEventListener("resize", resizeTextareas);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      document.removeEventListener("input", handleInput);
      window.removeEventListener("resize", resizeTextareas);
    };
  }, [resume, templateId, sectionOrder]);

  // Renderers for each section
  const renderSummary = () => (
    <div className="resume-section section-summary mb-3" key="Summary">
      <h5 className="section-title">Professional Summary</h5>
      <div className="position-relative">
        <textarea
          className="editable-textarea text-muted"
          rows={4}
          value={resume.summary}
          onChange={(e) => setResume({ ...resume, summary: e.target.value })}
        />
        <button
          className="btn btn-sm btn-outline-primary ai-btn position-absolute top-0 end-0 no-print"
          style={{ marginTop: "-25px" }}
          onClick={() => onSuggest("summary", resume.summary, (v) => setResume({ ...resume, summary: v }))}
        >
          ✨ AI Improve
        </button>
      </div>
    </div>
  );

  const renderSkills = () => (
    <div className="resume-section section-skills mb-3" key="Skills">
      <h5 className="section-title">Skills</h5>
      <div className="position-relative">
        <textarea
          className="editable-textarea text-muted"
          rows={2}
          value={resume.skills.join(", ")}
          onChange={(e) => setResume({ ...resume, skills: e.target.value.split(",").map((s) => s.trim()) })}
        />
        <button
          className="btn btn-sm btn-outline-primary ai-btn position-absolute top-0 end-0 no-print"
          style={{ marginTop: "-25px" }}
          onClick={() =>
            onSuggest("skills list", resume.skills.join(", "), (v) =>
              setResume({ ...resume, skills: v.split(",").map((s) => s.trim()) })
            )
          }
        >
          ✨ AI Improve
        </button>
      </div>
    </div>
  );

  const renderExperience = () => (
    <div className="resume-section section-experience mb-3" key="Experience">
      <h5 className="section-title">Experience</h5>
      {resume.experience.map((exp, i) => (
        <div className="mb-3 experience-item" key={i}>
          <div className="d-flex justify-content-between align-items-start">
            <textarea rows={1}
              className="editable-textarea fw-bold exp-title"
              style={{ width: "65%" }}
              value={exp.title}
              onChange={(e) => {
                const newExp = [...resume.experience];
                newExp[i].title = e.target.value;
                setResume({ ...resume, experience: newExp });
              }}
            />
            <textarea rows={1}
              className="editable-textarea text-end text-muted small exp-date"
              style={{ width: "30%" }}
              value={exp.duration}
              onChange={(e) => {
                const newExp = [...resume.experience];
                newExp[i].duration = e.target.value;
                setResume({ ...resume, experience: newExp });
              }}
            />
          </div>
          <textarea rows={1}
            className="editable-textarea text-muted mb-1 exp-company"
            value={exp.company}
            onChange={(e) => {
              const newExp = [...resume.experience];
              newExp[i].company = e.target.value;
              setResume({ ...resume, experience: newExp });
            }}
          />
          <div className="position-relative">
            <textarea
              className="editable-textarea exp-bullets"
              rows={exp.bullets.length + 1}
              value={exp.bullets.map(b => b.trim().startsWith('•') ? b : `• ${b}`).join("\n")}
              onChange={(e) => {
                const newExp = [...resume.experience];
                newExp[i].bullets = e.target.value.split("\n").map(b => b.replace(/^•\s*/, ''));
                setResume({ ...resume, experience: newExp });
              }}
            />
            <button
              className="btn btn-sm btn-outline-primary ai-btn position-absolute top-0 end-0 no-print"
              style={{ marginTop: "-25px" }}
              onClick={() =>
                onSuggest("experience bullets", exp.bullets.join("\n"), (v) => {
                  const newExp = [...resume.experience];
                  newExp[i].bullets = v.split("\n");
                  setResume({ ...resume, experience: newExp });
                })
              }
            >
              ✨ AI Improve
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderEducation = () => (
    <div className="resume-section section-education mb-3" key="Education">
      <h5 className="section-title">Education</h5>
      {resume.education.map((ed, i) => (
        <div className="mb-2 education-item" key={i}>
          <div className="d-flex justify-content-between align-items-start">
            <textarea rows={1}
              className="editable-textarea fw-bold edu-degree"
              style={{ width: "70%" }}
              value={ed.degree}
              onChange={(e) => {
                const newEd = [...resume.education];
                newEd[i].degree = e.target.value;
                setResume({ ...resume, education: newEd });
              }}
            />
            <textarea rows={1}
              className="editable-textarea text-end text-muted small edu-year"
              style={{ width: "25%" }}
              value={ed.year}
              onChange={(e) => {
                const newEd = [...resume.education];
                newEd[i].year = e.target.value;
                setResume({ ...resume, education: newEd });
              }}
            />
          </div>
          <textarea rows={1}
            className="editable-textarea text-muted edu-institution"
            value={ed.institution}
            onChange={(e) => {
              const newEd = [...resume.education];
              newEd[i].institution = e.target.value;
              setResume({ ...resume, education: newEd });
            }}
          />
        </div>
      ))}
    </div>
  );

  const renderProjects = () => {
    if (!resume.projects || resume.projects.length === 0) return null;
    return (
      <div className="resume-section section-projects mb-3" key="Projects">
        <h5 className="section-title">Projects</h5>
        {resume.projects.map((proj, i) => (
          <div className="mb-2 project-item" key={i}>
            <textarea rows={1}
              className="editable-textarea fw-bold proj-title"
              value={proj.title}
              onChange={(e) => {
                const newProj = [...resume.projects];
                newProj[i].title = e.target.value;
                setResume({ ...resume, projects: newProj });
              }}
            />
            <textarea
              className="editable-textarea text-muted proj-desc"
              rows={2}
              value={proj.description}
              onChange={(e) => {
                const newProj = [...resume.projects];
                newProj[i].description = e.target.value;
                setResume({ ...resume, projects: newProj });
              }}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderCertifications = () => {
    if (!resume.certifications || resume.certifications.length === 0) return null;
    return (
      <div className="resume-section section-certifications mb-3" key="Certifications">
        <h5 className="section-title">Certifications</h5>
        {resume.certifications.map((cert, i) => (
          <div className="mb-2 cert-item" key={i}>
            <div className="d-flex justify-content-between align-items-start">
              <textarea rows={1}
                className="editable-textarea fw-bold cert-title"
                style={{ width: "70%" }}
                value={cert.title}
                onChange={(e) => {
                  const newCert = [...resume.certifications];
                  newCert[i].title = e.target.value;
                  setResume({ ...resume, certifications: newCert });
                }}
              />
              <textarea rows={1}
                className="editable-textarea text-end text-muted small cert-year"
                style={{ width: "25%" }}
                value={cert.year}
                onChange={(e) => {
                  const newCert = [...resume.certifications];
                  newCert[i].year = e.target.value;
                  setResume({ ...resume, certifications: newCert });
                }}
              />
            </div>
            <textarea rows={1}
              className="editable-textarea text-muted cert-desc"
              value={cert.description || ""}
              onChange={(e) => {
                const newCert = [...resume.certifications];
                newCert[i].description = e.target.value;
                setResume({ ...resume, certifications: newCert });
              }}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderLanguages = () => {
    if (!resume.languages || resume.languages.length === 0) return null;
    return (
      <div className="resume-section section-languages mb-3" key="Languages">
        <h5 className="section-title">Languages</h5>
        <div className="position-relative">
          <textarea
            className="editable-textarea text-muted"
            rows={1}
            value={resume.languages.join(", ")}
            onChange={(e) => setResume({ ...resume, languages: e.target.value.split(",").map((s) => s.trim()) })}
          />
        </div>
      </div>
    );
  };

  const sectionRenderers: Record<string, () => React.ReactNode> = {
    Summary: renderSummary,
    Skills: renderSkills,
    Experience: renderExperience,
    Education: renderEducation,
    Projects: renderProjects,
    Certifications: renderCertifications,
    Languages: renderLanguages,
  };

  return (
    <div className={`template-wrapper template-${templateId}`} style={{ "--accent": accentColor } as any}>
      <style>{`
        .template-wrapper {
          color: #333;
          background: #fff;
          font-size: 14px;
          line-height: 1.6;
          padding: 15px;
        }
        
        .resume-section { margin-bottom: 24px !important; }
        .experience-item, .education-item, .project-item, .cert-item { margin-bottom: 16px; }
        .section-title { margin-bottom: 12px; }

        .editable-input { border: 1px solid transparent; background: transparent; width: 100%; transition: 0.2s; padding: 2px 4px; }
        .editable-input:hover, .editable-input:focus { border-color: #cbd5e1; background: #f8fafc; outline: none; }
        .editable-textarea { border: 1px solid transparent; background: transparent; width: 100%; transition: 0.2s; padding: 4px; resize: none; overflow: hidden; }
        .editable-textarea:hover, .editable-textarea:focus { border-color: #cbd5e1; background: #f8fafc; outline: none; resize: vertical; }
        .ai-btn { font-size: 0.75rem; padding: 0.1rem 0.4rem; margin-left: 0.5rem; }

        /* Generic Header */
        .resume-header {
          text-align: ${photoAlignment};
          margin-bottom: 2rem;
        }
        .header-name {
          font-size: 2rem;
          margin-bottom: 0.25rem;
          font-weight: 700;
          color: var(--accent);
        }
        .header-headline {
          font-size: 1.1rem;
          color: #666;
          margin-bottom: 0.5rem;
        }
        .header-contact {
          display: flex;
          justify-content: center;
          gap: 1rem;
          color: #555;
          font-size: 0.9rem;
          flex-wrap: wrap;
        }
        .header-photo {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
          margin-bottom: 1rem;
          margin-top: 0;
          margin-left: ${photoAlignment === "center" ? "auto" : photoAlignment === "right" ? "auto" : "0"};
          margin-right: ${photoAlignment === "center" ? "auto" : photoAlignment === "left" ? "auto" : "0"};
          display: block;
          border: 3px solid var(--accent);
        }

        /* 1. ATS Professional */
        .template-ats-professional { font-family: "Times New Roman", Times, serif; }
        .template-ats-professional .section-title { font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; margin-bottom: 10px; color: #000; }
        .template-ats-professional .header-name { color: #000; }

        /* 2. Modern Professional */
        .template-modern-professional { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .template-modern-professional .section-title { font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: var(--accent); border-bottom: 2px solid var(--accent); padding-bottom: 4px; }
        .template-modern-professional .header-name { text-transform: uppercase; }

        /* 3. Minimal */
        .template-minimal { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: 300; }
        .template-minimal .section-title { font-weight: 400; color: var(--accent); margin-bottom: 8px; }
        .template-minimal .header-name { font-weight: 300; }

        /* 4. Executive */
        .template-executive { font-family: Georgia, serif; }
        .template-executive .section-title { border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; padding: 4px 0; text-align: center; color: var(--accent); font-weight: 600; }
        .template-executive .resume-header { border-bottom: 3px solid var(--accent); padding-bottom: 1rem; }

        /* 5. Corporate */
        .template-corporate { font-family: Arial, sans-serif; border-top: 10px solid var(--accent); padding-top: 20px; }
        .template-corporate .section-title { background-color: #f3f4f6; padding: 4px 8px; color: var(--accent); font-weight: bold; border-left: 4px solid var(--accent); }
        .template-corporate .header-name { text-align: left; }
        .template-corporate .resume-header { text-align: left; }
        .template-corporate .header-contact { justify-content: flex-start; }

        /* 6. Creative */
        .template-creative { font-family: 'Poppins', sans-serif; }
        .template-creative .section-title { color: #fff; background-color: var(--accent); padding: 4px 12px; border-radius: 4px; display: inline-block; }
        .template-creative .header-name { font-size: 2.5rem; letter-spacing: -1px; }

        /* 7. Elegant */
        .template-elegant { font-family: 'Playfair Display', serif; }
        .template-elegant .section-title { font-style: italic; border-bottom: 1px dashed var(--accent); color: var(--accent); }
        .template-elegant .header-name { font-variant: small-caps; }

        /* 8. Classic */
        .template-classic { font-family: 'Garamond', serif; font-size: 15px; }
        .template-classic .section-title { text-align: center; text-transform: uppercase; font-weight: bold; letter-spacing: 2px; }

        /* 9. Student */
        .template-student { font-family: 'Roboto', sans-serif; }
        .template-student .section-title { border-left: 3px solid var(--accent); padding-left: 8px; font-weight: bold; }
        .template-student .resume-header { background: #f8fafc; padding: 1.5rem; border-radius: 8px; }

        /* 10. Intern */
        .template-intern { font-family: 'Open Sans', sans-serif; }
        .template-intern .section-title { color: var(--accent); border-bottom: 1px solid #e2e8f0; font-weight: 600; }

        /* 11. Software Engineer */
        .template-software-engineer { font-family: 'Fira Code', monospace; font-size: 13px; }
        .template-software-engineer .section-title { color: var(--accent); }
        .template-software-engineer .section-title::before { content: "> "; }

        /* 12. Full Stack Developer */
        .template-full-stack { font-family: 'Inter', sans-serif; }
        .template-full-stack .section-title { border-bottom: 2px solid var(--accent); display: inline-block; padding-bottom: 2px; }
        .template-full-stack .resume-header { display: flex; justify-content: space-between; align-items: center; text-align: left; }
        .template-full-stack .header-contact { flex-direction: column; gap: 4px; align-items: flex-end; }

        /* 13. Data Scientist */
        .template-data-scientist { font-family: 'Lato', sans-serif; }
        .template-data-scientist .section-title { background: #f1f5f9; padding: 6px 10px; border-left: 5px solid var(--accent); }

        /* 14. AI Engineer */
        .template-ai-engineer { font-family: 'Orbitron', sans-serif; }
        .template-ai-engineer .section-title { text-transform: uppercase; letter-spacing: 1px; color: var(--accent); border-bottom: 1px solid #cbd5e1; }
        .template-ai-engineer .header-name { letter-spacing: 2px; }

        /* 15. UI / UX Designer */
        .template-ui-ux { font-family: 'Montserrat', sans-serif; }
        .template-ui-ux .section-title { font-weight: 800; text-transform: lowercase; color: var(--accent); }
        .template-ui-ux .header-name { font-weight: 900; letter-spacing: -2px; }

        /* 16. Product Manager */
        .template-product-manager { font-family: 'Lato', sans-serif; }
        .template-product-manager .section-title { font-weight: 700; color: var(--accent); border-bottom: 3px solid var(--accent); }

        /* 17. Marketing Professional */
        .template-marketing { font-family: 'Raleway', sans-serif; }
        .template-marketing .section-title { text-align: right; color: var(--accent); border-bottom: 1px solid var(--accent); font-weight: 800; }

        /* 18. Finance Professional */
        .template-finance { font-family: 'Merriweather', serif; }
        .template-finance .section-title { border-top: 2px solid #000; border-bottom: 2px solid #000; text-align: center; font-weight: bold; text-transform: uppercase; }

        /* 19. Healthcare Professional */
        .template-healthcare { font-family: 'Ubuntu', sans-serif; }
        .template-healthcare .section-title { color: var(--accent); border-bottom: 1px solid var(--accent); padding-bottom: 4px; }
        .template-healthcare .header-name { color: var(--accent); }

        /* 20. Portfolio Style */
        .template-portfolio { font-family: 'Nunito', sans-serif; }
        .template-portfolio .section-title { color: var(--accent); font-weight: 800; font-size: 1.5rem; }
        .template-portfolio .resume-header { border-left: 5px solid var(--accent); padding-left: 20px; text-align: left; }
        .template-portfolio .header-contact { justify-content: flex-start; }

      `}</style>
      
      <div className="resume-header">
        {profilePhoto && (
          <img src={assetUrl(profilePhoto) || ""} alt="Profile" className="header-photo" />
        )}
        <textarea rows={1} 
          className="editable-textarea header-name w-100" 
          value={resume.fullName} 
          onChange={(e) => setResume({...resume, fullName: e.target.value})} 
          style={{ textAlign: 'inherit' }}
        />
        <textarea rows={1} 
          className="editable-textarea header-headline w-100" 
          value={resume.headline} 
          onChange={(e) => setResume({...resume, headline: e.target.value})} 
          style={{ textAlign: 'inherit' }}
        />
        <div className="header-contact" style={{ justifyContent: photoAlignment === "left" ? "flex-start" : photoAlignment === "right" ? "flex-end" : "center" }}>
          <textarea rows={1} className="editable-textarea" style={{ width: 'auto' }} value={resume.contact?.email || ''} onChange={(e) => setResume({...resume, contact: {...resume.contact, email: e.target.value}})} placeholder="Email" />
          <textarea rows={1} className="editable-textarea" style={{ width: 'auto' }} value={resume.contact?.phone || ''} onChange={(e) => setResume({...resume, contact: {...resume.contact, phone: e.target.value}})} placeholder="Phone" />
          <textarea rows={1} className="editable-textarea" style={{ width: 'auto' }} value={resume.contact?.location || ''} onChange={(e) => setResume({...resume, contact: {...resume.contact, location: e.target.value}})} placeholder="Location" />
        </div>
      </div>

      <div className="resume-body">
        {sectionOrder.map((section) => {
          const renderer = sectionRenderers[section];
          if (renderer) return renderer();
          return null;
        })}
      </div>
    </div>
  );
}

