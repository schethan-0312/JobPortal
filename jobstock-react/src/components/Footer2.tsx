"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface PublicStats {
  totalJobs: number;
  totalCandidates: number;
  totalVerifiedEmployers: number;
  totalApplications: number;
}

export default function Footer2() {
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
    <footer className="footer skin-light-footer">
      {/* Footer Top Start */}
      <div className="footer-top">
        <div className="container">
          <div className="row align-items-center justify-content-between">
            <div className="col-xl-5 col-lg-5 col-md-5">
              <div className="call-action-form rounded m-0">
                <form className="ms-0">
                  <div className="newsltr-form gray-style">
                    <input type="text" className="form-control" placeholder="Enter Your email" />
                    <button type="button" className="btn btn-subscribe">
                      Subscribe
                    </button>
                  </div>
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
            <div className="col-lg-3 col-md-4">
              <div className="footer-widget">
                <img src="/assets/img/logo.png" className="img-footer" alt="JobStock" />
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
                <h4 className="widget-title text-main">For Clients</h4>
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
                <h4 className="widget-title text-main">Our Resources</h4>
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
                    <a href="#">Upwork Reviews</a>
                  </li>
                  <li>
                    <a href="#">Resources</a>
                  </li>
                  <li>
                    <a href="#">Help &amp; Support</a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="col-lg-2 col-md-6">
              <div className="footer-widget">
                <h4 className="widget-title text-main">The Company</h4>
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
                    <a href="#">Trust, Safety &amp; Security</a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="footer-widget">
                <h4 className="widget-title text-main">Download Apps</h4>
                <div className="app-wrap d-flex flex-column gap-3">
                  {/* Google Store */}
                  <div className="d-flex align-items-center border rounded-3 px-2 py-3 gap-2">
                    <div className="social-icon">
                      <svg width="55" height="55" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M15.0082 5.05202C15.5082 4.45202 15.9082 3.65207 16.0082 2.85207C16.1082 2.25207 15.5082 1.85202 15.0082 2.05202C14.2082 2.35202 13.5082 2.85205 12.9082 3.45205C12.4082 4.05205 12.0082 4.8521 11.9082 5.7521C11.9082 6.2521 12.4082 6.65205 12.8082 6.45205C13.7082 6.35205 14.5082 5.75202 15.0082 5.05202Z"
                          className="fill-main"
                        />
                        <path
                          opacity="0.3"
                          d="M18.4082 10.0519C18.8082 9.65195 18.8082 8.95195 18.3082 8.55195C17.6082 8.05195 16.8082 7.65195 15.9082 7.55195C14.6082 7.45195 13.5082 8.35199 12.2082 8.35199C11.0082 8.35199 10.1082 7.55195 8.70818 7.55195C7.30818 7.55195 5.80818 8.45197 4.80818 9.95197C3.50818 12.052 3.70818 15.952 5.90818 19.352C6.70818 20.552 7.70818 21.852 9.10818 21.952C10.3082 21.952 10.7082 21.152 12.3082 21.152C13.9082 21.152 14.3082 21.952 15.5082 21.952C16.9082 21.952 18.0082 20.452 18.7082 19.252C19.1082 18.652 19.3082 18.352 19.5082 17.852C19.7082 17.452 19.5082 16.852 19.1082 16.652C16.8082 15.052 16.5082 11.8519 18.4082 10.0519Z"
                          className="fill-main"
                        />
                      </svg>
                    </div>
                    <div className="social-caption">
                      <p className="text-uppercase footer-text m-0">Get it on</p>
                      <h5 className="text-dark m-0">Google Play</h5>
                    </div>
                  </div>

                  {/* IOS Store */}
                  <div className="d-flex align-items-center border rounded-3 px-2 py-3 gap-2">
                    <div className="social-icon">
                      <svg width="55" height="55" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M4.335 8.61499C3.98049 8.61579 3.64078 8.75725 3.39048 9.0083C3.14018 9.25935 2.99973 9.59947 3 9.95398V15.307C3 15.6611 3.14065 16.0006 3.39101 16.251C3.64138 16.5013 3.98094 16.642 4.335 16.642C4.68907 16.642 5.02863 16.5013 5.27899 16.251C5.52935 16.0006 5.67 15.6611 5.67 15.307V9.95398C5.67027 9.59947 5.52983 9.25935 5.27953 9.0083C5.02922 8.75725 4.68952 8.61579 4.335 8.61499ZM20.353 8.61499C19.9986 8.61579 19.659 8.75734 19.4088 9.00842C19.1587 9.25951 19.0185 9.59956 19.019 9.95398V15.307C19.0141 15.4853 19.045 15.6628 19.1099 15.829C19.1748 15.9952 19.2723 16.1467 19.3967 16.2745C19.5211 16.4024 19.6699 16.504 19.8342 16.5734C19.9985 16.6428 20.1751 16.6786 20.3535 16.6786C20.5319 16.6786 20.7085 16.6428 20.8728 16.5734C21.0371 16.504 21.1859 16.4024 21.3103 16.2745C21.4347 16.1467 21.5322 15.9952 21.5971 15.829C21.662 15.6628 21.6929 15.4853 21.688 15.307V9.95398C21.6883 9.59947 21.5478 9.25935 21.2975 9.0083C21.0472 8.75725 20.7075 8.61579 20.353 8.61499Z"
                          className="fill-main"
                        />
                        <path
                          d="M8.33899 18.062V20.662C8.33899 21.0161 8.47964 21.3556 8.73 21.606C8.98036 21.8563 9.31993 21.9969 9.67399 21.9969C10.0281 21.9969 10.3676 21.8563 10.618 21.606C10.8683 21.3556 11.009 21.0161 11.009 20.662V18.062H8.33899Z"
                          className="fill-main"
                        />
                        <path
                          opacity="0.3"
                          d="M16.344 18.062C16.6984 18.0615 17.0381 17.9202 17.2885 17.6693C17.5388 17.4184 17.6793 17.0784 17.679 16.724V8.69299H7.004V16.724C7.00373 17.0784 7.1442 17.4184 7.39454 17.6693C7.64487 17.9202 7.98458 18.0615 8.339 18.062H16.344Z"
                          fill="#6e8497"
                        />
                        <path
                          d="M13.679 18.062V20.662C13.679 21.0161 13.8196 21.3556 14.07 21.606C14.3204 21.8563 14.6599 21.9969 15.014 21.9969C15.368 21.9969 15.7076 21.8563 15.958 21.606C16.2083 21.3556 16.349 21.0161 16.349 20.662V18.062H13.679Z"
                          className="fill-main"
                        />
                        <path
                          d="M15.676 4.53889L16.864 3.09492C16.9209 3.02747 16.9639 2.94945 16.9904 2.8653C17.017 2.78115 17.0266 2.69257 17.0187 2.60468C17.0109 2.51679 16.9857 2.43131 16.9446 2.35322C16.9035 2.27512 16.8474 2.206 16.7794 2.14973C16.7115 2.09345 16.633 2.05112 16.5486 2.02534C16.4642 1.99955 16.3756 1.99079 16.2878 1.99946C16.2 2.00813 16.1147 2.03408 16.037 2.07587C15.9593 2.11767 15.8906 2.17451 15.835 2.24299L14.535 3.82099C13.8435 3.50074 13.0902 3.33617 12.3282 3.33893C11.5662 3.3417 10.8141 3.51173 10.125 3.83698L8.85999 2.2519C8.80503 2.18348 8.73714 2.1266 8.66018 2.08442C8.58322 2.04224 8.49871 2.01569 8.41147 2.00617C8.32423 1.99665 8.23597 2.00441 8.15173 2.029C8.06748 2.05359 7.98891 2.09452 7.92049 2.14948C7.85207 2.20444 7.79515 2.27235 7.75297 2.34931C7.71079 2.42627 7.68418 2.51073 7.67466 2.59797C7.66515 2.68521 7.6729 2.77349 7.69749 2.85773C7.72209 2.94198 7.76303 3.02052 7.81799 3.08893L8.98999 4.55793C8.37138 5.05535 7.87187 5.68486 7.52806 6.40034C7.18426 7.11581 7.00485 7.89915 7.00299 8.69294H17.684C17.6821 7.8943 17.5006 7.10632 17.1531 6.38727C16.8055 5.66823 16.3007 5.03648 15.676 4.53889ZM10.676 7.34699C10.4782 7.34699 10.2849 7.28829 10.1204 7.17841C9.95597 7.06853 9.8278 6.91241 9.75211 6.72968C9.67642 6.54696 9.65662 6.34578 9.69521 6.1518C9.73379 5.95782 9.82903 5.77969 9.96888 5.63984C10.1087 5.49998 10.2869 5.40474 10.4809 5.36616C10.6749 5.32757 10.8759 5.34735 11.0587 5.42304C11.2414 5.49873 11.3976 5.62688 11.5075 5.79133C11.6173 5.95578 11.676 6.14921 11.676 6.34699C11.676 6.61221 11.5706 6.86649 11.3831 7.05402C11.1956 7.24156 10.9412 7.34699 10.676 7.34699ZM14.005 7.34699C13.8072 7.34699 13.6139 7.28829 13.4494 7.17841C13.285 7.06853 13.1568 6.91241 13.0811 6.72968C13.0054 6.54696 12.9856 6.34578 13.0242 6.1518C13.0628 5.95782 13.158 5.77969 13.2979 5.63984C13.4377 5.49998 13.6159 5.40474 13.8099 5.36616C14.0039 5.32757 14.2049 5.34735 14.3877 5.42304C14.5704 5.49873 14.7266 5.62688 14.8365 5.79133C14.9463 5.95578 15.005 6.14921 15.005 6.34699C15.005 6.61221 14.8996 6.86649 14.7121 7.05402C14.5246 7.24156 14.2702 7.34699 14.005 7.34699Z"
                          className="fill-main"
                        />
                      </svg>
                    </div>
                    <div className="social-caption">
                      <p className="text-uppercase footer-text m-0">Get it on</p>
                      <h5 className="text-dark m-0">App Store</h5>
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
