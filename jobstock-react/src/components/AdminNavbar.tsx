"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function AdminNavbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/");
  }

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
            </div>
            <div className="nav-menus-wrapper">
              <ul className="nav-menu">
                <li className="parent-parent-menu-item">
                  <Link href="/" className="home-link">
                    Home
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
                      style={{ padding: "8px 12px" }}
                    >
                      {user?.profilePhotoUrl ? (
                        <img src={user.profilePhotoUrl.startsWith('http') ? user.profilePhotoUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}`.replace('/api', '') + user.profilePhotoUrl} style={{width:'28px', height:'28px', borderRadius:'50%', objectFit:'cover'}} alt="Profile" />
                      ) : (
                        <i className="fa-solid fa-user-shield"></i>
                      )}
                    </button>
                    <div className="dropdown-menu pull-right animated flipInX">
                      <div className="drp_menu_headr bg-main">
                        <h4>Hi, {user?.email ?? "Admin"}</h4>
                        <div className="drp_menu_headr-right">
                          <button type="button" className="btn btn-whites" onClick={handleLogout}>
                            Logout
                          </button>
                        </div>
                      </div>
                      <ul>
                        <li>
                          <Link href="/admin-dashboard" className="sub-menu-item">
                            <i className="fa fa-tachometer-alt"></i>Dashboard
                          </Link>
                        </li>
                        <li>
                          <Link href="/admin-employers" className="sub-menu-item">
                            <i className="fa-solid fa-user-check"></i>Verify Employers
                          </Link>
                        </li>
                        <li>
                          <Link href="/admin-reports" className="sub-menu-item">
                            <i className="fa-solid fa-flag"></i>Reports
                          </Link>
                        </li>
                        <li>
                          <Link href="/admin-profile" className="sub-menu-item">
                            <i className="fa-solid fa-user-pen"></i>My Profile
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
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
