"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface LegalDoc {
  slug: string;
  title: string;
  version: number;
  updatedAt: string;
}

const KNOWN_SLUGS = [
  { slug: "privacy-policy", label: "Privacy Policy" },
  { slug: "terms-of-service", label: "Terms of Service" },
  { slug: "cookie-policy", label: "Cookie Policy" },
];

export default function AdminLegalPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [docs, setDocs] = useState<LegalDoc[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    (async () => {
      try {
        const res = await api.get<LegalDoc[]>("/admin/legal");
        setDocs(res);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load legal documents");
      }
    })();
  }, [user]);

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  const existingSlugs = new Set(docs.map((d) => d.slug));
  const rows = KNOWN_SLUGS.map((k) => ({
    ...k,
    doc: docs.find((d) => d.slug === k.slug) ?? null,
  }));
  const extraDocs = docs.filter((d) => !KNOWN_SLUGS.some((k) => k.slug === d.slug));

  return (
    <>
      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="legal" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Legal &amp; Compliance</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Legal Documents</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="card">
              <div className="card-header"><h6 className="mb-0">Documents</h6></div>
              <div className="card-body">
                <table className="table align-middle">
                  <thead>
                    <tr><th>Document</th><th>Version</th><th>Last Updated</th><th></th></tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.slug}>
                        <td className="small fw-medium">{r.label}</td>
                        <td className="small">{r.doc ? `v${r.doc.version}` : "â€”"}</td>
                        <td className="small text-muted">{r.doc ? new Date(r.doc.updatedAt).toLocaleString() : "Not created yet"}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-main"
                            onClick={() => router.push(`/admin-legal/${r.slug}`)}
                          >
                            {existingSlugs.has(r.slug) ? "Edit" : "Create"}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {extraDocs.map((d) => (
                      <tr key={d.slug}>
                        <td className="small fw-medium">{d.title}</td>
                        <td className="small">v{d.version}</td>
                        <td className="small text-muted">{new Date(d.updatedAt).toLocaleString()}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-main"
                            onClick={() => router.push(`/admin-legal/${d.slug}`)}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

