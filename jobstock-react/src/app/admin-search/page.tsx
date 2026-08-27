"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  candidate: "Candidate",
  employer: "Employer",
  job: "Job",
  ticket: "Support Ticket",
  transaction: "Transaction",
};

const TYPE_ICONS: Record<SearchResult["type"], string> = {
  candidate: "fa-user-graduate",
  employer: "fa-building",
  job: "fa-briefcase",
  ticket: "fa-headset",
  transaction: "fa-sack-dollar",
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

  return (
    <>
      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="search" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Global Search</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Search</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="card mb-4">
              <div className="card-body">
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Search candidates, employers, jobs, tickets, transactions..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
                {query.trim().length > 0 && query.trim().length < 2 && (
                  <p className="small text-muted mt-2 mb-0">Type at least 2 characters to search.</p>
                )}
              </div>
            </div>

            {searching && <p className="text-muted">Searching...</p>}

            {!searching && query.trim().length >= 2 && results.length === 0 && (
              <p className="text-muted">No results found for &quot;{query}&quot;.</p>
            )}

            {Object.entries(grouped).map(([type, items]) => (
              <div className="card mb-4" key={type}>
                <div className="card-header">
                  <h6 className="mb-0">
                    <i className={`fa-solid ${TYPE_ICONS[type as SearchResult["type"]]} me-2`}></i>
                    {TYPE_LABELS[type as SearchResult["type"]]} ({items.length})
                  </h6>
                </div>
                <div className="card-body">
                  <div className="d-flex flex-column gap-1">
                    {items.map((r) => (
                      <a
                        key={r.id}
                        href={r.href}
                        className="d-flex justify-content-between text-decoration-none px-2 py-2 rounded"
                        style={{ border: "1px solid #eee" }}
                      >
                        <span className="small fw-medium text-body">{r.title}</span>
                        <span className="small text-muted">{r.subtitle}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}
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

