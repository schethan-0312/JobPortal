"use client";

import { useState, useEffect } from "react";

export type EducationInput = { title: string; academy: string; year: string; description?: string };
export type ExperienceInput = { title: string; company: string; startDate?: string; endDate?: string; description?: string };
export type CertificationInput = { title: string; year: string; description?: string };
export type ProjectInput = { title: string; link?: string; description?: string };

interface EducationModalsProps {
  onAddEducation?: (data: EducationInput) => void;
  onEditEducation?: (data: EducationInput, index: number) => void;
  editEduData?: { data: EducationInput; index: number } | null;

  onAddExperience?: (data: ExperienceInput) => void;
  onEditExperience?: (data: ExperienceInput, index: number) => void;
  editExpData?: { data: ExperienceInput; index: number } | null;

  onAddCertification?: (data: CertificationInput) => void;
  onEditCertification?: (data: CertificationInput, index: number) => void;
  editCertData?: { data: CertificationInput; index: number } | null;

  onAddProject?: (data: ProjectInput) => void;
  onEditProject?: (data: ProjectInput, index: number) => void;
  editProjData?: { data: ProjectInput; index: number } | null;
}

export default function EducationModals({ 
  onAddEducation, onEditEducation, editEduData,
  onAddExperience, onEditExperience, editExpData,
  onAddCertification, onEditCertification, editCertData,
  onAddProject, onEditProject, editProjData
}: EducationModalsProps) {
  // Education State
  const [eduTitle, setEduTitle] = useState("");
  const [eduAcademy, setEduAcademy] = useState("");
  const [eduYear, setEduYear] = useState("");
  const [eduDesc, setEduDesc] = useState("");

  useEffect(() => {
    if (editEduData) {
      setEduTitle(editEduData.data.title || "");
      setEduAcademy(editEduData.data.academy || "");
      setEduYear(editEduData.data.year || "");
      setEduDesc(editEduData.data.description || "");
    } else {
      setEduTitle(""); setEduAcademy(""); setEduYear(""); setEduDesc("");
    }
  }, [editEduData]);

  // Experience State
  const [expTitle, setExpTitle] = useState("");
  const [expCompany, setExpCompany] = useState("");
  const [expStart, setExpStart] = useState("");
  const [expEnd, setExpEnd] = useState("");
  const [expDesc, setExpDesc] = useState("");

  useEffect(() => {
    if (editExpData) {
      setExpTitle(editExpData.data.title || "");
      setExpCompany(editExpData.data.company || "");
      setExpStart(editExpData.data.startDate || "");
      setExpEnd(editExpData.data.endDate || "");
      setExpDesc(editExpData.data.description || "");
    } else {
      setExpTitle(""); setExpCompany(""); setExpStart(""); setExpEnd(""); setExpDesc("");
    }
  }, [editExpData]);

  // Certification State
  const [certTitle, setCertTitle] = useState("");
  const [certYear, setCertYear] = useState("");
  const [certDesc, setCertDesc] = useState("");

  useEffect(() => {
    if (editCertData) {
      setCertTitle(editCertData.data.title || "");
      setCertYear(editCertData.data.year || "");
      setCertDesc(editCertData.data.description || "");
    } else {
      setCertTitle(""); setCertYear(""); setCertDesc("");
    }
  }, [editCertData]);

  // Project State
  const [projTitle, setProjTitle] = useState("");
  const [projLink, setProjLink] = useState("");
  const [projDesc, setProjDesc] = useState("");

  useEffect(() => {
    if (editProjData) {
      setProjTitle(editProjData.data.title || "");
      setProjLink(editProjData.data.link || "");
      setProjDesc(editProjData.data.description || "");
    } else {
      setProjTitle(""); setProjLink(""); setProjDesc("");
    }
  }, [editProjData]);

  const handleEduSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { title: eduTitle, academy: eduAcademy, year: eduYear, description: eduDesc };
    if (editEduData && onEditEducation) {
      onEditEducation(data, editEduData.index);
    } else if (onAddEducation) {
      onAddEducation(data);
    }
    const btn = document.querySelector('#educationmodal .mod-close') as HTMLElement;
    if (btn) btn.click();
  };

  const handleExpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { title: expTitle, company: expCompany, startDate: expStart, endDate: expEnd, description: expDesc };
    if (editExpData && onEditExperience) {
      onEditExperience(data, editExpData.index);
    } else if (onAddExperience) {
      onAddExperience(data);
    }
    const btn = document.querySelector('#experiencemodal .mod-close') as HTMLElement;
    if (btn) btn.click();
  };

  const handleCertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { title: certTitle, year: certYear, description: certDesc };
    if (editCertData && onEditCertification) {
      onEditCertification(data, editCertData.index);
    } else if (onAddCertification) {
      onAddCertification(data);
    }
    const btn = document.querySelector('#awardmodal .mod-close') as HTMLElement;
    if (btn) btn.click();
  };

  const handleProjSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { title: projTitle, link: projLink, description: projDesc };
    if (editProjData && onEditProject) {
      onEditProject(data, editProjData.index);
    } else if (onAddProject) {
      onAddProject(data);
    }
    const btn = document.querySelector('#projectmodal .mod-close') as HTMLElement;
    if (btn) btn.click();
  };

  return (
    <>
      {/* Education Modal */}
      <div className="modal fade" id="education" tabIndex={-1} role="dialog" aria-labelledby="messagemodal" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered education-pop-form" role="document">
          <div className="modal-content" id="educationmodal">
            <span className="mod-close" data-bs-dismiss="modal" aria-hidden="true"><i className="fas fa-close"></i></span>
            <div className="modal-body">
              <div className="text-center">
                <h4 className="mb-3">{editEduData ? "Edit your Education" : "Add your Education"}</h4>
              </div>
              <div className="added-form">
                <form onSubmit={handleEduSubmit}>
                  <div className="row mb-3">
                    <label className="col-md-12 col-form-label">Education Title</label>
                    <div className="col-md-12">
                      <input type="text" className="form-control" value={eduTitle} onChange={(e) => setEduTitle(e.target.value)} required />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-12 col-form-label">Academy Name</label>
                    <div className="col-md-12">
                      <input type="text" className="form-control" value={eduAcademy} onChange={(e) => setEduAcademy(e.target.value)} required />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-12 col-form-label">Passing year</label>
                    <div className="col-md-12">
                      <input type="text" className="form-control" placeholder="e.g. 2012" value={eduYear} onChange={(e) => setEduYear(e.target.value)} required />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-12 col-form-label">Description (optional)</label>
                    <div className="col-md-12">
                      <textarea className="form-control ht-80" value={eduDesc} onChange={(e) => setEduDesc(e.target.value)}></textarea>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-12">
                      <button type="submit" className="btn full-width btn-main">{editEduData ? "Save Changes" : "Save Education"}</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Experience Modal */}
      <div className="modal fade" id="experience" tabIndex={-1} role="dialog" aria-labelledby="messagemodal" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered experience-pop-form" role="document">
          <div className="modal-content" id="experiencemodal">
            <span className="mod-close" data-bs-dismiss="modal" aria-hidden="true"><i className="fas fa-close"></i></span>
            <div className="modal-body">
              <div className="text-center">
                <h4 className="mb-3">{editExpData ? "Edit your Experience" : "Add your Experience"}</h4>
              </div>
              <div className="added-form">
                <form onSubmit={handleExpSubmit}>
                  <div className="row mb-3">
                    <label className="col-md-12 col-form-label">Job Title</label>
                    <div className="col-md-12">
                      <input type="text" className="form-control" value={expTitle} onChange={(e) => setExpTitle(e.target.value)} required />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-12 col-form-label">Company Name</label>
                    <div className="col-md-12">
                      <input type="text" className="form-control" value={expCompany} onChange={(e) => setExpCompany(e.target.value)} required />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-12 col-form-label">Start Date</label>
                    <div className="col-md-12">
                      <input type="text" className="form-control" placeholder="e.g. Jan 2018" value={expStart} onChange={(e) => setExpStart(e.target.value)} />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-12 col-form-label">End Date</label>
                    <div className="col-md-12">
                      <input type="text" className="form-control" placeholder="e.g. Present" value={expEnd} onChange={(e) => setExpEnd(e.target.value)} />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-12 col-form-label">Description (optional)</label>
                    <div className="col-md-12">
                      <textarea className="form-control ht-80" value={expDesc} onChange={(e) => setExpDesc(e.target.value)}></textarea>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-12">
                      <button type="submit" className="btn full-width btn-main">{editExpData ? "Save Changes" : "Save Experience"}</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Award Modal */}
      <div className="modal fade" id="award" tabIndex={-1} role="dialog" aria-labelledby="messagemodal" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered award-pop-form" role="document">
          <div className="modal-content" id="awardmodal">
            <span className="mod-close" data-bs-dismiss="modal" aria-hidden="true"><i className="fas fa-close"></i></span>
            <div className="modal-body">
              <div className="text-center">
                <h4 className="mb-3">{editCertData ? "Edit your Certification" : "Add your Certification / Award"}</h4>
              </div>
              <div className="added-form">
                <form onSubmit={handleCertSubmit}>
                  <div className="row mb-3">
                    <label className="col-md-12 col-form-label">Title</label>
                    <div className="col-md-12">
                      <input type="text" className="form-control" value={certTitle} onChange={(e) => setCertTitle(e.target.value)} required />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-12 col-form-label">Year</label>
                    <div className="col-md-12">
                      <input type="text" className="form-control" placeholder="e.g. 2021" value={certYear} onChange={(e) => setCertYear(e.target.value)} required />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-12 col-form-label">Description (optional)</label>
                    <div className="col-md-12">
                      <textarea className="form-control ht-80" value={certDesc} onChange={(e) => setCertDesc(e.target.value)}></textarea>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-12">
                      <button type="submit" className="btn full-width btn-main">{editCertData ? "Save Changes" : "Save Award"}</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Modal */}
      <div className="modal fade" id="project" tabIndex={-1} role="dialog" aria-labelledby="messagemodal" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered project-pop-form" role="document">
          <div className="modal-content" id="projectmodal">
            <span className="mod-close" data-bs-dismiss="modal" aria-hidden="true"><i className="fas fa-close"></i></span>
            <div className="modal-body">
              <div className="text-center">
                <h4 className="mb-3">{editProjData ? "Edit your Project" : "Add your Project"}</h4>
              </div>
              <div className="added-form">
                <form onSubmit={handleProjSubmit}>
                  <div className="row mb-3">
                    <label className="col-md-12 col-form-label">Project Title</label>
                    <div className="col-md-12">
                      <input type="text" className="form-control" value={projTitle} onChange={(e) => setProjTitle(e.target.value)} required />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-12 col-form-label">Link</label>
                    <div className="col-md-12">
                      <input type="text" className="form-control" placeholder="e.g. https://github.com/..." value={projLink} onChange={(e) => setProjLink(e.target.value)} />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-12 col-form-label">Description (optional)</label>
                    <div className="col-md-12">
                      <textarea className="form-control ht-80" value={projDesc} onChange={(e) => setProjDesc(e.target.value)}></textarea>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-12">
                      <button type="submit" className="btn full-width btn-main">{editProjData ? "Save Changes" : "Save Project"}</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
