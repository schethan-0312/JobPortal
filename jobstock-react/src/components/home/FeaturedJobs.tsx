"use client";

import { useEffect, useState } from "react";
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

function formatSalary(job: Job) {
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  if (job.salaryMin && job.salaryMax) return `${fmt(job.salaryMin)} - ${fmt(job.salaryMax)}`;
  if (job.salaryMin) return fmt(job.salaryMin);
  return "Not disclosed";
}

export default function FeaturedJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<JobsResponse>("/jobs?pageSize=8", { auth: false });
        setJobs(data.items ?? []);
      } catch {
        setJobs([]);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

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

        {loaded && jobs.length === 0 && (
          <div className="row justify-content-center">
            <div className="col-xl-6 col-lg-8 col-md-10 text-center py-4">
              <p className="fs-5 fw-medium mb-2">You&apos;re early — no jobs posted yet.</p>
              <p className="text-muted mb-3">
                Be the first to know when a new role goes live, or if you&apos;re hiring, post your own.
              </p>
              <a href="/employer-submit-job" className="btn btn-main px-4">Post a Job</a>
            </div>
          </div>
        )}

        <div className="row justify-content-center gx-xl-3 gx-3 gy-4">
          {jobs.map((item) => (
            <div className="col-xl-3 col-lg-4 col-md-6 col-sm-12" key={item.id}>
              <div className="job-instructor-layout border">
                <div className="brows-job-type">
                  <span>{item.jobType ?? "—"}</span>
                </div>
                <div className="job-instructor-thumb">
                  <a href={`/job-detail/${item.slug}`}>
                    <img
                      src={assetUrl(item.employer?.logoUrl) || "/assets/img/l-1.png"}
                      className="img-fluid"
                      alt=""
                    />
                  </a>
                </div>
                <div className="job-instructor-content">
                  <h4 className="instructor-title">
                    <a href={`/job-detail/${item.slug}`}>{item.title}</a>
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
      </div>
    </section>
  );
}
