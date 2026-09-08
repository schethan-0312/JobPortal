"use client";

import Link from "next/link";
import AuthMenu from "./AuthMenu";
import { useAuth } from "@/lib/auth-context";

export default function Navbar() {
  const { user } = useAuth();

  return (
    <>
      <div className="header header-transparent change-logo">
        <div className="container">
          <nav id="navigation" className="navigation navigation-landscape">
            <div className="nav-header">
              <Link className="nav-brand d-inline-flex align-items-center gap-2 text-decoration-none" href="/">
                <div style={{ width: "36px", height: "36px", overflow: "hidden", position: "relative", flexShrink: 0 }}>
                  <img src="/assets/img/logo.png" alt="Nockree" style={{ height: "36px", width: "auto", position: "absolute", left: 0, top: 0 }} />
                </div>
                <span style={{ color: "#0b8260", fontWeight: 800, fontSize: "1.45rem", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                  Nockree
                </span>
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
                  {!user ? (
                    <a href="#!" className="sub-menu-item" data-bs-toggle="modal" data-bs-target="#login">
                      Candidates
                    </a>
                  ) : (
                    <Link href="/candidates" className="sub-menu-item">
                      Candidates
                    </Link>
                  )}
                </li>
                <li>
                  {!user ? (
                    <a href="#!" className="sub-menu-item" data-bs-toggle="modal" data-bs-target="#login">
                      Employers
                    </a>
                  ) : (
                    <Link href="/employers" className="sub-menu-item">
                      Employers
                    </Link>
                  )}
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

