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
  employer?: Employer;
  createdAt?: string;
}

interface JobsResponse {
  items: Job[];
}


function getTimeAgo(dateString?: string) {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
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

export default function FeaturedJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    if (currentIndex < Math.max(0, jobs.length - 3)) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<JobsResponse>("/jobs?pageSize=15", { auth: false });
        setJobs(data.items ?? []);
      } catch {
        setJobs([]);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

    return (
    <section className="py-5 bg-white position-relative">
      <div className="container py-2">
        <style>{`
          .f-job-card {
            border: 1px solid #e9ecef;
            border-radius: 12px;
            background: #fff;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.02);
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          .f-job-gradient {
            height: 110px;
            background: linear-gradient(180deg, rgba(60,179,113,0.6) 0%, rgba(255,255,255,0) 100%);
            position: relative;
          }
          .f-job-logo-wrapper {
            position: absolute;
            bottom: -25px;
            left: 20px;
            width: 70px;
            height: 70px;
            background: #fff;
            border-radius: 12px;
            border: 1px solid #eaeaea;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            padding: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.03);
          }
          .f-job-content {
            padding: 35px 20px 20px;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
          }
          .f-job-title {
            font-size: 1.15rem;
            font-weight: 700;
            color: #000;
            margin-bottom: 2px;
          }
          .f-job-company {
            font-size: 0.85rem;
            color: #999;
            margin-bottom: 4px;
          }
          .f-job-location {
            font-size: 0.85rem;
            color: #999;
            margin-bottom: 15px;
          }
          .f-job-location i {
            color: #ff4d4d;
            margin-right: 4px;
          }
          .f-job-divider {
            height: 1px;
            background-color: #f0f0f0;
            margin: auto -20px 15px -20px;
          }
          .f-job-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .f-job-posted {
            font-size: 0.85rem;
            color: #666;
          }
          .f-job-posted strong {
            color: #222;
          }
          .f-btn-save {
            background-color: #f1f1f1;
            color: #333;
            border: none;
            border-radius: 20px;
            padding: 5px 12px;
            font-size: 0.75rem;
            font-weight: 600;
            margin-right: 8px;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
          }
          .f-btn-save:hover {
            background-color: #e2e2e2;
            color: #000;
          }
          .f-btn-apply {
            background-color: #3cb371;
            color: #fff;
            border: none;
            border-radius: 20px;
            padding: 5px 12px;
            font-size: 0.75rem;
            font-weight: 600;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
          }
          .f-btn-apply:hover {
            background-color: #2e8b57;
            color: #fff;
          }
          .f-slider-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: #3cb371;
            color: #fff;
            border: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-left: 10px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.2s;
          }
          .f-slider-btn:hover {
            background-color: #2e8b57;
          }
          .f-view-all {
            background-color: #3cb371;
            color: #fff;
            border: none;
            border-radius: 30px;
            padding: 12px 25px;
            font-size: 1rem;
            font-weight: 600;
            margin-top: 30px;
            display: inline-block;
            text-decoration: none;
            transition: all 0.2s;
          }
          .f-view-all:hover {
            background-color: #2e8b57;
            color: white;
          }
        `}</style>

        {/* Heading */}
        <div className="text-center mb-4">
          <h2 className="fw-bold fs-1 text-dark mb-2">
            Featured <span style={{ color: '#3cb371' }}>Jobs</span>
          </h2>
          <p className="text-muted" style={{ fontSize: '1.1rem' }}>
            Explore latest opening roles posted by verified employers on JobStock.
          </p>
        </div>

        {/* Loading state */}
        {!loaded && (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}

        {/* No jobs empty state */}
        {loaded && jobs.length === 0 && (
          <div className="text-center py-5">
            <div style={{ fontSize: '3.5rem', marginBottom: '16px', opacity: 0.3 }}>
              <i className="fa-solid fa-briefcase"></i>
            </div>
            <h5 className="fw-semibold text-muted mb-2">No Jobs Added Yet</h5>
            <p className="text-muted" style={{ fontSize: '0.95rem' }}>
              Stay tuned! Employers will be posting new opportunities soon.
            </p>
          </div>
        )}

        {/* Controls — only show when jobs exist */}
        {loaded && jobs.length > 0 && (
          <>
            <div className="d-flex justify-content-end mb-3">
              <button className="f-slider-btn" onClick={prevSlide} disabled={currentIndex === 0} style={{ opacity: currentIndex === 0 ? 0.5 : 1, cursor: currentIndex === 0 ? 'default' : 'pointer' }}><i className="fa-solid fa-chevron-left"></i></button>
              <button className="f-slider-btn" onClick={nextSlide} disabled={currentIndex >= Math.max(0, jobs.length - 3)} style={{ opacity: currentIndex >= Math.max(0, jobs.length - 3) ? 0.5 : 1, cursor: currentIndex >= Math.max(0, jobs.length - 3) ? 'default' : 'pointer' }}><i className="fa-solid fa-chevron-right"></i></button>
            </div>

            {/* Jobs Grid */}
            <div className="row g-4">
              {jobs.slice(currentIndex, currentIndex + 3).map((item) => (
                <div className="col-xl-4 col-lg-4 col-md-6 col-sm-12" key={item.id}>
                  <div className="f-job-card">
                    <div className="f-job-gradient">
                      <div className="f-job-logo-wrapper">
                        <img
                          src={assetUrl(item.employer?.logoUrl) || "/assets/img/l-1.png"}
                          alt={item.employer?.companyName || "Employer"}
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                      </div>
                    </div>
                    <div className="f-job-content">
                      <div className="f-job-title text-truncate">
                        <Link href={`/job-detail/${item.slug}`} className="text-dark text-decoration-none">
                          {item.title}
                        </Link>
                      </div>
                      <div className="f-job-company text-truncate">
                        {item.employer?.companyName ?? "Verified Company"}
                      </div>
                      <div className="f-job-location text-truncate">
                        <i className="fa-solid fa-location-dot"></i>
                        {item.location ?? "Remote"}
                      </div>
                      
                      <div className="f-job-divider"></div>
                      
                      <div className="f-job-footer">
                        <div className="f-job-posted">
                          Posted: <strong>{getTimeAgo(item.createdAt)}</strong>
                        </div>
                        <div>
                          <Link href={`/job-detail/${item.slug}`} className="f-btn-apply text-decoration-none">
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* View all jobs button */}
            <div className="text-start">
              <Link href="/jobs" className="f-view-all text-decoration-none">
                View all jobs
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
