"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface LegalDocDetail {
  slug: string;
  title: string;
  body: string;
  version: number;
  updatedAt: string;
}

interface Revision {
  id: string;
  version: number;
  title: string;
  updatedById: string | null;
  createdAt: string;
}

export default function AdminLegalEditPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [doc, setDoc] = useState<LegalDocDetail | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function loadDoc() {
    try {
      const res = await api.get<LegalDocDetail>(`/admin/legal/${slug}`);
      setDoc(res);
      setTitle(res.title);
      setBody(res.body);
      const rev = await api.get<Revision[]>(`/admin/legal/${slug}/revisions`);
      setRevisions(rev);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
      } else {
        setError(err instanceof ApiError ? err.message : "Failed to load document");
      }
    }
  }

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    loadDoc();
  }, [user, slug]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.put(`/admin/legal/${slug}`, { title, body });
      setSuccessMsg("Saved successfully. A new version was recorded.");
      setNotFound(false);
      await loadDoc();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save document");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="legal" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">{doc?.title ?? slug}</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item text-muted"><a href="/admin-legal">Legal Documents</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">{slug}</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}
            {successMsg && <div className="alert alert-success">{successMsg}</div>}
            {notFound && <div className="alert alert-warning">This document doesn&apos;t exist yet — saving will create it as version 1.</div>}

            <div className="card mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Edit {doc ? `(current: v${doc.version})` : "(new document)"}</h6>
                <button type="button" className="btn btn-main btn-sm" disabled={saving} onClick={handleSave}>
                  {saving ? "Saving..." : "Save New Version"}
                </button>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label small">Title</label>
                  <input type="text" className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="mb-0">
                  <label className="form-label small">Body</label>
                  <textarea
                    className="form-control font-monospace"
                    rows={20}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {revisions.length > 0 && (
              <div className="card">
                <div className="card-header"><h6 className="mb-0">Version History</h6></div>
                <div className="card-body">
                  <table className="table table-sm align-middle mb-0">
                    <thead><tr><th>Version</th><th>Title</th><th>When</th></tr></thead>
                    <tbody>
                      {revisions.map((r) => (
                        <tr key={r.id}>
                          <td className="small">v{r.version}</td>
                          <td className="small">{r.title}</td>
                          <td className="small text-muted">{new Date(r.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
