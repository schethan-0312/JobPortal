"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface PublicStats {
  totalJobs: number;
  totalCandidates: number;
  totalVerifiedEmployers: number;
  totalApplications: number;
  verifiedEmployerPct: number;
  salaryFloor: number | null;
  salaryCeiling: number | null;
}

const AI_TOOL_COUNT = 8;

function formatLakhs(n: number) {
  return n >= 100000 ? `₹${(n / 100000).toFixed(0)}L` : `₹${n.toLocaleString("en-IN")}`;
}

export default function HeroBanner() {
  const router = useRouter();
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<PublicStats>("/stats", { auth: false });
        setStats(data);
      } catch {
        // decorative — fail silently
      }
    })();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (title.trim()) params.set("search", title.trim());
    if (location.trim()) params.set("location", location.trim());
    if (experience) params.set("experience", experience);
    router.push(`/jobs?${params.toString()}`);
  }

  return (
    <div
      className="image-cover hero-header position-relative py-5"
      style={{ background: "url(/assets/img/4268.jpg) no-repeat" }}
      data-overlay="7"
    >
      <div className="position-absolute bottom-0 start-0 end-0">
        <img src="/assets/img/banner-curve.svg" className="img-fluid" alt="SVG" />
      </div>
      <div className="container position-relative z-9">
        <div className="row justify-content-between align-items-center">
          <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
            <h6 className="text-green fw-medium d-inline-flex align-items-center mb-3">
              <span className="bg-green w-10 h-05 me-2"></span>Every employer verified before they post
            </h6>
            <h1 className="mb-4">Real Jobs, Real People, Real Success</h1>
            <p className="fs-5">
              Getting a new job is never easy. Check what new jobs we have in store for you on
              JobStock.
            </p>
            {stats && (
              <div className="lios-vrst">
                <ul>
                  <li>
                    <div className="lios-parts">
                      <h2>
                        <span className="ctr">
                          {stats.salaryFloor && stats.salaryCeiling
                            ? `${formatLakhs(stats.salaryFloor)}-${formatLakhs(stats.salaryCeiling)}`
                            : "—"}
                        </span>
                      </h2>
                      <h6>Salary Range Covered</h6>
                    </div>
                  </li>
                  <li>
                    <div className="lios-parts">
                      <h2>
                        <span className="ctr">{stats.verifiedEmployerPct}%</span>
                      </h2>
                      <h6>Employers Verified</h6>
                    </div>
                  </li>
                  <li>
                    <div className="lios-parts">
                      <h2>
                        <span className="ctr">{AI_TOOL_COUNT}</span>
                      </h2>
                      <h6>AI-Powered Tools</h6>
                    </div>
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="col-xl-5 col-lg-5 col-md-12 col-sm-12">
            <div className="hero-search-wrap">
              <div className="hero-search">
                <h1>
                  Grow Your Career with <span className="text-main">JobStock</span>
                </h1>
              </div>
              <form onSubmit={handleSearch} className="hero-search-content verticle-space">
                <div className="row">
                  <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                    <div className="form-group">
                      <label>Job Title</label>
                      <div className="input-with-icon">
                        <input
                          type="text"
                          className="form-control border"
                          placeholder="ex. Backend Engineer"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                        />
                        <img src="/assets/img/pin.svg" width={18} alt="" />
                      </div>
                    </div>
                  </div>

                  <div className="col-xl-6 col-lg-12 col-md-6 col-sm-6">
                    <div className="form-group">
                      <label>Location</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="ex. Bengaluru"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-xl-6 col-lg-12 col-md-6 col-sm-6">
                    <div className="form-group">
                      <label>Experience</label>
                      <select className="form-control" value={experience} onChange={(e) => setExperience(e.target.value)}>
                        <option value="">Any Experience</option>
                        <option value="0">Fresher</option>
                        <option value="1">1+ Years</option>
                        <option value="3">3+ Years</option>
                        <option value="5">5+ Years</option>
                        <option value="10">10+ Years</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                    <div className="form-group">
                      <button type="submit" className="btn btn-main full-width">
                        Search Jobs
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
