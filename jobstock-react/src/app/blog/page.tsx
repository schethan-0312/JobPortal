import Link from "next/link";
import PublicNavbar from "@/components/PublicNavbar";
import Footer2 from "@/components/Footer2";
import LoginModal from "@/components/LoginModal";
import { api } from "@/lib/api";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  publishedAt: string | null;
  author: { email: string };
}

async function getPosts() {
  try {
    return await api.get<{ items: BlogPost[]; total: number }>("/blog", { auth: false });
  } catch {
    return { items: [], total: 0 };
  }
}

export default async function BlogPage() {
  const { items: posts } = await getPosts();

  return (
    <>
      <PublicNavbar />

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
            <div className="row gx-4 gy-4">
              {posts.map((post) => (
                <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12" key={post.id}>
                  <div className="jobstock-grid-blog">
                    <div className="jobstock-grid-blog-thumb">
                      <img src={post.coverImageUrl ?? "/assets/img/blog-1.jpg"} className="img-fluid" alt="" />
                    </div>
                    <div className="jobstock-grid-blog-body">
                      <div className="jobstock-grid-body-header">
                        <div className="jobstock-grid-posted bg-main">
                          <span>
                            {post.publishedAt
                              ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : ""}
                          </span>
                        </div>
                        <div className="jobstock-grid-title">
                          <h4>
                            <Link href={`/blog-detail/${post.slug}`}>{post.title}</Link>
                          </h4>
                        </div>
                      </div>
                      <div className="jobstock-grid-body-middle">
                        <p>{post.excerpt ?? ""}</p>
                      </div>
                      <div className="jobstock-grid-body-footer">
                        <Link href={`/blog-detail/${post.slug}`} className="btn btn-blog-link">
                          Continue Reading
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      {/* Blog List End */}

      {/* Call To Action */}
      <section className="bg-cover bg-main" style={{ background: "url(/assets/img/footer-bg-dark.png)no-repeat" }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xl-7 col-lg-10 col-md-12 col-sm-12">
              <div className="call-action-wrap">
                <div className="sec-heading center">
                  <h2 className="lh-base mb-3 text-light">
                    Find The Perfect Job
                    <br />
                    on JobStock That is Superb For You
                  </h2>
                  <p className="fs-6 text-light">
                    Join thousands of job seekers and employers who trust JobStock to find the right fit, faster.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LoginModal />
      <Footer2 />
    </>
  );
}
