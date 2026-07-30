export default function EducationModals() {
  return (
    <>
      {/* education Modal */}
      <div className="modal fade" id="education" tabIndex={-1} role="dialog" aria-labelledby="messagemodal" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered education-pop-form" role="document">
          <div className="modal-content" id="educationmodal">
            <span className="mod-close" data-bs-dismiss="modal" aria-hidden="true"><i className="fas fa-close"></i></span>
            <div className="modal-body">
              <div className="text-center">
                <h4 className="mb-3">Add your Education</h4>
              </div>
              <div className="added-form">
                <form>
                  <div className="row mb-3">
                    <label className="col-md-12 col-form-label">Education Title</label>
                    <div className="col-md-12">
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-12 col-form-label">Academy Name</label>
                    <div className="col-md-12">
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-12 col-form-label">Passing year</label>
                    <div className="col-md-12">
                      <input type="date" className="form-control" />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-12 col-form-label">Description</label>
                    <div className="col-md-12">
                      <textarea className="form-control ht-80"></textarea>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-12">
                      <button type="submit" className="btn full-width btn-main">Save Education</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Experience Modal */}
      <div className="modal fade" id="experience" tabIndex={-1} role="dialog" aria-labelledby="messagemodal" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered experience-pop-form" role="document">
          <div className="modal-content" id="experiencemodal">
            <span className="mod-close" data-bs-dismiss="modal" aria-hidden="true"><i className="fas fa-close"></i></span>
            <div className="modal-body">
              <div className="text-center">
                <h4 className="mb-3">Add your Experience</h4>
              </div>
              <div className="added-form">
                <form>
                  <div className="row mb-3">
                    <label className="col-md-12 col-form-label">Job Title</label>
                    <div className="col-md-12">
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-12 col-form-label">Joinin Date</label>
                    <div className="col-md-12">
                      <input type="date" className="form-control" />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-12 col-form-label">End Date</label>
                    <div className="col-md-12">
                      <input type="date" className="form-control" />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-12 col-form-label">Company Name</label>
                    <div className="col-md-12">
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-12 col-form-label">Description</label>
                    <div className="col-md-12">
                      <textarea className="form-control ht-80"></textarea>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-12">
                      <button type="submit" className="btn full-width btn-main">Save Experience</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Award Modal */}
      <div className="modal fade" id="award" tabIndex={-1} role="dialog" aria-labelledby="messagemodal" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered award-pop-form" role="document">
          <div className="modal-content" id="awardmodal">
            <span className="mod-close" data-bs-dismiss="modal" aria-hidden="true"><i className="fas fa-close"></i></span>
            <div className="modal-body">
              <div className="text-center">
                <h4 className="mb-3">Add your Award</h4>
              </div>
              <div className="added-form">
                <form>
                  <div className="row mb-3">
                    <label className="col-md-12 col-form-label">Award Title</label>
                    <div className="col-md-12">
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-12 col-form-label">Award Year</label>
                    <div className="col-md-12">
                      <input type="date" className="form-control" />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-12 col-form-label">Description</label>
                    <div className="col-md-12">
                      <textarea className="form-control ht-80"></textarea>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-12">
                      <button type="submit" className="btn full-width btn-main">Save Award</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
