"use client";

import { useState } from "react";
import Link from "next/link";
import AuthMenu from "./AuthMenu";
import { useAuth } from "@/lib/auth-context";

export default function Navbar5() {
  const { user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const closeMobileNav = () => {
    setIsMobileOpen(false);
    setOpenDropdown(null);
  };

  return (
    <>
      <div className="header header-dark head-fixed" style={{ backgroundColor: "#64b1b3" }}>
        <div className="container">
          <nav id="navigation" className="navigation navigation-landscape">
            <div className="nav-header">
              <Link className="nav-brand" href="/" onClick={closeMobileNav}>
                <img src="/assets/img/logo-light.png" className="logo" alt="JobStock" />
              </Link>
              <div
                className={`nav-toggle ${isMobileOpen ? "open" : ""}`}
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                style={{ cursor: "pointer" }}
              >
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="mobile_nav">
                <ul>
                  <li className="list-buttons">
                    <a href="#!" data-bs-toggle="modal" data-bs-target="#login">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path opacity="0.3" d="M22 12C22 17.5 17.5 22 12 22C6.5 22 2 17.5 2 12C2 6.5 6.5 2 12 2C17.5 2 22 6.5 22 12ZM12 7C10.3 7 9 8.3 9 10C9 11.7 10.3 13 12 13C13.7 13 15 11.7 15 10C15 8.3 13.7 7 12 7Z" className="fill-main" />
                        <path d="M12 22C14.6 22 17 21 18.7 19.4C17.9 16.9 15.2 15 12 15C8.8 15 6.09999 16.9 5.29999 19.4C6.99999 21 9.4 22 12 22Z" className="fill-main" />
                      </svg>
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Mobile Backdrop */}
            {isMobileOpen && (
              <div
                className="nav-backdrop d-lg-none"
                onClick={closeMobileNav}
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100vw",
                  height: "100vh",
                  backgroundColor: "rgba(0,0,0,0.5)",
                  zIndex: 1040,
                }}
              />
            )}

            <div className={`nav-menus-wrapper ${isMobileOpen ? "nav-menus-wrapper-open show" : ""}`}>
              <ul className="nav-menu">
                <li>
                  <Link href="/" className="sub-menu-item" onClick={closeMobileNav}>
                    Home
                  </Link>
                </li>

                <li className={`parent-parent-menu-item ${openDropdown === "candidates" ? "active" : ""}`}>
                  <a
                    href="#!"
                    className="home-link d-flex justify-content-between align-items-center"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleDropdown("candidates");
                    }}
                  >
                    Candidates <span className="submenu-indicator"><span className="submenu-indicator-chevron"></span></span>
                  </a>
                  <ul
                    className="nav-dropdown nav-submenu"
                    style={{ display: openDropdown === "candidates" ? "block" : undefined }}
                  >
                    <li>
                      <Link href="/jobs" className="sub-menu-item" onClick={closeMobileNav}>
                        View Jobs
                      </Link>
                    </li>
                    <li>
                      <Link href="/candidates" className="sub-menu-item" onClick={closeMobileNav}>
                        View Candidates
                      </Link>
                    </li>
                  </ul>
                </li>

                <li>
                  <Link href="/employers" className="sub-menu-item" onClick={closeMobileNav}>
                    Companies
                  </Link>
                </li>

                <li className={`parent-parent-menu-item ${openDropdown === "pages" ? "active" : ""}`}>
                  <a
                    href="#!"
                    className="home-link d-flex justify-content-between align-items-center"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleDropdown("pages");
                    }}
                  >
                    Pages <span className="submenu-indicator"><span className="submenu-indicator-chevron"></span></span>
                  </a>
                  <ul
                    className="nav-dropdown nav-submenu"
                    style={{ display: openDropdown === "pages" ? "block" : undefined }}
                  >
                    <li>
                      <Link href="/about-us" className="sub-menu-item" onClick={closeMobileNav}>
                        About Us
                      </Link>
                    </li>
                    <li>
                      <Link href="/blog" className="sub-menu-item" onClick={closeMobileNav}>
                        Blogs Page
                      </Link>
                    </li>
                    <li>
                      <Link href="/privacy" className="sub-menu-item" onClick={closeMobileNav}>
                        Privacy and Policies
                      </Link>
                    </li>
                    <li>
                      <Link href="/terms" className="sub-menu-item" onClick={closeMobileNav}>
                        Terms and Condition
                      </Link>
                    </li>
                    <li>
                      <Link href="/faq" className="sub-menu-item" onClick={closeMobileNav}>
                        FAQ's
                      </Link>
                    </li>
                    <li>
                      <Link href="/contact" className="sub-menu-item" onClick={closeMobileNav}>
                        Contacts
                      </Link>
                    </li>
                    <li>
                      <Link href="/help" className="sub-menu-item" onClick={closeMobileNav}>
                        Help
                      </Link>
                    </li>
                  </ul>
                </li>
              </ul>

              <AuthMenu />
            </div>
          </nav>
        </div>
      </div>
      <div className="clearfix"></div>

      <style jsx global>{`
        @media (max-width: 991px) {
          .nav-menus-wrapper {
            position: fixed !important;
            top: 0 !important;
            left: -300px !important;
            width: 290px !important;
            height: 100vh !important;
            background-color: #ffffff !important;
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.2) !important;
            transition: left 0.3s ease !important;
            overflow-y: auto !important;
            z-index: 1050 !important;
            display: block !important;
            visibility: hidden !important;
          }
          .nav-menus-wrapper.nav-menus-wrapper-open,
          .nav-menus-wrapper.show {
            left: 0 !important;
            visibility: visible !important;
          }
          .nav-menus-wrapper .nav-menu {
            padding: 20px 10px !important;
          }
          .nav-menus-wrapper .nav-menu > li > a {
            color: #1e293b !important;
            padding: 12px 16px !important;
            display: flex !important;
            border-bottom: 1px solid #f1f5f9 !important;
          }
          .nav-menus-wrapper .nav-dropdown {
            background-color: #f8fafc !important;
            padding-left: 15px !important;
            box-shadow: none !important;
          }
          .nav-menus-wrapper .nav-dropdown > li > a {
            color: #475569 !important;
            padding: 10px 14px !important;
            font-size: 0.9rem !important;
          }
        }
      `}</style>
    </>
  );
}
