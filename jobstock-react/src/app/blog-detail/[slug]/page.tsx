import Navbar2 from "@/components/Navbar2";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import { api, ApiError } from "@/lib/api";
import ImageSlider from "@/components/ImageSlider";
import TableOfContents from "@/components/TableOfContents";

export const dynamic = "force-dynamic";

interface BlogPostDetail {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  coverImageUrl: string | null;
  publishedAt: string | null;
  category: string | null;
  readTimeMinutes: number | null;
  servicePageLink: string | null;
  images: string[];
  author: { email: string };
  customAuthorName?: string | null;
}

async function getPost(slug: string) {
  try {
    return await api.get<BlogPostDetail>(`/blog/${slug}`, { auth: false });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return (
      <>
        <Navbar2 />
        <section className="gray-simple">
          <div className="container py-5 text-center">
            <h3>Post not found</h3>
          </div>
        </section>
        <LoginModal />
        <Footer />
      </>
    );
  }

  const article = {
    img: post.coverImageUrl ?? undefined,
    date: post.publishedAt
      ? new Date(post.publishedAt).toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" })
      : "Draft",
    title: post.title,
  };

  return (
    <div style={{ backgroundColor: '#F9F7F1', minHeight: '100vh' }}>
      <Navbar2 />
      <style dangerouslySetInnerHTML={{ __html: `
        .serif-font { font-family: 'Playfair Display', 'Merriweather', 'Georgia', 'Times New Roman', serif; color: #2E4A3D; }
        .post-content h1, .post-content h2, .post-content h3, .post-content h4, .post-content h5, .post-content h6 {
          font-family: 'Playfair Display', 'Merriweather', 'Georgia', 'Times New Roman', serif;
          color: #2E4A3D;
          margin-top: 2.5rem;
          margin-bottom: 1.25rem;
          font-weight: 500;
        }
        .post-content h2 { font-size: 2rem; }
        .post-content h3 { font-size: 1.5rem; }
        .post-content p { color: #5c5a53; font-size: 1.1rem; line-height: 1.9; margin-bottom: 1.5rem; font-weight: 300; }
        .post-content ul, .post-content ol { color: #5c5a53; font-size: 1.1rem; line-height: 1.9; margin-bottom: 1.5rem; font-weight: 300; }
        .post-content a { color: #2E4A3D; text-decoration: underline; font-weight: 500; }
        .blog-breadcrumb a { color: #7a766c; text-decoration: none; }
        .blog-breadcrumb a:hover { color: #2E4A3D; }
      `}} />

      <section className="py-5" style={{ backgroundColor: '#F9F7F1' }}>
        <div className="container" style={{ maxWidth: '1200px' }}>
          
          {/* Two Column Layout for Entire Page */}
          <div className="row position-relative">
            {/* Left Sidebar (Sticky TOC) */}
            <div className="col-lg-3 d-none d-lg-block">
              <TableOfContents selector=".post-content" />
            </div>

            {/* Right Column (Main Content) */}
            <div className="col-lg-9 col-md-12 pe-lg-5">
              
              {/* Top Hero Section (Now inside the right column) */}
              <div className="mb-5">
                {/* Breadcrumbs */}
                <div className="blog-breadcrumb mb-4" style={{ fontSize: '0.9rem', color: '#7a766c' }}>
                  <a href="/">Home</a> / <a href="/blog">Blog</a> {post.category && <> / <span style={{ color: '#2E4A3D', fontWeight: '500' }}>{post.category}</span></>}
                </div>

                {/* Meta Tags */}
                <div className="d-flex align-items-center gap-3 mb-4 text-uppercase fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '1px', color: '#7a766c' }}>
                  {post.category && <span className="badge bg-white text-dark px-3 py-2 rounded-pill" style={{ border: '1px solid #d4d1c9' }}>{post.category}</span>}
                  <span>{article.date}</span>
                  {post.readTimeMinutes && (
                    <>
                      <span style={{ fontSize: '4px' }}>&#9679;</span>
                      <span>{post.readTimeMinutes} MIN READ</span>
                    </>
                  )}
                </div>

                {/* Title & Excerpt */}
                <h1 className="serif-font fw-bold mb-4" style={{ fontSize: '3.2rem', lineHeight: '1.2' }}>
                  {article.title}
                </h1>
                {post.excerpt && (
                  <p className="mb-4" style={{ color: '#5c5a53', fontSize: '1.25rem', lineHeight: '1.7', fontWeight: '300' }}>
                    {post.excerpt}
                  </p>
                )}

                {/* Author Info */}
                <div className="d-flex align-items-center gap-3 mt-4">
                  <div className="d-flex align-items-center justify-content-center text-white rounded-circle fs-5 fw-bold shadow-sm" style={{ width: '50px', height: '50px', backgroundColor: '#1a1f1a' }}>
                    {(post.customAuthorName || post.author.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold" style={{ color: '#2E4A3D', fontSize: '1rem' }}>{(post.customAuthorName || post.author.email.split('@')[0])}</h6>
                    <p className="text-muted small mb-0" style={{ fontSize: '0.8rem' }}>{post.customAuthorName ? "Author" : "Writer & Contributor"}</p>
                  </div>
                </div>
              </div>

              {/* Cover Image */}
              {article.img && (
                <div className="mb-5">
                  <div style={{ height: '500px', width: '100%', borderRadius: '16px', overflow: 'hidden' }}>
                    <img src={article.img} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>
              )}

              {/* Gallery Moved Above Content */}
              {post.images && post.images.length > 0 && (
                <div className="post-images mb-5">
                  <h3 className="serif-font fw-bold mb-4">Gallery</h3>
                  <ImageSlider images={post.images} />
                </div>
              )}

              <div className="post-content pe-lg-4" dangerouslySetInnerHTML={{ __html: post.body }} />
            </div>
          </div>

        </div>
      </section>

      <LoginModal />
      <Footer />
    </div>
  );
}
