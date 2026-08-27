"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface BlogPostRow {
  id: string;
  title: string;
  slug: string;
  publishedAt: string | null;
  createdAt: string;
  author: { email: string };
}

interface BlogListResponse {
  items: BlogPostRow[];
  total: number;
}

export default function AdminContentModerationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<BlogListResponse | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function loadData() {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await api.get<BlogListResponse>(`/admin/content-moderation/blog-posts?${params.toString()}`);
      setData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load blog posts");
    }
  }

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    loadData();
  }, [user]);



  async function handleTogglePublished(id: string, published: boolean) {
    setActing(id);
    setError(null);
    try {
      await api.patch(`/admin/content-moderation/blog-posts/${id}/published`, { published });
      await loadData();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update post");
    } finally {
      setActing(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Permanently delete this blog post? This cannot be undone.")) return;
    setActing(id);
    setError(null);
    try {
      await api.delete(`/admin/content-moderation/blog-posts/${id}`);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete post");
    } finally {
      setActing(null);
    }
  }

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="content" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Content Moderation</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Content</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="card">
              <div className="card-header d-flex flex-wrap gap-2 justify-content-between align-items-center">
                <h6 className="mb-0">Blog Posts ({data?.total ?? 0})</h6>
                <form 
                  className="d-flex gap-2 flex-wrap" 
                  onSubmit={(e) => {
                    e.preventDefault();
                    loadData();
                  }}
                >
                  <input
                    type="text"
                    className="form-control"
                    style={{ maxWidth: 260 }}
                    placeholder="Search title..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <button type="submit" className="btn btn-secondary">Search</button>
                  <Link href="/admin-content/add-blog" className="btn btn-main d-flex align-items-center">
                    <i className="fa-solid fa-plus me-1"></i> Add Blog
                  </Link>
                </form>
              </div>
              <div className="card-body">
                {!data && <p className="text-muted">Loading...</p>}
                {data && data.items.length === 0 && <p className="text-muted">No blog posts found.</p>}
                {data && data.items.length > 0 && (
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Author</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.map((p) => (
                          <tr key={p.id}>
                            <td className="small fw-medium">{p.title}</td>
                            <td className="small">{p.author.email}</td>
                            <td>
                              <span className={`badge ${p.publishedAt ? "bg-success" : "bg-secondary"}`}>
                                {p.publishedAt ? "Published" : "Unpublished"}
                              </span>
                            </td>
                            <td className="small text-muted">{new Date(p.createdAt).toLocaleDateString()}</td>
                            <td className="d-flex gap-2 flex-wrap">
                              <Link href={`/admin-content/edit-blog/${p.id}`} className="btn btn-sm btn-outline-secondary">
                                Edit
                              </Link>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-main"
                                disabled={acting === p.id}
                                onClick={() => handleTogglePublished(p.id, !p.publishedAt)}
                              >
                                {p.publishedAt ? "Unpublish" : "Publish"}
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                disabled={acting === p.id}
                                onClick={() => handleDelete(p.id)}
                              >
                                Delete
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

