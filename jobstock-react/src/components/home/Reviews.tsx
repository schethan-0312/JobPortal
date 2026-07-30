const reviews = [
  { img: "/assets/img/team-1.jpg", name: "Lucia E. Nugent", tag: "CEO of Climber", title: '"The best useful website"', desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim." },
  { img: "/assets/img/team-2.jpg", name: "Brenda R. Smith", tag: "Founder of Yeloower", title: '"Ranking is the #1"', desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim." },
  { img: "/assets/img/team-3.jpg", name: "Brian B. Wilkerson", tag: "CEO of Mark Soft", title: '"The website is eco friendly"', desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim." },
  { img: "/assets/img/team-4.jpg", name: "Miguel L. Benbow", tag: "Founder of Mitche LTD", title: '"100% save and secure website"', desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim." },
  { img: "/assets/img/team-5.jpg", name: "Hilda A. Sheppard", tag: "CEO of Doodle", title: '"Very developer friendly website"', desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim." },
];

export default function Reviews() {
  return (
    <section>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-7 col-md-10 text-center">
            <div className="sec-heading center">
              <h2>Good Reviews By Customers</h2>
              <p>
                At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis
                praesentium voluptatum deleniti atque corrupti quos dolores
              </p>
            </div>
          </div>
        </div>

        <div className="row justify-content-center gx-4 gy-4">
          {reviews.map((item) => (
            <div className="col-xl-4 col-lg-4 col-md-6" key={item.name}>
              <div className="jobstock-reviews-box">
                <div className="jobstock-reviews-desc">
                  <h6 className="review-title-yui">{item.title}</h6>
                  <p>{item.desc}</p>
                </div>
                <div className="jobstock-reviews-flex">
                  <div className="jobstock-reviews-thumb">
                    <div className="jobstock-reviews-figure">
                      <img src={item.img} className="img-fluid circle" alt="" />
                    </div>
                  </div>
                  <div className="jobstock-reviews-caption">
                    <div className="jobstock-reviews-title">
                      <h4>{item.name}</h4>
                    </div>
                    <div className="jobstock-reviews-designation">
                      <span>{item.tag}</span>
                    </div>
                    <div className="jobstock-reviews-rates">
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-solid fa-star deactive"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
