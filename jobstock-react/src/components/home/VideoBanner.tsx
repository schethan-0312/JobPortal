"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface PublicStats {
  totalJobs: number;
  totalCandidates: number;
  totalVerifiedEmployers: number;
  totalApplications: number;
}

function formatCount(n: number): string {
  if (n >= 100000) return `${(n / 100000).toFixed(0)}L+`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k+`;
  if (n > 0) return `${n}+`;
  return "10k+"; // fallback
}

export default function VideoBanner() {
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<PublicStats>("/stats", { auth: false });
        setStats(data);
      } catch {
        // fail silently — fallback text shown
      }
    })();
  }, []);

  const candidateCount = stats ? formatCount(stats.totalCandidates) : "10k+";

  return (
    <section className="vb-section">
      <style>{`
        .vb-section {
          background: #f8fffe;
          position: relative;
          overflow: hidden;
          padding: 80px 0;
          font-family: var(--primaryfont), sans-serif;
        }

        .vb-blob {
          position: absolute;
          top: -60px;
          left: -80px;
          width: 420px;
          height: 520px;
          background: linear-gradient(145deg, #134e4a 0%, #38a581 100%);
          border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
          z-index: 0;
          opacity: 0.12;
        }
        .vb-dots {
          position: absolute;
          bottom: 20px;
          left: 20px;
          width: 120px;
          height: 120px;
          background-image: radial-gradient(circle, #38a581 1.5px, transparent 1.5px);
          background-size: 18px 18px;
          opacity: 0.25;
          z-index: 0;
        }
        .vb-dots-right {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 100px;
          height: 100px;
          background-image: radial-gradient(circle, #38a581 1.5px, transparent 1.5px);
          background-size: 18px 18px;
          opacity: 0.18;
          z-index: 0;
        }

        /* Left image */
        .vb-img-side {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 30px 20px;
        }
        .vb-img-wrap {
          position: relative;
          width: 100%;
          max-width: 390px;
        }
        .vb-img-accent {
          position: absolute;
          top: 16px;
          left: 16px;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #38a581, #134e4a);
          border-radius: 22px;
          z-index: 0;
        }
        .vb-img-card {
          position: relative;
          z-index: 1;
          width: 100%;
          border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 24px 60px rgba(19,78,74,0.22);
          animation: vbFloat 4s ease-in-out infinite;
        }
        .vb-img-card img {
          width: 100%;
          display: block;
          object-fit: cover;
        }

        /* Floating badge — top right */
        .vb-badge-live {
          position: absolute;
          top: -14px;
          right: -14px;
          background: #fff;
          border-radius: 14px;
          padding: 8px 14px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 3;
          animation: vbFloat 3.5s ease-in-out infinite;
        }
        .vb-badge-live-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #22c55e;
          animation: vbPulse 1.5s ease-in-out infinite;
        }
        .vb-badge-live-text {
          font-size: 0.75rem;
          font-weight: 700;
          color: #111;
          white-space: nowrap;
        }

        /* Floating stat badge — bottom left — DYNAMIC */
        .vb-badge-stat {
          position: absolute;
          bottom: -14px;
          left: -14px;
          background: #134e4a;
          color: #fff;
          border-radius: 14px;
          padding: 9px 14px;
          box-shadow: 0 8px 24px rgba(19,78,74,0.3);
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 3;
          animation: vbFloat 5s ease-in-out infinite reverse;
        }
        .vb-badge-stat-num {
          font-size: 1.05rem;
          font-weight: 800;
          color: #4ade80;
          line-height: 1;
        }
        .vb-badge-stat-label {
          font-size: 0.68rem;
          color: #a8c6c4;
          line-height: 1.3;
        }

        @keyframes vbFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes vbPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.7; }
        }

        /* Right content */
        .vb-content {
          position: relative;
          z-index: 2;
          padding-left: 30px;
        }
        .vb-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(56,165,129,0.1);
          color: #38a581;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 20px;
          border: 1px solid rgba(56,165,129,0.25);
          margin-bottom: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .vb-tag-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #38a581;
        }
        .vb-title {
          font-size: 2.1rem;
          font-weight: 800;
          color: #0d1117;
          line-height: 1.2;
          margin-bottom: 14px;
        }
        .vb-title span { color: #38a581; }
        .vb-desc {
          font-size: 0.88rem;
          color: #6b7280;
          line-height: 1.75;
          margin-bottom: 28px;
          max-width: 88%;
        }

        /* Cards */
        .vb-cards {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 28px;
        }
        .vb-card {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          background: #fff;
          border: 1px solid #e8f5f0;
          border-radius: 14px;
          padding: 14px 18px;
          max-width: 360px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
          transition: all 0.25s ease;
          cursor: default;
        }
        .vb-card:hover {
          border-color: #38a581;
          box-shadow: 0 8px 28px rgba(56,165,129,0.14);
          transform: translateX(6px);
        }
        .vb-card-icon {
          width: 38px;
          height: 38px;
          min-width: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #134e4a, #38a581);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(56,165,129,0.3);
        }
        .vb-card-title {
          font-size: 0.92rem;
          font-weight: 700;
          color: #111;
          margin-bottom: 3px;
        }
        .vb-card-desc {
          font-size: 0.73rem;
          color: #9ca3af;
          margin: 0;
          line-height: 1.5;
        }

        .vb-divider {
          height: 1px;
          background: linear-gradient(to right, #e5e7eb, transparent);
          margin-bottom: 20px;
          max-width: 360px;
        }

        /* Avatars + count */
        .vb-bottom {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .vb-avatars {
          display: flex;
          align-items: center;
        }
        .vb-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2.5px solid #fff;
          object-fit: cover;
          margin-right: -10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          background: #e5e7eb;
        }
        .vb-avatar-badge {
          margin-left: 18px;
          background: linear-gradient(135deg, #38a581, #134e4a);
          color: #fff;
          font-size: 0.78rem;
          font-weight: 700;
          padding: 5px 14px;
          border-radius: 20px;
          box-shadow: 0 4px 14px rgba(56,165,129,0.3);
        }
        .vb-trusted-text {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-left: 4px;
        }

        @media (max-width: 991px) {
          .vb-content { padding-left: 0; margin-top: 60px; }
          .vb-card { max-width: 100%; }
          .vb-title { font-size: 1.65rem; }
          .vb-blob { display: none; }
        }
      `}</style>

      <div className="vb-blob"></div>
      <div className="vb-dots"></div>
      <div className="vb-dots-right"></div>

      <div className="container position-relative" style={{ zIndex: 2 }}>
        <div className="row align-items-center">

          {/* LEFT: Image with floating badges */}
          <div className="col-lg-5">
            <div className="vb-img-side">
              <div className="vb-img-wrap">
                <div className="vb-img-accent"></div>
                <div className="vb-img-card">
                  <img
                    src="/img/ai-tools/Career Counselling.jpg"
                    alt="Career Growth"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/img/slider-1.jpg';
                    }}
                  />
                </div>

                {/* Floating badge — top right */}
                <div className="vb-badge-live">
                  <div className="vb-badge-live-dot"></div>
                  <span className="vb-badge-live-text">Live Jobs Posted</span>
                </div>

                {/* Floating DYNAMIC stat badge — bottom left */}
                <div className="vb-badge-stat">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#4ade80" viewBox="0 0 24 24">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <div>
                    <div className="vb-badge-stat-num">{candidateCount}</div>
                    <div className="vb-badge-stat-label">Happy<br/>Candidates</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Content */}
          <div className="col-lg-7">
            <div className="vb-content">
              <div className="vb-tag">
                <div className="vb-tag-dot"></div>
                Platform Overview
              </div>

              <h2 className="vb-title">
                See How JobStock<br />
                <span>Accelerates</span> Hiring &amp;<br />Career Growth
              </h2>

              <p className="vb-desc">
                Discover how JobStock connects job seekers with verified employers,
                featuring automated matching, 1-click applications, and real-time
                candidate updates — all in one platform.
              </p>

              <div className="vb-cards">
                <div className="vb-card">
                  <div className="vb-card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="vb-card-title">Fast Matching</div>
                    <p className="vb-card-desc">Instant candidate alerts based on your specific requirements.</p>
                  </div>
                </div>
                <div className="vb-card">
                  <div className="vb-card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <div>
                    <div className="vb-card-title">Verified Jobs</div>
                    <p className="vb-card-desc">Direct company listings to ensure safe and authentic opportunities.</p>
                  </div>
                </div>
              </div>

              <div className="vb-divider"></div>

              <div className="vb-bottom">
                <div className="vb-avatars">
                  <img src="/assets/img/team-1.jpg" className="vb-avatar" alt="User 1"
                    onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                  <img src="/assets/img/team-2.jpg" className="vb-avatar" alt="User 2"
                    onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                  <img src="/assets/img/team-3.jpg" className="vb-avatar" alt="User 3"
                    onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                  <span className="vb-avatar-badge">{candidateCount}</span>
                </div>
                <span className="vb-trusted-text">Trusted by professionals across India</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
