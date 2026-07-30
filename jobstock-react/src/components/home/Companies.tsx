const companies = [
  { img: "/assets/img/brand/layar-primary.svg" },
  { img: "/assets/img/brand/mailchimp-primary.svg" },
  { img: "/assets/img/brand/fitbit-primary.svg" },
  { img: "/assets/img/brand/capsule-primary.svg" },
  { img: "/assets/img/brand/vidados-primary.svg" },
];

export default function Companies() {
  return (
    <section className="min">
      <div className="container">
        <div className="row justify-content-center mb-2">
          <div className="col-xl-4 col-lg-7 col-md-10 text-center">
            <div className="center mb-4">
              <h5 className="fw-medium lh-lg">
                Join over 2,000 companies around the world that trust the{" "}
                <span className="text-main">JobStock</span> platforms
              </h5>
            </div>
          </div>
        </div>

        <div className="row align-items-center justify-content-center row-cols-xl-5 row-cols-lg-5 row-cols-md-3 row-cols-3 gx-3 gy-3">
          {companies.map((item) => (
            <div className="col" key={item.img}>
              <figure className="single-brand thumb-figure">
                <img src={item.img} className="img-fluid" alt="" />
              </figure>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
