"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, assetUrl } from "@/lib/api";

interface EmployerProfile {
  companyName: string;
  logoUrl: string | null;
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
}

export default function Navbar8() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showMobileNotifications, setShowMobileNotifications] = useState(false);
  const [showMobileAccountMenu, setShowMobileAccountMenu] = useState(false);

  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadProfile = () => {
      api
        .get<EmployerProfile>("/employers/me")
        .then(setProfile)
        .catch(() => setProfile(null));
    };

    loadProfile();
    window.addEventListener("profile-updated", loadProfile);

    api
      .get<NotificationItem[]>("/notifications")
      .then((data) => setNotifications(data.slice(0, 5)))
      .catch(() => setNotifications([]));
    api
      .get<number>("/messages/unread-count")
      .then(setUnreadMessages)
      .catch(() => setUnreadMessages(0));

    return () => {
      window.removeEventListener("profile-updated", loadProfile);
    };
  }, []);

  // Close menus on path change or click outside
  useEffect(() => {
    setIsMobileOpen(false);
    setOpenDropdown(null);
    setShowNotifications(false);
    setShowAccountMenu(false);
    setShowMobileNotifications(false);
    setShowMobileAccountMenu(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
        setShowAccountMenu(false);
        setShowMobileNotifications(false);
        setShowMobileAccountMenu(false);
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleLogout() {
    logout();
    router.push("/");
  }

  function handleBellClick(isMobile = false) {
    if (isMobile) {
      setShowMobileNotifications((prev) => !prev);
      setShowMobileAccountMenu(false);
    } else {
      setShowNotifications((prev) => !prev);
      setShowAccountMenu(false);
    }
    api
      .patch("/notifications/read-all")
      .then(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      })
      .catch((err) => console.error("Failed to mark notifications as read:", err));
  }

  const toggleDropdown = (name: string) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  const closeMobileNav = () => {
    setIsMobileOpen(false);
    setOpenDropdown(null);
  };

  const notificationListContent = (
    <>
      <div className="drp_menu_headr bg-main">
        <h4>Notifications</h4>
      </div>
      <div className="ntf-list-groups">
        {notifications.length === 0 && (
          <div className="ntf-list-groups-single">
            <div className="ntf-list-groups-caption">
              <p className="small mb-0">No notifications yet.</p>
            </div>
          </div>
        )}
        {notifications.map((n) => (
          <div className="ntf-list-groups-single" key={n.id}>
            <div className={`ntf-list-groups-icon ${n.isRead ? "text-muted" : "text-main"}`}>
              <i className="fa-solid fa-bell"></i>
            </div>
            <div className="ntf-list-groups-caption">
              <p className="small mb-0">
                <strong>{n.title}</strong> {n.body}
              </p>
            </div>
          </div>
        ))}
        <div className="ntf-list-groups-single">
          <Link href="/employer-dashboard" className="ntf-more" onClick={() => setShowNotifications(false)}>
            View All Notifications
          </Link>
        </div>
      </div>
    </>
  );

  const accountMenuContent = (
    <>
      <div className="drp_menu_headr bg-main">
        <h4>Hi, {profile?.companyName || "there"}</h4>
        <div className="drp_menu_headr-right">
          <button type="button" className="btn btn-whites" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
      <ul>
        <li>
          <Link href="/employer-dashboard" onClick={() => setShowAccountMenu(false)}>
            <i className="fa fa-tachometer-alt"></i>Dashboard
          </Link>
        </li>
        <li>
          <Link href="/employer-profile" onClick={() => setShowAccountMenu(false)}>
            <i className="fa fa-user-tie"></i>Company Profile
          </Link>
        </li>
        <li>
          <Link href="/employer-manage-jobs" onClick={() => setShowAccountMenu(false)}>
            <i className="fa-solid fa-briefcase"></i>Manage Jobs
          </Link>
        </li>
        <li>
          <Link href="/employer-shortlist-candidates" onClick={() => setShowAccountMenu(false)}>
            <i className="fa-solid fa-bookmark"></i>Shortlisted Candidates
          </Link>
        </li>
        <li>
          <Link href="/employer-messages" onClick={() => setShowAccountMenu(false)}>
            <i className="fa-envelope fa"></i>Messages
            {unreadMessages > 0 && <span className="notti_coun style-3">{unreadMessages}</span>}
          </Link>
        </li>
        <li>
          <Link href="/employer-delete-account" onClick={() => setShowAccountMenu(false)}>
            <i className="fa-solid fa-trash-can"></i>Delete Account
          </Link>
        </li>
      </ul>
    </>
  );

  return (
    <>
      <div className="header header-dark head-fixed" ref={navRef}>
        <div className="container-fluid">
          <nav id="navigation" className="navigation navigation-landscape">
            <div className="nav-header">
              <Link className="nav-brand" href="/" onClick={closeMobileNav}>
                <img src="/assets/img/logo-light.png" className="logo" alt="JobStock" />
              </Link>

              {/* Mobile Toggle Button */}
              <div
                className={`nav-toggle ${isMobileOpen ? "open" : ""}`}
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                style={{ cursor: "pointer" }}
              >
                <span></span>
                <span></span>
                <span></span>
              </div>

              {/* Mobile Quick Action Buttons */}
              <ul className="mobile_nav dhsbrd">
                <li className="d-none d-md-inline-block">
                  <Link
                    href="/employer-submit-job"
                    className="btn btn-order-by-filt bg-main text-white"
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      marginRight: "6px",
                      border: "none",
                      verticalAlign: "middle",
                    }}
                  >
                    <i className="bi bi-patch-check-fill me-1"></i>Post Job
                  </Link>
                </li>
                <li>
                  <div className="btn-group account-drop">
                    <button
                      type="button"
                      className="btn btn-order-by-filt"
                      aria-expanded={showMobileNotifications}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBellClick(true);
                      }}
                    >
                      <i className="fa-regular fa-bell"></i>
                      {notifications.filter((n) => !n.isRead).length > 0 && (
                        <span
                          className="noti-status"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "11px",
                            color: "white",
                            width: "16px",
                            height: "16px",
                            top: "4px",
                            right: "4px",
                            fontWeight: "bold",
                            borderRadius: "50%",
                            backgroundColor: "#f32b2b",
                          }}
                        >
                          {notifications.filter((n) => !n.isRead).length}
                        </span>
                      )}
                    </button>
                    <div
                      className={`dropdown-menu pull-right animated flipInX ${
                        showMobileNotifications ? "show" : ""
                      }`}
                      style={{ display: showMobileNotifications ? "block" : "none" }}
                    >
                      {notificationListContent}
                    </div>
                  </div>
                </li>
                <li>
                  <div className="btn-group account-drop">
                    <button
                      type="button"
                      className="btn btn-order-by-filt"
                      aria-expanded={showMobileAccountMenu}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMobileAccountMenu(!showMobileAccountMenu);
                        setShowMobileNotifications(false);
                      }}
                    >
                      {profile?.logoUrl ? (
                        <img
                          src={assetUrl(profile.logoUrl!)}
                          className="img-fluid circle"
                          alt=""
                        />
                      ) : (
                        <div
                          className="img-fluid circle d-flex align-items-center justify-content-center bg-light text-muted fw-semibold"
                          style={{ width: "35px", height: "35px", borderRadius: "50%" }}
                        >
                          <span style={{ fontSize: "9px" }}>Upload</span>
                        </div>
                      )}
                    </button>
                    <div
                      className={`dropdown-menu pull-right animated flipInX ${
                        showMobileAccountMenu ? "show" : ""
                      }`}
                      style={{ display: showMobileAccountMenu ? "block" : "none" }}
                    >
                      {accountMenuContent}
                    </div>
                  </div>
                </li>
              </ul>
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

            {/* Nav Menu Wrapper */}
            <div className={`nav-menus-wrapper ${isMobileOpen ? "nav-menus-wrapper-open show" : ""}`}>
              <ul className="nav-menu">
                <li>
                  <Link href="/" className="sub-menu-item" onClick={closeMobileNav}>
                    Home
                  </Link>
                </li>

                {/* Candidates Dropdown */}
                <li
                  className={`parent-parent-menu-item ${
                    openDropdown === "candidates" ? "active" : ""
                  }`}
                  onMouseEnter={() => setOpenDropdown("candidates")}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
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
                    style={{
                      display: openDropdown === "candidates" ? "block" : undefined,
                    }}
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

                {/* Companies Link */}
                <li>
                  <Link href="/employers" className="sub-menu-item" onClick={closeMobileNav}>
                    Companies
                  </Link>
                </li>

                {/* Pages Dropdown */}
                <li
                  className={`parent-parent-menu-item ${
                    openDropdown === "pages" ? "active" : ""
                  }`}
                  onMouseEnter={() => setOpenDropdown("pages")}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
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
                    style={{
                      display: openDropdown === "pages" ? "block" : undefined,
                    }}
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
                        Terms &amp; Privacy
                      </Link>
                    </li>
                    <li>
                      <Link href="/faq" className="sub-menu-item" onClick={closeMobileNav}>
                        FAQ&apos;s
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

                <li className="d-lg-none">
                  <Link
                    href="/employer-submit-job"
                    className="sub-menu-item text-main fw-bold"
                    onClick={closeMobileNav}
                  >
                    <i className="bi bi-patch-check-fill me-2"></i>Post Your Job
                  </Link>
                </li>
              </ul>

              {/* Right Menu (Desktop) */}
              <ul className="nav-menu nav-menu-social align-to-right dhsbrd">
                <li>
                  <div className="btn-group account-drop">
                    <button
                      type="button"
                      className="btn btn-order-by-filt"
                      aria-expanded={showNotifications}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBellClick(false);
                      }}
                    >
                      <i className="fa-regular fa-bell"></i>
                      {notifications.filter((n) => !n.isRead).length > 0 && (
                        <span
                          className="noti-status"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "11px",
                            color: "white",
                            width: "16px",
                            height: "16px",
                            top: "4px",
                            right: "4px",
                            fontWeight: "bold",
                            borderRadius: "50%",
                            backgroundColor: "#f32b2b",
                          }}
                        >
                          {notifications.filter((n) => !n.isRead).length}
                        </span>
                      )}
                    </button>
                    <div
                      className={`dropdown-menu pull-right animated flipInX ${
                        showNotifications ? "show" : ""
                      }`}
                      style={{ display: showNotifications ? "block" : "none" }}
                    >
                      {notificationListContent}
                    </div>
                  </div>
                </li>
                <li>
                  <div className="btn-group account-drop">
                    <button
                      type="button"
                      className="btn btn-order-by-filt"
                      aria-expanded={showAccountMenu}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAccountMenu(!showAccountMenu);
                        setShowNotifications(false);
                      }}
                    >
                      {profile?.logoUrl ? (
                        <img
                          src={assetUrl(profile.logoUrl!)}
                          className="img-fluid circle"
                          alt=""
                        />
                      ) : (
                        <div
                          className="img-fluid circle d-flex align-items-center justify-content-center bg-light text-muted fw-semibold"
                          style={{ width: "35px", height: "35px", borderRadius: "50%" }}
                        >
                          <span style={{ fontSize: "9px" }}>Upload</span>
                        </div>
                      )}
                    </button>
                    <div
                      className={`dropdown-menu pull-right animated flipInX ${
                        showAccountMenu ? "show" : ""
                      }`}
                      style={{ display: showAccountMenu ? "block" : "none" }}
                    >
                      {accountMenuContent}
                    </div>
                  </div>
                </li>
                <li className="list-buttons ms-2">
                  <Link href="/employer-submit-job">
                    <i className="bi bi-patch-check-fill me-2"></i>Post Your Job
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      </div>
      <div className="clearfix"></div>

      <style jsx global>{`
        @media (min-width: 992px) {
          .nav-menu > li.parent-parent-menu-item:hover > .nav-dropdown,
          .nav-menu > li.parent-menu-item:hover > .nav-dropdown {
            display: block !important;
            opacity: 1 !important;
            visibility: visible !important;
          }
        }
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
