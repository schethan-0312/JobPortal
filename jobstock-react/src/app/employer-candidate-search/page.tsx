"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar8 from "@/components/Navbar8";
import EmployerSidebar from "@/components/employer-dashboard/EmployerSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl } from "@/lib/api";
import { Toaster, toast } from "react-hot-toast";

interface CandidateResult {
  id: string;
  userId: string;
  fullName: string;
  headline: string | null;
  location: string | null;
  about: string | null;
  skills: string[];
  experienceYears: number | null;
  resumeUrl: string | null;
  profilePhotoUrl: string | null;
  isVerified: boolean;
  updatedAt: string;
}

interface SearchResponse {
  items: CandidateResult[];
  total: number;
  page: number;
  pageSize: number;
}

export default function EmployerCandidateSearchPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [location, setLocation] = useState("");
  const [skill, setSkill] = useState("");
  const [minExperience, setMinExperience] = useState("");
  const [query, setQuery] = useState("");

  const [results, setResults] = useState<CandidateResult[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("loading");
  
  const [openMessageFor, setOpenMessageFor] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && (!user || user.role !== "EMPLOYER")) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user && user.role === "EMPLOYER") {
      runSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function runSearch(
    e?: React.FormEvent,
    overrides?: {
      location?: string;
      skill?: string;
      minExperience?: string;
      query?: string;
    }
  ) {
    e?.preventDefault();
    setStatus("loading");
        try {
      const searchLocation = overrides ? overrides.location : location;
      const searchSkill = overrides ? overrides.skill : skill;
      const searchMinExperience = overrides ? overrides.minExperience : minExperience;
      const searchQuery = overrides ? overrides.query : query;

      const params = new URLSearchParams();
      if (searchLocation) params.set("location", searchLocation);
      if (searchSkill) params.set("skill", searchSkill);
      if (searchMinExperience) params.set("minExperience", searchMinExperience);
      if (searchQuery) params.set("q", searchQuery);
      params.set("pageSize", "20");
      params.set("_t", Date.now().toString());

      const data = await api.get<SearchResponse>(`/candidates/search?${params.toString()}`);
      setResults(data.items);
      setTotal(data.total);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      toast.error(err instanceof ApiError ? err.message : "Could not load candidates. Try again.");
    }
  }

  function clearFilters() {
    setQuery("");
    setSkill("");
    setLocation("");
    setMinExperience("");
    runSearch(undefined, {
      location: "",
      skill: "",
      minExperience: "",
      query: "",
    });
  }

  async function sendMessage(candidate: CandidateResult) {
    if (!messageText.trim()) return;
    setSendingTo(candidate.userId);
    try {
      await api.post("/messages", { receiverId: candidate.userId, body: messageText.trim() });
      setSentTo((prev) => new Set(prev).add(candidate.userId));
      setOpenMessageFor(null);
      setMessageText("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not send message.");
    } finally {
      setSendingTo(null);
    }
  }

  if (loading || !user || user.role !== "EMPLOYER") {
    return null;
  }

  return (
    <>
      <Navbar8 />
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

      <div className="dashboard-wrap bg-light">
        <EmployerSidebar active="candidate-search" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Find Candidates</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Employer</a></li>
                    <li className="breadcrumb-item text-muted"><a href="#">Dashboard</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Find Candidates</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            <div className="card mb-4">
              <div className="card-header">
                <h4>Search the Candidate Pool</h4>
                <p className="text-muted mb-0 mt-1">
                  Proactively find and reach out to candidates — ranked by recently-active profiles first.
                </p>
              </div>
              <div className="card-body">
                <form onSubmit={runSearch}>
                  <div className="row g-3 align-items-end">
                    <div className="col-md-3">
                      <label className="form-label">Skill</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. React"
                        value={skill}
                        onChange={(e) => setSkill(e.target.value)}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Location</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Remote, Bengaluru"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Min. Experience (years)</label>
                      <input
                        type="number"
                        min={0}
                        className="form-control"
                        value={minExperience}
                        onChange={(e) => setMinExperience(e.target.value)}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label d-none d-md-block" style={{ visibility: "hidden" }}>Actions</label>
                      <div className="d-flex gap-2 w-100 flex-wrap">
                        <button type="submit" className="btn btn-main w-50" disabled={status === "loading"}>
                          {status === "loading" ? "Searching..." : "Search"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary w-50"
                          onClick={clearFilters}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h4>{status === "loading" ? "Searching..." : `${total} Candidate${total !== 1 ? "s" : ""} Found`}</h4>
              </div>
              <div className="card-body">
                                {status === "idle" && results.length === 0 && (
                  <p className="text-muted mb-0">No candidates match these filters. Try broadening your search.</p>
                )}

                <div className="row">
                  {results.map((c) => (
                    <div className="col-xl-6 col-md-12 mb-4" key={c.id}>
                      <div className="border rounded p-3 h-100 d-flex flex-column">
                        <div className="d-flex gap-3 mb-2 flex-wrap">
                          {c.profilePhotoUrl ? (
                            <img
                              src={assetUrl(c.profilePhotoUrl)!}
                              className="rounded-circle flex-shrink-0"
                              width={56}
                              height={56}
                              style={{ objectFit: "cover" }}
                              alt=""
                            />
                          ) : (
                            <div 
                              className="rounded-circle bg-light d-flex align-items-center justify-content-center text-muted fw-semibold flex-shrink-0" 
                              style={{ width: "56px", height: "56px" }}
                            >
                              <span className="small text-center px-1" style={{ fontSize: "10px", lineHeight: "1.2" }}>No Photo</span>
                            </div>
                          )}
                          <div>
                            <h5 className="mb-0">
                              <a href={`/candidate-detail/${c.id}`}>{c.fullName}</a>
                            </h5>
                            <div className="text-muted small">{c.headline || "No headline set"}</div>
                            <div className="small text-muted">
                              {c.experienceYears ?? 0} yrs exp &middot; {c.location || "Location unknown"}
                            </div>
                          </div>
                        </div>

                        {c.skills.length > 0 && (
                          <div className="mb-2">
                            {c.skills.slice(0, 6).map((s) => (
                              <span key={s} className="badge bg-light text-dark border me-1 mb-1">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-auto pt-2">
                          {sentTo.has(c.userId) ? (
                            <span className="badge bg-success p-2">
                              <i className="fa-solid fa-check me-1"></i>Message Sent
                            </span>
                          ) : openMessageFor === c.id ? (
                            <div className="d-flex gap-2 flex-wrap">
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Write a quick message..."
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                autoFocus
                              />
                              <button
                                type="button"
                                className="btn btn-sm btn-main"
                                disabled={sendingTo === c.userId || !messageText.trim()}
                                onClick={() => sendMessage(c)}
                              >
                                Send
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => { setOpenMessageFor(null); setMessageText(""); }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="d-flex gap-2 flex-wrap">
                              <button
                                type="button"
                                className="btn btn-sm btn-gray"
                                onClick={() => { setOpenMessageFor(c.id); setMessageText(""); }}
                              >
                                <i className="fa-solid fa-comment me-1"></i>Message
                              </button>
                              <a href={`/candidate-detail/${c.id}`} className="btn btn-sm btn-outline-main">
                                View Profile
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* footer removed */}
        </div>
      </div>
    </>
  );
}
