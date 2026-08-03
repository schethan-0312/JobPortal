"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar7 from "@/components/Navbar7";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
import UploadResumeModal from "@/components/candidate-dashboard/UploadResumeModal";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl } from "@/lib/api";

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

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
}

interface GamificationProgress {
  profileCompletionPercent: number;
  achievements: Achievement[];
  earnedCount: number;
  totalCount: number;
}

interface ProfileView {
  id: string;
  createdAt: string;
  viewer: { employer: { companyName: string; logoUrl: string | null } | null };
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
  const [progress, setProgress] = useState<GamificationProgress | null>(null);
  const [profileViews, setProfileViews] = useState<ProfileView[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const [notifs, apps, gamification, views] = await Promise.all([
          api.get<Notification[]>("/notifications"),
          api.get<Application[]>("/applications/mine"),
          api.get<GamificationProgress>("/gamification/me"),
          api.get<{ views: ProfileView[] }>("/candidates/profile-views/mine"),
        ]);
        setNotifications(notifs.slice(0, 5));
        setApplications(apps);
        setProgress(gamification);
        setProfileViews(views.views.slice(0, 5));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load dashboard data");
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

      <div className="dashboard-wrap bg-light">
        <CandidateSidebar active="dashboard" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-5">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
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

            {error && <div className="alert alert-danger">{error}</div>}

            {/* Row Start */}
            <div className="row align-items-center gx-4 gy-4 mb-4">
              {ctrs.map((item, i) => (
                <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6" key={i}>
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

            {/* Row Start: Profile Strength + Achievements */}
            {progress && (
              <div className="row gx-4 gy-4 mb-4">
                <div className="col-xl-4 col-lg-12 col-md-12 col-sm-12">
                  <div className="card h-100">
                    <div className="card-header"><h4 className="mb-0">Profile Strength</h4></div>
                    <div className="card-body d-flex flex-column align-items-center justify-content-center">
                      <div
                        className="d-flex align-items-center justify-content-center rounded-circle mb-3"
                        style={{
                          width: 120,
                          height: 120,
                          background: `conic-gradient(#0b8260 ${progress.profileCompletionPercent * 3.6}deg, #e9ecef 0deg)`,
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-center rounded-circle bg-white" style={{ width: 96, height: 96 }}>
                          <span className="fs-4 fw-bold">{progress.profileCompletionPercent}%</span>
                        </div>
                      </div>
                      {progress.profileCompletionPercent < 100 && (
                        <a href="/candidate-profile" className="small">Complete your profile &rarr;</a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-xl-8 col-lg-12 col-md-12 col-sm-12">
                  <div className="card h-100">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h4 className="mb-0">Achievements</h4>
                      <span className="small text-muted">{progress.earnedCount} of {progress.totalCount} earned</span>
                    </div>
                    <div className="card-body">
                      <div className="row gx-3 gy-3">
                        {progress.achievements.map((a) => (
                          <div className="col-xl-3 col-lg-3 col-md-4 col-sm-6 text-center" key={a.id} title={a.description}>
                            <div
                              className={`d-flex align-items-center justify-content-center rounded-circle mx-auto mb-2 ${a.earned ? "bg-main text-white" : "bg-light text-muted"}`}
                              style={{ width: 56, height: 56 }}
                            >
                              <i className={`${a.icon} fs-5`}></i>
                            </div>
                            <div className="small" style={{ opacity: a.earned ? 1 : 0.5 }}>{a.title}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Row End */}

            {/* Row Start */}
            <div className="row gx-4 gy-4 mb-4">
              <div className="col-xl-8 col-lg-12 col-md-12 col-sm-12">
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

                <div className="card mt-4">
                  <div className="card-header">
                    <h4>Who Viewed Your Profile</h4>
                  </div>
                  <div className="ground-list ground-list-hove">
                    {dataLoading && <p className="p-3 text-muted">Loading...</p>}
                    {!dataLoading && profileViews.length === 0 && <p className="p-3 text-muted">No profile views yet.</p>}
                    {profileViews.map((v) => (
                      <div className="ground ground-single-list" key={v.id}>
                        <a href="JavaScript:Void(0);">
                          <div className="btn-circle-40 text-main bg-main bg-opacity-05">
                            <img src={assetUrl(v.viewer.employer?.logoUrl) || "/assets/img/l-1.png"} className="img-fluid rounded-circle" alt="" />
                          </div>
                        </a>
                        <div className="ground-content">
                          <h6>{v.viewer.employer?.companyName ?? "An employer"}</h6>
                          <span className="small">{timeAgo(v.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Row End */}

            {/* Row Start: Application Pipeline */}
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                <div className="card">
                  <div className="card-header">
                    <h4 className="mb-0">Application Pipeline</h4>
                  </div>
                  <div className="card-body px-4 py-4">
                    {dataLoading && <p className="text-muted">Loading applied jobs...</p>}
                    {!dataLoading && applications.length === 0 && <p className="text-muted">You have not applied to any jobs yet.</p>}
                    {!dataLoading && applications.length > 0 && (
                      <div className="row gx-3 gy-4">
                        {(["APPLIED", "REVIEWED", "SHORTLISTED", "INTERVIEW", "OFFERED"] as const).map((stage) => {
                          const stageApps = applications.filter((a) => a.status === stage);
                          return (
                            <div className="col-xl-2 col-lg-4 col-md-6 col-sm-6" key={stage}>
                              <div className="small fw-medium text-muted mb-2 text-uppercase">
                                {stage} <span className="badge bg-secondary ms-1">{stageApps.length}</span>
                              </div>
                              <div className="d-flex flex-column gap-2">
                                {stageApps.map((item) => (
                                  <a
                                    key={item.id}
                                    href={`/job-detail/${item.job.slug}`}
                                    className="border rounded p-2 text-decoration-none d-block"
                                  >
                                    <div className="small fw-medium text-dark">{item.job.title}</div>
                                    <div className="small text-muted">{item.job.employer.companyName}</div>
                                  </a>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Row End */}

          </div>

          {/* footer */}
          <div className="row">
            <div className="col-md-12">
              <div className="py-3 text-center">
                &copy; {new Date().getFullYear()} JobStock. All rights reserved.
              </div>
            </div>
          </div>

        </div>

      </div>

      <UploadResumeModal />
    </>
  );
}
