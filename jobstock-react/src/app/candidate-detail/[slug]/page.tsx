import Navbar2 from "@/components/Navbar2";
import Footer2 from "@/components/Footer2";
import LoginModal from "@/components/LoginModal";
import RecordProfileView from "@/components/RecordProfileView";
import { api, ApiError, assetUrl } from "@/lib/api";

interface CandidateProfile {
  id: string;
  fullName: string;
  headline?: string;
  location?: string;
  skills?: string[];
  experienceYears?: number;
  resumeUrl?: string | null;
  profilePhotoUrl?: string | null;
  isVerified?: boolean;
  githubUsername?: string | null;
  githubProfileUrl?: string | null;
  linkedinProfileUrl?: string | null;
}

async function getCandidate(id: string): Promise<{ candidate: CandidateProfile | null; error: string | null }> {
  try {
    const candidate = await api.get<CandidateProfile>(`/candidates/${id}`, { auth: false });
    return { candidate, error: null };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return { candidate: null, error: "Candidate not found." };
    }
    return { candidate: null, error: err instanceof Error ? err.message : "Failed to load candidate" };
  }
}

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { candidate, error } = await getCandidate(slug);

  return (
    <>
      <Navbar2 />
      {candidate && <RecordProfileView candidateId={candidate.id} />}

      {/* Header Information Start */}
      <section className="gray-simple">
        <div className="container">
          <div className="row">
            <div className="col-xl-12 col-lg-12 col-md-12">
              {error && (
                <div className="cndt-head-block p-5 text-center">
                  <p className="text-danger m-0">{error}</p>
                </div>
              )}
              {candidate && (
                <div className="cndt-head-block">
                  <div className="cndt-head-left">
                    <div className="cndt-head-thumb">
                      <figure>
                        <img
                          src={assetUrl(candidate.profilePhotoUrl) || "/assets/img/avatar.jpg"}
                          className="img-fluid circle"
                          alt=""
                        />
                      </figure>
                    </div>
                    <div className="cndt-head-caption">
                      <div className="cndt-head-caption-top">
                        <div className="cndt-yior-2">
                          <h4 className="cndt-title">
                            {candidate.fullName}
                            {candidate.isVerified && (
                              <span className="badge bg-success-subtle text-success border border-success ms-2" title="Passed a proctored skill assessment">
                                <i className="fa-solid fa-shield-check me-1"></i>Verified
                              </span>
                            )}
                          </h4>
                        </div>
                        <div className="cndt-yior-3">
                          <span>
                            <i className="fa-solid fa-user-graduate me-1"></i>
                            {candidate.headline ?? "—"}
                          </span>
                          <span>
                            <i className="fa-solid fa-location-dot me-1"></i>
                            {candidate.location ?? "—"}
                          </span>
                          <span>
                            <i className="fa-solid fa-briefcase me-1"></i>
                            {candidate.experienceYears != null ? `${candidate.experienceYears} Years exp.` : "—"}
                          </span>
                          {candidate.githubUsername && (
                            <span>
                              <a href={candidate.githubProfileUrl ?? undefined} target="_blank" rel="noreferrer">
                                <i className="fa-brands fa-github me-1"></i>
                                {candidate.githubUsername}
                              </a>
                            </span>
                          )}
                          {candidate.linkedinProfileUrl && (
                            <span>
                              <a href={candidate.linkedinProfileUrl} target="_blank" rel="noreferrer">
                                <i className="fa-brands fa-linkedin me-1"></i>
                                LinkedIn
                              </a>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="cndt-head-caption-bottom">
                        <div className="cndt-yior-skills">
                          {(candidate.skills ?? []).length === 0 && <span>No skills listed</span>}
                          {(candidate.skills ?? []).map((skill) => (
                            <span key={skill}>{skill}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="cndt-head-right">
                    {candidate.resumeUrl ? (
                      <a href={candidate.resumeUrl} target="_blank" rel="noreferrer" className="btn btn-main">
                        Download CV
                        <i className="fa-solid fa-download ms-2"></i>
                      </a>
                    ) : (
                      <button type="button" className="btn btn-main" disabled>
                        No Resume
                      </button>
                    )}
                    <button type="button" className="btn btn-outline-main ms-2">
                      <i className="fa-solid fa-bookmark"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      {/* Header Information End */}

      {candidate && (
        <>
          {/* Full Candidate Details Start */}
          <section>
            <div className="container">
              <div className="row">
                <div className="col-xl-8 col-lg-8 col-md-12">
                  <div className="cdtsr-groups-block">
                    <div className="single-cdtsr-block">
                      <div className="single-cdtsr-header">
                        <h5>About Candidate</h5>
                      </div>
                      <div className="single-cdtsr-body">
                        <p>{candidate.headline ?? "No description provided."}</p>
                      </div>
                    </div>

                    <div className="single-cdtsr-block">
                      <div className="single-cdtsr-header">
                        <h5>All Information</h5>
                      </div>
                      <div className="single-cdtsr-body">
                        <div className="row align-items-center justify-content-between gy-4">
                          {[
                            { icon: "fa-solid fa-location-dot", title: candidate.location ?? "Not specified", name: "Location" },
                            {
                              icon: "fa-solid fa-briefcase",
                              title: candidate.experienceYears != null ? `${candidate.experienceYears} Years` : "Not specified",
                              name: "Experience",
                            },
                            {
                              icon: "fa-solid fa-user-graduate",
                              title: candidate.headline ?? "Not specified",
                              name: "Headline",
                            },
                            {
                              icon: "fa-solid fa-layer-group",
                              title: (candidate.skills ?? []).length > 0 ? `${(candidate.skills ?? []).length} Skills Listed` : "No skills listed",
                              name: "Skills",
                            },
                          ].map((item, idx) => (
                            <div className="col-xl-6 col-lg-6 col-md-6" key={idx}>
                              <div className="cdtx-infr-box">
                                <div className="cdtx-infr-icon">
                                  <i className={item.icon}></i>
                                </div>
                                <div className="cdtx-infr-captions">
                                  <h5>{item.title}</h5>
                                  <p>{item.name}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="single-cdtsr-block">
                      <div className="single-cdtsr-header">
                        <h5>Candidate Skills</h5>
                      </div>
                      <div className="single-cdtsr-body">
                        <div className="cndts-all-skills-list">
                          {(candidate.skills ?? []).length === 0 && <span>No skills listed</span>}
                          {(candidate.skills ?? []).map((skill) => (
                            <span key={skill}>{skill}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="col-xl-4 col-lg-4 col-md-12">
                  <div className="sidefr-usr-block mb-4">
                    <div className="sidefr-usr-header">
                      <h4 className="sidefr-usr-title">Contact {candidate.fullName}</h4>
                    </div>
                    <div className="sidefr-usr-body">
                      <form>
                        <div className="form-group">
                          <input type="text" className="form-control" placeholder="Your Name" />
                        </div>
                        <div className="form-group">
                          <input type="email" className="form-control" placeholder="Email Address" />
                        </div>
                        <div className="form-group">
                          <input type="text" className="form-control" placeholder="Phone." />
                        </div>
                        <div className="form-group">
                          <input type="text" className="form-control" placeholder="Subject" />
                        </div>
                        <div className="form-group">
                          <textarea className="form-control" placeholder="Your Message"></textarea>
                        </div>
                        <div className="form-group m-0">
                          <button type="button" className="btn btn-main fw-medium full-width">
                            Send Message
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
      {/* Full Candidate Details End */}

      {/* Call To Action */}
      <section className="bg-cover bg-main" style={{ background: "url(/assets/img/footer-bg-dark.png)no-repeat" }}>
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

      <LoginModal />
      <Footer2 />
    </>
  );
}
