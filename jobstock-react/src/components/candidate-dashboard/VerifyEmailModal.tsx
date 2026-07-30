"use client";

import { useAuth } from "@/lib/auth-context";

export default function VerifyEmailModal() {
  const { user } = useAuth();

  return (
    <div className="modal modal-lg fade" id="verifyemail" tabIndex={-1} role="dialog" aria-labelledby="verifyemailmodal" aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content" id="verifyemailmodal">
          <span className="mod-close" data-bs-dismiss="modal" aria-hidden="true"><i className="fas fa-close"></i></span>
          <div className="modal-body p-5">
            <div className="verify-email-wrap mb-5">
              <div className="icon-wrap text-center mb-4">
                <img src="/assets/img/verify-email-icon.svg" className="img-fluid mx-auto" width={140} alt="Image" />
              </div>

              <div className="message-wrap text-center d-block mb-4">
                <h4 className="mb-4">Verify your email address</h4>
                <h6 className="fw-normal">
                  You&apos;ve registered with {user?.email ?? "your email"} as the email address for your account.
                </h6>
                <p>Email verification is not yet available — this feature is coming soon.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
