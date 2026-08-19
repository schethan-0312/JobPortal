import Navbar5 from "@/components/Navbar5";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import ApplyBox from "@/components/jobs/ApplyBox";
import { api, ApiError, assetUrl } from "@/lib/api";

interface Employer {
  id: string;
  companyName: string;
  logoUrl?: string | null;
  description?: string | null;
  website?: string | null;
  location?: string | null;
  industry?: string | null;
  status?: string;
}

interface Job {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  category?: string | null;
  jobRole?: string | null;
  jobType?: string | null;
  description?: string | null;
  responsibilities?: string | null;
  skills?: string[];
  minExperience?: number | null;
  maxExperience?: number | null;
  minQualification?: string | null;
  specialization?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  salaryPeriod?: string | null;
  location?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  workMode?: string | null;
  noticePeriod?: string | null;
  willingnessToRelocate?: boolean | null;
  willingnessToTravel?: boolean | null;
  openings?: number | null;
  applicationDeadline?: string | null;
  screeningQuestions?: string[];
  status?: string | null;
  publishDate?: string | null;
  expiryDate?: string | null;
  isFeatured?: boolean;
  createdAt?: string;
  employer?: Employer;
}

async function getJob(slug: string): Promise<{ job: Job | null; error: string | null }> {
  try {
    const job = await api.get<Job>(`/jobs/${slug}`, { auth: false });
    return { job, error: null };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return { job: null, error: "Job not found." };
    }
    return { job: null, error: err instanceof Error ? err.message : "Failed to load job" };
  }
}

