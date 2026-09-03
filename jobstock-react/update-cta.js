const fs = require('fs');

const newCode = `"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function CallToAction() {
  const { user } = useAuth();

  const getStartedHref = user
    ? user.role === "EMPLOYER"
      ? "/employer-dashboard"
      : user.role === "ADMIN"
      ? "/admin-dashboard"
      : "/candidate-dashboard"
    : "/signup";

  return (
    <section className="py-5 position-relative" style={{ backgroundColor: "#ffffff" }}>
      <div className="container">
        <div
          className="rounded-4 p-4 p-md-5 position-relative overflow-hidden"
          style={{
            backgroundColor: "#205c56", /* Exact dark teal from screenshot */
            color: "#ffffff",
          }}
        >
          <div className="row align-items-center justify-content-between gy-4 position-relative" style={{ zIndex: 2 }}>
            {/* Left Side: Image with thick white outline */}
            <div className="col-lg-5 col-md-12 text-center">
              <div className="position-relative d-inline-block" style={{ maxWidth: "380px" }}>
                <div style={{
                  border: "8px solid #ffffff",
                  borderRadius: "35px",
                  padding: "0",
                  overflow: "hidden",
                  backgroundColor: "#ffffff",
                  display: "inline-block",
                  lineHeight: 0
                }}>
                  <div style={{
                    border: "4px solid #205c56",
                    borderRadius: "28px",
                    overflow: "hidden",
                    lineHeight: 0
                  }}>
                    <img
                      src="/assets/img/bn-1.png"
                      alt="Career Opportunities"
                      className="img-fluid w-100"
                      style={{
                        borderRadius: "24px",
                        maxHeight: "380px",
                        objectFit: "cover",
                      }}
                      onError={(e) => { (e.target).src = '/assets/img/team-1.jpg'; }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Content */}
            <div className="col-lg-6 col-md-12">
              <div className="ps-lg-3 pe-lg-4">
                <h2 className="fw-bold text-white mb-3" style={{ fontSize: '2.4rem', lineHeight: 1.25 }}>
                  Ready to Take the Next Step in Your Career or Hire Top Talent?
                </h2>

                <p className="fs-6 mb-4" style={{ color: '#a8c6c4', lineHeight: 1.6, fontSize: '1rem', fontWeight: 400 }}>
                  Whether you're searching for your dream role or hiring qualified professionals, JobStock connects talent with leading employers faster and smarter.
                </p>

                <ul className="list-unstyled mb-0">
                  <li className="d-flex align-items-center gap-3 mb-3">
                    <div style={{ width: '24px', height: '24px', backgroundColor: '#38a581', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="fa-solid fa-check text-white" style={{ fontSize: '11px' }}></i>
                    </div>
                    <span className="text-white" style={{ fontSize: '0.95rem' }}>Explore thousands of active, verified job openings</span>
                  </li>
                  <li className="d-flex align-items-center gap-3 mb-3">
                    <div style={{ width: '24px', height: '24px', backgroundColor: '#38a581', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="fa-solid fa-check text-white" style={{ fontSize: '11px' }}></i>
                    </div>
                    <span className="text-white" style={{ fontSize: '0.95rem' }}>AI-powered candidate shortlisting &amp; smart matching</span>
                  </li>
                  <li className="d-flex align-items-center gap-3 mb-3">
                    <div style={{ width: '24px', height: '24px', backgroundColor: '#38a581', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="fa-solid fa-check text-white" style={{ fontSize: '11px' }}></i>
                    </div>
                    <span className="text-white" style={{ fontSize: '0.95rem' }}>Instant notification alerts and 1-click application submission</span>
                  </li>
                </ul>

                {/* Two Action Buttons - Kept for functionality as requested */}
                <div className="d-flex flex-wrap gap-3 mt-4">
                  <Link
                    href="/jobs"
                    className="btn fw-semibold px-4 py-2 d-inline-flex align-items-center justify-content-center"
                    style={{
                      backgroundColor: "transparent",
                      color: "#ffffff",
                      border: "2px solid #a8c6c4",
                      borderRadius: "8px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    Browse Jobs
                  </Link>

                  <Link
                    href={getStartedHref}
                    className="btn fw-semibold px-4 py-2 d-inline-flex align-items-center justify-content-center"
                    style={{
                      backgroundColor: "#38a581",
                      color: "#ffffff",
                      border: "2px solid #38a581",
                      borderRadius: "8px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    Get Started Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
`;

fs.writeFileSync('src/components/home/CallToAction.tsx', newCode);
console.log('Successfully wrote CallToAction.tsx');
