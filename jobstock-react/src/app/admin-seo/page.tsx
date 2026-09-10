"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import Swal from "sweetalert2";
import toast, { Toaster } from "react-hot-toast";

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
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newPath, setNewPath] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  async function loadData(isSilent = false) {
    if (!isSilent) setFetching(true);
    try {
      const [cfg, ov] = await Promise.all([
        api.get<GlobalSeoConfig>("/admin/system-config"),
        api.get<SeoOverride[]>("/admin/seo/overrides"),
      ]);
      setConfig(cfg);
      setOverrides(ov);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed to Load SEO Data",
        text: err instanceof ApiError ? err.message : "Failed to load SEO settings",
        customClass: {
          popup: "elite-pkg-popup",
          title: "elite-pkg-title",
          confirmButton: "elite-pkg-btn",
        },
        confirmButtonColor: "#0d4f3c",
      });
    } finally {
      setFetching(false);
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
    try {
      await api.patch("/admin/system-config", config);
      toast.success("Global SEO settings saved successfully!");
      await loadData(true);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Save Failed",
        text: err instanceof ApiError ? err.message : "Failed to save SEO config",
        customClass: {
          popup: "elite-pkg-popup",
          title: "elite-pkg-title",
          confirmButton: "elite-pkg-btn",
        },
        confirmButtonColor: "#0d4f3c",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleAddOverride() {
    if (!newPath.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Route Path Required",
        text: "Please specify a URL route path (e.g. /jobs or /employers).",
        customClass: {
          popup: "elite-pkg-popup",
          title: "elite-pkg-title",
          confirmButton: "elite-pkg-btn",
        },
        confirmButtonColor: "#0d4f3c",
      });
      return;
    }

    try {
      await api.put(`/admin/seo/overrides?path=${encodeURIComponent(newPath.trim())}`, {
        metaTitle: newTitle || undefined,
        metaDescription: newDescription || undefined,
      });
      toast.success(`SEO override for "${newPath.trim()}" added!`);
      setNewPath("");
      setNewTitle("");
      setNewDescription("");
      await loadData(true);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed to Add Override",
        text: err instanceof ApiError ? err.message : "Failed to add SEO override",
        customClass: {
          popup: "elite-pkg-popup",
          title: "elite-pkg-title",
          confirmButton: "elite-pkg-btn",
        },
        confirmButtonColor: "#0d4f3c",
      });
    }
  }

  async function handleDeleteOverride(path: string) {
    const confirm = await Swal.fire({
      title: `Delete SEO Override?`,
      text: `Are you sure you want to remove the custom SEO override for "${path}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d94348",
      cancelButtonColor: "#8ea59d",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "elite-pkg-popup",
        title: "elite-pkg-title",
        confirmButton: "elite-pkg-btn",
      },
    });

    if (!confirm.isConfirmed) return;

    try {
      await api.delete(`/admin/seo/overrides?path=${encodeURIComponent(path)}`);
      toast.success(`Override for "${path}" deleted!`);
      await loadData(true);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: err instanceof ApiError ? err.message : "Failed to delete override",
        customClass: {
          popup: "elite-pkg-popup",
          title: "elite-pkg-title",
          confirmButton: "elite-pkg-btn",
        },
        confirmButtonColor: "#0d4f3c",
      });
    }
  }

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <Toaster position="top-right" />
      <AdminNavbar />

      <style jsx global>{`
        .dashboard-wrap {
          background-color: #f4f9f8 !important;
          min-height: 100vh;
          overflow-x: hidden !important;
        }
        .dashboard-content.pkg-page {
          background-color: #f4f9f8 !important;
          padding: 30px 24px !important;
          max-width: 100% !important;
          overflow-x: hidden !important;
        }
        .pkg-header-title {
          font-size: 24px;
          font-weight: 800;
          color: #0b2b22;
          letter-spacing: -0.5px;
        }
        .pkg-header-subtitle {
          color: #5c756d;
          font-size: 13.5px;
        }

        .dash-wrap-bloud {
          background: #ffffff;
          border: 1px solid #e1e9e7;
          border-radius: 0.75rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .dash-wrap-bloud:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.06);
        }
        .dash-wrap-glow {
          position: absolute;
          top: -20px;
          right: -20px;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          filter: blur(35px);
          z-index: 0;
          opacity: 0.9;
        }
        .dash-wrap-bloud-icon, .dash-wrap-bloud-caption {
          position: relative;
          z-index: 1;
        }
        .bloud-icon {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
        }
        .dash-wrap-bloud-content h5 {
          font-size: 2rem;
          font-weight: 700;
          color: #0d362d;
          margin-bottom: 0.25rem;
          text-align: right;
        }
        .dash-wrap-bloud-content p {
          color: #63857d;
          font-size: 0.875rem;
          margin-bottom: 0;
          text-align: right;
          font-weight: 500;
        }

        .elite-card {
          background: #ffffff;
          border: 1px solid #d6e8e4;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(13, 79, 60, 0.04);
          overflow: hidden;
          margin-bottom: 24px;
        }
        .elite-card-header {
          background: #fbfdfc;
          border-bottom: 1px solid #d6e8e4;
          padding: 16px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .elite-card-title {
          font-size: 16px;
          font-weight: 700;
          color: #0b2b22;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-input {
          background: #ffffff;
          border: 1.5px solid #d6e8e4;
          border-radius: 9px;
          padding: 8px 14px;
          font-size: 13.5px;
          color: #0b2b22;
          width: 100%;
          transition: all 0.2s;
        }
        .filter-input:focus {
          border-color: #429e85;
          outline: none;
          box-shadow: 0 0 0 3px rgba(66, 158, 133, 0.15);
        }

        .form-field-label {
          font-size: 12.5px;
          font-weight: 700;
          color: #334d44;
          margin-bottom: 6px;
          display: block;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .btn-primary-action {
          background: #0d4f3c;
          border: 1px solid #0d4f3c;
          color: #ffffff;
          font-weight: 700;
          font-size: 13px;
          padding: 8px 20px;
          border-radius: 9px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .btn-primary-action:hover {
          background: #08382b;
          color: #ffffff;
        }

        .btn-add-override {
          background: #e8f5f1;
          border: 1.5px solid #bce2d8;
          color: #0d4f3c;
          font-weight: 700;
          font-size: 13px;
          padding: 8px 16px;
          border-radius: 9px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          transition: all 0.2s;
        }
        .btn-add-override:hover {
          background: #d4ece5;
          color: #08382b;
          border-color: #429e85;
        }

        .seo-table-wrap {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .seo-table {
          width: 100%;
          min-width: 700px;
          border-collapse: collapse;
        }
        .seo-table th {
          background: #f8fbfa;
          color: #446158;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 14px 18px;
          border-bottom: 1px solid #d6e8e4;
        }
        .seo-table td {
          padding: 14px 18px;
          border-bottom: 1px solid #eef5f3;
          color: #334d44;
          font-size: 13.5px;
          vertical-align: middle;
        }
        .seo-table tbody tr:hover {
          background: #f2f9f6;
        }

        .btn-delete-row {
          background: #ffffff;
          border: 1px solid #fca5a5;
          color: #dc2626;
          font-weight: 600;
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .btn-delete-row:hover {
          background: #fee2e2;
          border-color: #ef4444;
          color: #b91c1c;
        }

        .elite-pkg-popup {
          border-radius: 16px !important;
          padding: 24px !important;
          border: 1px solid #d6e8e4 !important;
          font-family: inherit !important;
        }
        .elite-pkg-title {
          font-size: 20px !important;
          font-weight: 800 !important;
          color: #0b2b22 !important;
        }
        .elite-pkg-btn {
          border-radius: 8px !important;
          font-weight: 700 !important;
          padding: 10px 22px !important;
          font-size: 14px !important;
        }
      `}</style>

      <div className="dashboard-wrap">
        <AdminSidebar active="seo" />

        <div className="dashboard-content pkg-page">
          {/* Header */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
              <h1 className="pkg-header-title mb-1">SEO &amp; Discovery Configuration</h1>
              <p className="pkg-header-subtitle mb-0">
                Configure global search metadata, robots.txt directives, and route-level meta tag overrides.
              </p>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="row align-items-center gx-4 gy-4 mb-4">
            <div className="col-12 col-sm-6 col-md-6 col-lg-4">
              <div className="dash-wrap-bloud">
                <div className="dash-wrap-glow" style={{ background: "#dbfbf5" }}></div>
                <div className="dash-wrap-bloud-icon">
                  <div className="bloud-icon" style={{ backgroundColor: "#def5f0", color: "#134d42" }}>
                    <i className="fa-solid fa-file-code"></i>
                  </div>
                </div>
                <div className="dash-wrap-bloud-caption">
                  <div className="dash-wrap-bloud-content">
                    <h5 className="ctr">{overrides.length}</h5>
                    <p>Page Meta Overrides</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-md-6 col-lg-4">
              <div className="dash-wrap-bloud">
                <div className="dash-wrap-glow" style={{ background: "#dcf4fa" }}></div>
                <div className="dash-wrap-bloud-icon">
                  <div className="bloud-icon" style={{ backgroundColor: "#eef3f5", color: "#174742" }}>
                    <i className="fa-brands fa-google"></i>
                  </div>
                </div>
                <div className="dash-wrap-bloud-caption">
                  <div className="dash-wrap-bloud-content">
                    <h5 className="ctr" style={{ fontSize: "1.45rem" }}>
                      {config?.seoGoogleSiteVerification ? "Active" : "Not Set"}
                    </h5>
                    <p>Google Verification</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-md-6 col-lg-4">
              <div className="dash-wrap-bloud">
                <div className="dash-wrap-glow" style={{ background: "#fff3dc" }}></div>
                <div className="dash-wrap-bloud-icon">
                  <div className="bloud-icon" style={{ backgroundColor: "#fdf3e0", color: "#b07c1a" }}>
                    <i className="fa-solid fa-robot"></i>
                  </div>
                </div>
                <div className="dash-wrap-bloud-caption">
                  <div className="dash-wrap-bloud-content">
                    <h5 className="ctr" style={{ fontSize: "1.45rem" }}>
                      {config?.seoRobotsTxt ? "Custom" : "Default"}
                    </h5>
                    <p>robots.txt Directives</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Site-Wide Defaults */}
          {config && (
            <div className="elite-card">
              <div className="elite-card-header">
                <h2 className="elite-card-title">
                  <i className="fa-solid fa-globe" style={{ color: "#429e85" }}></i>
                  Site-Wide Meta Defaults
                </h2>
                <button
                  type="button"
                  className="btn-primary-action"
                  disabled={saving}
                  onClick={handleSaveGlobal}
                >
                  {saving ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin"></i> Saving...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-floppy-disk"></i> Save Global Settings
                    </>
                  )}
                </button>
              </div>

              <div className="p-4">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-field-label">Default Meta Title</label>
                    <input
                      type="text"
                      className="filter-input"
                      value={config.seoDefaultTitle}
                      onChange={(e) => setConfig({ ...config, seoDefaultTitle: e.target.value })}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-field-label">Default Meta Description</label>
                    <textarea
                      className="filter-input"
                      rows={2}
                      value={config.seoDefaultDescription}
                      onChange={(e) => setConfig({ ...config, seoDefaultDescription: e.target.value })}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-field-label">robots.txt Directives</label>
                    <textarea
                      className="filter-input font-monospace"
                      rows={4}
                      style={{ fontSize: "13px" }}
                      value={config.seoRobotsTxt}
                      onChange={(e) => setConfig({ ...config, seoRobotsTxt: e.target.value })}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-field-label">Google Site Verification Tag</label>
                    <input
                      type="text"
                      className="filter-input font-monospace"
                      placeholder="e.g. google-site-verification token content"
                      value={config.seoGoogleSiteVerification}
                      onChange={(e) => setConfig({ ...config, seoGoogleSiteVerification: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Per-Page Override */}
          <div className="elite-card">
            <div className="elite-card-header">
              <h2 className="elite-card-title">
                <i className="fa-solid fa-plus-circle" style={{ color: "#429e85" }}></i>
                Add Custom Route SEO Override
              </h2>
            </div>

            <div className="p-4">
              <div className="row g-2 align-items-center">
                <div className="col-12 col-md-3">
                  <label className="form-field-label">Route Path</label>
                  <input
                    type="text"
                    className="filter-input font-monospace"
                    placeholder="/jobs or /employers"
                    value={newPath}
                    onChange={(e) => setNewPath(e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-3">
                  <label className="form-field-label">Custom Meta Title</label>
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="Page specific title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-field-label">Custom Meta Description</label>
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="Page specific description"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-2">
                  <label className="form-field-label">&nbsp;</label>
                  <button
                    type="button"
                    className="btn-add-override"
                    onClick={handleAddOverride}
                  >
                    <i className="fa-solid fa-plus"></i> Add Override
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Overrides Table */}
          <div className="elite-card">
            <div className="elite-card-header">
              <h2 className="elite-card-title">
                <i className="fa-solid fa-list-check" style={{ color: "#429e85" }}></i>
                Configured Per-Page Overrides ({overrides.length})
              </h2>
            </div>

            <div className="seo-table-wrap">
              {overrides.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="fa-solid fa-compass text-muted fs-2 mb-2"></i>
                  <p className="mb-0 fw-semibold">No custom route overrides — all pages inherit site-wide defaults.</p>
                </div>
              ) : (
                <table className="seo-table">
                  <thead>
                    <tr>
                      <th>Route Path</th>
                      <th>Meta Title</th>
                      <th>Meta Description</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overrides.map((o) => (
                      <tr key={o.path}>
                        <td>
                          <span className="badge bg-light text-dark border font-monospace" style={{ fontSize: "12.5px" }}>
                            {o.path}
                          </span>
                        </td>
                        <td className="fw-semibold" style={{ color: "#0b2b22" }}>
                          {o.metaTitle ?? "—"}
                        </td>
                        <td className="text-muted" style={{ maxWidth: "350px", fontSize: "13px" }}>
                          {o.metaDescription ?? "—"}
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn-delete-row"
                            onClick={() => handleDeleteOverride(o.path)}
                          >
                            <i className="fa-solid fa-trash-can me-1"></i> Delete
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
      </div>
    </>
  );
}
