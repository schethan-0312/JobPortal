const categories = [
  { icon: "fa-solid fa-file-invoice", title: "Accounting & Finance" },
  { icon: "fa-solid fa-caravan", title: "Automotive Jobs" },
  { icon: "fa-solid fa-person-chalkboard", title: "Business & Tech" },
  { icon: "fa-solid fa-user-graduate", title: "Education Training" },
  { icon: "fa-solid fa-briefcase-medical", title: "Healthcare" },
  { icon: "fa-solid fa-burger", title: "Restaurant & Food" },
  { icon: "fa-solid fa-jet-fighter", title: "Transportation" },
  { icon: "fa-solid fa-mobile-screen-button", title: "Telecommunications" },
];

export default function Categories() {
  return (
    <section className="gray-simple">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-6 col-lg-7 col-md-10 text-center">
            <div className="sec-heading center">
              <h2>Explore Top Categories</h2>
              <p>Browse open roles by category across every employer on JobStock.</p>
            </div>
          </div>
        </div>

        <div className="row justify-content-center gx-4 gy-4">
          {categories.map((item) => (
            <div className="col-xl-3 col-lg-3 col-md-4 col-sm-6" key={item.title}>
              <div className="category-box">
                <div className="category-desc">
                  <div className="category-icon">
                    <i className={`${item.icon} text-main`}></i>
                    <i className={`${item.icon} abs-icon`}></i>
                  </div>
                  <div className="category-detail category-desc-text">
                    <h4 className="fs-5">
                      <a href={`/jobs?category=${encodeURIComponent(item.title)}`}>{item.title}</a>
                    </h4>
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
