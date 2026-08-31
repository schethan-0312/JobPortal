"use client";

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
          className="rounded-4 p-4 p-md-5 position-relative overflow-hidden shadow-lg"
          style={{
            background: "linear-gradient(135deg, #0b292a 0%, #145758 70%, #1a6b6c 100%)",
            color: "#ffffff",
          }}
        >
          {/* Subtle background circle decoration */}
          <div
            className="position-absolute"
            style={{
              bottom: "-80px",
              right: "-80px",
              width: "300px",
              height: "300px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(93, 240, 194, 0.15) 0%, rgba(20, 87, 88, 0) 70%)",
              pointerEvents: "none",
            }}
          />

          <div className="row align-items-center justify-content-between gy-4 position-relative" style={{ zIndex: 2 }}>
            {/* Left Side: Image */}
            <div className="col-lg-5 col-md-12 text-center text-lg-start">
              <div className="position-relative d-inline-block w-100" style={{ maxWidth: "420px" }}>
                <img
                  src="/assets/img/bn-1.png"
                  alt="JobStock Career Opportunities"
                  className="img-fluid rounded-4 shadow-sm w-100"
                  style={{
                    maxHeight: "360px",
                    objectFit: "cover",
                    border: "3px solid rgba(255, 255, 255, 0.2)",
                  }}
                />
                <div
                  className="position-absolute bottom-0 start-0 m-3 p-3 rounded-3 shadow-lg text-start d-none d-sm-block"
                  style={{
                    backgroundColor: "rgba(11, 41, 42, 0.9)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(93, 240, 194, 0.3)",
                  }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: "36px", height: "36px", backgroundColor: "#5df0c2", color: "#0b292a" }}
                    >
                      <i className="fa-solid fa-check fw-bold"></i>
                    </div>
                    <div>
                      <h6 className="mb-0 text-white fw-bold small">Verified Employers</h6>
                      <small className="text-white-50" style={{ fontSize: "0.75rem" }}>
                        100% Trusted Job Listings
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Content */}
            <div className="col-lg-6 col-md-12">
              <div className="ps-lg-2">
                <span
                  className="badge px-3 py-2 mb-3 rounded-pill fw-semibold text-uppercase"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    color: "#5df0c2",
                    border: "1px solid rgba(93, 240, 194, 0.3)",
                    fontSize: "0.8rem",
                    letterSpacing: "1px",
                  }}
                >
                  Join JobStock Today
                </span>

                <h2 className="cta-title fw-bold text-white mb-3" style={{ lineHeight: 1.25 }}>
                  Ready to Take the Next Step in Your Career or Hire Top Talent?
                </h2>

                <p className="fs-6 text-white-50 mb-4" style={{ lineHeight: 1.6 }}>
                  Whether you&apos;re searching for your dream role or hiring qualified professionals, JobStock connects talent with leading employers faster and smarter.
                </p>

                <ul className="list-unstyled mb-4">
                  <li className="d-flex align-items-center gap-2 mb-2">
                    <i className="fa-solid fa-circle-check fs-5" style={{ color: "#5df0c2" }}></i>
                    <span className="text-white">Explore thousands of active, verified job openings</span>
                  </li>
                  <li className="d-flex align-items-center gap-2 mb-2">
                    <i className="fa-solid fa-circle-check fs-5" style={{ color: "#5df0c2" }}></i>
                    <span className="text-white">AI-powered candidate shortlisting &amp; smart matching</span>
                  </li>
                  <li className="d-flex align-items-center gap-2 mb-2">
                    <i className="fa-solid fa-circle-check fs-5" style={{ color: "#5df0c2" }}></i>
                    <span className="text-white">Instant notification alerts and 1-click application submission</span>
                  </li>
                </ul>

                {/* Two Action Buttons */}
                <div className="d-flex flex-wrap gap-3 mt-4">
                  <Link
                    href="/jobs"
                    className="btn btn-lg fw-semibold px-4 py-3 shadow-sm d-inline-flex align-items-center justify-content-center cta-btn"
                    style={{
                      backgroundColor: "#ffffff",
                      color: "#145758",
                      border: "none",
                      borderRadius: "8px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <i className="fa-solid fa-magnifying-glass me-2"></i>Browse Jobs
                  </Link>

                  <Link
                    href={getStartedHref}
                    className="btn btn-lg fw-semibold px-4 py-3 shadow-sm d-inline-flex align-items-center justify-content-center cta-btn"
                    style={{
                      backgroundColor: "#5df0c2",
                      color: "#0b292a",
                      border: "none",
                      borderRadius: "8px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <i className="fa-solid fa-rocket me-2"></i>Get Started Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .cta-title {
          font-size: clamp(1.4rem, 3.5vw, 2.2rem);
        }
        @media (max-width: 576px) {
          .cta-btn {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}
