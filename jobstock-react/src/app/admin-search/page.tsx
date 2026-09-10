"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface SearchResult {
  type: "candidate" | "employer" | "job" | "ticket" | "transaction";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

const TYPE_LABELS: Record<SearchResult["type"], string> = {
  candidate: "Candidates",
  employer: "Employers",
  job: "Job Postings",
  ticket: "Support Tickets",
  transaction: "Transactions",
};

const TYPE_ICONS: Record<SearchResult["type"], string> = {
  candidate: "fa-user-graduate",
  employer: "fa-building",
  job: "fa-briefcase",
  ticket: "fa-headset",
  transaction: "fa-sack-dollar",
};

const TYPE_COLORS: Record<SearchResult["type"], { bg: string; text: string; iconBg: string }> = {
  candidate: { bg: "rgba(13, 79, 60, 0.08)", text: "#0d4f3c", iconBg: "rgba(13, 79, 60, 0.12)" },
  employer: { bg: "rgba(14, 116, 144, 0.08)", text: "#0e7490", iconBg: "rgba(14, 116, 144, 0.12)" },
  job: { bg: "rgba(30, 64, 175, 0.08)", text: "#1e40af", iconBg: "rgba(30, 64, 175, 0.12)" },
  ticket: { bg: "rgba(194, 65, 12, 0.08)", text: "#c2410c", iconBg: "rgba(194, 65, 12, 0.12)" },
  transaction: { bg: "rgba(4, 120, 87, 0.08)", text: "#047857", iconBg: "rgba(4, 120, 87, 0.12)" },
};

