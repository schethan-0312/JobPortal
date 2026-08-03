import { Suspense } from "react";
import Link from "next/link";
import PublicNavbar from "@/components/PublicNavbar";
import Footer2 from "@/components/Footer2";
import LoginModal from "@/components/LoginModal";
import JobFilters from "@/components/jobs/JobFilters";
import SortingBar from "@/components/jobs/SortingBar";
import Pagination from "@/components/jobs/Pagination";
import FindJobCta from "@/components/jobs/FindJobCta";
import { api, assetUrl } from "@/lib/api";

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
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  if (job.salaryMin && job.salaryMax) return `${fmt(job.salaryMin)} - ${fmt(job.salaryMax)}`;
  if (job.salaryMin) return fmt(job.salaryMin);
  return "Not disclosed";
}

async function getJobs(
  query: Record<string, string | undefined>,
): Promise<{ jobs: Job[]; total: number; pageSize: number; error: string | null }> {
  try {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value) params.set(key, value);
    }
    const data = await api.get<JobsResponse>(`/jobs?${params.toString()}`, { auth: false });
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
      <PublicNavbar />

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
                <Suspense fallback={null}>
                  <JobFilters variant="simple" />
                </Suspense>
              </div>
            </div>
            {/* Sidebar End */}

            {/* Job List Wrap */}
            <div className="col-lg-9 col-md-12 col-sm-12">
              {/* Job Alert Box */}
              <div className="row justify-content-center">
                <div className="col-lg-12 col-md-12">
                  <div className="light-jbs-alert mb-3">
                    <div className="row justify-content-center g-3">
                      <div className="col-xl-5 col-lg-4 col-md-4">
                        <div className="form-group m-0">
                          <input type="text" className="form-control" placeholder="Job Title" />
                        </div>
                      </div>
                      <div className="col-xl-4 col-lg-4 col-md-4">
                        <div className="form-group m-0">
                          <select>
                            <option value="1">Daily Base</option>
                            <option value="2">Weekly Base</option>
                            <option value="3">Monthly Base</option>
                            <option value="4">Anualy Base</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-xl-3 col-lg-4 col-md-4">
                        <div className="form-group m-0">
                          <button type="button" className="btn btn-main fs-6 fw-medium full-width">
                            Save Job Alert!
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Job Alert Box End */}

              {/* Shorting Box */}
              <div className="row justify-content-center mb-4">
                <div className="col-lg-12 col-md-12">
                  <Suspense fallback={null}>
                    <SortingBar total={total} shown={jobs.length} />
                  </Suspense>
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
                          <a href="JavaScript:Void(0);" className="btn btn-md btn-main px-3">
                            Quick Apply
                          </a>
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

              <Suspense fallback={null}>
                <Pagination total={total} pageSize={pageSize} />
              </Suspense>
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
