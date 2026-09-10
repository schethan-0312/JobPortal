"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, uploadFile, assetUrl, ApiError } from "@/lib/api";
import Swal from "sweetalert2";
import toast, { Toaster } from "react-hot-toast";

export default function AddBlogPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category: "",
    excerpt: "",
    body: "",
    author: "",
    status: "draft",
    servicePageLink: "",
    readTimeMinutes: "",
    seoTitle: "",
    seoKeywords: "",
    seoDescription: "",
    coverImageUrl: "",
    images: [] as string[],
  });

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    } else if (user && !formData.author) {
      setFormData((prev) => ({ ...prev, author: user.email || "" }));
    }
  }, [loading, user, router]);

  const handleSubmit = async (e: React.FormEvent, submitStatus: "draft" | "published") => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.body.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Required Fields Missing",
        text: "Please enter both blog title and article content before saving.",
        customClass: {
          popup: "elite-pkg-popup",
          title: "elite-pkg-title",
          confirmButton: "elite-pkg-btn",
        },
        confirmButtonColor: "#0d4f3c",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        title: formData.title,
        body: formData.body,
        status: submitStatus,
      };

      if (formData.author) payload.author = formData.author;
      if (formData.excerpt) payload.excerpt = formData.excerpt;
      if (formData.category) payload.category = formData.category;
      if (formData.servicePageLink) payload.servicePageLink = formData.servicePageLink;
      if (formData.readTimeMinutes) {
        const parsedTime = parseInt(formData.readTimeMinutes.toString(), 10);
        if (!isNaN(parsedTime)) {
          payload.readTimeMinutes = parsedTime;
        }
      }
      if (formData.seoTitle) payload.seoTitle = formData.seoTitle;
      if (formData.seoKeywords) payload.seoKeywords = formData.seoKeywords;
      if (formData.seoDescription) payload.seoDescription = formData.seoDescription;
      if (formData.coverImageUrl) payload.coverImageUrl = formData.coverImageUrl;
      if (formData.images.length > 0) payload.images = formData.images;

      await api.post("/blog", payload);
      
      await Swal.fire({
        icon: "success",
        title: submitStatus === "published" ? "Blog Post Published!" : "Draft Saved Successfully",
        text: submitStatus === "published" 
          ? "Your article is now live on JobStock knowledge base."
          : "Draft saved. You can continue editing and publish whenever you're ready.",
        customClass: {
          popup: "elite-pkg-popup",
          title: "elite-pkg-title",
          confirmButton: "elite-pkg-btn",
        },
        confirmButtonColor: "#0d4f3c",
      });

      router.refresh();
      router.push("/admin-content");
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: err.message || "Failed to create blog post",
        customClass: {
          popup: "elite-pkg-popup",
          title: "elite-pkg-title",
          confirmButton: "elite-pkg-btn",
        },
        confirmButtonColor: "#0d4f3c",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsUploadingFiles(true);
    try {
      const newImages = [...formData.images];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const res = await uploadFile<{ url: string }>("/uploads/image", file);
        if (res.url) {
          const fullUrl = assetUrl(res.url) || res.url;
          if (i === 0 && !formData.coverImageUrl) {
            setFormData((prev) => ({ ...prev, coverImageUrl: fullUrl }));
          }
          newImages.push(fullUrl);
        }
      }
      setFormData((prev) => ({ ...prev, images: newImages }));
      toast.success("Images uploaded successfully!");
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: err.message || "Failed to upload images",
        customClass: {
          popup: "elite-pkg-popup",
          title: "elite-pkg-title",
          confirmButton: "elite-pkg-btn",
        },
        confirmButtonColor: "#0d4f3c",
      });
    } finally {
      setIsUploadingFiles(false);
      e.target.value = "";
    }
  };

  const handleAiDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    setIsAiLoading(true);
    try {
      const res = await uploadFile<any>("/admin/ai/blog-from-document", file);

      setFormData((prev) => ({
        ...prev,
        title: res.title || prev.title,
        excerpt: res.excerpt || prev.excerpt,
        body: res.body || prev.body,
        category: res.category || prev.category,
        seoTitle: res.seoTitle || prev.seoTitle,
        seoKeywords: res.seoKeywords || prev.seoKeywords,
        seoDescription: res.seoDescription || prev.seoDescription,
        readTimeMinutes: res.readTimeMinutes?.toString() || prev.readTimeMinutes,
      }));

      Swal.fire({
        icon: "success",
        title: "Document Parsed with AI!",
        text: "Blog title, summary, SEO fields, and content were automatically generated from your file.",
        customClass: {
          popup: "elite-pkg-popup",
          title: "elite-pkg-title",
          confirmButton: "elite-pkg-btn",
        },
        confirmButtonColor: "#0d4f3c",
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "AI Parsing Failed",
        text: err.message || "Failed to parse document with AI",
        customClass: {
          popup: "elite-pkg-popup",
          title: "elite-pkg-title",
          confirmButton: "elite-pkg-btn",
        },
        confirmButtonColor: "#0d4f3c",
      });
    } finally {
      setIsAiLoading(false);
      e.target.value = "";
    }
  };

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

        .mint-back-btn {
          background: #ffffff;
          border: 1.5px solid #d6e8e4;
          color: #0d4f3c;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 9px;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
        }
        .mint-back-btn:hover {
          background: #e8f5f1;
          border-color: #429e85;
          color: #08382b;
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
          padding: 9px 14px;
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

        .btn-ai-magic {
          background: #e8f5f1;
          border: 1.5px solid #bce2d8;
          color: #0d4f3c;
          font-weight: 700;
          font-size: 13px;
          padding: 7px 16px;
          border-radius: 9px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-ai-magic:hover {
          background: #d4ece5;
          color: #08382b;
          border-color: #429e85;
        }

        .btn-save-draft {
          background: #ffffff;
          border: 1.5px solid #d6e8e4;
          color: #4b635b;
          font-weight: 700;
          font-size: 13.5px;
          padding: 9px 20px;
          border-radius: 9px;
          transition: all 0.2s;
        }
        .btn-save-draft:hover {
          background: #f4f9f8;
          color: #0b2b22;
        }

        .btn-publish-main {
          background: #0d4f3c;
          border: 1px solid #0d4f3c;
          color: #ffffff;
          font-weight: 700;
          font-size: 13.5px;
          padding: 9px 24px;
          border-radius: 9px;
          transition: all 0.2s;
        }
        .btn-publish-main:hover {
          background: #08382b;
          color: #ffffff;
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
              <div className="d-flex align-items-center gap-2 mb-1">
                <Link href="/admin-content" className="mint-back-btn py-1 px-2" style={{ fontSize: "12px" }}>
                  <i className="fa-solid fa-arrow-left"></i> Back to Content
                </Link>
                <h1 className="pkg-header-title mb-0">Compose New Article</h1>
              </div>
              <p className="pkg-header-subtitle mb-0">
                Draft rich blog posts, knowledge articles, and configure SEO discovery settings.
              </p>
            </div>
            <div>
              <label
                className={`btn-ai-magic ${isAiLoading ? "opacity-50" : ""}`}
              >
                {isAiLoading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> AI Processing Document...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-wand-magic-sparkles text-warning"></i> Auto-fill with AI (PDF/Word)
                  </>
                )}
                <input
                  type="file"
                  className="d-none"
                  accept=".pdf,.doc,.docx"
                  onChange={handleAiDocumentUpload}
                  disabled={isAiLoading}
                />
              </label>
            </div>
          </div>

          {/* Main Form Card */}
          <div className="elite-card">
            <div className="elite-card-header">
              <h2 className="elite-card-title">
                <i className="fa-solid fa-pen-nib" style={{ color: "#429e85" }}></i>
                Article Content &amp; Meta Details
              </h2>
            </div>

            <div className="p-4">
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-field-label">
                      1. Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      className="filter-input"
                      required
                      placeholder="e.g. 10 Tips for Software Engineer Resumes in 2026"
                      value={formData.title}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-field-label">2. URL Slug</label>
                    <input
                      type="text"
                      name="slug"
                      className="filter-input"
                      placeholder="e.g. software-engineer-resume-tips"
                      value={formData.slug}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-field-label">3. Category</label>
                    <select
                      name="category"
                      className="filter-input"
                      value={formData.category}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Category</option>
                      <option value="technology">Technology</option>
                      <option value="career">Career Advice</option>
                      <option value="news">Company News</option>
                      <option value="hiring">Hiring Trends</option>
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-field-label">4. Author (Attribution)</label>
                    <input
                      type="text"
                      name="author"
                      className="filter-input"
                      placeholder="Author name"
                      value={formData.author}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-field-label">5. Excerpt / Summary</label>
                    <textarea
                      name="excerpt"
                      className="filter-input"
                      rows={3}
                      placeholder="Brief article preview summary for cards and search cards..."
                      value={formData.excerpt}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>

                  <div className="col-12">
                    <label className="form-field-label">
                      6. Full Article Content (HTML / Rich Text) <span className="text-danger">*</span>
                    </label>
                    <textarea
                      name="body"
                      className="filter-input font-monospace"
                      rows={14}
                      required
                      placeholder="Write your comprehensive blog article content here..."
                      style={{ minHeight: "280px", fontSize: "13.5px", lineHeight: "1.6" }}
                      value={formData.body}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-field-label">7. Service / CTA Link</label>
                    <input
                      type="url"
                      name="servicePageLink"
                      className="filter-input"
                      placeholder="https://..."
                      value={formData.servicePageLink}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-field-label">8. Estimated Read Time (Minutes)</label>
                    <input
                      type="number"
                      name="readTimeMinutes"
                      className="filter-input"
                      min={1}
                      placeholder="e.g. 5"
                      value={formData.readTimeMinutes}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Images Section */}
                  <div className="col-12">
                    <label className="form-field-label">9. Featured Cover &amp; Gallery Images</label>
                    <div className="p-3 rounded-3" style={{ background: "#fbfdfc", border: "1.5px dashed #d6e8e4" }}>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        disabled={isUploadingFiles}
                      />
                      {isUploadingFiles && (
                        <p className="text-primary small mb-0 mt-2">
                          <i className="fa-solid fa-circle-notch fa-spin me-1"></i> Uploading images...
                        </p>
                      )}

                      {formData.images.length > 0 && (
                        <div className="mt-3 d-flex gap-2 flex-wrap">
                          {formData.images.map((img, idx) => (
                            <div key={idx} style={{ position: "relative" }}>
                              <img
                                src={img}
                                alt="Uploaded"
                                style={{
                                  width: "70px",
                                  height: "70px",
                                  objectFit: "cover",
                                  borderRadius: "8px",
                                  border: "1px solid #d6e8e4"
                                }}
                              />
                              <button
                                type="button"
                                className="btn btn-sm btn-danger p-0"
                                style={{
                                  position: "absolute",
                                  top: -6,
                                  right: -6,
                                  width: 20,
                                  height: 20,
                                  borderRadius: "50%",
                                  fontSize: "11px",
                                  lineHeight: 1
                                }}
                                onClick={() => {
                                  const updated = [...formData.images];
                                  updated.splice(idx, 1);
                                  setFormData((prev) => ({ ...prev, images: updated }));
                                }}
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-2">
                        <small className="text-muted">Or enter direct Cover Image URL below:</small>
                        <input
                          type="url"
                          name="coverImageUrl"
                          className="filter-input mt-1"
                          placeholder="https://..."
                          value={formData.coverImageUrl}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  {/* SEO Section */}
                  <div className="col-12 mt-4">
                    <h6 className="fw-bold border-bottom pb-2" style={{ color: "#0b2b22" }}>
                      <i className="fa-solid fa-magnifying-glass-chart me-1" style={{ color: "#429e85" }}></i>
                      Search Engine Optimization (SEO)
                    </h6>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-field-label">10. SEO Title</label>
                    <input
                      type="text"
                      name="seoTitle"
                      className="filter-input"
                      placeholder="Optimized meta title"
                      value={formData.seoTitle}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-field-label">11. SEO Keywords</label>
                    <input
                      type="text"
                      name="seoKeywords"
                      className="filter-input"
                      placeholder="keyword1, keyword2, job search"
                      value={formData.seoKeywords}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-field-label">12. SEO Meta Description</label>
                    <textarea
                      name="seoDescription"
                      className="filter-input"
                      rows={2}
                      placeholder="Concise 150-160 character description for search engine snippets..."
                      value={formData.seoDescription}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>

                  {/* Actions */}
                  <div className="col-12 mt-4 d-flex justify-content-end gap-2 flex-wrap">
                    <Link href="/admin-content" className="mint-back-btn">
                      Cancel
                    </Link>
                    <button
                      type="button"
                      className="btn-save-draft"
                      disabled={isSubmitting}
                      onClick={(e) => handleSubmit(e, "draft")}
                    >
                      {isSubmitting ? "Saving..." : "Save Draft"}
                    </button>
                    <button
                      type="button"
                      className="btn-publish-main"
                      disabled={isSubmitting}
                      onClick={(e) => handleSubmit(e, "published")}
                    >
                      {isSubmitting ? (
                        <>
                          <i className="fa-solid fa-circle-notch fa-spin me-1"></i> Publishing...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-globe me-1"></i> Publish Article
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
