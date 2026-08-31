const leftSteps = [
  {
    icon: "fa-solid fa-user-plus",
    title: "Create Your Account",
    desc: "Sign up as a candidate or employer in under a minute and set up your profile.",
  },
  {
    icon: "fa-solid fa-magnifying-glass",
    title: "Search & Apply",
    desc: "Browse verified job listings, filter by role and location, and apply with one click.",
  },
  {
    icon: "fa-solid fa-file-signature",
    title: "Track Your Applications",
    desc: "Follow every application's status in real time, from submitted to offer.",
  },
  {
    icon: "fa-solid fa-comments",
    title: "Connect Directly",
    desc: "Message employers and candidates in-app once there's mutual interest.",
  },
];

const rightSteps = [
  {
    icon: "fa-solid fa-briefcase",
    title: "Post a Job",
    desc: "Verified employers can publish a job listing in minutes and reach real candidates.",
  },
  {
    icon: "fa-solid fa-shield-halved",
    title: "Get Verified",
    desc: "Our admin team verifies every employer, so candidates only see genuine listings.",
  },
  {
    icon: "fa-solid fa-users-viewfinder",
    title: "Review Applicants",
    desc: "See every applicant in one dashboard, or let AI auto-shortlist your best fits.",
  },
  {
    icon: "fa-solid fa-handshake",
    title: "Hire the Best",
    desc: "Move candidates through your pipeline and make the offer, all from JobStock.",
  },
];

export default function FeaturesProcess() {
  return (
    <section>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-6 col-lg-7 col-md-10">
            <div className="sec-heading center">
              <h2>How JobStock Works</h2>
              <p>A simple, transparent flow for both job seekers and employers.</p>
            </div>
          </div>
        </div>

        <div className="row justify-content-center gx-xl-4 gx-lg-4">
          <div className="col-xl-4 col-lg-6 col-md-6 col-sm-12 col-12 order-xl-1 order-lg-1 order-md-1">
            {leftSteps.map((s) => (
              <div className="work-process mb-5" key={s.title}>
                <div className="work-process-icon">
                  <span>
                    <i className={`${s.icon} text-main`}></i>
                  </span>
                </div>
                <div className="work-process-caption">
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="col-xl-4 col-lg-6 col-md-6 col-sm-12 col-12 order-xl-2 order-lg-3 order-md-3 my-4 my-xl-0">
            <div className="eslio-pincc m-auto text-center" style={{ maxWidth: "280px" }}>
              <img src="/assets/img/wp-iphone.png" className="img-fluid" alt="Mobile App preview" />
            </div>
          </div>

          <div className="col-xl-4 col-lg-6 col-md-6 col-sm-12 col-12 order-xl-3 order-lg-2 order-md-2">
            {rightSteps.map((s) => (
              <div className="work-process mb-4 mb-md-5" key={s.title}>
                <div className="work-process-icon">
                  <span>
                    <i className={`${s.icon} text-main`}></i>
                  </span>
                </div>
                <div className="work-process-caption">
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
