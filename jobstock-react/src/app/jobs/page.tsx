import Link from "next/link";
import Navbar5 from "@/components/Navbar5";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import JobFilters from "@/components/jobs/JobFilters";
import SortingBar from "@/components/jobs/SortingBar";
import Pagination from "@/components/jobs/Pagination";
import QuickApplyButton from "@/components/jobs/QuickApplyButton";
import SaveBookmarkButton from "@/components/jobs/SaveBookmarkButton";
import { assetUrl } from "@/lib/api";

// Force dynamic rendering so searchParams are re-evaluated on every request
export const dynamic = "force-dynamic";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

interface Employer {
  id: string;
  companyName: string;
  logoUrl?: string | null;
  status?: string;
}

interface Job {
  id: string;
  title: string;
  slug: string;
  description?: string;
  category?: string;
  location?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  salaryPeriod?: string | null;
  jobType?: string;
  status?: string;
  employer?: Employer;
}

interface JobsResponse {
  items: Job[];
  total: number;
  page: number;
  pageSize: number;
}

function formatSalary(job: Job) {
  const { salaryMin, salaryMax, currency = "INR", salaryPeriod } = job;
  if (!salaryMin && !salaryMax) return "Not disclosed";

  const sym = currency === "USD" ? "$" : currency === "SGD" ? "S$" : "₹";
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

async function getJobs(params?: Record<string, string | undefined>): Promise<{ jobs: Job[]; total: number; pageSize: number; error: string | null }> {
  try {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.location) query.set("location", params.location);
    if (params?.search) query.set("search", params.search);
    if (params?.jobType) query.set("jobType", params.jobType);
    if (params?.page) query.set("page", params.page);
    if (params?.sortBy) query.set("sortBy", params.sortBy);
    if (params?.pageSize) query.set("pageSize", params.pageSize);
    
    const qs = query.toString();
    const url = qs ? `${API_BASE}/jobs?${qs}` : `${API_BASE}/jobs`;
    
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    const data: JobsResponse = await res.json();
    return { jobs: data.items ?? [], total: data.total ?? 0, pageSize: data.pageSize ?? 12, error: null };
  } catch (err) {
    return { jobs: [], total: 0, pageSize: 12, error: err instanceof Error ? err.message : "Failed to load jobs" };
  }
}

export default async function JobsGridPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { jobs, total, pageSize, error } = await getJobs(params);

  return (
    <>
      <Navbar5 />

      {/* Page Title Start */}
      <div className="page-title bg-main" style={{ background: "url(/assets/img/bg2.png) no-repeat" }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-12 col-md-12">
              <h2 className="ipt-title">Browse Jobs</h2>
              <div className="breadcrumbs light">
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                      <a href="/">Home</a>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Jobs
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Page Title End */}

      {/* All List Wrap */}
      <section className="gray-simple">
        <div className="container">
          <div className="row">
            {/* Search Sidebar */}
            <div className="col-xxl-3 col-xl-4 col-lg-4 col-md-12 col-sm-12">
              <button
                className="btn btn-main full-width d-lg-none mb-3 d-flex align-items-center justify-content-center gap-2"
                data-bs-toggle="collapse"
                data-bs-target="#search_open"
                aria-expanded="true"
                aria-controls="search_open"
              >
                <i className="fa-solid fa-filter"></i> Filter Search
              </button>
              <div className="bg-white rounded mb-3" style={{ overflow: "visible", position: "relative", zIndex: 10 }}>
                <JobFilters variant="full" />
              </div>
            </div>
            {/* Sidebar End */}

            <div className="col-xxl-9 col-xl-8 col-lg-8 col-md-12 col-sm-12">
              <div className="row justify-content-center mb-4">
                <div className="col-lg-12 col-md-12">
                  <SortingBar total={total} shown={jobs.length} />
                </div>
              </div>

              {/* Start All List */}
              {error && <p className="text-danger mb-3">{error}</p>}
              {!error && jobs.length === 0 && <p className="text-muted mb-3">No jobs found</p>}
              <div className="row justify-content-center gx-xl-3 gx-3 gy-4">
                {jobs.map((item) => (
                  <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12" key={item.id}>
                    <div className="jbs-grid-layout style_2 border">
                      <div className="jbs-grid-emp-head">
                        <div className="jbs-grid-emp-content">
                          <div className="jbs-grid-emp-thumb jbs-verified">
                            <Link href={`/job-detail/${item.slug}`}>
                              <figure>
                                <img
                                  src={assetUrl(item.employer?.logoUrl) || "/assets/img/l-1.png"}
                                  className="img-fluid"
                                  alt=""
                                />
                              </figure>
                            </Link>
                          </div>
                          <div className="jbs-grid-job-caption">
                            <div className="jbs-job-employer-wrap">
                              <span>{item.employer?.companyName ?? "—"}</span>
                            </div>
                            <div className="jbs-job-title-wrap">
                              <h4>
                                <Link href={`/job-detail/${item.slug}`} className="jbs-job-title">
                                  {item.title}
                                </Link>
                              </h4>
                            </div>
                          </div>
                        </div>
                        <div className="jbs-grid-jbs-saved">
                          <SaveBookmarkButton jobId={item.id} />
                        </div>
                      </div>
                      <div className="jbs-grid-job-edrs mt-3">
                        <div className="jbs-info-ico-style">
                          <div className="jbs-single-y1 style-1">
                            <span>
                              <i className="fa-solid fa-location-dot"></i>
                            </span>
                            {item.location ?? "—"}
                          </div>
                          <div className="jbs-single-y1 style-2">
                            <span>
                              <i className="fa-solid fa-clock"></i>
                            </span>
                            {item.jobType ?? "—"}
                          </div>
                          <div className="jbs-single-y1 style-3">
                            <span>
                              <i className="fa-solid fa-coins"></i>
                            </span>
                            {item.category ?? "—"}
                          </div>
                        </div>
                      </div>
                      <div className="jbs-grid-job-package-info">
                        <div className="jbs-grid-package-title">
                          <h5>
                            {formatSalary(item)}
                          </h5>
                        </div>
                        <div className="jbs-grid-posted">
                          <span>{item.status ?? ""}</span>
                        </div>
                      </div>
                      <div className="jbs-grid-job-apply-btns">
                        <div className="jbs-btn-groups">
                          <Link href={`/job-detail/${item.slug}`} className="btn btn-md btn-light-main px-4">
                            View Detail
                          </Link>
                          <QuickApplyButton jobId={item.id} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Pagination total={total} pageSize={pageSize} />
            </div>
          </div>
        </div>
      </section>
      {/* All List Wrap */}

      <LoginModal />

      <Footer />
    </>
  );
}
