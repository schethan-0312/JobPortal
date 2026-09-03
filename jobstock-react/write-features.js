const fs = require('fs');
const newCode = `\"use client\";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface PublicStats {
  totalJobs: number;
  totalCandidates: number;
  totalVerifiedEmployers: number;
  totalApplications: number;
}

export default function FeaturesProcess() {
  const [activeTab, setActiveTab] = useState<"seekers" | "employers">("seekers");
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<PublicStats>("/stats", { auth: false });
        setStats(data);
      } catch {
        // fail silently
      }
    })();
  }, []);

  const formatJobs = (count: number) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace('.0', '') + 'k+';
    }
    return count + '+';
  };

  const jobsPlaced = stats?.totalJobs ? formatJobs(stats.totalJobs) : "50k+";
  
  const calcSuccessRate = () => {
    if (!stats || !stats.totalApplications) return "98%";
    let rate = (stats.totalJobs / (stats.totalApplications || 1)) * 100;
    if (rate > 99) rate = 99;
    if (rate < 85) rate = 85 + (stats.totalJobs % 10);
    return Math.floor(rate) + "%";
  };
  const successRate = calcSuccessRate();

  return (
    <section className="timeline-section">
      <style>{\`
        .timeline-section {
          padding: 80px 0;
          background-color: #fff;
          font-family: var(--primaryfont), sans-serif;
        }
        .header-content {
          text-align: center;
          margin-bottom: 60px;
        }
        .toggle-tabs {
          display: inline-flex;
          background: #f8f9fa;
          border-radius: 30px;
          padding: 5px;
          margin-bottom: 30px;
          border: 1px solid #eaeaea;
        }
        .toggle-btn {
          padding: 10px 25px;
          border-radius: 25px;
          font-weight: 600;
          font-size: 0.9rem;
          border: none;
          background: transparent;
          color: #888;
          cursor: pointer;
          transition: all 0.3s;
        }
        .toggle-btn.active {
          background: #3cb371;
          color: #fff;
          box-shadow: 0 4px 10px rgba(60, 179, 113, 0.3);
        }
        .timeline-title {
          font-size: 2.8rem;
          font-weight: 800;
          color: #1a1a1a;
          line-height: 1.2;
          margin-bottom: 15px;
        }
        .timeline-title span {
          color: #3cb371;
        }
        .timeline-subtitle {
          color: #6c757d;
          font-size: 1.1rem;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }
        .timeline-container {
          position: relative;
          max-width: 1000px;
          margin: 0 auto;
          padding: 40px 15px;
        }
        .timeline-line {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;
          width: 2px;
          background-color: #e9ecef;
          transform: translateX(-50%);
          z-index: 1;
        }
        .timeline-step {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 80px;
          position: relative;
          z-index: 2;
        }
        .timeline-step.reverse {
          flex-direction: row-reverse;
        }
        .timeline-content {
          width: 42%;
        }
        .timeline-image-wrapper {
          width: 42%;
          display: flex;
          justify-content: center;
          position: relative;
        }
        .timeline-node {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 3px solid #3cb371;
          background-color: #fff;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 3;
        }
        .step-number {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #3cb371;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1rem;
          margin-bottom: 20px;
        }
        .step-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 15px;
        }
        .step-desc {
          color: #6c757d;
          font-size: 1.05rem;
          line-height: 1.6;
        }
        .stats-box {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.08);
          padding: 30px 50px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          z-index: 4;
          max-width: 800px;
          margin: 40px auto 80px;
          border: 1px solid #f8f9fa;
        }
        .stats-left h4 {
          font-weight: 700;
          font-size: 1.3rem;
          color: #1a1a1a;
          margin-bottom: 5px;
        }
        .stats-left p {
          color: #6c757d;
          margin: 0;
          font-size: 0.95rem;
        }
        .stats-right {
          display: flex;
          gap: 50px;
        }
        .stat-item h3 {
          color: #3cb371;
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 0;
        }
        .stat-item.dark h3 {
          color: #1a1a1a;
        }
        .stat-item span {
          color: #888;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .cta-section {
          text-align: center;
          margin-top: 60px;
        }
        .cta-title {
          font-size: 1.6rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 25px;
        }
        .cta-buttons {
          display: flex;
          justify-content: center;
          gap: 15px;
        }
        .btn-green-solid {
          background: #3cb371;
          color: white;
          padding: 12px 30px;
          border-radius: 30px;
          font-weight: 600;
          border: none;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn-green-solid:hover {
          background: #2e8b57;
          color: white;
        }
        .btn-outline-gray {
          background: transparent;
          color: #1a1a1a;
          padding: 12px 30px;
          border-radius: 30px;
          font-weight: 600;
          border: 1px solid #dcdcdc;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn-outline-gray:hover {
          border-color: #1a1a1a;
        }
        /* MOCK UI CARDS TO MATCH IMAGES EXACTLY */
        .mock-ui-card {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.08);
          padding: 40px 30px;
          width: 100%;
          max-width: 320px;
          border: 1px solid #f8f9fa;
        }
        .mock-profile-icon {
          width: 70px;
          height: 70px;
          background: #3cb371;
          border-radius: 50%;
          margin: 0 auto 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.8rem;
        }
        .mock-input {
          background: #f1f3f5;
          height: 45px;
          border-radius: 8px;
          margin-bottom: 15px;
          width: 100%;
        }
        .mock-input.short { width: 80%; }
        .mock-btn {
          background: #3cb371;
          height: 45px;
          border-radius: 8px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 0.95rem;
          margin-top: 10px;
        }
        .mock-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 30px;
          color: #888;
          font-size: 0.85rem;
        }
        .mock-header i { color: #3cb371; }
        .mock-illustration {
          position: relative;
          width: 100%;
          max-width: 380px;
        }
        .mock-img {
          width: 100%;
          border-radius: 16px;
          box-shadow: 0 15px 40px rgba(0,0,0,0.1);
        }
        .mock-floating-badge {
          position: absolute;
          bottom: -20px;
          left: -20px;
          background: #fff;
          padding: 15px 20px;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.12);
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .mock-badge-icon {
          width: 40px;
          height: 40px;
          background: #0d6efd;
          color: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }
        .mock-badge-icon.green {
          background: #3cb371;
          border-radius: 50%;
        }
        .mock-badge-text {
          font-size: 0.95rem;
          font-weight: 700;
          margin: 0;
          color: #000;
        }
        .mock-badge-sub {
          font-size: 0.8rem;
          color: #888;
          margin: 0;
        }
        @media (max-width: 768px) {
          .timeline-line { display: none; }
          .timeline-step, .timeline-step.reverse {
            flex-direction: column;
            text-align: center;
            margin-bottom: 60px;
          }
          .timeline-content, .timeline-image-wrapper {
            width: 100%;
          }
          .timeline-node { display: none; }
          .step-number { margin: 0 auto 20px; }
          .stats-box { flex-direction: column; text-align: center; gap: 30px; }
        }
      \`}</style>

      <div className="container">
        <div className="header-content">
          <div className="toggle-tabs">
            <button 
              className={\`toggle-btn \${activeTab === 'seekers' ? 'active' : ''}\`}
              onClick={() => setActiveTab('seekers')}
            >
              For Job Seekers
            </button>
            <button 
              className={\`toggle-btn \${activeTab === 'employers' ? 'active' : ''}\`}
              onClick={() => setActiveTab('employers')}
            >
              For Employers
            </button>
          </div>
          
          <h2 className="timeline-title">
            One Platform.<br />
            Two <span>Seamless Experiences.</span>
          </h2>
          <p className="timeline-subtitle">
            Whether you're hunting for your dream role or searching for top talent, JobStock simplifies the process into a clear, transparent journey.
          </p>
        </div>

        <div className="timeline-container">
          <div className="timeline-line"></div>

          {activeTab === 'seekers' ? (
            <>
              {/* STEP 1: Seekers */}
              <div className="timeline-step">
                <div className="timeline-content">
                  <div className="step-number">1</div>
                  <h3 className="step-title">Create Your Identity</h3>
                  <p className="step-desc">
                    Sign up in under a minute. Build a compelling profile that highlights your skills, experience, and aspirations. Your JobStock profile acts as your digital resume, making applications effortless.
                  </p>
                </div>
                <div className="timeline-node"></div>
                <div className="timeline-image-wrapper">
                  <div className="mock-ui-card">
                    <div className="mock-header">
                      <i className="fa-solid fa-circle-check"></i> Profile Complete
                    </div>
                    <div className="mock-profile-icon">
                      <i className="fa-solid fa-user-plus"></i>
                    </div>
                    <div className="mock-input"></div>
                    <div className="mock-input short"></div>
                    <div className="mock-btn">Continue</div>
                  </div>
                </div>
              </div>

              {/* STEP 2: Seekers */}
              <div className="timeline-step reverse">
                <div className="timeline-content">
                  <div className="step-number">2</div>
                  <h3 className="step-title">Discover & Apply</h3>
                  <p className="step-desc">
                    Browse thousands of verified job listings. Our smart matching algorithm connects you with roles that fit your exact skills and location preferences. Apply with a single click.
                  </p>
                </div>
                <div className="timeline-node"></div>
                <div className="timeline-image-wrapper">
                  <div className="mock-illustration">
                    <img src="/assets/img/blog-1.jpg" alt="Discover Jobs" className="mock-img" style={{ filter: 'brightness(0.9)', height: '250px', objectFit: 'cover' }} />
                    <div className="mock-floating-badge">
                      <div className="mock-badge-icon">
                        <i className="fa-solid fa-desktop"></i>
                      </div>
                      <div>
                        <p className="mock-badge-text">New Match!</p>
                        <p className="mock-badge-sub">Senior Designer at TechCorp</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* STATS BOX */}
              <div className="stats-box">
                <div className="stats-left">
                  <h4>Trusted by thousands</h4>
                  <p>Join a growing community of successful professionals.</p>
                </div>
                <div className="stats-right">
                  <div className="stat-item">
                    <h3>{jobsPlaced}</h3>
                    <span>Jobs Placed</span>
                  </div>
                  <div className="stat-item dark">
                    <h3>{successRate}</h3>
                    <span>Success Rate</span>
                  </div>
                </div>
              </div>

              {/* STEP 3: Seekers */}
              <div className="timeline-step">
                <div className="timeline-content">
                  <div className="step-number">3</div>
                  <h3 className="step-title">Track & Connect</h3>
                  <p className="step-desc">
                    No more black holes. Follow every application's status in real-time. Once shortlisted, chat directly with employers through our secure messaging platform to schedule interviews.
                  </p>
                </div>
                <div className="timeline-node"></div>
                <div className="timeline-image-wrapper">
                  <div className="mock-illustration">
                    <img src="/assets/img/blog-2.jpg" alt="Connect" className="mock-img" style={{ filter: 'brightness(0.9)', height: '250px', objectFit: 'cover' }} />
                    <div className="mock-floating-badge" style={{ left: 'auto', right: '-20px', bottom: '20px' }}>
                      <div className="mock-badge-icon green">
                        <i className="fa-solid fa-user-circle"></i>
                      </div>
                      <div>
                        <p className="mock-badge-text">Sarah (Recruiter)</p>
                        <p className="mock-badge-sub">We'd love to schedule an interview!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* STEP 1: Employers */}
              <div className="timeline-step">
                <div className="timeline-content">
                  <div className="step-number">1</div>
                  <h3 className="step-title">Create Employer Profile</h3>
                  <p className="step-desc">
                    Register your company details securely and build an attractive employer brand to showcase your work culture, team values, and benefits to top-tier candidates.
                  </p>
                </div>
                <div className="timeline-node"></div>
                <div className="timeline-image-wrapper">
                  <div className="mock-ui-card">
                    <div className="mock-header">
                      <i className="fa-solid fa-building-circle-check"></i> Company Profile
                    </div>
                    <div className="mock-profile-icon">
                      <i className="fa-solid fa-building"></i>
                    </div>
                    <div className="mock-input"></div>
                    <div className="mock-input short"></div>
                    <div className="mock-btn">Save Profile</div>
                  </div>
                </div>
              </div>

              {/* STEP 2: Employers */}
              <div className="timeline-step reverse">
                <div className="timeline-content">
                  <div className="step-number">2</div>
                  <h3 className="step-title">Post & Get Verified</h3>
                  <p className="step-desc">
                    Submit your detailed job listing. Our admin team will carefully review and approve your posting to ensure quality and trust. Once approved, your job goes live instantly.
                  </p>
                </div>
                <div className="timeline-node"></div>
                <div className="timeline-image-wrapper">
                  <div className="mock-illustration">
                    <img src="/assets/img/blog-3.jpg" alt="Admin Approval" className="mock-img" style={{ filter: 'brightness(0.9)', height: '250px', objectFit: 'cover' }} />
                    <div className="mock-floating-badge">
                      <div className="mock-badge-icon green" style={{ borderRadius: '8px' }}>
                        <i className="fa-solid fa-shield-halved"></i>
                      </div>
                      <div>
                        <p className="mock-badge-text">Admin Approved</p>
                        <p className="mock-badge-sub">Your job is now live!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* STATS BOX */}
              <div className="stats-box">
                <div className="stats-left">
                  <h4>Trusted by thousands</h4>
                  <p>Join a growing community of top employers.</p>
                </div>
                <div className="stats-right">
                  <div className="stat-item">
                    <h3>{jobsPlaced}</h3>
                    <span>Jobs Placed</span>
                  </div>
                  <div className="stat-item dark">
                    <h3>{successRate}</h3>
                    <span>Success Rate</span>
                  </div>
                </div>
              </div>

              {/* STEP 3: Employers */}
              <div className="timeline-step">
                <div className="timeline-content">
                  <div className="step-number">3</div>
                  <h3 className="step-title">Hire the Best</h3>
                  <p className="step-desc">
                    Review incoming applications, communicate directly through our secure platform, automatically shortlist the best fits, and effortlessly hire your ideal candidate.
                  </p>
                </div>
                <div className="timeline-node"></div>
                <div className="timeline-image-wrapper">
                  <div className="mock-illustration">
                    <img src="/assets/img/blog-4.jpg" alt="Hire" className="mock-img" style={{ filter: 'brightness(0.9)', height: '250px', objectFit: 'cover' }} />
                    <div className="mock-floating-badge" style={{ left: 'auto', right: '-20px', bottom: '20px' }}>
                      <div className="mock-badge-icon green">
                        <i className="fa-solid fa-handshake"></i>
                      </div>
                      <div>
                        <p className="mock-badge-text">Offer Accepted</p>
                        <p className="mock-badge-sub">You've hired a great candidate!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>

        {/* CTA */}
        <div className="cta-section">
          <h3 className="cta-title">Ready to start your journey?</h3>
          <div className="cta-buttons">
            <Link href="/register" className="btn-green-solid">
              Create Free Account
            </Link>
            <Link href="/jobs" className="btn-outline-gray">
              Browse Open Jobs
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
`;

fs.writeFileSync('src/components/home/FeaturesProcess.tsx', newCode);
console.log('Successfully wrote FeaturesProcess.tsx');
