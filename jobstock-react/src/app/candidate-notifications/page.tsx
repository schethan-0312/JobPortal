"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar7 from "@/components/Navbar7";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
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

export default function CandidateNotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
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
        const notifs = await api.get<Notification[]>("/notifications");
        setNotifications(notifs);
        
        // Optional: Mark all as read here, or have a separate button
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to load notifications");
      } finally {
        setDataLoading(false);
      }
    })();
  }, [user]);

  if (loading || !user || user.role !== "CANDIDATE") {
    return null;
  }

  return (
    <>
      <Navbar7 />
      <Toaster 
        position="top-center" 
        containerStyle={{ top: '100px' }}
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
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">All Notifications</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Candidate</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Notifications</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            <div className="row">
              <div className="col-12 col-xl-12 col-lg-12 col-md-12 col-sm-12">
                <div className="card mb-4" style={{ borderRadius: '0.5rem', border: '1px solid #e5e9ea', overflow: 'hidden' }}>
                  <div className="card-header py-4 px-4" style={{ backgroundColor: '#f8fbfb', borderBottom: '1px solid #e5e9ea' }}>
                    <h6 className="fw-bold mb-0" style={{ fontSize: '1.05rem', color: '#0d362d' }}>{notifications.length} notification{notifications.length !== 1 ? "s" : ""}</h6>
                  </div>
                  <div className="card-body p-0 bg-white">
                    {dataLoading && <p className="text-muted p-4">Loading...</p>}
                    {!dataLoading && notifications.length === 0 && <p className="text-muted p-4">You have no notifications yet.</p>}
                    
                    <div className="ground-list ground-list-hove p-0 m-0">
                      {notifications.map((n) => (
                        <div className="border-bottom p-4 d-flex align-items-start" key={n.id} style={{ borderColor: '#e1e9e7' }}>
                          <div className={`btn-circle-40 text-${n.isRead ? "secondary" : "danger"} bg-${n.isRead ? "light" : "danger"} bg-opacity-10 me-3`} style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <i className="fas fa-bell"></i>
                          </div>
                          <div className="ground-content">
                            <h6 className="mb-1 text-dark fw-medium" style={{ fontSize: '1rem' }}>{n.title}</h6>
                            <div className="text-muted mb-2" style={{ fontSize: '0.9rem' }}>{n.body || "Notification detail goes here..."}</div>
                            <span className="small text-muted" style={{ fontSize: '0.8rem' }}>
                              {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({timeAgo(n.createdAt)})
                            </span>
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
