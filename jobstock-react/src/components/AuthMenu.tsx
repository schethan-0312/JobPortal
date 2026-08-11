"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function AuthMenu() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <ul className="nav-menu nav-menu-social align-to-right">
        <li>
          <a href="#!" data-bs-toggle="modal" data-bs-target="#login">
            <i className="fas fa-sign-in-alt me-2"></i>Sign In
          </a>
        </li>
        <li className="list-buttons ms-2">
          <Link
            href="/signup"
            style={{
              backgroundColor: "#37a481",
              color: "#0e3b3c",
              borderColor: "rgb(93, 240, 194)",
              fontWeight: 600,
            }}
          >
            <i className="bi bi-person-circle me-2"></i>Register Today
          </Link>
        </li>
      </ul>
    );
  }

  const dashboardHref =
    user.role === "CANDIDATE"
      ? "/candidate-dashboard"
      : user.role === "EMPLOYER"
        ? "/employer-dashboard"
        : user.role === "ADMIN"
          ? "/admin-dashboard"
          : "/";

  function handleLogout() {
    logout();
    router.push("/");
  }

  const showDashboard = pathname !== "/candidate-dashboard";

  return (
    <ul className="nav-menu nav-menu-social align-to-right">
      {showDashboard && (
        <li>
          <Link href={dashboardHref}>
            <i className="fas fa-user me-2"></i>Dashboard
          </Link>
        </li>
      )}
      <li className="list-buttons ms-2">
        <a href="#!" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right me-2"></i>Logout
        </a>
      </li>
    </ul>
  );
}
