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
      style={{ background: "url(/assets/img/4268.jpg) no-repeat", backgroundSize: "cover", backgroundPosition: "center" }}
      data-overlay="7"
    >
      <div className="position-absolute bottom-0 start-0 end-0 d-none d-md-block">
        <img src="/assets/img/banner-curve.svg" className="img-fluid w-100" alt="SVG" />
      </div>
      <div className="container position-relative z-9 pt-lg-4 pt-md-3">
        <div className="row justify-content-between align-items-center gy-4">
          <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12 text-center text-lg-start">
            <h1 className="hero-title mb-3 fw-bold text-white">Real Jobs, Real People, Real Success</h1>
            <p className="hero-desc fs-5 text-white-50 mb-4">
              Getting a new job is never easy. Check what new jobs we have in store for you on
              JobStock.
            </p>
            {stats && (
              <div className="lios-vrst mt-4">
                <ul className="d-flex flex-wrap justify-content-center justify-content-lg-start gap-3 list-unstyled p-0 m-0">
                  <li className="stat-card">
                    <div className="lios-parts p-2">
                      <h2 className="mb-0 text-white">
                        <span className="ctr">{stats.totalJobs}</span>
                      </h2>
                      <h6 className="small text-white-50 mb-0">Active Jobs</h6>
                    </div>
                  </li>
                  <li className="stat-card">
                    <div className="lios-parts p-2">
                      <h2 className="mb-0 text-white">
                        <span className="ctr">{stats.totalVerifiedEmployers}</span>
                      </h2>
                      <h6 className="small text-white-50 mb-0">Verified Companies</h6>
                    </div>
                  </li>
                  <li className="stat-card">
                    <div className="lios-parts p-2">
                      <h2 className="mb-0 text-white">
                        <span className="ctr">{stats.totalCandidates}</span>
                      </h2>
                      <h6 className="small text-white-50 mb-0">Talents</h6>
                    </div>
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="col-xl-5 col-lg-5 col-md-12 col-sm-12">
            <div className="hero-search-wrap bg-white p-3 p-sm-4 rounded-4 shadow-lg">
              <div className="hero-search mb-3">
                <h2 className="fs-4 fw-bold mb-0 text-dark text-center text-sm-start">
                  Grow Your Career with <span className="text-main">JobStock</span>
                </h2>
              </div>
              <form action="/jobs" method="GET" className="hero-search-content verticle-space">
                <div className="row g-3">
                  <div className="col-12">
                    <div className="form-group mb-0">
                      <div className="input-with-icon position-relative">
                        <input
                          type="text"
                          name="search"
                          className="form-control border rounded-3 py-2 px-3"
                          placeholder="Search Job Keywords.."
                          style={{ height: "48px" }}
                        />
                        <img
                          src="/assets/img/pin.svg"
                          width={18}
                          alt=""
                          className="position-absolute end-0 top-50 translate-middle-y me-3 pointer-events-none opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-sm-6">
                    <div className="form-group mb-0">
                      <label className="small fw-medium text-secondary mb-1">Job Category</label>
                      <select name="category" className="form-control rounded-3 py-2" style={{ height: "44px" }}>
                        <option value="">All Categories</option>
                        <option value="Software">Software & Application</option>
                        <option value="Banking">Banking</option>
                        <option value="Health">Health & Medical</option>
                        <option value="Mobile">Mobile & App</option>
                        <option value="Education">Education</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="form-group mb-0">
                      <label className="small fw-medium text-secondary mb-1">Job Type</label>
                      <select name="jobType" className="form-control rounded-3 py-2" style={{ height: "44px" }}>
                        <option value="">All Type</option>
                        <option value="Full Time">Full Time</option>
                        <option value="Part Time">Part Time</option>
                        <option value="Contractor">Contractor</option>
                        <option value="Freelance">Freelance</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-12 mt-3">
                    <div className="form-group mb-0">
                      <button
                        type="submit"
                        className="btn w-100 fw-semibold rounded-3 py-2"
                        style={{
                          backgroundColor: "#37a481",
                          color: "#ffffff",
                          borderColor: "#37a481",
                          height: "48px",
                          fontSize: "1rem",
                        }}
                      >
                        <i className="fa-solid fa-magnifying-glass me-2"></i>Search Jobs
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .hero-title {
          font-size: clamp(1.8rem, 4vw, 2.75rem);
          line-height: 1.25;
        }
        .hero-desc {
          font-size: clamp(1rem, 2vw, 1.25rem);
        }
        .stat-card {
          min-width: 100px;
        }
        @media (max-width: 576px) {
          .stat-card {
            flex: 1 1 calc(33.333% - 12px);
            text-align: center;
          }
          .hero-search-wrap {
            padding: 1.25rem !important;
          }
        }
      `}</style>
    </div>
  );
}
