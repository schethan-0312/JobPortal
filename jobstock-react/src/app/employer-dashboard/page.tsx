"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar8 from "@/components/Navbar8";
import EmployerSidebar from "@/components/employer-dashboard/EmployerSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { Toaster, toast } from "react-hot-toast";

interface Notification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

interface EmployerJob {
  id: string;
  title: string;
  slug: string;
  status: string;
  location: string;
  createdAt: string;
  _count?: { applications: number };
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default function EmployerDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== "EMPLOYER")) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "EMPLOYER") return;
    (async () => {
      setDataLoading(true);
      try {
        const [notifs, myJobs] = await Promise.all([
          api.get<Notification[]>("/notifications"),
          api.get<EmployerJob[]>("/jobs/mine"),
        ]);
        setNotifications(notifs.slice(0, 5));
        setJobs(myJobs.slice(0, 10));
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to load dashboard data");
      } finally {
        setDataLoading(false);
      }
    })();
  }, [user]);

  if (loading || !user || user.role !== "EMPLOYER") {
    return null;
  }

  const activeJobs = jobs.filter((j) => j.status === "OPEN").length;
  const totalApplicants = jobs.reduce((sum, j) => sum + (j._count?.applications || 0), 0);

  const ctrs = [
    { icon: "fa-solid fa-business-time", class: "success", number: String(jobs.length), title: "Posted jobs" },
    { icon: "fa-solid fa-bookmark", class: "warning", number: String(activeJobs), title: "Active Jobs" },
    { icon: "fa-solid fa-user-clock", class: "danger", number: String(totalApplicants), title: "Applicants" },
    { icon: "fa-sharp fa-solid fa-comments", class: "info", number: String(notifications.length), title: "Notifications" },
  ];

  return (
    <>
      <Navbar8 />
      <Toaster 
        position="top-center" 
        containerStyle={{
          top: '100px',
        }}
        toastOptions={{
          style: {
            padding: '16px 24px',
            fontSize: '1.1rem',
            fontWeight: '500',
            maxWidth: '600px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
          },
        }}
      />
      <div className="dashboard-wrap bg-light">
        <EmployerSidebar active="dashboard" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Employer Dashboard</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted">
                      <a href="#">Employer</a>
                    </li>
                    <li className="breadcrumb-item text-muted">
                      <a href="#">Dashboard</a>
                    </li>
                    <li className="breadcrumb-item">
                      <a href="#" className="text-main">
                        Employer Dashboard
                      </a>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {/* Stats Row */}
            <div className="row align-items-center gx-4 gy-4 mb-4">
              {ctrs.map((item) => (
                <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6" key={item.title}>
                  <div className="dash-wrap-bloud">
                    <div className="dash-wrap-bloud-icon">
                      <div className={`bloud-icon text-${item.class} bg-${item.class} bg-opacity-05`}>
                        <i className={item.icon}></i>
                      </div>
                    </div>
                    <div className="dash-wrap-bloud-caption">
                      <div className="dash-wrap-bloud-content">
                        <h5 className="ctr">{item.number}</h5>
                        <p>{item.title}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Overview and Notifications Row */}
            <div className="row gx-4 gy-4 mb-4">
              <div className="col-xl-8 col-lg-12 col-md-12 col-sm-12">
                <div className="card d-none d-lg-block">
                  <div className="card-header">
                    <h4 className="mb-0">Overview</h4>
                  </div>
                  <div className="card-body">
                    <p className="text-muted">
                      You have posted {jobs.length} job{jobs.length !== 1 ? "s" : ""}, {activeJobs} currently active, with {totalApplicants} total applicants.
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-xl-4 col-lg-12 col-md-12 col-sm-12">
                <div className="card">
                  <div className="card-header">
                    <h4>Notifications</h4>
                  </div>

                  <div className="ground-list ground-list-hove">
                    {dataLoading && <p className="p-3 text-muted">Loading...</p>}
                    {!dataLoading && notifications.length === 0 && <p className="p-3 text-muted">No notifications yet.</p>}
                    {notifications.map((n) => (
                      <div className="ground ground-single-list" key={n.id}>
                        <a href="JavaScript:Void(0);">
                          <div className={`btn-circle-40 text-${n.isRead ? "info" : "warning"} bg-${n.isRead ? "info" : "warning"} bg-opacity-05`}>
                            <i className="fas fa-bell"></i>
                          </div>
                        </a>
                        <div className="ground-content">
                          <h6>
                            <a href="JavaScript:Void(0);">{n.title}</a>
                          </h6>
                          <span className="small">{timeAgo(n.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Posted Jobs */}
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0">Recent Posted Jobs</h6>
                  </div>
                  <div className="card-body">
                    {dataLoading && <p className="text-muted">Loading...</p>}
                    {!dataLoading && jobs.length === 0 && <p className="text-muted">You haven&apos;t posted any jobs yet.</p>}
                    <div className="row justify-content-start gx-3 gy-4">
                      {jobs.map((item) => (
                        <div className="col-xl-12 col-lg-12 col-md-12" key={item.id}>
                          <div className="jbs-list-box border">
                            <div className="jbs-list-head">
                              <div className="jbs-list-head-thunner">
                                <div className="jbs-list-emp-thumb jbs-verified">
                                  <a href={`/job-detail/${item.slug}`}>
                                    <figure>
                                      <img src="/assets/img/l-1.png" className="img-fluid" alt="" />
                                    </figure>
                                  </a>
                                </div>
                                <div className="jbs-list-job-caption">
                                  <div className="jbs-job-title-wrap">
                                    <h4>
                                      <a href={`/job-detail/${item.slug}`} className="jbs-job-title">
                                        {item.title}
                                      </a>
                                    </h4>
                                  </div>
                                </div>
                              </div>
                              <div className="jbs-list-applied-users">
                                <span className={`text-sm-muted text-light bg-${item.status === "OPEN" ? "green" : "red"} label`}>
                                  {item._count?.applications ?? 0} Applicants
                                </span>
                              </div>
                              <div className="jbs-list-postedinfo">
                                <p className="m-0 text-sm-muted">
                                  <strong>Posted:</strong>
                                  <span className="text-success">{new Date(item.createdAt).toLocaleDateString()}</span>
                                </p>
                                <p className="m-0 text-sm-muted">
                                  <strong>Status:</strong>
                                  <span className={item.status === "OPEN" ? "text-success" : "text-danger"}>{item.status}</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
