"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, uploadFile, assetUrl } from "@/lib/api";

export default function AddBlogPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
    images: [] as string[]
  });

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    } else if (user && !formData.author) {
      setFormData(prev => ({ ...prev, author: user.email || "" }));
    }
  }, [loading, user, router]);

  const handleSubmit = async (e: React.FormEvent, submitStatus: 'draft' | 'published') => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
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

      await api.post('/blog', payload);
      setSuccessMessage("Blog uploaded successfully");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      setTimeout(() => {
        router.refresh();
        router.push("/admin-content");
      }, 1500);

    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create blog post");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploadingFiles(true);
    setErrorMessage(null);
    try {
      const newImages = [...formData.images];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const res = await uploadFile<{ url: string }>('/uploads/image', file);
        if (res.url) {
          const fullUrl = assetUrl(res.url) || res.url;
          if (i === 0 && !formData.coverImageUrl) {
            setFormData(prev => ({ ...prev, coverImageUrl: fullUrl }));
          }
          newImages.push(fullUrl);
        }
      }
      setFormData(prev => ({ ...prev, images: newImages }));
      setSuccessMessage("Images uploaded successfully!");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to upload images");
    } finally {
      setIsUploadingFiles(false);
      e.target.value = '';
    }
  };

  const handleAiDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsAiLoading(true);
    setErrorMessage(null);
    try {
      const res = await uploadFile<any>('/admin/ai/blog-from-document', file);
      
      setFormData(prev => ({
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
      setSuccessMessage("Blog post auto-filled from document magically! âœ¨");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to parse document with AI");
    } finally {
      setIsAiLoading(false);
      e.target.value = '';
    }
  };

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
                <h1 className="mb-1 fs-3 fw-medium">Add Blog Post</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item"><Link href="/admin-content" className="text-muted">Content</Link></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Add Blog</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {successMessage && <div className="alert alert-success">{successMessage}</div>}
            {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Blog Details</h6>
                <div>
                  <label className={`btn btn-sm btn-outline-main mb-0 ${isAiLoading ? 'disabled' : ''}`} style={{ cursor: 'pointer' }}>
                    {isAiLoading ? (
                      <><i className="fa-solid fa-spinner fa-spin me-1"></i> Reading Document...</>
                    ) : (
                      <><i className="fa-solid fa-wand-magic-sparkles me-1"></i> Auto-fill with AI (PDF/Word)</>
                    )}
                    <input type="file" className="d-none" accept=".pdf,.doc,.docx" onChange={handleAiDocumentUpload} disabled={isAiLoading} />
                  </label>
                </div>
              </div>
              <div className="card-body">
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">1. TITLE <span className="text-danger">*</span></label>
                      <input type="text" name="title" className="form-control" required placeholder="Enter blog title" value={formData.title} onChange={handleInputChange} />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label">2. URL SLUG</label>
                      <input type="text" name="slug" className="form-control" placeholder="my-blog-post" value={formData.slug} onChange={handleInputChange} />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">3. CATEGORY</label>
                      <select name="category" className="form-select" value={formData.category} onChange={handleInputChange}>
                        <option value="">Select category</option>
                        <option value="technology">Technology</option>
                        <option value="career">Career Advice</option>
                        <option value="news">Company News</option>
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">6. AUTHOR (Customizable)</label>
                      <input type="text" name="author" className="form-control" placeholder="Author name" value={formData.author} onChange={handleInputChange} />
                    </div>

                    <div className="col-md-12 mb-3">
                      <label className="form-label">4. EXCERPT</label>
                      <textarea name="excerpt" className="form-control" rows={3} placeholder="Brief summary of the blog post..." value={formData.excerpt} onChange={handleInputChange}></textarea>
                    </div>

                    <div className="col-md-12 mb-3">
                      <label className="form-label">5. CONTENT (HTML) <span className="text-danger">*</span></label>
                      <textarea name="body" className="form-control" rows={15} required placeholder="Write your full blog content here (Supports 50000+ characters)..." style={{ minHeight: '300px' }} value={formData.body} onChange={handleInputChange}></textarea>
                      <small className="text-muted">You can add large amounts of information here (no character limit).</small>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">7. STATUS</label>
                      <select name="status" className="form-select" value={formData.status} onChange={handleInputChange}>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">8. SERVICE PAGE LINK (CTA)</label>
                      <input type="url" name="servicePageLink" className="form-control" placeholder="https://..." value={formData.servicePageLink} onChange={handleInputChange} />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">9. READ TIME (MINUTES)</label>
                      <input type="number" name="readTimeMinutes" className="form-control" min={1} placeholder="e.g. 5" value={formData.readTimeMinutes} onChange={handleInputChange} />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">13. FEATURED IMAGE & GALLERY (Multiple allowed)</label>
                      <input type="file" className="form-control" accept="image/*" multiple onChange={handleFileUpload} disabled={isUploadingFiles} />
                      {isUploadingFiles && <small className="text-primary d-block mt-1"><i className="fa-solid fa-spinner fa-spin"></i> Uploading images...</small>}
                      {formData.images.length > 0 && (
                        <div className="mt-2 d-flex gap-2 flex-wrap">
                          {formData.images.map((img, idx) => (
                            <div key={idx} style={{ position: 'relative' }}>
                              <img src={img} alt="Uploaded" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                              <button type="button" className="btn btn-sm btn-danger p-0" style={{ position: 'absolute', top: -5, right: -5, width: 20, height: 20, borderRadius: '50%' }} onClick={() => {
                                const updated = [...formData.images];
                                updated.splice(idx, 1);
                                setFormData(prev => ({ ...prev, images: updated }));
                              }}>&times;</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <small className="text-muted d-block mt-3">Or enter Cover Image URL below</small>
                      <input type="url" name="coverImageUrl" className="form-control mt-1" placeholder="https://..." value={formData.coverImageUrl} onChange={handleInputChange} />
                    </div>

                    <div className="col-md-12 mb-3 mt-3">
                      <h6 className="border-bottom pb-2">SEO Settings</h6>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">10. SEO TITLE</label>
                      <input type="text" name="seoTitle" className="form-control" placeholder="SEO optimized title" value={formData.seoTitle} onChange={handleInputChange} />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">11. SEO KEYWORDS</label>
                      <input type="text" name="seoKeywords" className="form-control" placeholder="keyword1, keyword2" value={formData.seoKeywords} onChange={handleInputChange} />
                    </div>

                    <div className="col-md-12 mb-3">
                      <label className="form-label">12. SEO DESCRIPTION</label>
                      <textarea name="seoDescription" className="form-control" rows={2} placeholder="Meta description for search engines..." value={formData.seoDescription} onChange={handleInputChange}></textarea>
                    </div>

                    <div className="col-md-12 mt-4 d-flex justify-content-end gap-2 flex-wrap">
                      <Link href="/admin-content" className="btn btn-secondary">Cancel</Link>
                      <button type="button" className="btn btn-outline-main" disabled={isSubmitting} onClick={(e) => handleSubmit(e, 'draft')}>
                        Save Draft
                      </button>
                      <button type="button" className="btn btn-main" disabled={isSubmitting} onClick={(e) => handleSubmit(e, 'published')}>
                        Publish
                      </button>
                    </div>
                  </div>
                </form>
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

