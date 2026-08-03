import PublicNavbar from "@/components/PublicNavbar";
import Footer2 from "@/components/Footer2";
import LoginModal from "@/components/LoginModal";

const sections = [
  {
    title: "Introduction",
    body: [
      "This Privacy Policy explains what information JobStock collects, how we use it, and the choices you have. By creating an account or using JobStock, you agree to the practices described here.",
    ],
  },
  {
    title: "Information We Collect",
    body: [
      "Account details you provide directly: name, email, password, and role (candidate or employer).",
      "Profile information: headline, skills, experience, location, phone number, resume, and profile photo for candidates; company name, description, website, and logo for employers.",
      "Content you create: job postings, applications, cover notes, messages between users, and skill assessment or mock interview responses.",
    ],
  },
  {
    title: "Employer Account Information",
    body: [
      "Employers must complete a verification process before posting jobs. We review the company details submitted at signup to confirm legitimacy and reduce fake job postings on the platform.",
    ],
  },
  {
    title: "Candidate Information",
    body: [
      "Candidate profile data (skills, experience, headline, and location) is used to power job matching, AI resume feedback, and search visibility to employers. Your phone number is never shown publicly — employers can only reach you through JobStock's in-app messaging.",
    ],
  },
  {
    title: "AI Feature Data Usage",
    body: [
      "Features like the Resume Health Scanner, AI Resume Builder, Career Path Navigator, Mock Interviews, and the Career Assistant chatbot send the text you provide (resume content, background notes, chat messages) to our AI provider to generate a response. This content is used only to produce that response and is not used to train third-party models.",
    ],
  },
  {
    title: "Payments",
    body: [
      "Payments for premium plans are processed by Razorpay. JobStock does not store your card, UPI, or bank details — we only store the confirmation and status of a completed transaction.",
    ],
  },
  {
    title: "Cookies & Local Storage",
    body: [
      "JobStock uses your browser's local storage to keep you signed in between visits. We do not use third-party advertising or tracking cookies.",
    ],
  },
  {
    title: "Your Choices",
    body: [
      "You can update or remove most profile information at any time from your dashboard. You can also permanently delete your account from the Delete Account page in your dashboard settings.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PublicNavbar />

      {/* Page Title Start */}
      <section className="bg-cover bg-second" style={{ background: "url(/assets/img/bg2.png)no-repeat" }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-12 col-md-12">
              <h2 className="ipt-title text-light">Privacy Policy</h2>
              <span className="ipn-subtitle text-light opacity-75">Check our Privacy and Policies</span>
            </div>
          </div>
        </div>
      </section>
      {/* Page Title End */}

      {/* Policy Sections */}
      <section className="gray-simple">
        <div className="container">
          <div className="row">
            <div className="col-lg-12 col-md-12">
              <div className="box-block-wrap-group">
                {sections.map((section) => (
                  <div className="box-block-wrap" key={section.title}>
                    <div className="box-block-wrap_header">
                      <h4 className="box-block-wrap_title">{section.title}</h4>
                    </div>

                    <div className="box-block-wrap-body">
                      {section.body.map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Policy Sections End */}

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
