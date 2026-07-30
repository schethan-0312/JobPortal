export default function FindJobCta() {
  return (
    <section
      className="bg-cover bg-main"
      style={{ background: "url(/assets/img/footer-bg-dark.png) no-repeat" }}
    >
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
  );
}
