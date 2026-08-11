import Navbar5 from "@/components/Navbar5";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import Link from "next/link";
import styles from "./Help.module.css";

const topics = [
  {
    icon: "mdi mdi-account-plus-outline",
    title: "Getting Started",
    desc: "Creating an account, setting up your profile, and finding your way around JobStock.",
    href: "/faq#gettingStarted",
  },
  {
    icon: "mdi mdi-briefcase-outline",
    title: "For Job Seekers",
    desc: "Applying to jobs, tracking application status, and using the AI career tools.",
    href: "/faq#forCandidates",
  },
  {
    icon: "mdi mdi-office-building",
    title: "For Employers",
    desc: "Getting verified, posting jobs, searching candidates, and managing applicants.",
    href: "/faq#forEmployers",
  },
  {
    icon: "mdi mdi-credit-card-outline",
    title: "Plans & Payments",
    desc: "Understanding pricing plans, upgrading, and how payments are processed.",
    href: "/faq#billing",
  },
];

export default function HelpPage() {
  return (
    <>
      <Navbar5 />

      {/* Page Title & Search Start */}
      <section className="bg-cover bg-light pt-5 pb-4">
        <div className="container pt-4 text-center">
          <h1 className="fw-bold text-dark mb-3">Help & Support</h1>
          <p className="text-muted fs-5 mb-0">Find answers to common questions and get the support you need.</p>
          
          {/* Search Bar */}
          <div className={styles.searchWrapper}>
            <i className={`mdi mdi-magnify ${styles.searchIcon}`}></i>
            <input 
              type="text" 
              className={styles.searchInput} 
              placeholder="Search for articles, tutorials, or guides..."
            />
          </div>
        </div>
      </section>
      {/* Page Title & Search End */}

      {/* Help Section */}
      <section className={styles.helpSection}>
        <div className="container">
          <div className="row justify-content-center mb-4">
            <div className="col-lg-8 text-center">
              <h2 className="fw-bold mb-3">Browse Help Topics</h2>
              <p className="text-muted fs-5 mb-5">Select a category below to explore our comprehensive guides and FAQs.</p>
            </div>
          </div>

          <div className="row gx-4 gy-4">
            {topics.map((topic) => (
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12" key={topic.title}>
                <Link href={topic.href} className={styles.topicCard}>
                  <div className={styles.iconWrapper}>
                    <i className={topic.icon}></i>
                  </div>
                  <h4 className={styles.topicTitle}>{topic.title}</h4>
                  <p className={styles.topicDesc}>{topic.desc}</p>
                </Link>
              </div>
            ))}
          </div>

          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className={styles.supportBanner}>
                <div className={styles.bannerContent}>
                  <h4>Can't find what you're looking for?</h4>
                  <p>Our support team is standing by to assist you with any issues.</p>
                </div>
                <div>
                  <Link href="/contact" className={styles.contactBtn}>
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
      {/* Help Section End */}

      <LoginModal />
      <Footer />
    </>
  );
}
