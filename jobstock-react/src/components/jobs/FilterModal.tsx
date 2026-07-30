export default function FilterModal() {
  return (
    <div className="modal fade" id="filter" tabIndex={-1} role="dialog" aria-labelledby="filtermodal" aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered filter-popup" role="document">
        <div className="modal-content" id="filtermodal">
          <span className="mod-close" data-bs-dismiss="modal" aria-hidden="true">
            <i className="fas fa-close"></i>
          </span>
          <div className="modal-header">
            <h4 className="modal-header-sub-title">Start Your Filter</h4>
          </div>
          <div className="modal-body p-0">
            <div className="filter-content">
              <div className="full-tabs-group">
                <div className="single-tabs-group">
                  <div className="single-tabs-group-header">
                    <h5>Job Match Score</h5>
                  </div>
                  <div className="single-tabs-group-content">
                    <div className="d-flex flex-wrap">
                      {["6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0", "9.5", "10"].map((score, i) => {
                        const id = `m${score.replace(".", "")}`;
                        return (
                          <div className="sing-btn-groups" key={i}>
                            <input type="checkbox" className="btn-check" id={id} />
                            <label className="btn btn-md btn-outline-main font--bold rounded-5" htmlFor={id}>
                              {score}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="single-tabs-group">
                  <div className="single-tabs-group-header">
                    <h5>Job Value Score</h5>
                  </div>
                  <div className="single-tabs-group-content">
                    <div className="d-flex flex-wrap">
                      {["6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0", "9.5", "10"].map((score, i) => {
                        const id = `v${score.replace(".", "")}`;
                        return (
                          <div className="sing-btn-groups" key={i}>
                            <input type="checkbox" className="btn-check" id={id} />
                            <label className="btn btn-md btn-outline-main font--bold rounded-5" htmlFor={id}>
                              {score}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="single-tabs-group">
                  <div className="single-tabs-group-header">
                    <h5>Place Of Work</h5>
                  </div>
                  <div className="single-tabs-group-content">
                    <div className="d-flex flex-wrap">
                      <div className="sing-btn-groups">
                        <input type="checkbox" className="btn-check" id="anywhere" defaultChecked />
                        <label className="btn btn-md btn-outline-main font--bold rounded-5" htmlFor="anywhere">
                          Anywhere
                        </label>
                      </div>
                      <div className="sing-btn-groups">
                        <input type="checkbox" className="btn-check" id="onsite" />
                        <label className="btn btn-md btn-outline-main font--bold rounded-5" htmlFor="onsite">
                          On Site
                        </label>
                      </div>
                      <div className="sing-btn-groups">
                        <input type="checkbox" className="btn-check" id="remote" />
                        <label className="btn btn-md btn-outline-main font--bold rounded-5" htmlFor="remote">
                          Fully Remote
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="single-tabs-group">
                  <div className="single-tabs-group-header">
                    <h5>Type Of Contract</h5>
                  </div>
                  <div className="single-tabs-group-content">
                    <div className="d-flex flex-wrap">
                      <div className="sing-btn-groups">
                        <input type="checkbox" className="btn-check" id="employee1" />
                        <label className="btn btn-md btn-outline-main font--bold rounded-5" htmlFor="employee1">
                          Employee
                        </label>
                      </div>
                      <div className="sing-btn-groups">
                        <input type="checkbox" className="btn-check" id="frelancers1" />
                        <label className="btn btn-md btn-outline-main font--bold rounded-5" htmlFor="frelancers1">
                          Freelancer
                        </label>
                      </div>
                      <div className="sing-btn-groups">
                        <input type="checkbox" className="btn-check" id="contractor1" />
                        <label className="btn btn-md btn-outline-main font--bold rounded-5" htmlFor="contractor1">
                          Contractor
                        </label>
                      </div>
                      <div className="sing-btn-groups">
                        <input type="checkbox" className="btn-check" id="internship1" />
                        <label className="btn btn-md btn-outline-main font--bold rounded-5" htmlFor="internship1">
                          Internship
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="single-tabs-group">
                  <div className="single-tabs-group-header">
                    <h5>Type Of Employment</h5>
                  </div>
                  <div className="single-tabs-group-content">
                    <div className="d-flex flex-wrap">
                      <div className="sing-btn-groups">
                        <input type="checkbox" className="btn-check" id="fulltime" />
                        <label className="btn btn-md btn-outline-main font--bold rounded-5" htmlFor="fulltime">
                          Full Time
                        </label>
                      </div>
                      <div className="sing-btn-groups">
                        <input type="checkbox" className="btn-check" id="parttime" />
                        <label className="btn btn-md btn-outline-main font--bold rounded-5" htmlFor="parttime">
                          Part Time
                        </label>
                      </div>
                      <div className="sing-btn-groups">
                        <input type="checkbox" className="btn-check" id="freelance2" defaultChecked />
                        <label className="btn btn-md btn-outline-main font--bold rounded-5" htmlFor="freelance2">
                          Freelance
                        </label>
                      </div>
                      <div className="sing-btn-groups">
                        <input type="checkbox" className="btn-check" id="internship2" />
                        <label className="btn btn-md btn-outline-main font--bold rounded-5" htmlFor="internship2">
                          Internship
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="single-tabs-group">
                  <div className="single-tabs-group-header">
                    <h5>Radius In Miles</h5>
                  </div>
                  <div className="single-tabs-group-content">
                    <div className="rg-slider">
                      <input type="text" className="js-range-slider" name="my_range" defaultValue="" />
                    </div>
                  </div>
                </div>

                <div className="single-tabs-group">
                  <div className="single-tabs-group-header">
                    <h5>Explore Top Categories</h5>
                  </div>
                  <div className="single-tabs-group-content">
                    <ul className="row p-0 m-0">
                      {[
                        "IT Computers",
                        "Web Design",
                        "Web development",
                        "SEO Services",
                        "Financial Service",
                        "Art, Design, Media",
                        "Coach & Education",
                        "Apps Developements",
                        "IOS Development",
                        "Android Development",
                      ].map((cat, i) => {
                        const id = `s-${i + 1}`;
                        return (
                          <li className="col-lg-6 col-md-6 p-0" key={id}>
                            <div className="form-check form-check-inline">
                              <input id={id} className="form-check-input" name={id} type="checkbox" />
                              <label htmlFor={id} className="form-check-label">
                                {cat}
                              </label>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                <div className="single-tabs-group">
                  <div className="single-tabs-group-header">
                    <h5>Keywords</h5>
                  </div>
                  <div className="single-tabs-group-content">
                    <div className="form-group">
                      <input type="text" className="form-control" placeholder="Design, Java, Python, WordPress etc..." />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <div className="filt-buttons-updates">
              <button type="button" className="btn btn-dark">
                Clear Filter
              </button>
              <button type="button" className="btn btn-main">
                Search
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
