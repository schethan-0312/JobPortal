"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

interface PublicStats {
  totalJobs: number;
  totalCandidates: number;
  totalVerifiedEmployers: number;
  totalApplications: number;
}

export default function Footer2() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<PublicStats>("/stats", { auth: false });
        setStats(data);
      } catch {
        // stats are decorative — fail silently, section just won't render
      }
    })();
  }, []);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("submitting");
    setErrorMsg(null);
    try {
      await api.post("/newsletter/subscribe", { email }, { auth: false });
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <footer className="footer skin-light-footer">
      {/* Footer Top Start */}
      <div className="footer-top">
        <div className="container">
          <div className="row align-items-center justify-content-between">
            <div className="col-xl-5 col-lg-5 col-md-5">
              <div className="call-action-form rounded m-0">
                <form className="ms-0" onSubmit={handleSubscribe}>
                  <div className="newsltr-form gray-style">
                    <input 
                      type="email" 
                      className="form-control" 
                      placeholder="Enter Your email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={status === "submitting" || status === "success"}
                    />
                    <button 
                      type="submit" 
                      className="btn btn-subscribe"
                      disabled={status === "submitting" || status === "success"}
                    >
                      {status === "submitting" ? "..." : status === "success" ? "Subscribed!" : "Subscribe"}
                    </button>
                  </div>
                  {status === "success" && (
                    <p className="text-success mt-2 mb-0" style={{ fontSize: "14px" }}>
                      Thanks for subscribing!
                    </p>
                  )}
                  {status === "error" && (
                    <p className="text-danger mt-2 mb-0" style={{ fontSize: "14px" }}>
                      {errorMsg}
                    </p>
                  )}
                </form>
              </div>
            </div>

            {stats && (
              <div className="col-xl-7 col-lg-7 col-md-7">
                <div className="job-info-count-group lg-ctr">
                  <div className="single-jb-info-count">
                    <div className="jbs-y7">
                      <h5 className="ctr">{stats.totalJobs}</h5>
                    </div>
                    <div className="jbs-y5">
                      <p>Jobs Posted</p>
                    </div>
                  </div>
                  <div className="single-jb-info-count">
                    <div className="jbs-y7">
                      <h5 className="ctr">{stats.totalCandidates}</h5>
                    </div>
                    <div className="jbs-y5">
                      <p>Candidates</p>
                    </div>
                  </div>
                  <div className="single-jb-info-count">
                    <div className="jbs-y7">
                      <h5 className="ctr">{stats.totalApplications}</h5>
                    </div>
                    <div className="jbs-y5">
                      <p>Applications</p>
                    </div>
                  </div>
                  <div className="single-jb-info-count">
                    <div className="jbs-y7">
                      <h5 className="ctr">{stats.totalVerifiedEmployers}</h5>
                    </div>
                    <div className="jbs-y5">
                      <p>Verified Companies</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Footer Top End */}

      <div>
        <div className="container">
          <div className="row">
            <div className="col-lg-4 col-md-4">
              <div className="footer-widget">
                <img src="/assets/img/logo.png" className="img-footer" alt="JobStock" />
                <div className="footer-add">
                  <p>
                    4th Floor, Prestige Tech Park
                    <br />
                    Marathahalli, Bengaluru
                    <br />
                    Karnataka 560103, India
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-4">
              <div className="footer-widget">
                <h4 className="widget-title text-main">For Job Seekers</h4>
                <ul className="footer-menu">
                  <li>
                    <a href="/jobs">Browse Jobs</a>
                  </li>
                  <li>
                    <a href="/candidate-resume-scanner">Resume Scanner</a>
                  </li>
                  <li>
                    <a href="/candidate-career-navigator">Career Navigator</a>
                  </li>
                  <li>
                    <a href="/pricing">Pricing</a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="col-lg-2 col-md-4">
              <div className="footer-widget">
                <h4 className="widget-title text-main">For Employers</h4>
                <ul className="footer-menu">
                  <li>
                    <a href="/employer-submit-job">Post a Job</a>
                  </li>
                  <li>
                    <a href="/employers">Employer Directory</a>
                  </li>
                  <li>
                    <a href="/pricing">Pricing</a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="col-lg-2 col-md-6">
              <div className="footer-widget">
                <h4 className="widget-title text-main">Company</h4>
                <ul className="footer-menu">
                  <li>
                    <a href="/about-us">About Us</a>
                  </li>
                  <li>
                    <a href="/blog">Blog</a>
                  </li>
                  <li>
                    <a href="/contact">Contact Us</a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="col-lg-1 col-md-6">
              <div className="footer-widget">
                <h4 className="widget-title text-main">Support</h4>
                <ul className="footer-menu">
                  <li>
                    <a href="/help">Help</a>
                  </li>
                  <li>
                    <a href="/faq">FAQ</a>
                  </li>
                  <li>
                    <a href="/privacy">Privacy</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <div className="row align-items-center justify-content-center">
            <div className="col-xl-12 col-lg-12 col-md-12">
              <p className="mb-0 text-center">
                &copy; {new Date().getFullYear()} JobStock. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
