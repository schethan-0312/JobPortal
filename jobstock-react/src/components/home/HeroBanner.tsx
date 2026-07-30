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
            <h6 className="text-green fw-medium d-inline-flex align-items-center mb-3">
              <span className="bg-green w-10 h-05 me-2"></span>Get Hot & Trending Jobs
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
              <div className="hero-search-content verticle-space">
                <div className="row">
                  <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                    <div className="form-group">
                      <div className="input-with-icon">
                        <input
                          type="text"
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
                      <select className="form-control">
                        <option value="1">Software & Application</option>
                        <option value="2">Banking</option>
                        <option value="3">Health & Medical</option>
                        <option value="4">Mobile & App</option>
                        <option value="5">Education</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-xl-6 col-lg-12 col-md-6 col-sm-6">
                    <div className="form-group">
                      <label>Job Type</label>
                      <select className="form-control">
                        <option value="1">All Type</option>
                        <option value="2">Full Time</option>
                        <option value="3">Part Time</option>
                        <option value="4">Contractor</option>
                        <option value="5">Freelance</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6">
                    <div className="form-group">
                      <label>Job Level</label>
                      <select className="form-control">
                        <option value="1">Junior Level</option>
                        <option value="2">Mid Level</option>
                        <option value="3">Manager</option>
                        <option value="4">Team Leader</option>
                        <option value="5">Senior Level</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6">
                    <div className="form-group">
                      <label>Experience</label>
                      <select className="form-control">
                        <option value="1">1 Year</option>
                        <option value="2">2 Year</option>
                        <option value="3">3 Year</option>
                        <option value="4">4 Year</option>
                        <option value="5">5 Year</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                    <div className="form-group">
                      <label>Expected Salary</label>
                      <select className="form-control">
                        <option value="1">$500 - $1000 PA</option>
                        <option value="2">$200 - $5000 PA</option>
                        <option value="3">$5000 - $10000 PA</option>
                        <option value="4">$10000 - $20000 PA</option>
                        <option value="5">$20000 - $40000 PA</option>
                        <option value="6">$40000 - $50000 PA</option>
                        <option value="7">$50000 - $100000 PA</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                    <div className="form-group">
                      <button type="submit" className="btn btn-main full-width">
                        Search Result
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
