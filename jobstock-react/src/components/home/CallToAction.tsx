"use client";

export default function CallToAction() {

  return (
    <section className="py-5 position-relative" style={{ backgroundColor: "#ffffff" }}>
      <div className="container">
        <div
          className="rounded-4 p-4 p-md-5 position-relative overflow-hidden"
          style={{
            backgroundColor: "#205c56", /* Exact dark teal from screenshot */
            color: "#ffffff",
          }}
        >
          <div className="row align-items-center justify-content-between gy-4 position-relative" style={{ zIndex: 2 }}>
            {/* Left Side: Image with thick white outline */}
            <div className="col-lg-5 col-md-12 text-center">
              <div className="position-relative d-inline-block" style={{ width: "100%", maxWidth: "360px", padding: "18px" }}>
                {/* Offset white border */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  border: "6px solid #ffffff",
                  borderRadius: "45px",
                  zIndex: 0
                }}></div>
                {/* Image Container */}
                <div style={{
                  position: "relative",
                  zIndex: 1,
                  borderRadius: "30px",
                  overflow: "hidden",
                  width: "100%",
                  backgroundColor: "#205c56",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-end"
                }}>
                  <img
                    src="/img/ai-tools/G.png"
                    alt="Career Opportunities"
                    className="img-fluid"
                    style={{
                      width: "100%",
                      objectFit: "cover",
                      display: "block"
                    }}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/team-1.jpg'; }}
                  />
                </div>
              </div>
            </div>

            {/* Right Side: Content */}
            <div className="col-lg-6 col-md-12">
              <div className="ps-lg-3 pe-lg-4">
                <h2 className="fw-bold text-white mb-3" style={{ fontSize: '2.4rem', lineHeight: 1.25 }}>
                  Ready to Take the Next Step in Your Career or Hire Top Talent?
                </h2>

                <p className="fs-6 mb-4" style={{ color: '#a8c6c4', lineHeight: 1.6, fontSize: '1rem', fontWeight: 400 }}>
                  Whether you're searching for your dream role or hiring qualified professionals, JobStock connects talent with leading employers faster and smarter.
                </p>

                <ul className="list-unstyled mb-0">
                  <li className="d-flex align-items-center gap-3 mb-3">
                    <div style={{ width: '24px', height: '24px', backgroundColor: '#38a581', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="fa-solid fa-check text-white" style={{ fontSize: '11px' }}></i>
                    </div>
                    <span className="text-white" style={{ fontSize: '0.95rem' }}>Explore thousands of active, verified job openings</span>
                  </li>
                  <li className="d-flex align-items-center gap-3 mb-3">
                    <div style={{ width: '24px', height: '24px', backgroundColor: '#38a581', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="fa-solid fa-check text-white" style={{ fontSize: '11px' }}></i>
                    </div>
                    <span className="text-white" style={{ fontSize: '0.95rem' }}>AI-powered candidate shortlisting &amp; smart matching</span>
                  </li>
                  <li className="d-flex align-items-center gap-3 mb-3">
                    <div style={{ width: '24px', height: '24px', backgroundColor: '#38a581', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="fa-solid fa-check text-white" style={{ fontSize: '11px' }}></i>
                    </div>
                    <span className="text-white" style={{ fontSize: '0.95rem' }}>Instant notification alerts and 1-click application submission</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
