"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, assetUrl } from "@/lib/api";

interface Employer {
  companyName: string;
  logoUrl?: string | null;
}

interface Job {
  id: string;
  title: string;
  slug: string;
  location?: string;
  jobType?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  salaryPeriod?: string | null;
  employer?: Employer;
}

interface JobsResponse {
  items: Job[];
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

export default function FeaturedJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<JobsResponse>("/jobs?pageSize=4", { auth: false });
        setJobs((data.items ?? []).slice(0, 4));
      } catch {
        setJobs([]);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  if (loaded && jobs.length === 0) {
    return null;
  }

  return (
    <section className="py-5 bg-white position-relative">
      <div className="container py-2">
        {/* Heading */}
        <div className="row justify-content-center">
          <div className="col-xl-6 col-lg-7 col-md-10 text-center">
            <div className="sec-heading center mb-5">
              <span className="badge bg-main-light text-main fw-semibold px-3 py-2 rounded-pill fs-7 mb-2 d-inline-flex align-items-center gap-1">
                <i className="fa-solid fa-fire text-danger"></i> Trending Opportunities
              </span>
              <h2 className="fw-bold fs-2 text-dark mt-2 mb-3">
                Featured <span className="text-main">Jobs</span>
              </h2>
              <p className="text-muted fs-6 m-0">
                Explore the latest open roles posted by verified employers on JobStock.
              </p>
            </div>
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="row justify-content-center g-4">
          {jobs.slice(0, 4).map((item) => (
            <div className="col-xl-3 col-lg-4 col-md-6 col-sm-12" key={item.id}>
              <div className="featured-job-card h-100 d-flex flex-column justify-content-between p-4 rounded-4 bg-white border position-relative transition-all">
                {/* Top Accent Hover Gradient Bar */}
                <div className="card-hover-bar"></div>

                <div>
                  {/* Header: Company Logo & Job Type Badge */}
                  <div className="d-flex align-items-start justify-content-between mb-3">
                    <Link href={`/job-detail/${item.slug}`} className="job-logo-wrapper rounded-3 p-2 border d-inline-flex align-items-center justify-content-center bg-white shadow-sm">
                      <img
                        src={assetUrl(item.employer?.logoUrl) || "/assets/img/l-1.png"}
                        className="img-fluid job-logo-img"
                        alt={item.employer?.companyName || "Employer"}
                      />
                    </Link>
                    <span className="badge job-type-badge rounded-pill px-3 py-2 fw-medium fs-8">
                      {item.jobType ?? "Full Time"}
                    </span>
                  </div>

                  {/* Job Title & Company Name */}
                  <div className="mb-3">
                    <h3 className="fs-6 fw-bold mb-1 job-card-title text-truncate">
                      <Link href={`/job-detail/${item.slug}`} className="text-dark text-decoration-none title-link">
                        {item.title}
                      </Link>
                    </h3>
                    <p className="text-muted small mb-0 d-flex align-items-center gap-1 text-truncate">
                      <i className="fa-regular fa-building text-main opacity-75"></i>
                      {item.employer?.companyName ?? "Verified Company"}
                    </p>
                  </div>

                  {/* Metadata Chips: Salary & Location */}
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <span className="badge bg-light text-dark border px-2.5 py-1.5 rounded-2 font-medium small d-inline-flex align-items-center gap-1">
                      <i className="fa-solid fa-wallet text-success fs-8"></i>
                      {formatSalary(item)}
                    </span>
                    <span className="badge bg-light text-secondary border px-2.5 py-1.5 rounded-2 small d-inline-flex align-items-center gap-1">
                      <i className="fa-solid fa-location-dot text-danger opacity-75 fs-8"></i>
                      {item.location ?? "Remote"}
                    </span>
                  </div>
                </div>

                {/* Footer Action Button */}
                <div className="pt-3 border-top border-light-subtle mt-2">
                  <Link
                    href={`/job-detail/${item.slug}`}
                    className="btn btn-outline-main btn-sm w-100 rounded-pill fw-medium d-flex align-items-center justify-content-center gap-2 apply-btn"
                  >
                    View Details <i className="fa-solid fa-arrow-right fs-8 btn-arrow-icon"></i>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="row justify-content-center mt-5">
          <div className="col-lg-12 text-center">
            <Link href="/jobs" className="btn btn-main btn-md px-5 rounded-pill fw-medium shadow-sm hover-lift">
              View All Jobs <i className="fa-solid fa-arrow-right ms-2"></i>
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .bg-main-light {
          background-color: rgba(11, 130, 96, 0.08) !important;
          color: #0b8260 !important;
        }
        .fs-7 {
          font-size: 0.875rem !important;
        }
        .fs-8 {
          font-size: 0.785rem !important;
        }
        .featured-job-card {
          border-color: rgba(0, 0, 0, 0.08) !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
          overflow: hidden;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease;
        }
        .card-hover-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #0b8260, #10b981);
          border-radius: 1rem 1rem 0 0;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .featured-job-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(11, 130, 96, 0.14) !important;
          border-color: rgba(11, 130, 96, 0.35) !important;
        }
        .featured-job-card:hover .card-hover-bar {
          opacity: 1;
        }
        .job-logo-wrapper {
          width: 52px;
          height: 52px;
          transition: transform 0.3s ease, border-color 0.3s ease;
        }
        .job-logo-img {
          max-height: 36px;
          object-fit: contain;
        }
        .featured-job-card:hover .job-logo-wrapper {
          transform: scale(1.06);
          border-color: rgba(11, 130, 96, 0.3) !important;
        }
        .job-type-badge {
          background-color: rgba(11, 130, 96, 0.08);
          color: #0b8260;
          border: 1px solid rgba(11, 130, 96, 0.2);
        }
        .title-link {
          transition: color 0.2s ease;
        }
        .featured-job-card:hover .title-link {
          color: #0b8260 !important;
        }
        .btn-outline-main {
          color: #0b8260;
          border-color: rgba(11, 130, 96, 0.3);
          background-color: rgba(11, 130, 96, 0.04);
          transition: all 0.3s ease;
        }
        .featured-job-card:hover .apply-btn,
        .btn-outline-main:hover {
          background-color: #0b8260 !important;
          color: #ffffff !important;
          border-color: #0b8260 !important;
        }
        .btn-arrow-icon {
          transition: transform 0.3s ease;
        }
        .featured-job-card:hover .btn-arrow-icon {
          transform: translateX(4px);
        }
        .hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 24px rgba(11, 130, 96, 0.25) !important;
        }
      `}</style>
    </section>
  );
}
