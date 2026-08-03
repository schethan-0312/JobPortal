"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PublicNavbar from "@/components/PublicNavbar";
import Footer2 from "@/components/Footer2";
import LoginModal from "@/components/LoginModal";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl } from "@/lib/api";

interface EmployerJob {
  id: string;
  title: string;
  slug: string;
  department: string | null;
  location: string;
  jobType: string;
  workMode: "REMOTE" | "HYBRID" | "ONSITE" | null;
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
  jobs: EmployerJob[];
  _count?: { followers: number };
}

const workModeLabels: Record<string, string> = { REMOTE: "Remote", HYBRID: "Hybrid", ONSITE: "On-site" };

type TabKey = "overview" | "culture" | "jobs";

export default function EmployerDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const id = params.slug as string;

  const [employer, setEmployer] = useState<Employer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<Employer>(`/employers/${id}`, { auth: false });
        setEmployer(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load employer");
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!user || user.role !== "CANDIDATE") return;
    (async () => {
      try {
        const res = await api.get<{ following: boolean }>(`/candidates/follow-employer/${id}`);
        setFollowing(res.following);
      } catch {
        // non-critical
      }
    })();
  }, [user, id]);

  async function toggleFollow() {
    setFollowBusy(true);
    try {
      if (following) {
        await api.delete(`/candidates/follow-employer/${id}`);
        setFollowing(false);
      } else {
        await api.post(`/candidates/follow-employer/${id}`);
        setFollowing(true);
      }
    } catch {
      // leave state unchanged on failure
    } finally {
      setFollowBusy(false);
    }
  }

  const departments = employer ? Array.from(new Set(employer.jobs.map((j) => j.department).filter((d): d is string => Boolean(d)))) : [];
  const filteredJobs = employer
    ? departmentFilter
      ? employer.jobs.filter((j) => j.department === departmentFilter)
      : employer.jobs
    : [];

  return (
    <>
      <PublicNavbar />

      <section className="gray-simple">
        <div className="container">
          <div className="row">
            <div className="col-xl-12 col-lg-12 col-md-12">
              {error && (
                <div className="emplr-head-block p-5 text-center">
                  <p className="text-danger m-0">{error}</p>
                </div>
              )}
              {employer && (
                <div className="emplr-head-block">
                  <div className="emplr-head-left">
                    <div className="emplr-head-thumb">
                      <figure>
                        <img src={assetUrl(employer.logoUrl) || "/assets/img/l-1.png"} className="img-fluid rounded" alt="" />
                      </figure>
                    </div>
                    <div className="emplr-head-caption">
                      <div className="emplr-head-caption-top">
                        <div className="emplr-yior-1">
                          <span className="label text-sm-muted text-success bg-light-success">
                            {employer.status ?? "VERIFIED"}
                          </span>
                        </div>
                        <div className="emplr-yior-2">
                          <h4 className="emplr-title">{employer.companyName}</h4>
                        </div>
                        <div className="emplr-yior-3">
                          <span>
                            <i className="fa-solid fa-building-shield me-1"></i>
                            {employer.industry ?? "—"}
                          </span>
                          <span>
                            <i className="fa-solid fa-location-dot me-1"></i>
                            {employer.location ?? "—"}
                          </span>
                          {employer._count && (
                            <span>
                              <i className="fa-solid fa-users me-1"></i>
                              {employer._count.followers} followers
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="emplr-head-right d-flex gap-2">
                    {user?.role === "CANDIDATE" && (
                      <button
                        type="button"
                        className={`btn ${following ? "btn-outline-main" : "btn-main"}`}
                        disabled={followBusy}
                        onClick={toggleFollow}
                      >
                        {following ? "Following" : "Follow"}
                      </button>
                    )}
                    {employer.website ? (
                      <a href={employer.website} target="_blank" rel="noreferrer" className="btn btn-outline-main">
                        Visit Website
                      </a>
                    ) : (
                      <button type="button" className="btn btn-outline-main" disabled>
                        No Website
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {employer && (
        <section>
          <div className="container">
            <ul className="nav nav-tabs mb-4">
              {(["overview", "culture", "jobs"] as TabKey[]).map((t) => (
                <li className="nav-item" key={t}>
                  <button
                    type="button"
                    className={`nav-link ${tab === t ? "active" : ""}`}
                    onClick={() => setTab(t)}
                  >
                    {t === "overview" ? "Overview" : t === "culture" ? "Why Join Us" : `Jobs (${employer.jobs.length})`}
                  </button>
                </li>
              ))}
            </ul>

            <div className="row">
              <div className="col-xl-8 col-lg-8 col-md-12">
                {tab === "overview" && (
                  <div className="cdtsr-groups-block">
                    <div className="single-cdtsr-block">
                      <div className="single-cdtsr-header">
                        <h5>About Company</h5>
                      </div>
                      <div className="single-cdtsr-body">
                        <p>{employer.description ?? "No description provided."}</p>
                      </div>
                    </div>
                  </div>
                )}

                {tab === "culture" && (
                  <div className="cdtsr-groups-block">
                    <div className="single-cdtsr-block">
                      <div className="single-cdtsr-header">
                        <h5>Culture &amp; Values</h5>
                      </div>
                      <div className="single-cdtsr-body">
                        <p style={{ whiteSpace: "pre-line" }}>{employer.cultureBlurb ?? "This company hasn't shared what it's like to work here yet."}</p>
                      </div>
                    </div>
                    {employer.photos && employer.photos.length > 0 && (
                      <div className="single-cdtsr-block">
                        <div className="single-cdtsr-header">
                          <h5>Life at {employer.companyName}</h5>
                        </div>
                        <div className="single-cdtsr-body">
                          <div className="d-flex flex-wrap gap-3">
                            {employer.photos.map((url) => (
                              <img key={url} src={assetUrl(url) ?? url} alt="" width={160} height={160} style={{ objectFit: "cover", borderRadius: 8 }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {tab === "jobs" && (
                  <div className="cdtsr-groups-block">
                    {departments.length > 0 && (
                      <div className="d-flex flex-wrap gap-2 mb-4">
                        <button
                          type="button"
                          className={`btn btn-sm ${departmentFilter === null ? "btn-main" : "btn-outline-main"}`}
                          onClick={() => setDepartmentFilter(null)}
                        >
                          All Departments
                        </button>
                        {departments.map((dept) => (
                          <button
                            key={dept}
                            type="button"
                            className={`btn btn-sm ${departmentFilter === dept ? "btn-main" : "btn-outline-main"}`}
                            onClick={() => setDepartmentFilter(dept)}
                          >
                            {dept}
                          </button>
                        ))}
                      </div>
                    )}

                    {filteredJobs.length === 0 && <p className="text-muted">No open roles right now.</p>}
                    <div className="d-flex flex-column gap-3">
                      {filteredJobs.map((job) => (
                        <a
                          key={job.id}
                          href={`/job-detail/${job.slug}`}
                          className="single-cdtsr-block d-block text-decoration-none"
                          style={{ border: "1px solid #eee", borderRadius: 8, padding: "1rem" }}
                        >
                          <h6 className="mb-1 text-dark">{job.title}</h6>
                          <div className="small text-muted">
                            {job.department && <span className="me-3">{job.department}</span>}
                            <span className="me-3"><i className="fa-solid fa-location-dot me-1"></i>{job.location}</span>
                            <span className="me-3">{job.jobType.replace("_", " ")}</span>
                            {job.workMode && <span>{workModeLabels[job.workMode]}</span>}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="col-xl-4 col-lg-4 col-md-12">
                <div className="eflorio-wrap-block mb-4">
                  <div className="eflorio-wrap-group">
                    <div className="eflorio-wrap-body">
                      <div className="eflorio-list-groups">
                        <div className="single-eflorio-list">
                          <div className="eflorio-list-icons"><i className="fa-solid fa-layer-group text-main"></i></div>
                          <div className="eflorio-list-captions"><label>Industry</label><h6>{employer.industry ?? "—"}</h6></div>
                        </div>
                        <div className="single-eflorio-list">
                          <div className="eflorio-list-icons"><i className="fa-solid fa-map-location-dot text-main"></i></div>
                          <div className="eflorio-list-captions"><label>Location</label><h6>{employer.location ?? "—"}</h6></div>
                        </div>
                        <div className="single-eflorio-list">
                          <div className="eflorio-list-icons"><i className="fa-solid fa-building-circle-check text-main"></i></div>
                          <div className="eflorio-list-captions">
                            <label>Verified Since</label>
                            <h6>{employer.verifiedAt ? new Date(employer.verifiedAt).toLocaleDateString() : "—"}</h6>
                          </div>
                        </div>
                        <div className="single-eflorio-list">
                          <div className="eflorio-list-icons"><i className="fa-solid fa-briefcase text-main"></i></div>
                          <div className="eflorio-list-captions"><label>Active Postings</label><h6>{employer.jobs.length}</h6></div>
                        </div>
                      </div>
                    </div>
                    <div className="eflorio-wrap-footer">
                      <div className="eflorio-footer-body">
                        {employer.website ? (
                          <a href={employer.website} target="_blank" rel="noreferrer" className="btn btn-main fw-medium full-width">
                            View Website
                          </a>
                        ) : (
                          <button type="button" className="btn btn-main fw-medium full-width" disabled>
                            View Website
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="bg-cover bg-main" style={{ background: "url(/assets/img/footer-bg-dark.png)no-repeat" }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xl-7 col-lg-10 col-md-12 col-sm-12">
              <div className="call-action-wrap">
                <div className="sec-heading center">
                  <h2 className="lh-base mb-3 text-light">
                    Find The Perfect Job
                    <br />
                    on JobStock That is Superb For You
                  </h2>
                  <p className="fs-6 text-light">
                    Join thousands of job seekers and employers who trust JobStock to find the right fit, faster.
                  </p>
                </div>
                <div className="call-action-buttons mt-3">
                  <a href="/jobs" className="btn btn-lg btn-dark fw-medium px-xl-5 px-lg-4 me-2">
                    Browse Jobs
                  </a>
                  <a href="/signup" className="btn btn-lg btn-whites fw-medium px-xl-5 px-lg-4 text-main">
                    Get Started
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LoginModal />
      <Footer2 />
    </>
  );
}
