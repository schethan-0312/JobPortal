"use client";

import { useState } from "react";
import Navbar5 from "@/components/Navbar5";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import { api, ApiError } from "@/lib/api";
import styles from "./Contact.module.css";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg(null);
    try {
      await api.post("/contact", { name, email, subject: subject || undefined, message }, { auth: false });
      setStatus("success");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <>
      <Navbar5 />

      {/* Page Title Start */}
      <section className="bg-cover bg-light py-5">
        <div className="container py-4 text-center">
          <h1 className="fw-bold text-dark mb-3">Get In Touch</h1>
          <p className="text-muted fs-5 mb-0">We're here to help you take the next step in your career or business.</p>
        </div>
      </section>
      {/* Page Title End */}

      {/* Contact Section Start */}
      <section className={styles.contactSection}>
        <div className="container">
          <div className="row justify-content-center gx-5">
            
            {/* Contact Info Sidebar */}
            <div className="col-lg-4 col-md-10 mb-5 mb-lg-0">
              <div className="mb-4">
                <h3 className="fw-bold mb-4">Contact Information</h3>
                <p className="text-muted mb-4">
                  Have questions about our platform, enterprise pricing, or need technical support? Reach out to us directly.
                </p>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <i className="mdi mdi-map-marker"></i>
                </div>
                <div className={styles.infoContent}>
                  <h4>Our Office</h4>
                  <p>123 Tech Boulevard<br />Innovation District, NY 10001</p>
                </div>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <i className="mdi mdi-email-outline"></i>
                </div>
                <div className={styles.infoContent}>
                  <h4>Email Us</h4>
                  <p>support@jobstock.com<br />sales@jobstock.com</p>
                </div>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <i className="mdi mdi-phone-outline"></i>
                </div>
                <div className={styles.infoContent}>
                  <h4>Call Us</h4>
                  <p>+1 (555) 123-4567<br />Mon-Fri, 9am to 6pm EST</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="col-lg-7 col-md-10">
              <div className={styles.formWrapper}>
                <h3 className="fw-bold mb-4">Send us a Message</h3>
                
                <form id="myForm" onSubmit={handleSubmit}>
                  {status === "success" && (
                    <div className={styles.alertSuccess}>
                      <i className="mdi mdi-check-circle me-2"></i>
                      Thanks — your message has been received. We'll get back to you soon.
                    </div>
                  )}
                  {status === "error" && (
                    <div className={styles.alertError}>
                      <i className="mdi mdi-alert-circle me-2"></i>
                      {errorMsg}
                    </div>
                  )}
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Your Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className={styles.formControl}
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Email Address <span className="text-danger">*</span></label>
                        <input
                          type="email"
                          className={styles.formControl}
                          placeholder="john@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="col-md-12">
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Subject</label>
                        <input
                          type="text"
                          className={styles.formControl}
                          placeholder="How can we help?"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="col-md-12">
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Message <span className="text-danger">*</span></label>
                        <textarea
                          className={styles.formControl}
                          placeholder="Tell us more about your inquiry..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          required
                        ></textarea>
                      </div>
                    </div>
                    
                    <div className="col-md-12 mt-2">
                      <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={status === "submitting"}
                      >
                        {status === "submitting" ? (
                          <span><i className="mdi mdi-loading mdi-spin me-2"></i> Sending...</span>
                        ) : (
                          "Submit Request"
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            
          </div>
        </div>
      </section>
      {/* Contact Section End */}

      <LoginModal />
      <Footer />
    </>
  );
}
