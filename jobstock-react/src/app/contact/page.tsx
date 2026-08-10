"use client";

import { useState } from "react";
import Navbar5 from "@/components/Navbar5";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import { api, ApiError } from "@/lib/api";

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
      <section className="bg-cover bg-second" style={{ background: "url(/assets/img/bg2.png)no-repeat" }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-12 col-md-12">
              <h2 className="ipt-title text-light">Get In touch</h2>
              <span className="text-light opacity-75">Get all latest news and updates</span>
            </div>
          </div>
        </div>
      </section>
      {/* Page Title End */}

      {/* Contact Start */}
      <section>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-7 col-md-10 text-center">
              <div className="sec-heading center">
                <label className="label text-success bg-light-success">Grow Your Business</label>
                <h2>Activate Next Now</h2>
                <p>
                  Please fill the form and we will guide you to the best solution. Our experts will get in touch
                  soon.
                </p>
              </div>
            </div>
          </div>

          <div className="row align-items-center justify-content-center">
            <div className="col-lg-10 col-md-12">
              <form className="mt-4" id="myForm" onSubmit={handleSubmit}>
                {status === "success" && (
                  <div className="alert alert-success" id="simple-msg">
                    Thanks — your message has been received. We&apos;ll get back to you soon.
                  </div>
                )}
                {status === "error" && (
                  <p className="mb-0 text-danger" id="error-msg">
                    {errorMsg}
                  </p>
                )}
                <div className="row">
                  <div className="col-lg-6 col-md-6">
                    <div className="form-group">
                      <label>Name</label>
                      <input
                        name="name"
                        id="name"
                        type="text"
                        className="form-control simple"
                        placeholder="Name :"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-lg-6 col-md-6">
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        name="email"
                        id="email"
                        type="email"
                        className="form-control simple"
                        placeholder="Email :"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-lg-12 col-md-12">
                    <div className="form-group">
                      <label>Subject</label>
                      <input
                        name="subject"
                        id="subject"
                        type="text"
                        className="form-control simple"
                        placeholder="Subject :"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12 col-md-12">
                    <div className="form-group">
                      <label>Message</label>
                      <textarea
                        name="Message"
                        id="Message"
                        className="form-control simple"
                        placeholder="Message :"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                      ></textarea>
                    </div>
                  </div>
                  <div className="col-lg-12 col-md-12">
                    <div className="form-group">
                      <button
                        type="submit"
                        id="submit"
                        name="send"
                        className="btn btn-main px-5"
                        disabled={status === "submitting"}
                      >
                        {status === "submitting" ? "Sending..." : "Submit Request"}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

        </div>
      </section>
      {/* Contact End */}

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
      <Footer />
    </>
  );
}
