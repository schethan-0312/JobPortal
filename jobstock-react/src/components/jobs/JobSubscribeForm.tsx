"use client";

import { useState } from "react";

export default function JobSubscribeForm() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  }

  return (
    <div
      className="alert-jbemail-box bg-cover"
      style={{ background: "#016551 url(/assets/img/alert-bg.png) no-repeat" }}
    >
      <div className="alert-bxr-wrap">
        <div className="alert-bxr-captions mb-3">
          <h4 className="text-light">Get The Latest Jobs Right Into Your Inbox!</h4>
          <p className="text-light opacity-75">We just want your email address!</p>
        </div>
        {subscribed ? (
          <div className="alert alert-success py-2 text-sm mb-0">
            <i className="fa-solid fa-circle-check me-2"></i>
            Thank you for subscribing! We&apos;ll keep you updated with the latest jobs.
          </div>
        ) : (
          <div className="alert-bxr-forms">
            <form onSubmit={handleSubscribe}>
              <div className="newsltr-form">
                <input
                  type="email"
                  className="form-control"
                  placeholder="Enter Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-subscribe bg-dark">
                  Subscribe
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
