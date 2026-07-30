export default function CallToAction() {
  return (
    <section
      className="bg-cover call-action-container dark bg-main"
      style={{ background: "url(/assets/img/footer-bg-dark.png) no-repeat" }}
    >
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-7 col-lg-10 col-md-12 col-sm-12">
            <div className="call-action-wrap">
              <div className="call-action-caption">
                <h2 className="text-light">Ready to Take the Next Step?</h2>
                <p className="fs-6 text-light">
                  Whether you&apos;re hiring or job hunting, JobStock connects you with the right people, faster.
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
  );
}
