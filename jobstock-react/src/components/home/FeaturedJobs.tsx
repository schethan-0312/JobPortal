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
}

interface JobsResponse {
  items: Job[];
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
    <section className="pt-2">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-6 col-lg-7 col-md-10 text-center">
            <div className="sec-heading center">
              <h2>Featured Jobs</h2>
              <p>Explore the latest open roles posted by verified employers on JobStock.</p>
            </div>
          </div>
        </div>

        <div className="row justify-content-center gx-xl-3 gx-3 gy-4">
          {jobs.slice(0, 4).map((item) => (
            <div className="col-xl-3 col-lg-4 col-md-6 col-sm-12" key={item.id}>
              <div className="job-instructor-layout border">
                <div className="brows-job-type">
                  <span>{item.jobType ?? "—"}</span>
                </div>
                <div className="job-instructor-thumb">
                  <Link href={`/job-detail/${item.slug}`}>
                    <img
                      src={assetUrl(item.employer?.logoUrl) || "/assets/img/l-1.png"}
                      className="img-fluid"
                      alt=""
                    />
                  </Link>
                </div>
                <div className="job-instructor-content">
                  <h4 className="instructor-title">
                    <Link href={`/job-detail/${item.slug}`}>{item.title}</Link>
                  </h4>
                  <div className="instructor-skills">{item.employer?.companyName ?? "—"}</div>
                </div>
                <div className="job-instructor-footer">
                  <div className="instructor-students">
                    <h5 className="instructor-scount">{formatSalary(item)}</h5>
                  </div>
                  <div className="instructor-corses">
                    <span className="c-counting">{item.location ?? "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="row justify-content-center mt-5">
          <div className="col-lg-12 text-center">
            <Link href="/jobs" className="btn btn-main btn-md px-5 rounded-pill fw-medium">
              View All Jobs <i className="fa-solid fa-arrow-right ms-2"></i>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
