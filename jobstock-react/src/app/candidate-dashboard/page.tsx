"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar7 from "@/components/Navbar7";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
import UploadResumeModal from "@/components/candidate-dashboard/UploadResumeModal";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl } from "@/lib/api";
import { Toaster, toast } from "react-hot-toast";

interface Notification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

interface Application {
  id: string;
  jobId: string;
  status: string;
  appliedAt: string;
  job: {
    id: string;
    title: string;
    slug: string;
    location: string;
    employer: { companyName: string; logoUrl: string | null };
  };
}

interface JobMatch {
  matchScore: number;
  matchReasons: string[];
  job: {
    id: string;
    title: string;
    slug: string;
    location?: string;
    employer?: { companyName: string };
  };
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

export default function CandidateDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [recommended, setRecommended] = useState<JobMatch[] | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  
  useEffect(() => {
    if (!loading && (!user || user.role !== "CANDIDATE")) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "CANDIDATE") return;
    (async () => {
      setDataLoading(true);
      try {
        const [notifs, apps] = await Promise.all([
          api.get<Notification[]>("/notifications"),
          api.get<Application[]>("/applications/mine"),
        ]);
        setNotifications(notifs.slice(0, 5));
        setApplications(apps.slice(0, 10));
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to load dashboard data");
      } finally {
        setDataLoading(false);
      }
    })();

    // Independent of the main dashboard load — a candidate with an incomplete
    // profile (no headline/skills yet) gets a 400 here, which shouldn't block
    // the rest of the dashboard from rendering. Fails silently to an empty list.
    api
      .get<JobMatch[]>("/smart-match/jobs")
      .then((data) => setRecommended(data.slice(0, 3)))
      .catch(() => setRecommended([]));
  }, [user]);

  if (loading || !user || user.role !== "CANDIDATE") {
    return null;
  }

  const appliedCount = applications.length;
  const shortlistedCount = applications.filter((a) => a.status === "SHORTLISTED" || a.status === "INTERVIEW" || a.status === "OFFERED").length;

  const ctrs = [
    { icon: "fa-solid fa-business-time", class: "success", title: "Applied jobs", number: String(appliedCount) },
    { icon: "fa-solid fa-bookmark", class: "warning", title: "Shortlisted", number: String(shortlistedCount) },
    { icon: "fa-solid fa-eye", class: "danger", title: "Notifications", number: String(notifications.length) },
    { icon: "fa-sharp fa-solid fa-comments", class: "info", title: "Total Applications", number: String(appliedCount) },
  ];

  return (
    <>
      <Navbar7 />
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
        <CandidateSidebar active="dashboard" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-5">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Candidate Dashboard</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Candidate</a></li>
                    <li className="breadcrumb-item text-muted"><a href="#">Dashboard</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Candidate Statistics</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">

            
            {/* Row Start */}
            <div className="row align-items-center gx-4 gy-4 mb-4">
              {ctrs.map((item, i) => (
                <div className="col-12 col-xl-3 col-lg-6 col-md-6 col-sm-6" key={i}>
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
            {/* Row End */}

            {/* Row Start */}
            <div className="row gx-4 gy-4 mb-4">
              <div className="col-12 col-xl-8 col-lg-12 col-md-12 col-sm-12">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">Recommended For You</h4>
                    <a href="/candidate-smart-match" className="small">
                      View all matches
                    </a>
                  </div>
                  <div className="card-body">
                    {recommended === null && <p className="text-muted mb-0">Finding jobs that fit your profile...</p>}
                    {recommended !== null && recommended.length === 0 && (
                      <p className="text-muted mb-0">
                        No strong matches yet — add a headline and some skills to your{" "}
                        <a href="/candidate-profile">profile</a> to get personalized recommendations.
                      </p>
                    )}
                    {recommended !== null && recommended.length > 0 && (
                      <div className="d-flex flex-column gap-3">
                        {recommended.map((m) => (
                          <a
                            key={m.job.id}
                            href={`/job-detail/${m.job.slug}`}
                            className="d-flex justify-content-between align-items-center border rounded p-3 text-decoration-none"
                          >
                            <div>
                              <div className="fw-medium text-dark">{m.job.title}</div>
                              <div className="small text-muted">
                                {m.job.employer?.companyName ?? "—"} &middot; {m.job.location ?? "—"}
                              </div>
                            </div>
                            <span className="badge bg-main text-white">{m.matchScore}% Match</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-12 col-xl-4 col-lg-12 col-md-12 col-sm-12">
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
                          <div className={`btn-circle-40 text-${n.isRead ? "info" : "warning"} bg-${n.isRead ? "info" : "warning"} bg-opacity-05`}><i className="fas fa-bell"></i></div>
                        </a>
                        <div className="ground-content">
                          <h6><a href="JavaScript:Void(0);">{n.title}</a></h6>
                          <span className="small">{timeAgo(n.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Row End */}

            {/* Row Start */}
            <div className="row">
              <div className="col-12 col-xl-12 col-lg-12 col-md-12 col-sm-12">
                <div className="card">
                  <div className="card-header">
                    <h4 className="mb-0">Applied Jobs</h4>
                  </div>
                  <div className="card-body px-4 py-4">
                    {dataLoading && <p className="text-muted">Loading applied jobs...</p>}
                    {!dataLoading && applications.length === 0 && <p className="text-muted">You have not applied to any jobs yet.</p>}
                    {/* Start All List */}
                    <div className="row justify-content-start gx-3 gy-4">
                      {applications.map((item) => (
                        <div className="col-xl-12 col-lg-12 col-md-12" key={item.id}>
                          <div className="jbs-list-box border">
                            <div className="jbs-list-head">
                              <div className="jbs-list-head-thunner">
                                <div className="jbs-list-emp-thumb jbs-verified">
                                  <a href={`/job-detail/${item.job.slug}`}>
                                    <figure><img src={assetUrl(item.job.employer.logoUrl) || "/assets/img/l-1.png"} className="img-fluid" alt="" /></figure>
                                  </a>
                                </div>
                                <div className="jbs-list-job-caption">
                                  <div className="jbs-job-types-wrap"><span className="label text-green bg-light-green">{item.status}</span></div>
                                  <div className="jbs-job-title-wrap"><h4><a href={`/job-detail/${item.job.slug}`} className="jbs-job-title">{item.job.title}</a></h4></div>
                                  <div className="jbs-job-mrch-lists">
                                    <div className="single-mrch-lists">
                                      <span>{item.job.employer.companyName}</span>.<span><i className="fa-solid fa-location-dot me-1"></i>{item.job.location}</span>.<span>{new Date(item.appliedAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="jbs-list-head-last">
                                <a href={`/job-detail/${item.job.slug}`} className="btn btn-md btn-gray px-3 me-2">View Detail</a>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* End All Job List */}
                  </div>
                </div>
              </div>
            </div>
            {/* Row End */}

          </div>

          {/* footer removed */}

        </div>

      </div>

      <UploadResumeModal />
    </>
  );
}
