"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import Swal from "sweetalert2";
import toast, { Toaster } from "react-hot-toast";

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
  const [fetching, setFetching] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function loadData(isSilent = false) {
    if (!isSilent) setFetching(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await api.get<BlogListResponse>(`/admin/content-moderation/blog-posts?${params.toString()}`);
      setData(res);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed to Load Content",
        text: err instanceof ApiError ? err.message : "Failed to load blog posts",
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
    if (!user || user.role !== "ADMIN") return;
    loadData();
  }, [user]);

  async function handleTogglePublished(id: string, published: boolean) {
    const actionVerb = published ? "Publish" : "Unpublish";
    const confirm = await Swal.fire({
      title: `${actionVerb} Blog Post?`,
      text: published
        ? "This will make the blog post visible publicly to candidates and employers."
        : "This will revert the post to draft mode and hide it from the public site.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: published ? "#0d4f3c" : "#d97706",
      cancelButtonColor: "#8ea59d",
      confirmButtonText: `Yes, ${actionVerb}`,
      cancelButtonText: "Cancel",
      customClass: {
        popup: "elite-pkg-popup",
        title: "elite-pkg-title",
        confirmButton: "elite-pkg-btn",
      },
    });

    if (!confirm.isConfirmed) return;

    setActing(id);
    try {
      await api.patch(`/admin/content-moderation/blog-posts/${id}/published`, { published });
      toast.success(`Blog post ${actionVerb.toLowerCase()}ed successfully!`);
      await loadData(true);
      router.refresh();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: err instanceof ApiError ? err.message : "Failed to update post status",
        customClass: {
          popup: "elite-pkg-popup",
          title: "elite-pkg-title",
          confirmButton: "elite-pkg-btn",
        },
        confirmButtonColor: "#0d4f3c",
      });
    } finally {
      setActing(null);
    }
  }

  async function handleDelete(id: string) {
    const confirm = await Swal.fire({
      title: "Delete Blog Post?",
      text: "Are you sure you want to permanently delete this blog post? This action cannot be undone.",
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

    setActing(id);
    try {
      await api.delete(`/admin/content-moderation/blog-posts/${id}`);
      toast.success("Blog post deleted successfully!");
      await loadData(true);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: err instanceof ApiError ? err.message : "Failed to delete post",
        customClass: {
          popup: "elite-pkg-popup",
          title: "elite-pkg-title",
          confirmButton: "elite-pkg-btn",
        },
        confirmButtonColor: "#0d4f3c",
      });
    } finally {
      setActing(null);
    }
  }

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  const totalBlogs = data?.total ?? 0;
  const publishedCount = data?.items.filter((b) => b.publishedAt !== null).length ?? 0;
  const draftCount = data ? data.items.length - publishedCount : 0;

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

        .blog-table-wrap {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .blog-table {
          width: 100%;
          min-width: 800px;
          border-collapse: collapse;
          white-space: nowrap;
        }
        .blog-table th {
          background: #f8fbfa;
          color: #446158;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 14px 18px;
          border-bottom: 1px solid #d6e8e4;
        }
        .blog-table td {
          padding: 14px 18px;
          border-bottom: 1px solid #eef5f3;
          color: #334d44;
          font-size: 13.5px;
          vertical-align: middle;
        }
        .blog-table tbody tr {
          transition: background 0.15s ease;
        }
        .blog-table tbody tr:hover {
          background: #f2f9f6;
        }

        .badge-status {
          font-size: 11.5px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .badge-status.published { background: #e8f5f1; color: #0d4f3c; border: 1px solid #bce2d8; }
        .badge-status.draft { background: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb; }

        .btn-add-primary {
          background: #0d4f3c;
          border: 1px solid #0d4f3c;
          color: #ffffff;
          font-weight: 700;
          font-size: 13px;
          padding: 8px 18px;
          border-radius: 9px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn-add-primary:hover {
          background: #08382b;
          color: #ffffff;
        }

        .filter-input {
          background: #ffffff;
          border: 1.5px solid #d6e8e4;
          border-radius: 9px;
          padding: 7px 12px;
          font-size: 13px;
          color: #0b2b22;
          transition: all 0.2s;
        }
        .filter-input:focus {
          border-color: #429e85;
          outline: none;
          box-shadow: 0 0 0 3px rgba(66, 158, 133, 0.15);
        }

        .action-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          border: 1px solid #d6e8e4;
          background: #ffffff;
          color: #446158;
          transition: all 0.2s;
          text-decoration: none;
        }
        .action-icon-btn:hover {
          background: #e8f5f1;
          color: #0d4f3c;
          border-color: #429e85;
        }
        .action-icon-btn.danger:hover {
          background: #fee2e2;
          color: #dc2626;
          border-color: #fca5a5;
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
        <AdminSidebar active="content" />

        <div className="dashboard-content pkg-page">
          {/* Header */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
              <h1 className="pkg-header-title mb-1">Content &amp; Blog Moderation</h1>
              <p className="pkg-header-subtitle mb-0">
                Manage articles, knowledge base publications, publish statuses, and SEO content.
              </p>
            </div>
            <div>
              <Link href="/admin-content/add-blog" className="btn-add-primary">
                <i className="fa-solid fa-plus"></i> Write New Blog
              </Link>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="row align-items-center gx-4 gy-4 mb-4">
            <div className="col-12 col-sm-6 col-md-6 col-lg-4">
              <div className="dash-wrap-bloud">
                <div className="dash-wrap-glow" style={{ background: "#dbfbf5" }}></div>
                <div className="dash-wrap-bloud-icon">
                  <div className="bloud-icon" style={{ backgroundColor: "#def5f0", color: "#134d42" }}>
                    <i className="fa-solid fa-newspaper"></i>
                  </div>
                </div>
                <div className="dash-wrap-bloud-caption">
                  <div className="dash-wrap-bloud-content">
                    <h5 className="ctr">{totalBlogs}</h5>
                    <p>Total Blog Articles</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-md-6 col-lg-4">
              <div className="dash-wrap-bloud">
                <div className="dash-wrap-glow" style={{ background: "#dcf4fa" }}></div>
                <div className="dash-wrap-bloud-icon">
                  <div className="bloud-icon" style={{ backgroundColor: "#eef3f5", color: "#174742" }}>
                    <i className="fa-solid fa-circle-check"></i>
                  </div>
                </div>
                <div className="dash-wrap-bloud-caption">
                  <div className="dash-wrap-bloud-content">
                    <h5 className="ctr">{publishedCount}</h5>
                    <p>Published &amp; Live</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-md-6 col-lg-4">
              <div className="dash-wrap-bloud">
                <div className="dash-wrap-glow" style={{ background: "#fff3dc" }}></div>
                <div className="dash-wrap-bloud-icon">
                  <div className="bloud-icon" style={{ backgroundColor: "#fdf3e0", color: "#b07c1a" }}>
                    <i className="fa-solid fa-file-pen"></i>
                  </div>
                </div>
                <div className="dash-wrap-bloud-caption">
                  <div className="dash-wrap-bloud-content">
                    <h5 className="ctr">{draftCount}</h5>
                    <p>Draft / Unpublished</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Card */}
          <div className="elite-card">
            <div className="elite-card-header d-flex flex-wrap gap-3 justify-content-between align-items-center">
              <h2 className="elite-card-title">
                <i className="fa-solid fa-book-open-reader" style={{ color: "#429e85" }}></i>
                Blog Posts Directory ({data?.total ?? 0})
              </h2>

              <form
                className="d-flex gap-2 flex-wrap"
                onSubmit={(e) => {
                  e.preventDefault();
                  loadData();
                }}
              >
                <input
                  type="text"
                  className="filter-input"
                  style={{ width: "240px" }}
                  placeholder="Search title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn btn-sm"
                  style={{
                    background: "#ffffff",
                    border: "1.5px solid #d6e8e4",
                    color: "#0d4f3c",
                    fontWeight: 600,
                    borderRadius: "8px",
                    padding: "6px 14px"
                  }}
                >
                  <i className="fa-solid fa-magnifying-glass me-1"></i> Search
                </button>
              </form>
            </div>

            <div className="blog-table-wrap">
              {fetching && !data && (
                <div className="text-center py-5">
                  <i className="fa-solid fa-circle-notch fa-spin text-muted fs-2 mb-2"></i>
                  <p className="text-muted fw-semibold">Loading blog articles...</p>
                </div>
              )}

              {data && data.items.length === 0 && (
                <div className="text-center py-5">
                  <i className="fa-solid fa-newspaper text-muted fs-1 mb-2"></i>
                  <h5 className="fw-bold" style={{ color: "#0b2b22" }}>No Blog Posts Found</h5>
                  <p className="text-muted small mb-0">Create your first blog post to populate content.</p>
                </div>
              )}

              {data && data.items.length > 0 && (
                <table className="blog-table">
                  <thead>
                    <tr>
                      <th>Article Title</th>
                      <th>Author</th>
                      <th>Status</th>
                      <th>Created Date</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((p) => {
                      const isPublished = !!p.publishedAt;
                      return (
                        <tr key={p.id}>
                          <td>
                            <div className="fw-bold" style={{ color: "#0b2b22", fontSize: "14px" }}>
                              {p.title}
                            </div>
                            <div className="text-muted small" style={{ fontSize: "12px" }}>
                              /{p.slug}
                            </div>
                          </td>
                          <td>
                            <span className="text-muted" style={{ fontSize: "13px" }}>
                              <i className="fa-solid fa-user-pen me-1 text-muted"></i>
                              {p.author?.email || "Admin"}
                            </span>
                          </td>
                          <td>
                            <span className={`badge-status ${isPublished ? "published" : "draft"}`}>
                              <i className="fa-solid fa-circle" style={{ fontSize: "6px" }}></i>
                              {isPublished ? "Published" : "Draft / Hidden"}
                            </span>
                          </td>
                          <td className="text-muted">
                            {new Date(p.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="text-end">
                            <div className="d-flex justify-content-end gap-2 align-items-center">
                              <Link
                                href={`/admin-content/edit-blog/${p.id}`}
                                className="action-icon-btn"
                                title="Edit Article"
                              >
                                <i className="fa-solid fa-pen-to-square"></i>
                              </Link>

                              <button
                                type="button"
                                className="action-icon-btn"
                                title={isPublished ? "Unpublish Article" : "Publish Article"}
                                disabled={acting === p.id}
                                onClick={() => handleTogglePublished(p.id, !isPublished)}
                              >
                                <i className={`fa-solid ${isPublished ? "fa-eye-slash text-warning" : "fa-globe text-success"}`}></i>
                              </button>

                              <button
                                type="button"
                                className="action-icon-btn danger"
                                title="Delete Article"
                                disabled={acting === p.id}
                                onClick={() => handleDelete(p.id)}
                              >
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
