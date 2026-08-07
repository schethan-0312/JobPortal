"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const { logout } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    api
      .get<EmployerProfile>("/employers/me")
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
          <Link href="/employer-dashboard" className="ntf-more">
            View All Notifications
          </Link>
        </div>
      </div>
    </div>
  );

  const accountMenu = (
    <div className="dropdown-menu pull-right animated flipInX">
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
          <Link href="/employer-dashboard">
            <i className="fa fa-tachometer-alt"></i>Dashboard
          </Link>
        </li>
        <li>
          <Link href="/employer-profile">
            <i className="fa fa-user-tie"></i>My Profile
          </Link>
        </li>
        <li>
          <Link href="/employer-jobs">
            <i className="fa fa-file"></i>My Jobs
          </Link>
        </li>
        <li>
          <Link href="/employer-shortlist-candidates">
            <i className="fa-solid fa-bookmark"></i>Shortlisted Candidates
          </Link>
        </li>
        <li>
          <Link href="/employer-messages">
            <i className="fa fa-envelope"></i>Messages
            {unreadMessages > 0 && <span className="notti_coun style-3">{unreadMessages}</span>}
          </Link>
        </li>
        <li>
          <Link href="/employer-change-password">
            <i className="fa fa-unlock-alt"></i>Change Password
          </Link>
        </li>
        <li>
          <Link href="/employer-delete-account">
            <i className="fa-solid fa-trash-can"></i>Delete Account
          </Link>
        </li>
      </ul>
    </div>
  );

  return (
    <>
      <div className="header header-light head-fixed">
        <div className="container-fluid">
          <nav id="navigation" className="navigation navigation-landscape">
            <div className="nav-header">
              <Link className="nav-brand" href="/">
                <img src="/assets/img/logo.png" className="logo" alt="JobStock" />
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
                      <img src={assetUrl(profile?.logoUrl) || "/assets/img/l-12.png"} className="img-fluid circle" alt="" />
                    </button>
                    {accountMenu}
                  </div>
                </li>
              </ul>
            </div>
            <div className="nav-menus-wrapper">
              <ul className="nav-menu">
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
                      <img src={assetUrl(profile?.logoUrl) || "/assets/img/l-12.png"} className="img-fluid circle" alt="" />
                    </button>
                    {accountMenu}
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
    </>
  );
}
