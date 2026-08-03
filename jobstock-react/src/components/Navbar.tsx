import Link from "next/link";
import AuthMenu from "./AuthMenu";

export default function Navbar() {
  return (
    <>
      <div className="header header-transparent change-logo">
        <div className="container">
          <nav id="navigation" className="navigation navigation-landscape">
            <div className="nav-header">
              <Link className="nav-brand static-logo" href="/">
                <img src="/assets/img/logo-light.png" className="logo" alt="JobStock" />
              </Link>
              <Link className="nav-brand fixed-logo" href="/">
                <img src="/assets/img/logo.png" className="logo" alt="JobStock" />
              </Link>
              <div className="nav-toggle"></div>
            </div>
            <div className="nav-menus-wrapper">
              <ul className="nav-menu">
                <li>
                  <Link href="/" className="sub-menu-item">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/jobs" className="sub-menu-item">
                    Jobs
                  </Link>
                </li>
                <li>
                  <Link href="/candidates" className="sub-menu-item">
                    Candidates
                  </Link>
                </li>
                <li>
                  <Link href="/employers" className="sub-menu-item">
                    Browse Companies
                  </Link>
                </li>
                <li>
                  <Link href="/signup?role=EMPLOYER" className="sub-menu-item">
                    Post a Job
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="sub-menu-item">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="sub-menu-item">
                    Contact
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
