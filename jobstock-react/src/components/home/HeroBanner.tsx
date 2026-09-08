"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface PublicStats {
  totalJobs: number;
  totalCandidates: number;
  totalVerifiedEmployers: number;
  totalApplications: number;
}

function formatStat(n: number | undefined): string {
  if (n === undefined || n === null) return "0";
  if (n >= 100000) return `${(n / 100000).toFixed(0)}L+`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k+`;
  return `${n}`;
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

  const activeJobs = stats ? formatStat(stats.totalJobs) : "0";
  const verifiedCompanies = stats ? formatStat(stats.totalVerifiedEmployers) : "0";
  const talents = stats ? formatStat(stats.totalCandidates) : "0";

  return (
    <div className="hero-banner-main position-relative">
      <div className="container position-relative z-2">
        <div className="row">
          <div className="col-xl-9 col-lg-10 col-md-12">
            
            {/* Main Headline */}
            <h1 className="hero-headline fw-bold text-white mb-3">
              Real Jobs,Real<br />
              People,Real Success
            </h1>

            {/* Sub-headline */}
            <p className="hero-subtext text-white-50 mb-4 pb-2" style={{ maxWidth: "580px", lineHeight: 1.6 }}>
              Getting a new job is never easy. Check what new jobs we have in store for you on JobStock.
            </p>

            {/* Search Bar */}
            <div className="hero-search-bar-wrap mb-5">
              <form action="/jobs" method="GET" className="hero-horizontal-form">
                
                {/* Search Keyword */}
                <div className="search-field keyword-field">
                  <i className="fa-solid fa-magnifying-glass text-muted ms-2 me-2"></i>
                  <input
                    type="text"
                    name="search"
                    className="form-control border-0 shadow-none bg-transparent hero-keyword-input"
                    placeholder="Search Job Keywords.."
                  />
                </div>

                {/* Submit Button */}
                <div className="search-btn-field">
                  <button type="submit" className="btn search-submit-btn">
                    Search Jobs
                  </button>
                </div>

              </form>
            </div>

            {/* Stats Row */}
            <div className="hero-stats-row d-flex flex-wrap align-items-center gap-4 gap-md-5">
              <div className="hero-stat-item">
                <h3 className="hero-stat-number text-white fw-bold mb-0">{activeJobs}</h3>
                <span className="hero-stat-label text-white-50 text-uppercase fw-semibold">Active Jobs</span>
              </div>
              <div className="hero-stat-item">
                <h3 className="hero-stat-number text-white fw-bold mb-0">{verifiedCompanies}</h3>
                <span className="hero-stat-label text-white-50 text-uppercase fw-semibold">Verified Companies</span>
              </div>
              <div className="hero-stat-item">
                <h3 className="hero-stat-number text-white fw-bold mb-0">{talents}</h3>
                <span className="hero-stat-label text-white-50 text-uppercase fw-semibold">Talents</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style jsx>{`
        .hero-banner-main {
          background-image: linear-gradient(rgba(40, 78, 73, 0.78), rgba(84, 126, 120, 0.78)), url(/assets/img/4268.jpg);
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          padding: 160px 0 110px;
        }

        .hero-headline {
          font-size: clamp(2.2rem, 4.5vw, 3.4rem);
          line-height: 1.18;
          letter-spacing: -0.5px;
        }
        .hero-subtext {
          font-size: clamp(0.95rem, 1.8vw, 1.15rem);
        }
        
        .hero-search-bar-wrap {
          max-width: 620px;
        }

        .hero-horizontal-form {
          background: #ffffff;
          border-radius: 16px;
          padding: 7px 8px;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
        }

        .search-field {
          display: flex;
          align-items: center;
          flex: 1;
        }

        .keyword-field {
          flex: 1;
          padding-left: 6px;
        }

        .hero-keyword-input {
          font-size: 0.95rem;
          color: #1e293b;
          height: 44px;
        }

        .hero-keyword-input::placeholder {
          color: #94a3b8;
          font-size: 0.92rem;
        }

        .search-btn-field {
          flex-shrink: 0;
        }

        .search-submit-btn {
          background-color: #38a581;
          color: #ffffff;
          border: none;
          border-radius: 12px;
          padding: 0 26px;
          height: 46px;
          font-size: 0.95rem;
          font-weight: 600;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
        }

        .search-submit-btn:hover {
          background-color: #2e8b6b;
          color: #ffffff;
          transform: translateY(-1px);
        }

        .hero-stat-number {
          font-size: clamp(1.6rem, 2.5vw, 2.2rem);
          line-height: 1.1;
          letter-spacing: -0.5px;
        }

        .hero-stat-label {
          font-size: 0.72rem;
          letter-spacing: 0.8px;
        }

        @media (max-width: 767px) {
          .hero-banner-main {
            padding: 130px 0 80px;
          }
          .hero-horizontal-form {
            flex-direction: column;
            align-items: stretch;
            padding: 12px;
            border-radius: 16px;
            gap: 10px;
          }
          .hero-horizontal-form .search-field {
            width: 100%;
            padding-left: 0;
          }
          .hero-horizontal-form .search-btn-field {
            width: 100%;
            margin-top: 4px;
          }
          .search-submit-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
