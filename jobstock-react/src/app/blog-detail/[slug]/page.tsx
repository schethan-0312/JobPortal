import Navbar2 from "@/components/Navbar2";
import Footer2 from "@/components/Footer2";
import LoginModal from "@/components/LoginModal";
import { api, ApiError } from "@/lib/api";

interface BlogPostDetail {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  coverImageUrl: string | null;
  publishedAt: string | null;
  author: { email: string };
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
        <Footer2 />
      </>
    );
  }

  const article = {
    img: post.coverImageUrl ?? undefined,
    date: post.publishedAt
      ? new Date(post.publishedAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
      : undefined,
    title: post.title,
  };

  return (
    <>
      <Navbar2 />

      {/* Page Title Start */}
      <div className="page-bg">
        <div className="blog-thumb d-lg-flex justify-content-lg-center">
          <img
            src={article.img ? `/${article.img}` : "/assets/img/slider-5.jpg"}
            className="img-fluid"
            alt=""
          />
        </div>
      </div>
      {/* Page Title End */}

      {/* Agency List Start */}
      <section className="gray-simple">
        <div className="container">
          <div className="row">
            {/* Blog Detail */}
            <div className="col-lg-8 col-md-12 col-sm-12 col-12">
              <div className="blog-details single-post-item format-standard mb-4">
                <div className="post-details">
                  <div className="post-top-meta mb-2">
                    <span className="pst-cats label text-success bg-success bg-opacity-05 me-2">Updates</span>
                    <span className="pst-date label text-danger bg-danger bg-opacity-05">
                      {article.date ? article.date : "17 Feb 2026"}
                    </span>
                  </div>
                  <h3 className="post-title lh-base">{article.title}</h3>
                  {post.excerpt && <p className="lead">{post.excerpt}</p>}
                  <p style={{ whiteSpace: "pre-wrap" }}>{post.body}</p>
                </div>

                <div className="pst-foot-roiu">
                  <div className="post-share">
                    <ul className="list">
                      <li>
                        <i className="fa-solid fa-share-nodes"></i>
                      </li>
                      <li>
                        <a href="#">
                          <i className="fab fa-facebook-f"></i>
                        </a>
                      </li>
                      <li>
                        <a href="#">
                          <i className="fab fa-twitter"></i>
                        </a>
                      </li>
                      <li>
                        <a href="#">
                          <i className="fab fa-linkedin-in"></i>
                        </a>
                      </li>
                      <li>
                        <a href="#">
                          <i className="fab fa-vk"></i>
                        </a>
                      </li>
                      <li>
                        <a href="#">
                          <i className="fab fa-tumblr"></i>
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Author */}
            <div className="col-lg-4 col-md-12 col-sm-12 col-12">
              <div className="pg-side-groups">
                <div className="pg-side-block">
                  <div className="pg-side-block-head">
                    <div className="pg-side-left">
                      <div className="pg-side-thumb">
                        <img src="/assets/img/team-6.jpg" className="img-fluid circle" alt="" />
                      </div>
                    </div>
                    <div className="pg-side-right">
                      <div className="pg-side-right-caption">
                        <h4>Author</h4>
                      </div>
                    </div>
                  </div>
                  <div className="pg-side-block-body">
                    <div className="pg-side-block-info">
                      <div className="vl-elfo-group">
                        <div className="vl-elfo-icon">
                          <i className="fa-regular fa-envelope"></i>
                        </div>
                        <div className="vl-elfo-caption">
                          <h6>Written by</h6>
                          <p>{post.author.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Contact Author End */}

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
                <div className="call-action-buttons mt-3">
                  <a href="/jobs" className="btn btn-lg btn-dark fw-medium px-xl-5 px-lg-4 me-2">
                    Browse Jobs
                  </a>
                  <a href="/signup" className="btn btn-lg btn-whites fw-medium px-xl-5 px-lg-4 text-main">
                    Get Started
                  </a>
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