function formatJobSalary(job: Job) {
  const { salaryMin, salaryMax, currency = "INR", salaryPeriod } = job;
  if (!salaryMin && !salaryMax) return "Not disclosed";

  const currSymbolMap: Record<string, string> = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
    AUD: "A$",
    CAD: "C$",
    SGD: "S$",
  };
  const sym = currSymbolMap[currency || "INR"] || (currency ? `${currency} ` : "₹");
  const periodText = salaryPeriod ? ` / ${salaryPeriod.toLowerCase()}` : "";

  if (salaryMin && salaryMax) {
    return `${sym}${salaryMin.toLocaleString()} - ${sym}${salaryMax.toLocaleString()}${periodText}`;
  }
  if (salaryMin) {
    return `From ${sym}${salaryMin.toLocaleString()}${periodText}`;
  }
  if (salaryMax) {
    return `Up to ${sym}${salaryMax.toLocaleString()}${periodText}`;
  }
  return "Not disclosed";
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { job, error } = await getJob(slug);

  return (
    <>
      <Navbar5 />

      {/* Job Detail */}
      <section className="gray-simple py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-12 col-md-12">
              {error && (
                <div className="jbs-dts-block styl-02 p-5 text-center bg-white rounded shadow-sm">
                  <p className="text-danger m-0 fs-5">{error}</p>
                </div>
              )}
              {job && (
                <div className="jbs-dts-block styl-02 bg-white rounded shadow-sm overflow-hidden mb-4">
                  {/* Job Header */}
                  <div className="jbs-head-block">
                    <div
                      className="jbs-head-tops bg-cover"
                      style={{ background: "url(/assets/img/blog-4.jpg) no-repeat", backgroundSize: "cover" }}
                    >
                      <div className="ht-200"></div>
                    </div>
                    <div className="jbs-head-bodys p-4">
                      <div className="jbs-head-bodys-top d-flex justify-content-between align-items-start flex-wrap gap-3">
                        <div className="jbs-roots-y1 d-flex align-items-center gap-3">
                          <div className="jbs-roots-thumb">
                            <figure className="m-0">
                              <img
                                src={assetUrl(job.employer?.logoUrl) || "/assets/img/l-4.png"}
                                className="img-fluid rounded border"
                                style={{ width: "70px", height: "70px", objectFit: "cover" }}
                                alt=""
                              />
                            </figure>
                          </div>
                          <div className="jbs-roots-y1-last">
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <span className="badge bg-light text-main border">{job.jobType?.replace("_", " ") ?? "Full Time"}</span>
                              {job.workMode && <span className="badge bg-secondary">{job.workMode?.replace("_", " ")}</span>}
                              {job.isFeatured && <span className="badge bg-warning text-dark"><i className="fa-solid fa-star me-1"></i>Featured</span>}
                            </div>
                            <div className="jbs-title-iop">
                              <h2 className="m-0 fs-3 text-dark fw-bold">{job.title}</h2>
                            </div>
                            <div className="jbs-locat-oiu text-muted fs-6 mt-1 d-flex align-items-center gap-3 flex-wrap">
                              <span>
                                <i className="fa-solid fa-building me-1 text-main"></i>
                                {job.employer?.companyName ?? "Company"}
                              </span>
                              <span>
                                <i className="fa-solid fa-location-dot me-1 text-main"></i>
                                {job.location ?? "Not specified"}
                              </span>
                              {job.jobRole && (
                                <span>
                                  <i className="fa-solid fa-user-tag me-1 text-main"></i>
                                  {job.jobRole}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="jbs-roots-y2">
                          <ApplyBox jobId={job.id} />
                        </div>
                      </div>

                      {/* Header Summary Grid */}
                      <div className="jbs-head-bodys-foot mt-4 pt-3 border-top">
                        <div className="row g-3">
                          <div className="col-lg-3 col-md-6 col-6">
                            <span className="text-muted fs-7 d-block">Category</span>
                            <span className="fw-semibold text-dark">{job.category ?? "General"}</span>
                          </div>
                          <div className="col-lg-3 col-md-6 col-6">
                            <span className="text-muted fs-7 d-block">Salary</span>
                            <span className="fw-semibold text-main">{formatJobSalary(job)}</span>
                          </div>
                          <div className="col-lg-3 col-md-6 col-6">
                            <span className="text-muted fs-7 d-block">Experience</span>
                            <span className="fw-semibold text-dark">
                              {job.minExperience != null || job.maxExperience != null
                                ? `${job.minExperience ?? 0} - ${job.maxExperience ?? "5+"} Years`
                                : "Not specified"}
                            </span>
                          </div>
                          <div className="col-lg-3 col-md-6 col-6">
                            <span className="text-muted fs-7 d-block">Openings</span>
                            <span className="fw-semibold text-dark">{job.openings ?? 1} Position(s)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Content & Sidebar Grid */}
                  <div className="jbs-dts-body p-4">
                    <div className="row g-4">
                      {/* Left Primary Details */}
                      <div className="col-xl-8 col-lg-8 col-md-12">
                        {/* Job Summary */}
                        {job.summary && (
                          <div className="mb-4 p-3 bg-light rounded border-start border-main border-4">
                            <h5 className="fs-6 fw-bold text-dark mb-2">Job Summary</h5>
                            <p className="mb-0 text-secondary">{job.summary}</p>
                          </div>
                        )}

                        {/* Full Job Description */}
                        <div className="mb-4">
                          <h5 className="fs-5 fw-bold text-dark mb-3">Job Description</h5>
                          <div className="text-secondary" style={{ whiteSpace: "pre-wrap", lineHeight: "1.7" }}>
                            {job.description ?? "No description provided."}
                          </div>
                        </div>

                        {/* Roles & Responsibilities */}
                        {job.responsibilities && (
                          <div className="mb-4">
                            <h5 className="fs-5 fw-bold text-dark mb-3">Roles & Responsibilities</h5>
                            <div className="text-secondary" style={{ whiteSpace: "pre-wrap", lineHeight: "1.7" }}>
                              {job.responsibilities}
                            </div>
                          </div>
                        )}

                        {/* Skills & Experience */}
                        {((job.skills && job.skills.length > 0) || job.minExperience != null || job.maxExperience != null) && (
                          <div className="mb-4 p-4 border rounded">
                            <h5 className="fs-5 fw-bold text-dark mb-3">Skills & Experience</h5>
                            {job.skills && job.skills.length > 0 && (
                              <div className="mb-3">
                                <span className="fw-medium text-dark d-block mb-2">Required Skills:</span>
                                <div className="d-flex flex-wrap gap-2">
                                  {job.skills.map((skill) => (
                                    <span key={skill} className="badge bg-light text-main border px-3 py-2 fs-6">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {(job.minExperience != null || job.maxExperience != null) && (
                              <div>
                                <span className="fw-medium text-dark">Required Experience: </span>
                                <span className="text-secondary">
                                  {job.minExperience ?? 0} to {job.maxExperience ?? "5+"} Years
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Education & Qualification */}
                        {(job.minQualification || job.specialization) && (
                          <div className="mb-4 p-4 border rounded">
                            <h5 className="fs-5 fw-bold text-dark mb-3">Education & Qualification</h5>
                            <div className="row g-3">
                              {job.minQualification && (
                                <div className="col-md-6">
                                  <span className="text-muted d-block fs-7">Minimum Qualification</span>
                                  <span className="fw-medium text-dark">{job.minQualification}</span>
                                </div>
                              )}
                              {job.specialization && (
                                <div className="col-md-6">
                                  <span className="text-muted d-block fs-7">Specialization</span>
                                  <span className="fw-medium text-dark">{job.specialization}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Sidebar Details */}
                      <div className="col-xl-4 col-lg-4 col-md-12">
                        {/* Job Overview Card */}
                        <div className="card border mb-4 shadow-sm">
                          <div className="card-header bg-white py-3">
                            <h5 className="mb-0 fs-6 fw-bold text-dark">Job Overview</h5>
                          </div>
                          <div className="card-body">
                            <ul className="list-unstyled mb-0 d-flex flex-column gap-3 fs-6">
                              <li className="d-flex justify-content-between border-bottom pb-2">
                                <span className="text-muted"><i className="fa-solid fa-briefcase me-2 text-main"></i>Job Role</span>
                                <span className="fw-medium text-dark text-end">{job.jobRole || job.title}</span>
                              </li>
                              <li className="d-flex justify-content-between border-bottom pb-2">
                                <span className="text-muted"><i className="fa-solid fa-layer-group me-2 text-main"></i>Category</span>
                                <span className="fw-medium text-dark text-end">{job.category || "General"}</span>
                              </li>
                              <li className="d-flex justify-content-between border-bottom pb-2">
                                <span className="text-muted"><i className="fa-solid fa-clock me-2 text-main"></i>Work Mode</span>
                                <span className="fw-medium text-dark text-end">{job.workMode?.replace("_", " ") || "In-Office"}</span>
                              </li>
                              <li className="d-flex justify-content-between border-bottom pb-2">
                                <span className="text-muted"><i className="fa-solid fa-indian-rupee-sign me-2 text-main"></i>Salary Period</span>
                                <span className="fw-medium text-dark text-end">{job.salaryPeriod || "Monthly"}</span>
                              </li>
                              {(job.city || job.state || job.country) && (
                                <li className="d-flex justify-content-between border-bottom pb-2">
                                  <span className="text-muted"><i className="fa-solid fa-earth-americas me-2 text-main"></i>Location</span>
                                  <span className="fw-medium text-dark text-end">
                                    {[job.city, job.state, job.country].filter(Boolean).join(", ")}
                                  </span>
                                </li>
                              )}
                              {job.applicationDeadline && (
                                <li className="d-flex justify-content-between border-bottom pb-2">
                                  <span className="text-muted"><i className="fa-solid fa-calendar-xmark me-2 text-main"></i>Deadline</span>
                                  <span className="fw-medium text-danger text-end">{formatDate(job.applicationDeadline)}</span>
                                </li>
                              )}
                              {job.publishDate && (
                                <li className="d-flex justify-content-between">
                                  <span className="text-muted"><i className="fa-solid fa-calendar-check me-2 text-main"></i>Published</span>
                                  <span className="fw-medium text-dark text-end">{formatDate(job.publishDate)}</span>
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>

                        {/* Employer Info Card */}
                        {job.employer && (
                          <div className="card border shadow-sm">
                            <div className="card-header bg-white py-3">
                              <h5 className="mb-0 fs-6 fw-bold text-dark">About Employer</h5>
                            </div>
                            <div className="card-body">
                              <div className="d-flex align-items-center gap-3 mb-3">
                                <img
                                  src={assetUrl(job.employer.logoUrl) || "/assets/img/l-4.png"}
                                  alt={job.employer.companyName}
                                  className="rounded border"
                                  style={{ width: "50px", height: "50px", objectFit: "cover" }}
                                />
                                <div>
                                  <h6 className="m-0 fw-bold text-dark">{job.employer.companyName}</h6>
                                  {job.employer.industry && (
                                    <span className="badge bg-secondary mt-1">{job.employer.industry}</span>
                                  )}
                                </div>
                              </div>
                              {job.employer.location && (
                                <p className="text-muted fs-6 mb-2">
                                  <i className="fa-solid fa-location-dot me-2 text-main"></i>
                                  {job.employer.location}
                                </p>
                              )}
                              {job.employer.website && (
                                <p className="text-muted fs-6 mb-2">
                                  <i className="fa-solid fa-globe me-2 text-main"></i>
                                  <a
                                    href={job.employer.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-main"
                                  >
                                    {job.employer.website}
                                  </a>
                                </p>
                              )}
                              {job.employer.description && (
                                <p className="text-secondary fs-6 mb-0 mt-3 pt-3 border-top">
                                  {job.employer.description}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <LoginModal />
      <Footer />
    </>
  );
}

