"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar8 from "@/components/Navbar8";
import EmployerSidebar from "@/components/employer-dashboard/EmployerSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface EmployerJob {
  id: string;
  title: string;
  status: string;
}

type QuestionType = 
  | "mcq" 
  | "coding" 
  | "short_answer" 
  | "debugging" 
  | "sql" 
  | "spreadsheet" 
  | "video"
  | "whiteboard"
  | "personality";

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
}

interface BaseQuestion {
  id: string;
  prompt: string;
  options?: string[];
  correctOptionIndex?: number;
  starterCode?: string;
  expectedOutput?: string;
  testCases?: TestCase[];
  schemaDescription?: string;
  expectedSqlOutput?: string;
  expectedFormulas?: string;
  workPreferences?: string;
  behavioralTendencies?: string;
  workingStyle?: string;
}

interface QuestionSection {
  id: string;
  type: QuestionType;
  questions: BaseQuestion[];
}

export default function EmployerCompetitionPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedJobId, setSelectedJobId] = useState("");
  const [existingAssessments, setExistingAssessments] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [skills, setSkills] = useState("");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState("");
  
  // A single assessment has exactly one section now, but it still maintains the sections array format for backward compatibility
  const [sections, setSections] = useState<QuestionSection[]>([]);
  
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Load existing assessments when a job is selected
  useEffect(() => {
    if (selectedJobId) {
      api.get<any[]>(`/jobs/${selectedJobId}/assessments`)
         .then(data => setExistingAssessments(data))
         .catch(() => setExistingAssessments([]));
    } else {
      setExistingAssessments([]);
    }
  }, [selectedJobId]);

  useEffect(() => {
    if (!loading && (!user || user.role !== "EMPLOYER")) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "EMPLOYER") return;
    api
      .get<EmployerJob[]>("/jobs/mine")
      .then((data) => {
        setJobs(data.filter((j) => j.status === "OPEN"));
        setDataLoading(false);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Failed to load jobs");
        setDataLoading(false);
      });
  }, [user]);

  const createBaseQuestion = (type: QuestionType): BaseQuestion => {
    const newQuestion: BaseQuestion = {
      id: crypto.randomUUID(),
      prompt: "",
    };
    if (type === "mcq") {
      newQuestion.options = ["", ""];
      newQuestion.correctOptionIndex = 0;
    } else if (type === "coding" || type === "debugging") {
      newQuestion.starterCode = "function solution(input) {\n  // Write your code here\n  return input;\n}";
      newQuestion.testCases = [
        { id: crypto.randomUUID(), input: "5", expectedOutput: "5" },
        { id: crypto.randomUUID(), input: "10", expectedOutput: "10" },
        { id: crypto.randomUUID(), input: "15", expectedOutput: "15" },
      ];
    }
    return newQuestion;
  };

  const handleAddSection = (type: QuestionType) => {
    const newSection: QuestionSection = {
      id: crypto.randomUUID(),
      type,
      questions: [createBaseQuestion(type)],
    };
    setSections([...sections, newSection]);
  };

  const handleRemoveSection = (sectionId: string) => {
    setSections(sections.filter((s) => s.id !== sectionId));
  };

  const handleAddQuestionToSection = (sectionId: string, type: QuestionType) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return { ...s, questions: [...s.questions, createBaseQuestion(type)] };
      }
      return s;
    }));
  };

  const handleRemoveQuestionFromSection = (sectionId: string, questionId: string) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return { ...s, questions: s.questions.filter(q => q.id !== questionId) };
      }
      return s;
    }).filter(s => s.questions.length > 0)); // Also remove section if empty
  };

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!confirm("Are you sure you want to delete this assessment?")) return;
    
    try {
      await api.delete(`/jobs/assessments/${assessmentId}`);
      setExistingAssessments(prev => prev.filter(a => a.id !== assessmentId));
      setSuccessMsg("Assessment deleted successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete assessment");
    }
  };

  const handleUpdateQuestion = (sectionId: string, questionId: string, updates: Partial<BaseQuestion>) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          questions: s.questions.map(q => q.id === questionId ? { ...q, ...updates } : q)
        };
      }
      return s;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId) {
      setError("Please select a job");
      return;
    }
    if (sections.length === 0) {
      setError("Please add at least one question section to the assessment.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg("");

    try {
      const skillsArr = skills.split(",").map((s) => s.trim()).filter((s) => s.length > 0);

      // The backend simply accepts any JSON for questions. 
      // We'll pass the sections array directly so it retains grouping.
      await api.post(`/jobs/${selectedJobId}/assessment`, {
        title,
        skills: skillsArr,
        questions: sections,
        timeLimitMinutes: timeLimitMinutes ? parseInt(timeLimitMinutes, 10) : null,
      });

      setSuccessMsg("Assessment created successfully!");
      setTitle("");
      setSkills("");
      setTimeLimitMinutes("");
      setSections([]);
      
      // Reload existing assessments
      api.get<any[]>(`/jobs/${selectedJobId}/assessments`)
         .then(data => setExistingAssessments(data))
         .catch(() => {});
      
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save assessment");
      window.scrollTo(0, 0);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user || user.role !== "EMPLOYER") {
    return null;
  }

  const formatSectionTitle = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <>
      <Navbar8 />

      <div className="dashboard-wrap bg-light">
        <EmployerSidebar active="competition" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Create Assessment (Competition)</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted">
                      <a href="#">Employer</a>
                    </li>
                    <li className="breadcrumb-item">
                      <a href="#" className="text-main">
                        Competition
                      </a>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}
            {successMsg && <div className="alert alert-success">{successMsg}</div>}
            
            <div className="card">
              <div className="card-header">
                <h4>Assessment Details</h4>
              </div>
              <div className="card-body">
                {dataLoading ? (
                  <p>Loading...</p>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label fw-medium">Select Job Role</label>
                      <select 
                        className="form-select" 
                        value={selectedJobId} 
                        onChange={(e) => setSelectedJobId(e.target.value)}
                        required
                      >
                        <option value="">-- Choose a job --</option>
                        {jobs.map(job => (
                          <option key={job.id} value={job.id}>{job.title}</option>
                        ))}
                      </select>
                    </div>

                    {existingAssessments.length > 0 && (
                      <div className="mb-4 p-3 bg-white border rounded shadow-sm">
                        <h6 className="fw-bold mb-3"><i className="fa-solid fa-list-check me-2 text-primary"></i>Existing Assessments for this Job</h6>
                        <ul className="list-group list-group-flush">
                          {existingAssessments.map(a => (
                            <li key={a.id} className="list-group-item px-0 d-flex justify-content-between align-items-center">
                              <div>
                                <span className="fw-medium">{a.title}</span>
                                <div className="small text-muted mt-1">
                                  {a.skills?.join(", ")} | {a.timeLimitMinutes ? `${a.timeLimitMinutes} minutes` : "No time limit"}
                                </div>
                              </div>
                              <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-light text-dark border">
                                  {a.questions?.[0]?.type || 'Unknown'} section
                                </span>
                                <button 
                                  type="button"
                                  className="btn btn-sm btn-outline-danger border-0"
                                  onClick={() => handleDeleteAssessment(a.id)}
                                  title="Delete Assessment"
                                >
                                  <i className="fa-solid fa-trash"></i>
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mb-3">
                      <label className="form-label fw-medium">Assessment Title</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="e.g., Frontend React Developer Challenge" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-medium">Required Skills (comma separated)</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="e.g., React, TypeScript, Node.js" 
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-medium">Time Limit (Minutes)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        placeholder="e.g., 30 (Leave blank for no time limit)" 
                        value={timeLimitMinutes}
                        onChange={(e) => setTimeLimitMinutes(e.target.value)}
                        min="1"
                      />
                      <small className="text-muted">If set, the assessment will auto-lock when this time expires.</small>
                    </div>

                    <hr className="my-5" />
                    <h5 className="mb-4">Assessment Sections Builder</h5>
                    <p className="text-muted small">You can create one section type per assessment. To test multiple distinct sections for the same job, create separate assessments.</p>

                    {sections.map((section, sIndex) => (
                      <div key={section.id} className="card border mb-5 shadow-sm border-primary">
                        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                          <h6 className="mb-0">
                            Section {sIndex + 1}: {formatSectionTitle(section.type)}
                          </h6>
                          <button 
                            type="button" 
                            className="btn btn-sm btn-light text-danger"
                            onClick={() => handleRemoveSection(section.id)}
                          >
                            <i className="fa-solid fa-trash me-1"></i> Remove Section
                          </button>
                        </div>
                        
                        <div className="card-body bg-light">
                          {section.questions.map((q, qIndex) => (
                            <div key={q.id} className="card mb-4 border-0 shadow-sm">
                              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                                <span className="fw-bold text-secondary">Question {qIndex + 1}</span>
                                <button 
                                  type="button" 
                                  className="btn btn-sm btn-outline-danger border-0"
                                  onClick={() => handleRemoveQuestionFromSection(section.id, q.id)}
                                >
                                  <i className="fa-solid fa-xmark"></i>
                                </button>
                              </div>
                              <div className="card-body">
                                {section.type !== "personality" && (
                                  <div className="mb-3">
                                    <label className="form-label fw-medium">Prompt / Question Text</label>
                                    <textarea
                                      className="form-control"
                                      rows={2}
                                      placeholder={
                                        section.type === "video" ? "Ask the candidate to record a video answer..." :
                                        section.type === "whiteboard" ? "Describe the problem they should draw/explain visually..." :
                                        "Describe the problem, question, or scenario..."
                                      }
                                      value={q.prompt}
                                      onChange={(e) => handleUpdateQuestion(section.id, q.id, { prompt: e.target.value })}
                                      required
                                    ></textarea>
                                  </div>
                                )}

                                {section.type === "video" && (
                                  <p className="text-muted small mb-3">
                                    <i className="fa-solid fa-video me-1"></i>
                                    A video question asks the candidate to record a video answer using their webcam/microphone.
                                  </p>
                                )}

                                {section.type === "whiteboard" && (
                                  <p className="text-muted small mb-3">
                                    <i className="fa-solid fa-pen-to-square me-1"></i>
                                    A whiteboard question gives the candidate a digital drawing/canvas area where they can explain their solution visually.
                                  </p>
                                )}

                                {section.type === "personality" && (
                                  <>
                                    <p className="text-muted small mb-3">
                                      <i className="fa-solid fa-users me-1"></i>
                                      These try to understand a candidate's work preferences, behavioral tendencies, and working style.
                                    </p>
                                    <div className="mb-3">
                                      <label className="form-label fw-medium">Work Preferences</label>
                                      <textarea
                                        className="form-control"
                                        rows={2}
                                        placeholder="E.g. Do you prefer working independently or in a highly collaborative team?"
                                        value={q.workPreferences || ""}
                                        onChange={(e) => handleUpdateQuestion(section.id, q.id, { workPreferences: e.target.value })}
                                        required
                                      ></textarea>
                                    </div>
                                    <div className="mb-3">
                                      <label className="form-label fw-medium">Behavioral Tendencies</label>
                                      <textarea
                                        className="form-control"
                                        rows={2}
                                        placeholder="E.g. How do you handle tight deadlines or sudden changes in scope?"
                                        value={q.behavioralTendencies || ""}
                                        onChange={(e) => handleUpdateQuestion(section.id, q.id, { behavioralTendencies: e.target.value })}
                                        required
                                      ></textarea>
                                    </div>
                                    <div className="mb-3">
                                      <label className="form-label fw-medium">Working Style</label>
                                      <textarea
                                        className="form-control"
                                        rows={2}
                                        placeholder="E.g. What is your ideal daily routine for maximum productivity?"
                                        value={q.workingStyle || ""}
                                        onChange={(e) => handleUpdateQuestion(section.id, q.id, { workingStyle: e.target.value })}
                                        required
                                      ></textarea>
                                    </div>
                                  </>
                                )}

                                {/* Render type-specific fields */}
                                {section.type === "mcq" && (
                                  <div className="mb-3">
                                    <label className="form-label fw-medium">Options</label>
                                    {q.options?.map((opt, oIndex) => (
                                      <div key={oIndex} className="d-flex align-items-center mb-2">
                                        <div className="form-check me-2 mb-0">
                                          <input 
                                            className="form-check-input" 
                                            type="radio" 
                                            name={`correct-opt-${q.id}`}
                                            checked={q.correctOptionIndex === oIndex}
                                            onChange={() => handleUpdateQuestion(section.id, q.id, { correctOptionIndex: oIndex })}
                                            title="Mark as correct answer"
                                          />
                                        </div>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm me-2"
                                          placeholder={`Option ${oIndex + 1}`}
                                          value={opt}
                                          onChange={(e) => {
                                            const newOpts = [...(q.options || [])];
                                            newOpts[oIndex] = e.target.value;
                                            handleUpdateQuestion(section.id, q.id, { options: newOpts });
                                          }}
                                          required
                                        />
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-light text-danger"
                                          onClick={() => {
                                            const newOpts = [...(q.options || [])];
                                            newOpts.splice(oIndex, 1);
                                            let newCorrectIndex = q.correctOptionIndex;
                                            if (newCorrectIndex === oIndex) newCorrectIndex = 0;
                                            else if (newCorrectIndex !== undefined && newCorrectIndex > oIndex) newCorrectIndex--;
                                            handleUpdateQuestion(section.id, q.id, { options: newOpts, correctOptionIndex: newCorrectIndex });
                                          }}
                                          disabled={q.options && q.options.length <= 2}
                                        >
                                          <i className="fa-solid fa-xmark"></i>
                                        </button>
                                      </div>
                                    ))}
                                    <button 
                                      type="button" 
                                      className="btn btn-sm btn-outline-secondary mt-2"
                                      onClick={() => handleUpdateQuestion(section.id, q.id, { options: [...(q.options || []), ""] })}
                                    >
                                      + Add Option
                                    </button>
                                  </div>
                                )}

                                 {(section.type === "coding" || section.type === "debugging") && (
                                  <>
                                    <div className="mb-3">
                                      <label className="form-label fw-medium">Starter / Buggy Code (Optional)</label>
                                      <textarea
                                        className="form-control font-monospace bg-dark text-light"
                                        rows={4}
                                        placeholder="function solution(input) {\n  // your code here\n  return input;\n}"
                                        value={q.starterCode || ""}
                                        onChange={(e) => handleUpdateQuestion(section.id, q.id, { starterCode: e.target.value })}
                                      ></textarea>
                                      <small className="text-muted">Define the starting template code for the candidate.</small>
                                    </div>

                                    <div className="mb-4 p-3 bg-white border rounded shadow-sm">
                                      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                        <h6 className="fw-bold mb-0 text-primary">
                                          <i className="fa-solid fa-vial-circle-check me-2"></i>Test Cases (Automated Evaluation)
                                        </h6>
                                        <div className="d-flex gap-2">
                                          {(q.testCases || []).length < 3 && (
                                            <button
                                              type="button"
                                              className="btn btn-sm btn-outline-info"
                                              onClick={() => {
                                                const currentTC = [...(q.testCases || [])];
                                                while (currentTC.length < 3) {
                                                  currentTC.push({ id: crypto.randomUUID(), input: `${(currentTC.length + 1) * 5}`, expectedOutput: `${(currentTC.length + 1) * 5}` });
                                                }
                                                handleUpdateQuestion(section.id, q.id, { testCases: currentTC });
                                              }}
                                            >
                                              + Populate 3 Test Cases
                                            </button>
                                          )}
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => {
                                              const currentTC = q.testCases || [];
                                              handleUpdateQuestion(section.id, q.id, {
                                                testCases: [
                                                  ...currentTC,
                                                  { id: crypto.randomUUID(), input: "", expectedOutput: "" }
                                                ]
                                              });
                                            }}
                                          >
                                            + Add Test Case
                                          </button>
                                        </div>
                                      </div>
                                      
                                      {(q.testCases || []).map((tc, tcIdx) => (
                                        <div key={tc.id || tcIdx} className="p-3 bg-light border rounded mb-3 position-relative">
                                          <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span className="badge bg-secondary">Test Case #{tcIdx + 1}</span>
                                            {(q.testCases || []).length > 1 && (
                                              <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger border-0 py-0 px-1"
                                                onClick={() => {
                                                  const newTC = (q.testCases || []).filter((_, idx) => idx !== tcIdx);
                                                  handleUpdateQuestion(section.id, q.id, { testCases: newTC });
                                                }}
                                                title="Remove Test Case"
                                              >
                                                <i className="fa-solid fa-trash"></i>
                                              </button>
                                            )}
                                          </div>
                                          <div className="row g-2">
                                            <div className="col-md-6">
                                              <label className="form-label small fw-medium mb-1">Input / Arguments</label>
                                              <textarea
                                                className="form-control form-control-sm font-monospace"
                                                rows={2}
                                                placeholder="e.g. 5 or [1, 2, 3] or Hello"
                                                value={tc.input}
                                                onChange={(e) => {
                                                  const updatedTC = [...(q.testCases || [])];
                                                  updatedTC[tcIdx] = { ...updatedTC[tcIdx], input: e.target.value };
                                                  handleUpdateQuestion(section.id, q.id, { testCases: updatedTC });
                                                }}
                                              ></textarea>
                                            </div>
                                            <div className="col-md-6">
                                              <label className="form-label small fw-medium mb-1">Expected Output</label>
                                              <textarea
                                                className="form-control form-control-sm font-monospace"
                                                rows={2}
                                                placeholder="e.g. 10 or [2, 4, 6] or Hello World"
                                                value={tc.expectedOutput}
                                                onChange={(e) => {
                                                  const updatedTC = [...(q.testCases || [])];
                                                  updatedTC[tcIdx] = { ...updatedTC[tcIdx], expectedOutput: e.target.value };
                                                  handleUpdateQuestion(section.id, q.id, { testCases: updatedTC });
                                                }}
                                                required
                                              ></textarea>
                                            </div>
                                          </div>
                                        </div>
                                      ))}

                                      {(!q.testCases || q.testCases.length === 0) && (
                                        <p className="text-muted small mb-0 fst-italic">No test cases added. Click "+ Add Test Case" to create one.</p>
                                      )}
                                    </div>
                                  </>
                                )}

                                {section.type === "sql" && (
                                  <>
                                    <div className="mb-3">
                                      <label className="form-label fw-medium">Schema Description (Optional)</label>
                                      <textarea
                                        className="form-control font-monospace bg-light"
                                        rows={3}
                                        placeholder="Table `users` (id INT, name VARCHAR)\nTable `orders` (id INT, user_id INT, total DECIMAL)"
                                        value={q.schemaDescription || ""}
                                        onChange={(e) => handleUpdateQuestion(section.id, q.id, { schemaDescription: e.target.value })}
                                      ></textarea>
                                    </div>
                                    <div className="mb-3">
                                      <label className="form-label fw-medium">Expected SQL Query / Result (Optional)</label>
                                      <textarea
                                        className="form-control font-monospace"
                                        rows={2}
                                        placeholder="SELECT * FROM users WHERE..."
                                        value={q.expectedSqlOutput || ""}
                                        onChange={(e) => handleUpdateQuestion(section.id, q.id, { expectedSqlOutput: e.target.value })}
                                      ></textarea>
                                    </div>
                                  </>
                                )}

                                {section.type === "spreadsheet" && (
                                  <div className="mb-3">
                                    <label className="form-label fw-medium">Expected Formulas / Output (Optional)</label>
                                    <textarea
                                      className="form-control font-monospace"
                                      rows={2}
                                      placeholder="=VLOOKUP(A2, Sheet2!A:B, 2, FALSE)"
                                      value={q.expectedFormulas || ""}
                                      onChange={(e) => handleUpdateQuestion(section.id, q.id, { expectedFormulas: e.target.value })}
                                    ></textarea>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                          <div className="d-flex justify-content-center mt-3">
                            <button 
                              type="button" 
                              className="btn btn-outline-primary"
                              onClick={() => handleAddQuestionToSection(section.id, section.type)}
                            >
                              + Add another {formatSectionTitle(section.type)} Question
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {sections.length === 0 && (
                      <div className="d-flex flex-wrap gap-2 mb-5 p-4 bg-light rounded border align-items-center justify-content-center">
                        <span className="fw-medium me-2">Choose Section Type:</span>
                        <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => handleAddSection("mcq")}>+ MCQ Section</button>
                        <button type="button" className="btn btn-outline-success btn-sm" onClick={() => handleAddSection("coding")}>+ Coding Section</button>
                        <button type="button" className="btn btn-outline-info btn-sm" onClick={() => handleAddSection("short_answer")}>+ Short Answer</button>
                        <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => handleAddSection("debugging")}>+ Debugging</button>
                        <button type="button" className="btn btn-outline-warning btn-sm" onClick={() => handleAddSection("sql")}>+ Database/SQL</button>
                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => handleAddSection("spreadsheet")}>+ Spreadsheet</button>
                        <button type="button" className="btn btn-outline-dark btn-sm" onClick={() => handleAddSection("video")}>+ Video</button>
                        <button type="button" className="btn btn-outline-dark btn-sm" onClick={() => handleAddSection("whiteboard")}>+ Whiteboard</button>
                        <button type="button" className="btn btn-outline-dark btn-sm" onClick={() => handleAddSection("personality")}>+ Personality</button>
                      </div>
                    )}

                    <div className="d-flex justify-content-end">
                      <button type="submit" className="btn btn-main btn-lg px-5" disabled={saving}>
                        {saving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Saving Assessment...
                          </>
                        ) : (
                          "Publish Assessment"
                        )}
                      </button>
                    </div>

                  </form>
                )}
              </div>
            </div>
          </div>

          {/* footer */}
          <div className="row mt-5">
            <div className="col-md-12">
              <div className="py-3 text-center">
                &copy; {new Date().getFullYear()} JobStock. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
