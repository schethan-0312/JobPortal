"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface DirectoryEmployer {
  id: string;
  companyName: string;
  status: string;
  email: string;
  signupDate: string;
  jobsPostedCount: number;
  activeSubscription: string | null;
  totalSpendPaisa: number;
}

interface DirectoryResponse {
  items: DirectoryEmployer[];
  total: number;
  page: number;
  pageSize: number;
}

function formatMoney(paisa: number) {
  return `₹${(paisa / 100).toLocaleString("en-IN")}`;
}

export default function AdminEmployerDirectoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<DirectoryResponse | null>(null);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    (async () => {
      setError(null);
      try {
        const params = new URLSearchParams();
        if (status) params.set("status", status);
        if (search) params.set("search", search);
        const res = await api.get<DirectoryResponse>(`/admin/employer-management?${params.toString()}`);
        setData(res);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load employers");
      }
    })();
  }, [user, status, search]);

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="employer-directory" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Employer Directory</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Employer Directory</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="card">
              <div className="card-header d-flex flex-wrap gap-2 justify-content-between align-items-center">
                <h6 className="mb-0">All Employers ({data?.total ?? 0})</h6>
                <div className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search company..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <select className="form-control form-control-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">All statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="INFO_REQUESTED">Info Requested</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="card-body">
                {!data && <p className="text-muted">Loading...</p>}
                {data && data.items.length === 0 && <p className="text-muted">No employers match these filters.</p>}
                {data && data.items.length > 0 && (
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th>Company</th>
                          <th>Status</th>
                          <th>Jobs posted</th>
                          <th>Subscription</th>
                          <th>Total spend</th>
                          <th>Signed up</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.map((e) => (
                          <tr
                            key={e.id}
                            style={{ cursor: "pointer" }}
                            onClick={() => router.push(`/admin-employer-directory/${e.id}`)}
                          >
                            <td className="small fw-medium">{e.companyName}</td>
                            <td>
                              <span
                                className={`badge ${
                                  e.status === "VERIFIED"
                                    ? "bg-success"
                                    : e.status === "REJECTED"
                                      ? "bg-danger"
                                      : e.status === "INFO_REQUESTED"
                                        ? "bg-info"
                                        : "bg-warning"
                                }`}
                              >
                                {e.status}
                              </span>
                            </td>
                            <td className="small">{e.jobsPostedCount}</td>
                            <td className="small">{e.activeSubscription ?? "—"}</td>
                            <td className="small">{formatMoney(e.totalSpendPaisa)}</td>
                            <td className="small text-muted">{new Date(e.signupDate).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-12">
              <div className="py-3 text-center">
                &copy; {new Date().getFullYear()} JobStock. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
