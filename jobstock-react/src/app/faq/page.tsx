import Navbar2 from "@/components/Navbar2";
import Footer2 from "@/components/Footer2";
import LoginModal from "@/components/LoginModal";

const groups = [
  {
    id: "gettingStarted",
    title: "Getting Started",
    items: [
      {
        q: "How do I create an account on JobStock?",
        a: "Click Register Today, choose whether you're a candidate or an employer, and fill in your basic details. You'll be taken straight to your dashboard once you're signed up.",
      },
      {
        q: "Is JobStock free to use for job seekers?",
        a: "Yes — browsing jobs, applying, and using core features like your profile and application tracking are free. Optional premium plans unlock extras like priority visibility and unlimited applications.",
      },
      {
        q: "How do I reset my password?",
        a: "Go to Change Password from your dashboard sidebar if you're logged in, or use the password reset link on the sign-in screen if you're locked out.",
      },
    ],
  },
  {
    id: "forCandidates",
    title: "For Job Seekers",
    items: [
      {
        q: "How do I apply to a job?",
        a: "Open any job listing and click Apply. If you're logged in, your application is submitted immediately and you can track its status from your dashboard.",
      },
      {
        q: "Can I see the status of my application?",
        a: "Yes — your Candidate Dashboard shows every application's current status, from Applied through Interview to Offer or Rejected.",
      },
      {
        q: "What are the AI tools for candidates?",
        a: "JobStock includes a Resume Health Scanner, AI Resume Builder, Skill Assessments, Mock Interviews, a Career Path Navigator, and Smart Job Matching — all available from your dashboard.",
      },
      {
        q: "How do job alerts work?",
        a: "Set up an alert with your preferred category, location, or keyword, and you'll get a notification whenever a matching job is posted.",
      },
    ],
  },
  {
    id: "forEmployers",
    title: "For Employers",
    items: [
      {
        q: "Why can't I post a job right after signing up?",
        a: "Every employer is manually verified by our admin team before they can post — this keeps job listings genuine and protects candidates from fake postings.",
      },
      {
        q: "How long does employer verification take?",
        a: "Our team typically reviews new employer accounts within one business day.",
      },
      {
        q: "Can I search for candidates directly instead of waiting for applicants?",
        a: "Yes — use Find Candidates from your employer dashboard to search the candidate pool by skill, location, and experience, and message anyone who looks like a fit.",
      },
      {
        q: "What does AI Auto-Shortlist do?",
        a: "It ranks every applicant to your job by fit, with a match score and a short explanation of their strengths and any gaps — so you don't have to read every resume manually.",
      },
    ],
  },
  {
    id: "billing",
    title: "Plans & Payments",
    items: [
      {
        q: "What payment methods are supported?",
        a: "Payments are processed securely through Razorpay, supporting UPI, cards, and net banking.",
      },
      {
        q: "Can I upgrade or change my plan later?",
        a: "Yes — visit the Package page from your dashboard at any time to view and purchase a different plan.",
      },
      {
        q: "Is my payment information stored on JobStock's servers?",
        a: "No — all payment details are handled directly by Razorpay. JobStock only stores the confirmation of a successful payment.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <Navbar2 />

      {/* Page Title Start */}
      <section className="bg-cover bg-second" style={{ background: "url(/assets/img/bg2.png)no-repeat" }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-12 col-md-12">
              <h2 className="ipt-title text-light">FAQ&apos;s</h2>
              <span className="ipn-subtitle text-light opacity-75">get your all queries here</span>
            </div>
          </div>
        </div>
      </section>
      {/* Page Title End */}

      {/* FAQ's Section */}
      <section>
        <div className="container">
          <div className="row">
            <div className="col-lg-10 col-md-12 col-sm-12">
              {groups.map((group) => (
                <div className="single-faqs mb-5" key={group.id}>
                  <div className="faqs-title">
                    <h5>{group.title}</h5>
                  </div>
                  <div className="accordion" id={group.id}>
                    {group.items.map((item, qIdx) => {
                      const collapseId = `${group.id}-collapse-${qIdx}`;
                      const headingId = `${group.id}-heading-${qIdx}`;
                      const isFirst = qIdx === 0;
                      return (
                        <div className="accordion-item" key={qIdx}>
                          <h2 className="accordion-header" id={headingId}>
                            <button
                              className={`accordion-button${isFirst ? "" : " collapsed"}`}
                              type="button"
                              data-bs-toggle="collapse"
                              data-bs-target={`#${collapseId}`}
                              aria-expanded={isFirst}
                              aria-controls={collapseId}
                            >
                              {item.q}
                            </button>
                          </h2>
                          <div
                            id={collapseId}
                            className={`accordion-collapse collapse${isFirst ? " show" : ""}`}
                            aria-labelledby={headingId}
                            data-bs-parent={`#${group.id}`}
                          >
                            <div className="accordion-body">{item.a}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* FAQ's Section */}

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
