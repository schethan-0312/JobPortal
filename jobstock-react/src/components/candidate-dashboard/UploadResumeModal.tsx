"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, uploadFile } from "@/lib/api";

interface CandidateProfile {
  resumeUrl: string | null;
}

export default function UploadResumeModal() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLSpanElement>(null);

  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState<"idle" | "Uploading Resume..." | "Extracting Resume..." | "Analyzing Resume..." | "Preparing Profile..." | "Ready for Review..." | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);

  useEffect(() => {
    // Check if user already has a resume to warn them
    api.get<any>("/candidates/me/resume")
      .then(r => {
        if (r.resumeUrl) setHasExistingProfile(true);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Please choose a resume file first.");
      setStatus("error");
      return;
    }

    if (hasExistingProfile) {
      if (!window.confirm("Uploading a new resume will replace your existing saved resume data. Continue?")) {
        return;
      }
    }

    setError(null);
    try {
      setStatus("Uploading Resume...");
      const { url } = await uploadFile<{ url: string }>("/uploads/document?save=false", file);

      setStatus("Extracting Resume...");
      
      // Simulate extraction phase before analysis phase
      await new Promise(r => setTimeout(r, 1000));
      setStatus("Analyzing Resume...");

      const parsedData = await api.post<any>("/resume-parser/parse", { resumeUrl: url });

      setStatus("Preparing Profile...");
      
      const draft: Record<string, any> = {
        resumeUrl: url,
        ...(parsedData as Record<string, any>)
      };
      
      // Ensure we map 'about' to 'summary' for the new draft format if 'about' exists
      if (draft.about && !draft.summary) {
        draft.summary = draft.about;
        delete draft.about;
      }

      sessionStorage.setItem("resumeDraft", JSON.stringify(draft));

      setStatus("Ready for Review...");
      await new Promise(r => setTimeout(r, 500));

      setStatus("idle");
      setFileName("");
      closeRef.current?.click();
      
      // Navigate to review page
      router.push("/candidate-resume");
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiError ? err.message : "Failed to process resume. Try again.");
    }
  }

  const isProcessing = status !== "idle" && status !== "error";

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
                
                {isProcessing ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary mb-3" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <h5 className="text-primary">{status}</h5>
                    <p className="text-muted small">Please wait, AI is doing the heavy lifting...</p>
                  </div>
                ) : (
                  <>
                    <label className="upload-box mb-4">
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
                    
                    {hasExistingProfile && (
                      <div className="alert alert-warning py-2 mb-4" style={{ fontSize: '0.9rem' }}>
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Uploading a new resume will replace your existing saved resume data.
                      </div>
                    )}

                    <div className="d-flex align-items-center justify-content-end">
                      <button type="submit" className="btn btn-md btn-main px-4">
                        Upload & Analyze Resume
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
