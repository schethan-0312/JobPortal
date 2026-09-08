import Navbar5 from "@/components/Navbar5";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import Link from "next/link";
import styles from "./AboutUs.module.css";
import HeroSlider from "./HeroSlider";
import FeaturedJobs from "@/components/home/FeaturedJobs";

const features = [
  {
    icon: "mdi-account-check-outline",
    title: "Verified Employers",
    desc: "Every company on our platform goes through a strict verification process. No scams, just real opportunities.",
  },
  {
    icon: "mdi-robot-outline",
    title: "AI-Powered Matching",
    desc: "Our smart algorithms analyze your resume and skills to connect you with jobs where you're most likely to succeed.",
  },
  {
    icon: "mdi-chart-bar",
    title: "Skill Assessments",
    desc: "Prove your expertise with our built-in tests and rank higher in employer searches instantly.",
  },
];

export default function AboutUsPage() {
  return (
    <>
      <Navbar5 />

      {/* Impressive Sliding Hero Section */}
      <HeroSlider />
      <FeaturedJobs />



      {/* Story & Mission Section */}
      <section className={styles.storySection}>
        <div className="container">
          <div className="row align-items-center gx-5">
            <div className="col-lg-6 mb-5 mb-lg-0">
              <div className={styles.storyImageWrapper}>
                <img 
                  src="https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-4.0.3&auto=format&fit=crop&w=1469&q=80" 
                  alt="Professional Interview" 
                />
              </div>
            </div>
            <div className="col-lg-6">
              <h2 className={styles.sectionTitle}>The JobStock Difference</h2>
              <p className={styles.storyText}>
                Most job portals show the same thing to everyone: endless listings with no way to tell which employers are real. We built JobStock to fix that — every employer is verified before they can post, so candidates only see genuine opportunities.
              </p>
              <p className={styles.storyText}>
                We didn't stop there. We integrated cutting-edge AI tools to offer resume scoring, skill assessments, and smart job matching. Our goal is to help candidates put their best foot forward and help employers find the exact right fit, faster.
              </p>
              <div className="mt-4">
                <Link href="/signup" className="btn btn-main px-4 py-3 fw-bold rounded shadow-sm">
                  Join Our Community
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <div className="container">
          <div className="row justify-content-center mb-5">
            <div className="col-lg-8 text-center">
              <h2 className={styles.sectionTitle}>Why Choose JobStock?</h2>
              <p className="text-muted fs-5">Everything you need to land your dream job or hire the perfect candidate, all in one place.</p>
            </div>
          </div>
          
          <div className="row gx-4 gy-4">
            {features.map((feature, idx) => (
              <div className="col-lg-4 col-md-6" key={idx}>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>
                    <i className={`mdi ${feature.icon}`}></i>
                  </div>
                  <h4 className={styles.featureTitle}>{feature.title}</h4>
                  <p className={styles.featureDesc}>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LoginModal />
      <Footer />
    </>
  );
}
