"use client";

interface RoleMismatchModalProps {
  show: boolean;
  requiredRole: "CANDIDATE" | "EMPLOYER" | null;
  onClose: () => void;
  onOpenLogin: () => void;
}

export default function RoleMismatchModal({
  show,
  requiredRole,
  onClose,
  onOpenLogin,
}: RoleMismatchModalProps) {
  if (!show || !requiredRole) return null;

  const isCandidateFeature = requiredRole === "CANDIDATE";
  const message = isCandidateFeature
    ? "Please login as a Job Seeker to access this feature."
    : "Please login as an Employer to access this feature.";
  const buttonLabel = isCandidateFeature ? "Login as Job Seeker" : "Login as Employer";

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", zIndex: 1060 }}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: "450px" }}>
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div className="modal-header border-0 pb-0 position-relative pt-4 px-4">
            <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2 m-0 fs-5">
              <i className="fa-solid fa-circle-exclamation text-warning fs-4"></i>
              Access Restricted
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body py-3 px-4">
            <p className="text-secondary mb-0 fs-6 lh-base">{message}</p>
          </div>
          <div className="modal-footer border-0 pt-2 pb-4 px-4 d-flex gap-2 justify-content-end">
            <button type="button" className="btn btn-light px-4 rounded-pill fw-medium" onClick={onClose}>
              Close
            </button>
            <button
              type="button"
              className="btn btn-main px-4 rounded-pill fw-medium"
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
            >
              {buttonLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
