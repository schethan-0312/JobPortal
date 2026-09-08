const fs = require('fs');

const code = `
"use client";

import React from "react";

export default function VideoBanner() {
  return (
    <section className="platform-overview-section">
      <style>{\`
        .platform-overview-section {
          padding: 100px 0;
          background-color: #f7fbfa; /* Soft very light teal/gray */
          position: relative;
          overflow: hidden;
          font-family: var(--primaryfont), sans-serif;
        }
        /* Left side decorative shapes */
        .po-bg-shape-1 {
          position: absolute;
          top: -15%;
          left: -10%;
          width: 500px;
          height: 700px;
          background-color: #38a581; /* Teal */
          border-radius: 50%;
          z-index: 1;
        }
        .po-bg-shape-2 {
          position: absolute;
          top: -25%;
          left: -20%;
          width: 600px;
          height: 800px;
          background-color: rgba(56, 165, 129, 0.15);
          border-radius: 50%;
          z-index: 0;
        }
        .po-image-wrapper {
          position: relative;
          z-index: 2;
          padding: 20px;
          display: flex;
          justify-content: center;
        }
        .po-main-img {
          width: 100%;
          max-width: 500px;
          border-radius: 20px;
          box-shadow: 0 15px 40px rgba(0,0,0,0.15);
          object-fit: cover;
          background-color: #fff;
        }
        
        /* Right side */
        .po-content-wrapper {
          padding-left: 20px;
          position: relative;
          z-index: 2;
        }
        .po-title {
          font-size: 2rem;
          font-weight: 800;
          color: #1a1a1a;
          margin-bottom: 15px;
          line-height: 1.3;
          text-align: center;
        }
        .po-subtitle {
          font-size: 0.9rem;
          color: #6c757d;
          line-height: 1.6;
          margin-bottom: 40px;
          text-align: center;
          max-width: 85%;
          margin-left: auto;
          margin-right: auto;
        }
        
        .po-cards-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          align-items: center;
        }
        .po-card {
          background: #fff;
          border-radius: 12px;
          padding: 25px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.06);
          display: flex;
          align-items: center;
          gap: 20px;
          border: 1px solid #f8f9fa;
        }
        .po-card-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #18332f; /* Very dark teal */
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          flex-shrink: 0;
        }
        .po-card-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 4px;
        }
        .po-card-desc {
          font-size: 0.8rem;
          color: #888;
          margin: 0;
          line-height: 1.5;
        }

        .po-avatars-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 40px;
        }
        .po-avatar {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          border: 3px solid #fff;
          margin-right: -15px;
          object-fit: cover;
          background: #eaeaea;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        .po-avatar-count {
          background: #38a581;
          color: #fff;
          font-size: 0.85rem;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 20px;
          margin-left: 25px;
          box-shadow: 0 4px 12px rgba(56, 165, 129, 0.3);
        }

        @media (max-width: 991px) {
          .po-content-wrapper {
            padding-left: 0;
            margin-top: 50px;
          }
          .po-bg-shape-1, .po-bg-shape-2 {
            display: none; /* Hide decorative background on mobile for cleaner look */
          }
        }
      \`}</style>

      <div className="po-bg-shape-2"></div>
      <div className="po-bg-shape-1"></div>

      <div className="container position-relative z-2">
        <div className="row align-items-center">
          {/* Left Column: Image */}
          <div className="col-lg-6">
            <div className="po-image-wrapper">
              <img 
                src="/assets/img/career-illustration.png" 
                alt="Career Growth Illustration" 
                className="po-main-img" 
                onError={(e) => {
                  // Fallback to a default template image if the exact one is missing
                  (e.target as HTMLImageElement).src = '/assets/img/slider-1.jpg';
                }}
              />
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="col-lg-6">
            <div className="po-content-wrapper">
              <h2 className="po-title">See How JobStock Accelerates Hiring & Career Growth</h2>
              <p className="po-subtitle">
                Watch our platform overview video to discover how JobStock connects job seekers with verified employers, featuring automated matching, 1-click applications, and real-time candidate updates.
              </p>

              <div className="po-cards-container">
                <div className="po-card">
                  <div className="po-card-icon">
                    <i className="fa-solid fa-bolt"></i>
                  </div>
                  <div>
                    <h4 className="po-card-title">Fast Matching</h4>
                    <p className="po-card-desc">Instant candidate alerts based on your specific requirements.</p>
                  </div>
                </div>

                <div className="po-card">
                  <div className="po-card-icon">
                    <i className="fa-solid fa-bullseye"></i>
                  </div>
                  <div>
                    <h4 className="po-card-title">Verified Jobs</h4>
                    <p className="po-card-desc">Direct company listings to ensure safe and authentic opportunities.</p>
                  </div>
                </div>
              </div>

              <div className="po-avatars-wrapper">
                <img src="/assets/img/team-1.jpg" className="po-avatar" alt="User 1" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                <img src="/assets/img/team-2.jpg" className="po-avatar" alt="User 2" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                <img src="/assets/img/team-3.jpg" className="po-avatar" alt="User 3" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                <div className="po-avatar-count">10k+</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
`;

fs.writeFileSync('src/components/home/VideoBanner.tsx', code);
console.log('Successfully wrote VideoBanner.tsx');
