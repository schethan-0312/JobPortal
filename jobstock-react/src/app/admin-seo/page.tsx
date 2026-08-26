"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface GlobalSeoConfig {
  seoDefaultTitle: string;
  seoDefaultDescription: string;
  seoRobotsTxt: string;
  seoGoogleSiteVerification: string;
}

interface SeoOverride {
  path: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;
  updatedAt: string;
}

export default function AdminSeoPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [config, setConfig] = useState<GlobalSeoConfig | null>(null);
  const [overrides, setOverrides] = useState<SeoOverride[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [newPath, setNewPath] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  async function loadData() {
    try {
      const [cfg, ov] = await Promise.all([
        api.get<GlobalSeoConfig>("/admin/system-config"),
        api.get<SeoOverride[]>("/admin/seo/overrides"),
      ]);
      setConfig(cfg);
      setOverrides(ov);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load SEO settings");
    }
  }

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    loadData();
  }, [user]);

  async function handleSaveGlobal() {
    if (!config) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.patch("/admin/system-config", config);
      setSuccessMsg("Global SEO settings saved.");
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddOverride() {
    if (!newPath.trim()) return;
    setError(null);
    try {
      await api.put(`/admin/seo/overrides?path=${encodeURIComponent(newPath.trim())}`, {
        metaTitle: newTitle || undefined,
        metaDescription: newDescription || undefined,
      });
      setNewPath("");
      setNewTitle("");
      setNewDescription("");
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add override");
    }
  }

  async function handleDeleteOverride(path: string) {
    setError(null);
    try {
      await api.delete(`/admin/seo/overrides?path=${encodeURIComponent(path)}`);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete override");
    }
  }

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="seo" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">SEO &amp; Content Control</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">SEO</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}
            {successMsg && <div className="alert alert-success">{successMsg}</div>}

            {config && (
              <div className="card mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Site-Wide Defaults</h6>
                  <button type="button" className="btn btn-main btn-sm" disabled={saving} onClick={handleSaveGlobal}>
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label small">Default Meta Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={config.seoDefaultTitle}
                      onChange={(e) => setConfig({ ...config, seoDefaultTitle: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">Default Meta Description</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={config.seoDefaultDescription}
                      onChange={(e) => setConfig({ ...config, seoDefaultDescription: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">robots.txt Content</label>
                    <textarea
                      className="form-control font-monospace"
                      rows={4}
                      value={config.seoRobotsTxt}
                      onChange={(e) => setConfig({ ...config, seoRobotsTxt: e.target.value })}
                    />
                  </div>
                  <div className="mb-0">
                    <label className="form-label small">Google Site Verification Tag</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="google-site-verification content value"
                      value={config.seoGoogleSiteVerification}
                      onChange={(e) => setConfig({ ...config, seoGoogleSiteVerification: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="card mb-4">
              <div className="card-header"><h6 className="mb-0">Add Per-Page Override</h6></div>
              <div className="card-body">
                <div className="row g-2">
                  <div className="col-md-3">
                    <input type="text" className="form-control form-control-sm" placeholder="/jobs" value={newPath} onChange={(e) => setNewPath(e.target.value)} />
                  </div>
                  <div className="col-md-3">
                    <input type="text" className="form-control form-control-sm" placeholder="Meta title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                  </div>
                  <div className="col-md-4">
                    <input type="text" className="form-control form-control-sm" placeholder="Meta description" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
                  </div>
                  <div className="col-md-2">
                    <button type="button" className="btn btn-outline-main btn-sm w-100" onClick={handleAddOverride}>
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h6 className="mb-0">Per-Page Overrides ({overrides.length})</h6></div>
              <div className="card-body">
                {overrides.length === 0 && <p className="text-muted small mb-0">No overrides â€” all pages use site-wide defaults.</p>}
                {overrides.length > 0 && (
                  <table className="table table-sm align-middle mb-0">
                    <thead><tr><th>Path</th><th>Title</th><th>Description</th><th></th></tr></thead>
                    <tbody>
                      {overrides.map((o) => (
                        <tr key={o.path}>
                          <td className="small font-monospace">{o.path}</td>
                          <td className="small">{o.metaTitle ?? "â€”"}</td>
                          <td className="small">{o.metaDescription ?? "â€”"}</td>
                          <td>
                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteOverride(o.path)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

