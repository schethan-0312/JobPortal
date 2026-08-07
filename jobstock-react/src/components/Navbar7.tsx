"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, assetUrl } from "@/lib/api";

interface CandidateProfile {
  fullName: string;
  profilePhotoUrl: string | null;
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
}

export default function Navbar7() {
  const { logout } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    api
      .get<CandidateProfile>("/candidates/me")
      .then(setProfile)
      .catch(() => setProfile(null));
    api
      .get<NotificationItem[]>("/notifications")
      .then((data) => setNotifications(data.slice(0, 5)))
      .catch(() => setNotifications([]));
    api
      .get<number>("/messages/unread-count")
      .then(setUnreadMessages)
      .catch(() => setUnreadMessages(0));
  }, []);

  function handleLogout() {
    logout();
    router.push("/");
  }

  const notificationList = (
    <div className="dropdown-menu pull-right animated flipInX">
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
          <Link href="/candidate-dashboard" className="ntf-more">
            View All Notifications
          </Link>
        </div>
      </div>
    </div>
  );

  const accountMenu = (
    <div className="dropdown-menu pull-right animated flipInX">
      <div className="drp_menu_headr bg-main">
        <h4>Hi, {profile?.fullName || "there"}</h4>
        <div className="drp_menu_headr-right">
          <button type="button" className="btn btn-whites" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
      <ul>
        <li>
          <Link href="/candidate-dashboard">
            <i className="fa fa-tachometer-alt"></i>Dashboard
          </Link>
        </li>
        <li>
          <Link href="/candidate-profile">
            <i className="fa fa-user-tie"></i>My Profile
          </Link>
        </li>
        <li>
          <Link href="/candidate-resume">
            <i className="fa fa-file"></i>My Resume
          </Link>
        </li>
        <li>
          <Link href="/candidate-saved-jobs">
            <i className="fa-solid fa-bookmark"></i>Saved Resume
          </Link>
        </li>
        <li>
          <Link href="/candidate-messages">
            <i className="fa fa-envelope"></i>Messages
            {unreadMessages > 0 && <span className="notti_coun style-3">{unreadMessages}</span>}
          </Link>
        </li>
        <li>
          <Link href="/candidate-change-password">
            <i className="fa fa-unlock-alt"></i>Change Password
          </Link>
        </li>
        <li>
          <Link href="/candidate-delete-account">
            <i className="fa-solid fa-trash-can"></i>Delete Account
          </Link>
        </li>
      </ul>
    </div>
  );

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
              <ul className="mobile_nav dhsbrd">
                <li>
                  <div className="btn-group account-drop">
                    <button
                      type="button"
                      className="btn btn-order-by-filt"
                      data-bs-toggle="dropdown"
                      aria-haspopup="true"
                      aria-expanded="false"
                    >
                      <i className="fa-regular fa-comments"></i>
                      <span className="noti-status"></span>
                    </button>
                    {notificationList}
                  </div>
                </li>
                <li>
                  <div className="btn-group account-drop">
                    <button
                      type="button"
                      className="btn btn-order-by-filt"
                      data-bs-toggle="dropdown"
                      aria-haspopup="true"
                      aria-expanded="false"
                    >
                      <img src={assetUrl(profile?.profilePhotoUrl) || "/assets/img/avatar.jpg"} className="img-fluid circle" alt="" />
                    </button>
                    {accountMenu}
                  </div>
                </li>
              </ul>
            </div>
            <div className="nav-menus-wrapper">
              <ul className="nav-menu">
                <li className="parent-parent-menu-item">
                  <a href="#!" className="home-link">
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
                  <a href="#!" className="home-link">
                    For Candidate<span className="submenu-indicator"></span>
                  </a>
                  <ul className="nav-dropdown nav-submenu">
                    <li className="parent-menu-item">
                      <a href="#!">
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
                      <a href="#!">
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
                  <a href="#!" className="home-link">
                    For Employer<span className="submenu-indicator"></span>
                  </a>
                  <ul className="nav-dropdown nav-submenu">
                    <li className="parent-menu-item">
                      <a href="#!">
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
                  <a href="#!" className="home-link">
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

              <ul className="nav-menu nav-menu-social align-to-right dhsbrd">
                <li>
                  <div className="btn-group account-drop">
                    <button
                      type="button"
                      className="btn btn-order-by-filt"
                      data-bs-toggle="dropdown"
                      aria-haspopup="true"
                      aria-expanded="false"
                    >
                      <i className="fa-regular fa-comments"></i>
                      <span className="noti-status"></span>
                    </button>
                    {notificationList}
                  </div>
                </li>
                <li>
                  <div className="btn-group account-drop">
                    <button
                      type="button"
                      className="btn btn-order-by-filt"
                      data-bs-toggle="dropdown"
                      aria-haspopup="true"
                      aria-expanded="false"
                    >
                      <img src={assetUrl(profile?.profilePhotoUrl) || "/assets/img/user-5.png"} className="img-fluid circle" alt="" />
                    </button>
                    {accountMenu}
                  </div>
                </li>
                <li className="list-buttons ms-2">
                  <a href="#!" data-bs-toggle="modal" data-bs-target="#uploadresume">
                    <i className="bi bi-plus-circle-dotted me-2"></i>Upload Resume
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      </div>
      <div className="clearfix"></div>
    </>
  );
}
