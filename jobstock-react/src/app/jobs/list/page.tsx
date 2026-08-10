import Link from "next/link";
import Navbar5 from "@/components/Navbar5";
import Footer2 from "@/components/Footer2";
import LoginModal from "@/components/LoginModal";
import JobFilters from "@/components/jobs/JobFilters";
import SortingBar from "@/components/jobs/SortingBar";
import Pagination from "@/components/jobs/Pagination";
import FindJobCta from "@/components/jobs/FindJobCta";
import QuickApplyButton from "@/components/jobs/QuickApplyButton";
import { assetUrl } from "@/lib/api";

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
  if (job.salaryMin && job.salaryMax) return `$${job.salaryMin} - ${job.salaryMax}`;
  if (job.salaryMin) return `$${job.salaryMin}`;
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

export default async function JobsListPage({
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
              <h2 className="ipt-title">Job List</h2>
              <div className="breadcrumbs light">
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                      <a href="/">Home</a>
                    </li>
                    <li className="breadcrumb-item">
                      <a href="/jobs">Jobs</a>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      List View
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
      <section>
        <div className="container">
          <div className="row">
            {/* Search Sidebar */}
            <div className="col-lg-3 col-md-12 col-sm-12">
              <div className="side-widget-blocks">
                <JobFilters variant="simple" />
              </div>
            </div>
            {/* Sidebar End */}

            {/* Job List Wrap */}
            <div className="col-lg-9 col-md-12 col-sm-12">
              {/* Shorting Box */}
              <div className="row justify-content-center mb-4">
                <div className="col-lg-12 col-md-12">
                  <SortingBar total={total} shown={jobs.length} />
                </div>
              </div>
              {/* Shorting Wrap End */}

              {/* Start All List */}
              {error && <p className="text-danger mb-3">{error}</p>}
              {!error && jobs.length === 0 && <p className="text-muted mb-3">No jobs found</p>}
              <div className="row justify-content-start gx-3 gy-4">
                {jobs.map((item) => (
                  <div className="col-xl-12 col-lg-12 col-md-12 col-12" key={item.id}>
                    <div className="jbs-list-box border">
                      <div className="jbs-list-head">
                        <div className="jbs-list-head-thunner">
                          <div className="jbs-list-emp-thumb jbs-verified">
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
                          <div className="jbs-list-job-caption">
                            <div className="jbs-job-types-wrap">
                              <span className="label text-success bg-success bg-opacity-05">{item.jobType ?? "—"}</span>
                            </div>
                            <div className="jbs-job-title-wrap">
                              <h4>
                                <Link href={`/job-detail/${item.slug}`} className="jbs-job-title">
                                  {item.title}
                                </Link>
                              </h4>
                            </div>
                            <div className="jbs-job-mrch-lists">
                              <div className="single-mrch-lists">
                                <span>{item.employer?.companyName ?? "—"}</span>.
                                <span>
                                  <i className="fa-solid fa-location-dot me-1"></i>
                                  {item.location ?? "—"}
                                </span>
                                .<span>{item.category ?? ""}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="jbs-list-head-middle">
                          <div className="elsocrio-jbs">
                            <div className="ilop-tr">
                              <i className="fa-solid fa-sack-dollar"></i>
                            </div>
                            <h5 className="jbs-list-pack">
                              {formatSalary(item)}
                              <span className="patype">\PA</span>
                            </h5>
                          </div>
                        </div>
                        <div className="jbs-list-head-last">
                          <QuickApplyButton jobId={item.id} className="btn btn-md btn-main px-3" />
                        </div>
                      </div>
                      <div className="jbs-grid-job-description">
                        <p className="text-mmd text-muted">{item.description ?? ""}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* End All Job List */}

              <Pagination total={total} pageSize={pageSize} />
            </div>
            {/* Job List Wrap End*/}
          </div>
        </div>
      </section>
      {/* All List Wrap */}

      <FindJobCta />

      <LoginModal />

      <Footer2 />
    </>
  );
}
