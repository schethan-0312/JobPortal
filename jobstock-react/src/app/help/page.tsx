import Navbar2 from "@/components/Navbar2";
import Footer2 from "@/components/Footer2";
import LoginModal from "@/components/LoginModal";

const topics = [
  {
    icon: "fa-solid fa-user-plus",
    title: "Getting Started",
    desc: "Creating an account, setting up your profile, and finding your way around JobStock.",
    href: "/faq#gettingStarted",
  },
  {
    icon: "fa-solid fa-briefcase",
    title: "For Job Seekers",
    desc: "Applying to jobs, tracking application status, and using the AI career tools.",
    href: "/faq#forCandidates",
  },
  {
    icon: "fa-solid fa-building",
    title: "For Employers",
    desc: "Getting verified, posting jobs, searching candidates, and managing applicants.",
    href: "/faq#forEmployers",
  },
  {
    icon: "fa-solid fa-credit-card",
    title: "Plans & Payments",
    desc: "Understanding pricing plans, upgrading, and how payments are processed.",
    href: "/faq#billing",
  },
];

export default function HelpPage() {
  return (
    <>
      <Navbar2 />

      {/* Page Title Start */}
      <section className="bg-cover bg-second" style={{ background: "url(/assets/img/bg2.png)no-repeat" }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-12 col-md-12">
              <h2 className="ipt-title text-light">Help & Support</h2>
              <span className="ipn-subtitle text-light opacity-75">Find answers to common questions and get support</span>
            </div>
          </div>
        </div>
      </section>
      {/* Page Title End */}

      {/* Help Topics */}
      <section>
        <div className="container">
          <div className="row justify-content-center mb-4">
            <div className="col-xl-6 col-lg-7 col-md-10 text-center">
              <div className="sec-heading center">
                <h2>How Can We Help?</h2>
                <p>Browse a topic below, or check the full FAQ for detailed answers.</p>
              </div>
            </div>
          </div>

          <div className="row gx-4 gy-4 mb-5">
            {topics.map((topic) => (
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12" key={topic.title}>
                <a href={topic.href} className="text-decoration-none">
                  <div className="border rounded p-4 h-100 text-center">
                    <i className={`${topic.icon} text-main fs-2 mb-3`}></i>
                    <h5 className="text-dark">{topic.title}</h5>
                    <p className="text-muted small mb-0">{topic.desc}</p>
                  </div>
                </a>
              </div>
            ))}
          </div>

          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <h4 className="mb-2">Still need help?</h4>
              <p className="text-muted mb-3">
                Check our full <a href="/faq">FAQ page</a> for detailed answers, or reach out directly and we&apos;ll
                get back to you.
              </p>
              <a href="/contact" className="btn btn-main px-5">
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </section>
      {/* Help Topics End */}

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
