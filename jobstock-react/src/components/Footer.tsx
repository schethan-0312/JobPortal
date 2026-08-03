"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface PublicStats {
  totalJobs: number;
  totalCandidates: number;
  totalVerifiedEmployers: number;
  totalApplications: number;
}

export default function Footer() {
  const [stats, setStats] = useState<PublicStats | null>(null);

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

  return (
    <footer className="footer skin-dark-footer">
      <div>
        <div className="container">
          <div className="row">
            <div className="col-lg-4 col-md-4">
              <div className="footer-widget">
                <img src="/assets/img/logo-light.png" className="img-footer" alt="JobStock" />
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
                <h4 className="widget-title">For Job Seekers</h4>
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
                <h4 className="widget-title">For Employers</h4>
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
                <h4 className="widget-title">Company</h4>
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
                <h4 className="widget-title">Support</h4>
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
          <div className="row align-items-center justify-content-between">
            <div className="col-xl-4 col-lg-5 col-md-5">
              <p className="mb-0">
                &copy; {new Date().getFullYear()} JobStock. Built with{" "}
                <i className="mdi mdi-heart text-danger"></i>
              </p>
            </div>

            {stats && (
              <div className="col-xl-8 col-lg-7 col-md-7 overflow-hidden">
                <div className="job-info-count-group">
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
    </footer>
  );
}
