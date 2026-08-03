import Link from "next/link";
import AuthMenu from "./AuthMenu";

export default function Navbar6() {
  return (
    <>
      <div className="header header-dark head-fixed">
        <div className="container-fluid">
          <nav id="navigation" className="navigation navigation-landscape">
            <div className="nav-header">
              <Link className="nav-brand" href="/">
                <img src="/assets/img/logo-light.png" className="logo" alt="JobStock" />
              </Link>
              <div className="nav-toggle"></div>
              <div className="mobile_nav">
                <ul>
                  <li className="list-buttons">
                    <a href="#" data-bs-toggle="modal" data-bs-target="#login">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path opacity="0.3" d="M22 12C22 17.5 17.5 22 12 22C6.5 22 2 17.5 2 12C2 6.5 6.5 2 12 2C17.5 2 22 6.5 22 12ZM12 7C10.3 7 9 8.3 9 10C9 11.7 10.3 13 12 13C13.7 13 15 11.7 15 10C15 8.3 13.7 7 12 7Z" className="fill-white" />
                        <path d="M12 22C14.6 22 17 21 18.7 19.4C17.9 16.9 15.2 15 12 15C8.8 15 6.09999 16.9 5.29999 19.4C6.99999 21 9.4 22 12 22Z" className="fill-white" />
                      </svg>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="nav-menus-wrapper">
              <ul className="nav-menu">
                <li className="parent-parent-menu-item">
                  <a href="#" className="home-link">
                    Home<span className="submenu-indicator"></span>
                  </a>
                  <ul className="nav-dropdown nav-submenu">
                    <li>
                      <Link href="/" className="sub-menu-item">
                        Home
                      </Link>
                    </li>
                  </ul>
                </li>

                <li className="parent-parent-menu-item">
                  <a href="#" className="home-link">
                    For Candidate<span className="submenu-indicator"></span>
                  </a>
                  <ul className="nav-dropdown nav-submenu">
                    <li className="parent-menu-item">
                      <a href="#">
                        Browse Jobs<span className="submenu-indicator"></span>
                      </a>
                      <ul className="nav-dropdown nav-submenu">
                        <li>
                          <Link href="/jobs" className="sub-menu-item">
                            Jobs
                          </Link>
                        </li>
                        <li>
                          <Link href="/jobs/list" className="sub-menu-item">
                            Job List
                          </Link>
                        </li>
                      </ul>
                    </li>
                    <li className="parent-menu-item">
                      <a href="#">
                        Browse Candidate<span className="submenu-indicator"></span>
                      </a>
                      <ul className="nav-dropdown nav-submenu">
                        <li>
                          <Link href="/candidates" className="sub-menu-item">
                            Candidates
                          </Link>
                        </li>
                      </ul>
                    </li>
                    <li>
                      <Link href="/candidate-dashboard" className="sub-menu-item">
                        Candidate Dashboard
                      </Link>
                    </li>
                  </ul>
                </li>

                <li className="parent-parent-menu-item">
                  <a href="#" className="home-link">
                    For Employer<span className="submenu-indicator"></span>
                  </a>
                  <ul className="nav-dropdown nav-submenu">
                    <li className="parent-menu-item">
                      <a href="#">
                        Explore Employers<span className="submenu-indicator"></span>
                      </a>
                      <ul className="nav-dropdown nav-submenu">
                        <li>
                          <Link href="/employers" className="sub-menu-item">
                            Employers
                          </Link>
                        </li>
                      </ul>
                    </li>
                    <li>
                      <Link href="/employer-dashboard" className="sub-menu-item">
                        Employer Dashboard
                      </Link>
                    </li>
                  </ul>
                </li>

                <li className="parent-parent-menu-item">
                  <a href="#" className="home-link">
                    Pages<span className="submenu-indicator"></span>
                  </a>
                  <ul className="nav-dropdown nav-submenu">
                    <li>
                      <Link href="/about-us" className="sub-menu-item">
                        About Us
                      </Link>
                    </li>
                    <li>
                      <Link href="/blog" className="sub-menu-item">
                        Blogs Page
                      </Link>
                    </li>
                    <li>
                      <Link href="/privacy" className="sub-menu-item">
                        Terms &amp; Privacy
                      </Link>
                    </li>
                    <li>
                      <Link href="/faq" className="sub-menu-item">
                        FAQ&apos;s
                      </Link>
                    </li>
                    <li>
                      <Link href="/contact" className="sub-menu-item">
                        Contacts
                      </Link>
                    </li>
                  </ul>
                </li>

                <li>
                  <Link href="/help" className="sub-menu-item">
                    Help
                  </Link>
                </li>
              </ul>

              <AuthMenu />
            </div>
          </nav>
        </div>
      </div>
      <div className="clearfix"></div>
    </>
  );
}
