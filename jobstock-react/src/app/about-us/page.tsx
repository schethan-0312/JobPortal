import PublicNavbar from "@/components/PublicNavbar";
import Footer2 from "@/components/Footer2";
import LoginModal from "@/components/LoginModal";

const needs = [
  {
    number: "01.",
    title: "Create An Account",
    desc: "Sign up as a candidate or employer in minutes and set up a profile that represents you well.",
  },
  {
    number: "02.",
    title: "Search Jobs",
    desc: "Browse listings from verified employers, filtered by role, location, and experience level.",
  },
  {
    number: "03.",
    title: "Save & Apply Jobs",
    desc: "Bookmark roles you're interested in and apply with one click when you're ready.",
  },
];

export default function AboutUsPage() {
  return (
    <>
      <PublicNavbar />

      {/* Page Title Start */}
      <section
        className="page-head bg-cover"
        style={{ background: "#017efa url(/assets/img/about.jpg) no-repeat" }}
        data-overlay="4"
      >
        <div className="container">
          <div className="row">
            <div className="col-xl-8 col-lg-9 col-md-12">
              <h1 className="text-white mb-4">
                Who We are
                <br /> & Our Smart Mission
              </h1>
              <p className="text-white mb-4">
                JobStock connects job seekers with verified employers through a platform built on trust, real data,
                and modern AI tools — from resume scoring to smart job matching — so both sides can move faster and
                with more confidence.
              </p>
              <a href="/contact" className="btn btn-main fw-medium">
                Get In Touch
              </a>
            </div>
          </div>
        </div>
      </section>
      {/* Page Title End */}

      {/* Our Story Start */}
      <section>
        <div className="container">
          <div className="row align-items-center justify-content-between">
            <div className="col-lg-6 col-md-6">
              <div className="story-wrap explore-content">
                <h2>Our Mission & Story</h2>
                <p>
                  Most job portals show the same thing to everyone: endless listings with no way to tell which
                  employers are real. We built JobStock to fix that — every employer is verified before they can
                  post, so candidates only see genuine opportunities.
                </p>
                <p className="fw-light mb-4">
                  On top of that foundation, we layered practical AI tools — resume scoring, skill assessments, mock
                  interviews, and smart job matching — to help candidates put their best foot forward and help
                  employers find the right people faster.
                </p>
                <a href="/signup" className="btn fw-medium btn-main">
                  Start Today Now
                </a>
              </div>
            </div>

            <div className="col-lg-5 col-md-6">
              <img src="/assets/img/bn-1.png" className="img-fluid" alt="" />
            </div>
          </div>
        </div>
      </section>
      {/* Our Story End */}

      {/* Valuable Step Start */}
      <section className="bg-second">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xl-6 col-lg-7 col-md-10 text-center">
              <div className="sec-heading center light">
                <h2>Choose What You Need</h2>
                <p>Whether you&apos;re hiring or job hunting, getting started only takes three steps.</p>
              </div>
            </div>
          </div>

          <div className="row align-items-center gx-4 gy-4">
            {needs.map((item, idx) => (
              <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12" key={idx}>
                <div className="jobstock-posted-box-y78 colored">
                  <div className="jobstock-posted-body-y78">
                    <div className="serv-ctr-title">
                      <h2 className="text-green">{item.number}</h2>
                    </div>
                    <div className="serv-ctr-subtitle">
                      <h5 className="text-light">{item.title}</h5>
                    </div>
                    <div className="serv-ctr-decs">
                      <p className="text-light opacity-75">{item.desc}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Valuable Step End */}

      {/* Call To Action */}
      <section
        className="bg-cover bg-main"
        style={{ background: "url(/assets/img/footer-bg-dark.png)no-repeat" }}
      >
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
      {/* Call To Action End */}

      <LoginModal />
      <Footer2 />
    </>
  );
}
