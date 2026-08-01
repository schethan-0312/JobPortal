"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface SystemConfigValues {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  registrationEnabled: boolean;
  supportEmail: string;
  maxJobPostsPerEmployer: number;
  platformAnnouncement: string;
}

export default function AdminSystemConfigPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [config, setConfig] = useState<SystemConfigValues | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function loadConfig() {
    try {
      const res = await api.get<SystemConfigValues>("/admin/system-config");
      setConfig(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load system configuration");
    }
  }

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    loadConfig();
  }, [user]);

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.patch("/admin/system-config", config);
      setSuccessMsg("Settings saved.");
      await loadConfig();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save settings");
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
        <AdminSidebar active="system-config" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">System Configuration</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">System Configuration</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}
            {successMsg && <div className="alert alert-success">{successMsg}</div>}
            {!config && !error && <p className="text-muted">Loading...</p>}

            {config && (
              <div className="card">
                <div className="card-header"><h6 className="mb-0">Platform Settings</h6></div>
                <div className="card-body">
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="maintenanceMode"
                      checked={config.maintenanceMode}
                      onChange={(e) => setConfig({ ...config, maintenanceMode: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="maintenanceMode">
                      <strong>Maintenance Mode</strong> — when on, all non-admin API requests are blocked
                    </label>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small">Maintenance Message</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={config.maintenanceMessage}
                      onChange={(e) => setConfig({ ...config, maintenanceMessage: e.target.value })}
                    />
                  </div>

                  <hr />

                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="registrationEnabled"
                      checked={config.registrationEnabled}
                      onChange={(e) => setConfig({ ...config, registrationEnabled: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="registrationEnabled">
                      <strong>Registration Enabled</strong> — turn off to temporarily block new signups
                    </label>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small">Support Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={config.supportEmail}
                        onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small">Max Job Posts Per Employer</label>
                      <input
                        type="number"
                        className="form-control"
                        value={config.maxJobPostsPerEmployer}
                        onChange={(e) => setConfig({ ...config, maxJobPostsPerEmployer: parseInt(e.target.value, 10) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label small">Platform Announcement Banner (blank = hidden)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={config.platformAnnouncement}
                      onChange={(e) => setConfig({ ...config, platformAnnouncement: e.target.value })}
                    />
                  </div>

                  <button type="button" className="btn btn-main" disabled={saving} onClick={handleSave}>
                    {saving ? "Saving..." : "Save Settings"}
                  </button>
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
