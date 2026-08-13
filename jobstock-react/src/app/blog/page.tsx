import Link from "next/link";
import Navbar5 from "@/components/Navbar5";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import { api } from "@/lib/api";
import ImageSlider from "@/components/ImageSlider";

export const dynamic = "force-dynamic";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  publishedAt: string | null;
  category: string | null;
  readTimeMinutes: number | null;
  servicePageLink: string | null;
  images: string[];
  createdAt: string;
  updatedAt: string;
  author: { email: string };
  customAuthorName?: string | null;
}

async function getPosts(page: number) {
  try {
    return await api.get<{ items: BlogPost[]; total: number }>(`/blog?page=${page}&pageSize=5`, { auth: false });
  } catch (err) {
    console.error("Failed to fetch posts:", err);
    return { items: [], total: 0 };
  }
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ page?: string }> | { page?: string } }) {
  const params = await searchParams;
  const page = parseInt(params?.page || "1", 10);
  const { items: posts, total } = await getPosts(page);
  const totalPages = Math.ceil(total / 5);

  return (
    <>
      <Navbar5 />

      {/* Page Title Start */}
      <section className="bg-cover bg-second" style={{ background: "url(/assets/img/bg2.png)no-repeat" }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-12 col-md-12">
              <h2 className="ipt-title text-light">Our Latest Updates</h2>
              <span className="ipn-subtitle text-light opacity-75">Get all latest news and updates</span>
            </div>
          </div>
        </div>
      </section>
      {/* Page Title End */}

      {/* Blog List Start */}
      <section className="gray-simple">
        <div className="container">
          {posts.length === 0 ? (
            <div className="row">
              <div className="col-12 text-center py-5">
                <p>No blog posts yet. Check back soon.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="row gx-4 gy-4">
                {posts.map((post) => (
                  <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12" key={post.id}>
                    <div className="jobstock-grid-blog h-100 d-flex flex-column">
                      {(() => {
                        const postImages = post.coverImageUrl 
                          ? [post.coverImageUrl, ...post.images.filter(img => img !== post.coverImageUrl)] 
                          : post.images;
                          
                        return postImages.length > 0 ? (
                          <div className="jobstock-grid-blog-thumb" style={{ borderRadius: '16px 16px 0 0', overflow: 'hidden' }}>
                            <ImageSlider images={postImages} autoScroll={true} height="220px" />
                          </div>
                        ) : null;
                      })()}
                      <div className="jobstock-grid-blog-body flex-grow-1 d-flex flex-column">
                        <div className="jobstock-grid-body-header">
                          <div className="jobstock-grid-posted bg-main d-flex justify-content-between align-items-center w-100 px-3 py-2">
                            <span className="text-white fw-medium" suppressHydrationWarning>
                              {post.publishedAt
                                ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : ""}
                            </span>
                            {post.category && <span className="badge bg-white text-main">{post.category.toUpperCase()}</span>}
                          </div>
                          <div className="jobstock-grid-title mt-3">
                            <h4>
                              <Link href={`/blog-detail/${post.slug}`}>{post.title}</Link>
                            </h4>
                          </div>
                        </div>
                        <div className="jobstock-grid-body-middle flex-grow-1">
                          <p>{post.excerpt ?? ""}</p>
                          <div className="d-flex justify-content-between text-muted small mt-2">
                            <span><i className="fa-solid fa-user me-1"></i> {post.customAuthorName || post.author.email.split('@')[0]}</span>
                            {post.readTimeMinutes && <span><i className="fa-regular fa-clock me-1"></i> {post.readTimeMinutes} min read</span>}
                          </div>
                          {post.servicePageLink && (
                            <div className="mt-2">
                              <a href={post.servicePageLink} className="text-main fw-medium small" target="_blank" rel="noopener noreferrer">
                                <i className="fa-solid fa-link me-1"></i> Related Service
                              </a>
                            </div>
                          )}
                        </div>
                        <div className="jobstock-grid-body-footer mt-3">
                          <Link href={`/blog-detail/${post.slug}`} className="btn btn-blog-link">
                            Continue Reading
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="row mt-5">
                  <div className="col-12">
                    <ul className="pagination justify-content-center">
                      <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                        <Link className="page-link" href={`/blog?page=${page - 1}`} aria-label="Previous">
                          <span aria-hidden="true">&laquo;</span>
                        </Link>
                      </li>
                      {Array.from({ length: totalPages }).map((_, idx) => (
                        <li key={idx} className={`page-item ${page === idx + 1 ? 'active' : ''}`}>
                          <Link className="page-link" href={`/blog?page=${idx + 1}`}>
                            {idx + 1}
                          </Link>
                        </li>
                      ))}
                      <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                        <Link className="page-link" href={`/blog?page=${page + 1}`} aria-label="Next">
                          <span aria-hidden="true">&raquo;</span>
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      {/* Blog List End */}

      <LoginModal />
      <Footer />
    </>
  );
}
