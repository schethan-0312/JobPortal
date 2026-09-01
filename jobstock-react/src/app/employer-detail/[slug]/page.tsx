"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import PublicNavbar from "@/components/PublicNavbar";
import Navbar7 from "@/components/Navbar7";
import Navbar8 from "@/components/Navbar8";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl } from "@/lib/api";
import { Toaster, toast } from "react-hot-toast";

interface EmployerJob {
  id: string;
  title: string;
  slug: string;
  category?: string | null;
  jobRole?: string | null;
  department?: string | null;
  location: string;
  jobType: string;
  workMode?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  salaryPeriod?: string | null;
  createdAt: string;
}

interface Employer {
  id: string;
  companyName: string;
  logoUrl?: string | null;
  description?: string;
  website?: string;
  location?: string;
  industry?: string;
  status?: string;
  cultureBlurb?: string | null;
  photos?: string[];
  verifiedAt?: string | null;
  jobs?: EmployerJob[];
  _count?: { followers?: number; jobs?: number };
}

const workModeLabels: Record<string, string> = {
  REMOTE: "Remote",
  HYBRID: "Hybrid",
  ONSITE: "On-site",
  IN_OFFICE: "In-Office",
};

type TabKey = "overview" | "culture" | "jobs";

function EmployerDetailContent() {
  const { user } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.slug as string;

  const initialTab = (searchParams.get("tab") as TabKey) || "overview";

  const [employer, setEmployer] = useState<Employer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (searchParams.get("tab") === "jobs") {
      setTab("jobs");
    }
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const data = await api.get<Employer>(`/employers/${id}`, { auth: false });
        setEmployer(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load company details");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        const counts = await api.get<{ followersCount: number; followingCount: number }>(`/follow/counts/${id}`, { auth: false });
        setFollowersCount(counts.followersCount);
        setFollowingCount(counts.followingCount);
      } catch {
        // non-critical
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!user || user.role !== "CANDIDATE") return;
    (async () => {
      try {
        const res = await api.get<{ following: boolean }>(`/follow/status/${id}`);
        setFollowing(res.following);
      } catch {
        // non-critical
      }
    })();
  }, [user, id]);

  // Load candidate's applied jobs to prevent duplicate submissions
  useEffect(() => {
    if (!user || user.role !== "CANDIDATE") return;
    (async () => {
      try {
        const myApps = await api.get<Array<{ jobId: string }>>("/applications/mine");
        if (Array.isArray(myApps)) {
          setAppliedJobIds(new Set(myApps.map((a) => a.jobId)));
        }
      } catch {
        // non-critical
      }
    })();
  }, [user]);

  async function toggleFollow() {
    if (!user) {
      toast.error("Please login to follow this company");
      return;
    }
    setFollowBusy(true);
    const previousFollowing = following;
    const previousCount = followersCount;
    
    setFollowing(!previousFollowing);
    setFollowersCount(previousFollowing ? previousCount - 1 : previousCount + 1);

    try {
      if (previousFollowing) {
        await api.delete(`/follow/${id}`);
        toast.success("Unfollowed company");
      } else {
        await api.post(`/follow/${id}`);
        toast.success("Following company");
      }
      
      const counts = await api.get<{ followersCount: number; followingCount: number }>(`/follow/counts/${id}`, { auth: false });
      setFollowersCount(counts.followersCount);
      setFollowingCount(counts.followingCount);
    } catch (err) {
      setFollowing(previousFollowing);
      setFollowersCount(previousCount);
      toast.error(err instanceof ApiError ? err.message : "Failed to update follow status");
    } finally {
      setFollowBusy(false);
    }
  }

  // Quick Apply Handler
  async function handleQuickApply(jobId: string) {
    if (!user) {
      toast.error("Please login as a candidate to apply for this job");
      return;
    }
    if (user.role !== "CANDIDATE") {
      toast.error("Only candidates can apply to jobs");
      return;
    }
    if (appliedJobIds.has(jobId)) {
      toast.error("You have already applied to this job");
      return;
    }

    setApplyingJobId(jobId);
    try {
      await api.post("/applications", { jobId });
      toast.success("Application submitted successfully!");
      setAppliedJobIds((prev) => new Set([...prev, jobId]));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to apply for job");
    } finally {
      setApplyingJobId(null);
    }
  }

  const jobsList = employer?.jobs || [];
  const categories = Array.from(
    new Set(
      jobsList
        .map((j) => j.category || j.department)
        .filter((d): d is string => Boolean(d))
    )
  );
  const filteredJobs = categoryFilter
    ? jobsList.filter((j) => (j.category || j.department) === categoryFilter)
    : jobsList;

  return (
    <>
      {user?.role === "CANDIDATE" ? (
        <Navbar7 />
      ) : user?.role === "EMPLOYER" ? (
        <Navbar8 />
      ) : (
        <PublicNavbar />
      )}

      <Toaster position="top-center" />

      {loading && (
        <div className="container text-center" style={{ paddingTop: "120px", minHeight: "60vh" }}>
          <div className="spinner-border text-main" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-2">Loading company profile...</p>
        </div>
      )}

      {error && !loading && (
        <div className="container text-center" style={{ paddingTop: "120px", minHeight: "60vh" }}>
          <div className="alert alert-danger d-inline-block px-5 py-3 rounded-4 mb-4">
            <h5 className="mb-1">{error}</h5>
            <p className="small mb-0">The requested employer profile could not be found or is not yet published.</p>
          </div>
          <div>
            <Link href="/employers" className="btn btn-outline-main px-4 py-2">
              <i className="fa-solid fa-arrow-left me-2"></i>Back to Companies Directory
            </Link>
          </div>
        </div>
      )}

      {employer && !loading && (
        <section className="bg-light pb-5" style={{ paddingTop: "110px", minHeight: "85vh" }}>
          <div className="container">
            {/* Breadcrumb Navigation */}
            <div className="mb-3">
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href={user?.role === "CANDIDATE" ? "/candidate-dashboard" : "/"}>
                      {user?.role === "CANDIDATE" ? "Dashboard" : "Home"}
                    </Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link href="/employers">Companies</Link>
                  </li>
                  <li className="breadcrumb-item active text-muted" aria-current="page">
                    {employer.companyName}
                  </li>
                </ol>
              </nav>
            </div>

            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-circle overflow-hidden border d-flex align-items-center justify-content-center bg-white p-2 flex-shrink-0"
                    style={{ width: 80, height: 80 }}
                  >
                    <img
                      src={assetUrl(employer.logoUrl) || "/assets/img/l-4.png"}
                      alt={employer.companyName}
                      className="img-fluid"
                      style={{ maxHeight: "100%", objectFit: "contain" }}
                    />
                  </div>
                  <div>
                    <h3 className="mb-1 text-dark fw-bold">{employer.companyName}</h3>
                    <div className="d-flex flex-wrap gap-2 text-muted small align-items-center">
                      {employer.industry && (
                        <span>
                          <i className="fa-solid fa-layer-group me-1 text-main"></i>
                          {employer.industry}
                        </span>
                      )}
                      {employer.location && (
                        <span>
                          <i className="fa-solid fa-location-dot me-1 text-main"></i>
                          {employer.location}
                        </span>
                      )}
                      <span className="badge bg-light-main text-main border">
                        <i className="fa-solid fa-briefcase me-1"></i>
                        {jobsList.length} Open {jobsList.length === 1 ? "Job" : "Jobs"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    className={`btn px-4 py-2 fw-medium ${
                      following ? "btn-outline-main" : "btn-main"
                    }`}
                    onClick={toggleFollow}
                    disabled={followBusy}
                  >
                    {followBusy ? (
                      "..."
                    ) : following ? (
                      <>
                        <i className="fa-solid fa-user-check me-2"></i>Following ({followersCount})
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-user-plus me-2"></i>Follow ({followersCount})
                      </>
                    )}
                  </button>
                  {employer.website && (
                    <a
                      href={employer.website}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline-secondary px-3 py-2"
                    >
                      <i className="fa-solid fa-globe me-1"></i>Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <ul className="nav nav-pills gap-2 mb-4">
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link px-4 py-2 fw-medium ${tab === "overview" ? "active bg-main text-white" : "bg-white text-dark shadow-sm"}`}
                  onClick={() => setTab("overview")}
                  style={{ borderRadius: 8 }}
                >
                  <i className="fa-solid fa-circle-info me-2"></i>Overview
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link px-4 py-2 fw-medium ${tab === "culture" ? "active bg-main text-white" : "bg-white text-dark shadow-sm"}`}
                  onClick={() => setTab("culture")}
                  style={{ borderRadius: 8 }}
                >
                  <i className="fa-solid fa-heart me-2"></i>Culture &amp; Life
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link px-4 py-2 fw-medium ${tab === "jobs" ? "active bg-main text-white" : "bg-white text-dark shadow-sm"}`}
                  onClick={() => setTab("jobs")}
                  style={{ borderRadius: 8 }}
                >
                  <i className="fa-solid fa-briefcase me-2"></i>Jobs ({jobsList.length})
                </button>
              </li>
            </ul>

            <div className="row">
              <div className="col-xl-8 col-lg-8 col-md-12 mb-4">
                {tab === "overview" && (
                  <div className="card border-0 shadow-sm rounded-4 p-4">
                    <h5 className="fw-bold mb-3">About {employer.companyName}</h5>
                    <p className="text-muted" style={{ whiteSpace: "pre-line", lineHeight: 1.7 }}>
                      {employer.description || "No description provided yet."}
                    </p>
                  </div>
                )}

                {tab === "culture" && (
                  <div className="card border-0 shadow-sm rounded-4 p-4">
                    <div className="mb-4">
                      <h5 className="fw-bold mb-3 text-dark">
                        <i className="fa-solid fa-heart me-2 text-danger"></i>Culture &amp; Values
                      </h5>
                      <p className="text-muted" style={{ whiteSpace: "pre-line", lineHeight: 1.7 }}>
                        {employer.cultureBlurb || "This company hasn't shared culture details yet."}
                      </p>
                    </div>

                    <div className="pt-3 border-top">
                      <h6 className="fw-bold mb-3 text-dark d-flex align-items-center justify-content-between">
                        <span>
                          <i className="fa-solid fa-camera-retro me-2 text-main"></i>Workplace &amp; Team Photos
                        </span>
                        <span className="badge bg-light-main text-main border">
                          {employer.photos?.length || 0} {employer.photos?.length === 1 ? "Photo" : "Photos"}
                        </span>
                      </h6>

                      {employer.photos && employer.photos.length > 0 ? (
                        <div className="row g-3">
                          {employer.photos.map((url, idx) => (
                            <div className="col-xl-4 col-lg-4 col-md-6 col-6" key={idx}>
                              <a
                                href={assetUrl(url) || url}
                                target="_blank"
                                rel="noreferrer"
                                className="d-block position-relative rounded-4 overflow-hidden shadow-sm border"
                                style={{ height: "180px", cursor: "pointer", transition: "transform 0.2s" }}
                                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                                title="Click to view full image"
                              >
                                <img
                                  src={assetUrl(url) || url}
                                  alt={`Workplace photo ${idx + 1}`}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              </a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border border-dashed rounded-4 p-4 text-center bg-light">
                          <i className="fa-regular fa-image fs-3 text-muted mb-2 d-block"></i>
                          <p className="text-muted small mb-0">No workplace photos shared by this company yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {tab === "jobs" && (
                  <div>
                    {categories.length > 1 && (
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        <button
                          type="button"
                          className={`btn btn-sm ${categoryFilter === null ? "btn-main" : "btn-outline-main"}`}
                          onClick={() => setCategoryFilter(null)}
                        >
                          All Categories
                        </button>
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            className={`btn btn-sm ${categoryFilter === cat ? "btn-main" : "btn-outline-main"}`}
                            onClick={() => setCategoryFilter(cat)}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}

                    {filteredJobs.length === 0 && (
                      <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
                        <div className="mb-2">
                          <i className="fa-solid fa-briefcase fs-2 text-muted"></i>
                        </div>
                        <h6 className="fw-bold text-dark mb-1">No Active Openings</h6>
                        <p className="text-muted mb-0">This company does not currently have any active job postings.</p>
                      </div>
                    )}

                    <div className="d-flex flex-column gap-3">
                      {filteredJobs.map((job) => {
                        const isApplied = appliedJobIds.has(job.id);
                        const isBusy = applyingJobId === job.id;
                        const salaryText = job.salaryMin && job.salaryMax
                          ? `${job.currency || '₹'} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}${job.salaryPeriod ? ` / ${job.salaryPeriod.toLowerCase()}` : ''}`
                          : job.salaryMin
                          ? `From ${job.currency || '₹'} ${job.salaryMin.toLocaleString()}`
                          : null;

                        return (
                          <div
                            key={job.id}
                            className="card border-0 shadow-sm rounded-3 p-4 bg-white"
                          >
                            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                              <div>
                                <h5 className="mb-2 fw-bold">
                                  <Link
                                    href={`/job-detail/${job.slug}`}
                                    className="text-dark text-decoration-none"
                                  >
                                    {job.title}
                                  </Link>
                                </h5>
                                <div className="small text-muted d-flex flex-wrap gap-3 align-items-center">
                                  {(job.category || job.jobRole) && (
                                    <span>
                                      <i className="fa-solid fa-tag me-1 text-main"></i>
                                      {job.category || job.jobRole}
                                    </span>
                                  )}
                                  <span>
                                    <i className="fa-solid fa-location-dot me-1 text-main"></i>
                                    {job.location}
                                  </span>
                                  <span>
                                    <i className="fa-regular fa-clock me-1 text-main"></i>
                                    {job.jobType.replace(/_/g, " ")}
                                  </span>
                                  {salaryText && (
                                    <span>
                                      <i className="fa-solid fa-money-bill-wave me-1 text-main"></i>
                                      {salaryText}
                                    </span>
                                  )}
                                  {job.workMode && (
                                    <span className="badge bg-light-info text-info border">
                                      {workModeLabels[job.workMode] || job.workMode}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="d-flex align-items-center gap-2 flex-wrap">
                                <Link
                                  href={`/job-detail/${job.slug}`}
                                  className="btn btn-sm btn-outline-secondary px-3 py-2 fw-medium"
                                >
                                  <i className="fa-regular fa-eye me-1"></i>View Details
                                </Link>

                                {isApplied ? (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-success px-3 py-2 fw-medium text-white"
                                    disabled
                                  >
                                    <i className="fa-solid fa-check me-1"></i>Applied
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-main px-3 py-2 fw-medium"
                                    onClick={() => handleQuickApply(job.id)}
                                    disabled={isBusy}
                                  >
                                    {isBusy ? (
                                      "..."
                                    ) : (
                                      <>
                                        <i className="fa-solid fa-paper-plane me-1"></i>Quick Apply
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Info Card */}
              <div className="col-xl-4 col-lg-4 col-md-12">
                <div className="card border-0 shadow-sm rounded-4 p-4">
                  <h6 className="fw-bold mb-3 text-dark">Company Information</h6>
                  <div className="d-flex flex-column gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle bg-light-primary text-primary p-3">
                        <i className="fa-solid fa-layer-group"></i>
                      </div>
                      <div>
                        <span className="text-muted small d-block">Industry</span>
                        <span className="fw-semibold text-dark">{employer.industry || "—"}</span>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle bg-light-success text-success p-3">
                        <i className="fa-solid fa-map-location-dot"></i>
                      </div>
                      <div>
                        <span className="text-muted small d-block">Location</span>
                        <span className="fw-semibold text-dark">{employer.location || "—"}</span>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle bg-light-warning text-warning p-3">
                        <i className="fa-solid fa-briefcase"></i>
                      </div>
                      <div>
                        <span className="text-muted small d-block">Active Postings</span>
                        <span className="fw-semibold text-dark">{jobsList.length} Openings</span>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle bg-light-info text-info p-3">
                        <i className="fa-solid fa-users"></i>
                      </div>
                      <div>
                        <span className="text-muted small d-block">Followers</span>
                        <span className="fw-semibold text-dark">{followersCount} Followers</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-top">
                    {employer.website ? (
                      <a
                        href={employer.website}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-main full-width fw-medium py-2"
                      >
                        <i className="fa-solid fa-globe me-2"></i>Visit Company Website
                      </a>
                    ) : (
                      <button type="button" className="btn btn-secondary full-width fw-medium py-2" disabled>
                        No Website Listed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <LoginModal />
      <Footer />
    </>
  );
}

export default function EmployerDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center" style={{ paddingTop: "120px", minHeight: "60vh" }}>
          <div className="spinner-border text-main" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      }
    >
      <EmployerDetailContent />
    </Suspense>
  );
}
