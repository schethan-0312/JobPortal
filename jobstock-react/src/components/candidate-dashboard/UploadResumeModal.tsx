"use client";

import { useRef, useState } from "react";
import { api, ApiError, uploadFile } from "@/lib/api";

interface CandidateProfile {
  skills: string[];
}

export default function UploadResumeModal() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLSpanElement>(null);

  const [fileName, setFileName] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Please choose a resume file first.");
      setStatus("error");
      return;
    }

    setStatus("uploading");
    setError(null);
    try {
      const { url } = await uploadFile<{ url: string }>("/uploads/document", file);

      const newSkills = skillsInput
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

      let skills: string[] | undefined;
      if (newSkills.length > 0) {
        const current = await api.get<CandidateProfile>("/candidates/me");
        skills = Array.from(new Set([...(current.skills || []), ...newSkills]));
      }

      await api.patch("/candidates/me", { resumeUrl: url, ...(skills ? { skills } : {}) });

      setStatus("idle");
      setFileName("");
      setSkillsInput("");
      closeRef.current?.click();
      window.location.reload();
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiError ? err.message : "Failed to upload resume. Try again.");
    }
  }

  return (
    <div className="modal fade" id="uploadresume" tabIndex={-1} role="dialog" aria-labelledby="uploadresumemodal" aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content" id="uploadresumemodal">
          <span ref={closeRef} className="mod-close" data-bs-dismiss="modal" aria-hidden="true"><i className="fas fa-close"></i></span>
          <div className="modal-body">
            <div className="head-caps mb-4">
              <h4 className="mb-0">Upload Resume</h4>
              <p className="text-muted">Upload your resume in PDF or Word format</p>
            </div>
            <div className="modal-uploadresume-form">
              <form className="upload-container" onSubmit={handleSubmit}>
                {error && <div className="alert alert-danger py-2">{error}</div>}
                <label className="upload-box">
                  <i className="bi bi-cloud-plus"></i>
                  <p className="text-secondcolor fw-medium fs-6 mb-0">
                    {fileName || "Click to choose your resume file"}
                  </p>
                  <p className="text-sm text-muted">PDF or Word, up to 10MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    name="resume"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
                  />
                </label>
                <div className="skills-section mb-5">
                  <label htmlFor="skills">Add Skills (optional, comma separated)</label>
                  <textarea
                    id="skills"
                    className="form-control"
                    name="skills"
                    placeholder="e.g. React, Node.js, SQL"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                  ></textarea>
                </div>
                <div className="d-flex align-items-center justify-content-end">
                  <button type="submit" className="btn btn-md btn-main px-4" disabled={status === "uploading"}>
                    {status === "uploading" ? "Uploading..." : "Upload Resume"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