export default function AdminSearchPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      setError(null);
      try {
        const res = await api.get<SearchResult[]>(`/admin/search?q=${encodeURIComponent(query.trim())}`);
        setResults(res);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Search failed");
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [user, query]);

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.type] ??= []).push(r);
    return acc;
  }, {});

  const totalCount = results.length;

  return (
    <>
      <AdminNavbar />

      <div className="dashboard-wrap bg-light" style={{ minHeight: "100vh", overflowX: "hidden" }}>
        <AdminSidebar active="search" />

        <div className="dashboard-content" style={{ padding: "30px 25px 60px" }}>
          {/* Breadcrumb / Title */}
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-12">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div>
                    <h1 className="mb-1 fs-3 fw-bold text-dark" style={{ letterSpacing: "-0.5px" }}>
                      Global Search
                    </h1>
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                        <li className="breadcrumb-item">
                          <Link href="/admin-dashboard" className="text-muted text-decoration-none">Admin</Link>
                        </li>
                        <li className="breadcrumb-item active text-dark fw-medium" aria-current="page" style={{ color: "#0d4f3c" }}>
                          Global Search
                        </li>
                      </ol>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 mb-4 rounded-3 border-0 shadow-sm" style={{ background: "#fef2f2", color: "#991b1b" }}>
                <i className="fa-solid fa-circle-exclamation fs-5"></i>
                <span>{error}</span>
              </div>
            )}

            {/* Search Input Box */}
            <div className="card border-0 rounded-4 shadow-sm mb-4" style={{ background: "#ffffff", border: "1px solid rgba(13,79,60,0.08)" }}>
              <div className="card-body p-4">
                <div className="position-relative">
                  <div
                    className="position-absolute d-flex align-items-center justify-content-center"
                    style={{ left: "16px", top: "50%", transform: "translateY(-50%)", width: "36px", height: "36px", color: "#0d4f3c" }}
                  >
                    {searching ? (
                      <i className="fa-solid fa-spinner fa-spin fs-5"></i>
                    ) : (
                      <i className="fa-solid fa-magnifying-glass fs-5"></i>
                    )}
                  </div>
                  <input
                    type="text"
                    className="form-control form-control-lg ps-5 pe-5 border-0 rounded-3 shadow-none"
                    placeholder="Search candidates, employers, jobs, tickets, transactions..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                    style={{
                      background: "#f8faf9",
                      border: "1.5px solid #e2e8f0",
                      fontSize: "1rem",
                      paddingTop: "14px",
                      paddingBottom: "14px",
                      paddingLeft: "54px",
                      color: "#1e293b",
                      transition: "all 0.2s ease"
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#0d4f3c", e.target.style.background = "#fff", e.target.style.boxShadow = "0 0 0 4px rgba(13,79,60,0.1)")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0", e.target.style.background = "#f8faf9", e.target.style.boxShadow = "none")}
                  />
                  {query.length > 0 && (
                    <button
                      type="button"
                      className="btn position-absolute border-0 text-muted p-0 d-flex align-items-center justify-content-center"
                      style={{ right: "16px", top: "50%", transform: "translateY(-50%)", width: "30px", height: "30px" }}
                      onClick={() => setQuery("")}
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  )}
                </div>

                <div className="d-flex align-items-center justify-content-between mt-3 flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge rounded-pill text-muted bg-light border px-2.5 py-1.5" style={{ fontSize: "0.75rem", fontWeight: 500 }}>
                      <i className="fa-solid fa-bolt text-warning me-1"></i> Quick Filters: Candidates • Employers • Jobs • Tickets • Transactions
                    </span>
                  </div>
                  {query.trim().length > 0 && query.trim().length < 2 && (
                    <p className="small text-muted mb-0">Type at least 2 characters to trigger live search.</p>
                  )}
                  {query.trim().length >= 2 && !searching && (
                    <span className="small text-muted mb-0">
                      Found <strong className="text-dark">{totalCount}</strong> matching record{totalCount === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Empty States / Results */}
            {query.trim().length < 2 && (
              <div className="card border-0 rounded-4 shadow-sm text-center py-5" style={{ background: "#ffffff" }}>
                <div className="card-body p-4">
                  <div
                    className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
                    style={{ width: "70px", height: "70px", background: "rgba(13, 79, 60, 0.08)", color: "#0d4f3c" }}
                  >
                    <i className="fa-solid fa-magnifying-glass fs-2"></i>
                  </div>
                  <h5 className="fw-bold text-dark mb-1">Search Across the Entire Platform</h5>
                  <p className="text-muted mx-auto mb-0" style={{ maxWidth: "460px", fontSize: "0.9rem" }}>
                    Instantly look up candidate profiles, employer accounts, active job postings, support tickets, and payment transactions.
                  </p>
                </div>
              </div>
            )}

            {!searching && query.trim().length >= 2 && results.length === 0 && (
              <div className="card border-0 rounded-4 shadow-sm text-center py-5" style={{ background: "#ffffff" }}>
                <div className="card-body p-4">
                  <div
                    className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
                    style={{ width: "70px", height: "70px", background: "rgba(220, 53, 69, 0.08)", color: "#dc3545" }}
                  >
                    <i className="fa-solid fa-folder-open fs-2"></i>
                  </div>
                  <h5 className="fw-bold text-dark mb-1">No Results Found</h5>
                  <p className="text-muted mx-auto mb-0" style={{ maxWidth: "400px", fontSize: "0.9rem" }}>
                    We couldn&apos;t find any records matching &quot;<strong className="text-dark">{query}</strong>&quot;. Please check your spelling or try another keyword.
                  </p>
                </div>
              </div>
            )}

            {Object.entries(grouped).map(([type, items]) => {
              const typeKey = type as SearchResult["type"];
              const colorInfo = TYPE_COLORS[typeKey] || { bg: "rgba(13, 79, 60, 0.08)", text: "#0d4f3c", iconBg: "rgba(13, 79, 60, 0.12)" };
              const typeLabel = TYPE_LABELS[typeKey] || type;
              const typeIcon = TYPE_ICONS[typeKey] || "fa-file";

              return (
                <div className="card border-0 rounded-4 shadow-sm mb-4 overflow-hidden" key={type} style={{ background: "#ffffff" }}>
                  <div
                    className="card-header bg-white py-3 px-4 d-flex align-items-center justify-content-between border-bottom"
                    style={{ borderColor: "#f1f5f9" }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "32px", height: "32px", background: colorInfo.bg, color: colorInfo.text }}
                      >
                        <i className={`fa-solid ${typeIcon} fs-6`}></i>
                      </div>
                      <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: "0.95rem" }}>
                        {typeLabel}
                      </h6>
                    </div>
                    <span
                      className="badge rounded-pill fw-semibold px-2.5 py-1"
                      style={{ background: colorInfo.bg, color: colorInfo.text, fontSize: "0.75rem" }}
                    >
                      {items.length} {items.length === 1 ? "result" : "results"}
                    </span>
                  </div>
                  <div className="card-body p-3">
                    <div className="d-flex flex-column gap-2">
                      {items.map((r) => (
                        <a
                          key={r.id}
                          href={r.href}
                          className="d-flex justify-content-between align-items-center text-decoration-none px-3 py-2.5 rounded-3 transition-all"
                          style={{
                            border: "1px solid #f1f5f9",
                            background: "#ffffff",
                            transition: "all 0.2s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#0d4f3c";
                            e.currentTarget.style.background = "rgba(13, 79, 60, 0.03)";
                            e.currentTarget.style.transform = "translateX(4px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#f1f5f9";
                            e.currentTarget.style.background = "#ffffff";
                            e.currentTarget.style.transform = "none";
                          }}
                        >
                          <div className="d-flex flex-column">
                            <span className="fw-semibold text-dark" style={{ fontSize: "0.9rem" }}>
                              {r.title}
                            </span>
                            <span className="small text-muted" style={{ fontSize: "0.8rem" }}>
                              {r.subtitle}
                            </span>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <span className="small fw-medium text-muted" style={{ fontSize: "0.75rem" }}>
                              View
                            </span>
                            <i className="fa-solid fa-arrow-right text-muted" style={{ fontSize: "0.75rem" }}></i>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
