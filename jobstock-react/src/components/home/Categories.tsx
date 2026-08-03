import { JOB_CATEGORIES, CATEGORY_ICONS } from "@/lib/job-categories";

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
          {JOB_CATEGORIES.map((title) => (
            <div className="col-xl-3 col-lg-3 col-md-4 col-sm-6" key={title}>
              <div className="category-box">
                <div className="category-desc">
                  <div className="category-icon">
                    <i className={`${CATEGORY_ICONS[title]} text-main`}></i>
                    <i className={`${CATEGORY_ICONS[title]} abs-icon`}></i>
                  </div>
                  <div className="category-detail category-desc-text">
                    <h4 className="fs-5">
                      <a href={`/jobs?category=${encodeURIComponent(title)}`}>{title}</a>
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
