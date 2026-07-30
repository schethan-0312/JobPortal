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
            <div className="col-lg-3 col-md-4">
              <div className="footer-widget">
                <img src="/assets/img/logo-light.png" className="img-footer" alt="JobStock" />
                <div className="footer-add">
                  <p>
                    Collins Street West, Victoria Near Bank Road
                    <br />
                    Australia QHR12456.
                  </p>
                </div>
                <div className="foot-socials">
                  <ul>
                    <li>
                      <a href="#">
                        <i className="fa-brands fa-facebook"></i>
                      </a>
                    </li>
                    <li>
                      <a href="#">
                        <i className="fa-brands fa-linkedin"></i>
                      </a>
                    </li>
                    <li>
                      <a href="#">
                        <i className="fa-brands fa-google-plus"></i>
                      </a>
                    </li>
                    <li>
                      <a href="#">
                        <i className="fa-brands fa-twitter"></i>
                      </a>
                    </li>
                    <li>
                      <a href="#">
                        <i className="fa-brands fa-dribbble"></i>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-lg-2 col-md-4">
              <div className="footer-widget">
                <h4 className="widget-title">For Clients</h4>
                <ul className="footer-menu">
                  <li>
                    <a href="#">Talent Marketplace</a>
                  </li>
                  <li>
                    <a href="#">Payroll Services</a>
                  </li>
                  <li>
                    <a href="#">Direct Contracts</a>
                  </li>
                  <li>
                    <a href="#">Hire Worldwide</a>
                  </li>
                  <li>
                    <a href="#">Hire in the USA</a>
                  </li>
                  <li>
                    <a href="#">How to Hire</a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="col-lg-2 col-md-4">
              <div className="footer-widget">
                <h4 className="widget-title">Our Resources</h4>
                <ul className="footer-menu">
                  <li>
                    <a href="#">Free Business tools</a>
                  </li>
                  <li>
                    <a href="#">Affiliate Program</a>
                  </li>
                  <li>
                    <a href="#">Success Stories</a>
                  </li>
                  <li>
                    <a href="#">Reviews</a>
                  </li>
                  <li>
                    <a href="#">Resources</a>
                  </li>
                  <li>
                    <a href="#">Help & Support</a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="col-lg-2 col-md-6">
              <div className="footer-widget">
                <h4 className="widget-title">The Company</h4>
                <ul className="footer-menu">
                  <li>
                    <a href="#">About Us</a>
                  </li>
                  <li>
                    <a href="#">Leadership</a>
                  </li>
                  <li>
                    <a href="#">Contact Us</a>
                  </li>
                  <li>
                    <a href="#">Investor Relations</a>
                  </li>
                  <li>
                    <a href="#">Trust, Safety & Security</a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="footer-widget">
                <h4 className="widget-title">Download Apps</h4>
                <div className="app-wrap d-flex flex-column gap-3">
                  <div className="d-flex align-items-center bg-transparent rounded-3 px-2 py-3 gap-2">
                    <div className="social-caption">
                      <p className="text-uppercase text-light opacity-75 m-0">Get it on</p>
                      <h5 className="text-light m-0">Google Play</h5>
                    </div>
                  </div>
                  <div className="d-flex align-items-center bg-transparent rounded-3 px-2 py-3 gap-2">
                    <div className="social-caption">
                      <p className="text-uppercase text-light opacity-75 m-0">Get it on</p>
                      <h5 className="text-light m-0">App Store</h5>
                    </div>
                  </div>
                </div>
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
