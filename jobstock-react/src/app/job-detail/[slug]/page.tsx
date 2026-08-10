import Navbar5 from "@/components/Navbar5";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import ApplyBox from "@/components/jobs/ApplyBox";
import { api, ApiError, assetUrl } from "@/lib/api";

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

function formatAmount(val: number): { text: string; unit: "L" | "k" | "" } {
  if (val >= 100000) {
    const lakh = val / 100000;
    const formatted = Number.isInteger(lakh) ? lakh.toString() : parseFloat(lakh.toFixed(2)).toString();
    return { text: formatted, unit: "L" };
  }
  if (val >= 1000) {
    const k = Math.round(val / 100) / 10;
    const formatted = Number.isInteger(k) ? k.toString() : parseFloat(k.toFixed(1)).toString();
    return { text: `${formatted}k`, unit: "k" };
  }
  return { text: val.toString(), unit: "" };
}

function formatSalary(job: Job) {
  const { salaryMin, salaryMax } = job;
  if (!salaryMin && !salaryMax) return "Not disclosed";

  if (salaryMin && salaryMax) {
    const minObj = formatAmount(salaryMin);
    const maxObj = formatAmount(salaryMax);

    if (minObj.unit === "L" && maxObj.unit === "L") {
      return `₹${minObj.text} - ${maxObj.text} LPA`;
    }
    if (minObj.unit === "k" && maxObj.unit === "k") {
      return `₹${minObj.text} - ${maxObj.text} PA`;
    }
    return `₹${minObj.text} - ${maxObj.text} LPA`;
  }

  if (salaryMin) {
    const minObj = formatAmount(salaryMin);
    if (minObj.unit === "L") return `₹${minObj.text} LPA`;
    return `₹${minObj.text} PA`;
  }

  if (salaryMax) {
    const maxObj = formatAmount(salaryMax);
    if (maxObj.unit === "L") return `Up to ₹${maxObj.text} LPA`;
    return `Up to ₹${maxObj.text} PA`;
  }

  return "Not disclosed";
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
            <div className="col-lg-11 col-md-12">
              {error && (
                <div className="jbs-dts-block styl-02 p-5 text-center">
                  <p className="text-danger m-0">{error}</p>
                </div>
              )}
              {job && (
                <div className="jbs-dts-block styl-02">
                  <div className="jbs-head-block">
                    <div className="jbs-head-tops bg-cover" style={{ background: "url(/assets/img/blog-4.jpg) no-repeat" }}>
                      <div className="ht-200"></div>
                    </div>
                    <div className="jbs-head-bodys">
                      <div className="jbs-head-bodys-top">
                        <div className="jbs-roots-y1">
                          <div className="jbs-roots-y1-first">
                            <div className="jbs-roots-thumb">
                              <figure>
                                <img
                                  src={assetUrl(job.employer?.logoUrl) || "/assets/img/l-4.png"}
                                  className="img-fluid"
                                  alt=""
                                />
                              </figure>
                            </div>
                          </div>
                          <div className="jbs-roots-y1-last">
                            <div className="jbs-urt">
                              <span className="label text-main bg-light-main">{job.jobType ?? "—"}</span>
                            </div>
                            <div className="jbs-title-iop">
                              <h2 className="m-0">{job.title}</h2>
                            </div>
                            <div className="jbs-locat-oiu text-sm-muted">
                              <span>
                                <i className="fa-solid fa-location-dot me-1"></i>
                                {job.location ?? "—"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="jbs-roots-y2">
                          <div className="jbs-roots-action-groups">
                            <div className="jbs-roots-action-btns">
                              <ApplyBox jobId={job.id} />
                            </div>
                            <div className="jbs-roots-action-info">
                              <span className="text-sm fw-medium text-success ms-2">
                                {job.employer?.companyName ?? ""}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="jbs-head-bodys-foot">
                        <div className="jbs-info-detail-yelos">
                          <div className="signle-jbs-info-yelos">
                            <div className="signle-yelos-subtitle">
                              <span className="text-sm-muted mb-1">Job Type</span>
                            </div>
                            <div className="signle-yelos-title">
                              <h6 className="m-0 text-main">{job.jobType ?? "—"}</h6>
                            </div>
                          </div>
                          <div className="signle-jbs-info-yelos">
                            <div className="signle-yelos-subtitle">
                              <span className="text-sm-muted mb-1">Category</span>
                            </div>
                            <div className="signle-yelos-title">
                              <h6 className="m-0 text-main">{job.category ?? "—"}</h6>
                            </div>
                          </div>
                          <div className="signle-jbs-info-yelos">
                            <div className="signle-yelos-subtitle">
                              <span className="text-sm-muted mb-1">Salary</span>
                            </div>
                            <div className="signle-yelos-title">
                              <h6 className="m-0 text-main">{formatSalary(job)}</h6>
                            </div>
                          </div>
                          <div className="signle-jbs-info-yelos">
                            <div className="signle-yelos-subtitle">
                              <span className="text-sm-muted mb-1">Status</span>
                            </div>
                            <div className="signle-yelos-title">
                              <h6 className="m-0 text-main">{job.status ?? "—"}</h6>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="jbs-dts-body">
                    <div className="jbs-dts-body-content">
                      <div className="tab-content py-4 px-5">
                        <div className="row">
                          <div className="col-xl-9 col-lg-10 col-md-12">
                            <div className="jbs-content">
                              <h6>Job Description</h6>
                              <p style={{ whiteSpace: "pre-wrap" }}>{job.description ?? "No description provided."}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      {/* Job Detail */}

      {/* Call To Action */}
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
      <Footer />
    </>
  );
}
