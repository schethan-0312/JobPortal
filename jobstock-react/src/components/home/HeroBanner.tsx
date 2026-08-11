"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface PublicStats {
  totalJobs: number;
  totalCandidates: number;
  totalVerifiedEmployers: number;
  totalApplications: number;
}

export default function HeroBanner() {
  const [stats, setStats] = useState<PublicStats | null>(null);

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
                        <span className="ctr">{stats.totalJobs}</span>
                      </h2>
                      <h6>Active Jobs</h6>
                    </div>
                  </li>
                  <li>
                    <div className="lios-parts">
                      <h2>
                        <span className="ctr">{stats.totalVerifiedEmployers}</span>
                      </h2>
                      <h6>Verified Companies</h6>
                    </div>
                  </li>
                  <li>
                    <div className="lios-parts">
                      <h2>
                        <span className="ctr">{stats.totalCandidates}</span>
                      </h2>
                      <h6>Talents</h6>
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
              <form action="/jobs" method="GET" className="hero-search-content verticle-space">
                <div className="row">
                  <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                    <div className="form-group">
                      <div className="input-with-icon">
                        <input
                          type="text"
                          name="search"
                          className="form-control border"
                          placeholder="Search Job Keywords.."
                        />
                        <img src="/assets/img/pin.svg" width={18} alt="" />
                      </div>
                    </div>
                  </div>

                  <div className="col-xl-6 col-lg-12 col-md-6 col-sm-6">
                    <div className="form-group">
                      <label>Job Category</label>
                      <select name="category" className="form-control">
                        <option value="">All Categories</option>
                        <option value="Software">Software & Application</option>
                        <option value="Banking">Banking</option>
                        <option value="Health">Health & Medical</option>
                        <option value="Mobile">Mobile & App</option>
                        <option value="Education">Education</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-xl-6 col-lg-12 col-md-6 col-sm-6">
                    <div className="form-group">
                      <label>Job Type</label>
                      <select name="jobType" className="form-control">
                        <option value="">All Type</option>
                        <option value="Full Time">Full Time</option>
                        <option value="Part Time">Part Time</option>
                        <option value="Contractor">Contractor</option>
                        <option value="Freelance">Freelance</option>
                      </select>
                    </div>
                  </div>

                  
                

                 

                  <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                    <div className="form-group">
                      <button
                        type="submit"
                        className="btn full-width fw-semibold"
                        style={{
                          backgroundColor: "#37a481",
                          color: "#0e3b3c",
                          borderColor: "rgb(93, 240, 194)",
                        }}
                      >
                        Search Result
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
