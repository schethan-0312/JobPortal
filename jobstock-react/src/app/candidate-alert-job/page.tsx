"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar7 from "@/components/Navbar7";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
import UploadResumeModal from "@/components/candidate-dashboard/UploadResumeModal";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { Toaster, toast } from "react-hot-toast";

interface JobAlert {
  id: string;
  keyword: string | null;
  category: string | null;
  location: string | null;
  createdAt: string;
}

export default function CandidateAlertJobPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
    const [removingId, setRemovingId] = useState<string | null>(null);

  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "CANDIDATE")) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "CANDIDATE") return;
    loadAlerts();
  }, [user]);

  async function loadAlerts() {
    setDataLoading(true);
        try {
      const list = await api.get<JobAlert[]>("/candidates/job-alerts");
      setAlerts(list);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load job alerts");
    } finally {
      setDataLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim() && !category.trim() && !location.trim()) return;
    setCreating(true);
        try {
      const created = await api.post<JobAlert>("/candidates/job-alerts", {
        keyword: keyword.trim() || undefined,
        category: category.trim() || undefined,
        location: location.trim() || undefined,
      });
      setAlerts((prev) => [created, ...prev]);
      setKeyword("");
      setCategory("");
      setLocation("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create job alert");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    setRemovingId(id);
        try {
      await api.delete(`/candidates/job-alerts/${id}`);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to remove job alert");
    } finally {
      setRemovingId(null);
    }
  }

  if (loading || !user || user.role !== "CANDIDATE") {
    return null;
  }

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
        <CandidateSidebar active="alert-job" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">All Alert Jobs</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Candidate</a></li>
                    <li className="breadcrumb-item text-muted"><a href="#">Dashboard</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Alert Jobs</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">

            
            {/* Header Wrap */}
            <div className="row">
              <div className="col-12 col-xl-12 col-lg-12 col-md-12 col-sm-12">
                <div className="card">
                  <div className="card-header">
                    <form onSubmit={handleCreate} className="_mp-inner-content elior w-100">
                      <div className="_mp-inner-first d-flex gap-2 flex-wrap">
                        <input type="text" className="form-control" placeholder="Keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ maxWidth: 180 }} />
                        <input type="text" className="form-control" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} style={{ maxWidth: 180 }} />
                        <input type="text" className="form-control" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} style={{ maxWidth: 180 }} />
                        <button type="submit" className="btn btn-main" disabled={creating}>{creating ? "Adding..." : "Add Alert"}</button>
                      </div>
                    </form>
                  </div>
                  <div className="card-body">
                    {dataLoading && <p className="text-muted">Loading...</p>}
                    {!dataLoading && alerts.length === 0 && <p className="text-muted">No job alerts set up yet.</p>}
                    {!dataLoading && alerts.length > 0 && (
                      <div className="table-responsive">
                        <table className="table">
                          <thead>
                            <tr>
                              <th scope="col">Keyword</th>
                              <th scope="col">Category</th>
                              <th scope="col">Location</th>
                              <th scope="col">Created</th>
                              <th scope="col">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {alerts.map((a) => (
                              <tr key={a.id}>
                                <td>{a.keyword || "-"}</td>
                                <td>{a.category || "-"}</td>
                                <td>{a.location || "-"}</td>
                                <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-md btn-light-red px-3 me-2"
                                    disabled={removingId === a.id}
                                    onClick={() => handleDelete(a.id)}
                                  >
                                    {removingId === a.id ? "..." : <i className="fa-solid fa-xmark"></i>}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Header Wrap */}

          </div>

          {/* footer removed */}

        </div>

      </div>

      <UploadResumeModal />
    </>
  );
}
