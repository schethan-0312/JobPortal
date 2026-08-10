import Navbar2 from "@/components/Navbar5";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import RecordProfileView from "@/components/RecordProfileView";
import CandidateFollowHeader from "@/components/CandidateFollowHeader";
import { api, ApiError, assetUrl } from "@/lib/api";
import Navbar5 from "@/components/Navbar5";

interface CandidateProfile {
  id: string;
  fullName: string;
  headline?: string;
  location?: string;
  about?: string;
  profilePhotoUrl?: string | null;
  resume?: {
    resumeUrl: string | null;
    summary: string | null;
    skills: string[];
    experienceYears: number | null;
    educations: any[];
    experiences: any[];
    projects: any[];
    certifications: any[];
  } | null;
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

async function getFollowCounts(id: string): Promise<{ followersCount: number; followingCount: number }> {
  try {
    const counts = await api.get<{ followersCount: number; followingCount: number }>(`/follow/counts/${id}`, { auth: false });
    return counts;
  } catch {
    return { followersCount: 0, followingCount: 0 };
  }
}

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { candidate, error } = await getCandidate(slug);
  const counts = candidate ? await getFollowCounts(candidate.id) : { followersCount: 0, followingCount: 0 };

  return (
    <>
      <Navbar5 />

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
                <CandidateFollowHeader candidate={candidate} initialCounts={counts} />
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
                        <h5>Resume Summary</h5>
                      </div>
                      <div className="single-cdtsr-body">
                        <p>{candidate.resume?.summary || candidate.about || "No summary provided."}</p>
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
                              title: candidate.resume?.experienceYears != null ? `${candidate.resume.experienceYears} Years` : "Not specified",
                              name: "Experience",
                            },
                            {
                              icon: "fa-solid fa-user-graduate",
                              title: candidate.headline ?? "Not specified",
                              name: "Headline",
                            },
                            {
                              icon: "fa-solid fa-layer-group",
                              title: (candidate.resume?.skills ?? []).length > 0 ? `${(candidate.resume?.skills ?? []).length} Skills Listed` : "No skills listed",
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
                          {(candidate.resume?.skills ?? []).length === 0 && <span>No skills listed</span>}
                          {(candidate.resume?.skills ?? []).map((skill) => (
                            <span key={skill}>{skill}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Experiences */}
                    <div className="single-cdtsr-block">
                      <div className="single-cdtsr-header">
                        <h5>Experience</h5>
                      </div>
                      <div className="single-cdtsr-body">
                        {(candidate.resume?.experiences ?? []).length === 0 && <p>No experience listed</p>}
                        <ul className="timeline">
                          {(candidate.resume?.experiences ?? []).map((exp: any) => (
                            <li key={exp.id}>
                              <div className="timeline-badge bg-primary"></div>
                              <div className="timeline-panel">
                                <div className="timeline-heading">
                                  <h6 className="timeline-title mb-1">{exp.title}</h6>
                                  <p className="text-muted mb-1"><small>{exp.company} | {exp.startDate || ""} - {exp.endDate || ""}</small></p>
                                </div>
                                <div className="timeline-body">
                                  <p>{exp.description}</p>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Educations */}
                    <div className="single-cdtsr-block">
                      <div className="single-cdtsr-header">
                        <h5>Education</h5>
                      </div>
                      <div className="single-cdtsr-body">
                        {(candidate.resume?.educations ?? []).length === 0 && <p>No education listed</p>}
                        <ul className="timeline">
                          {(candidate.resume?.educations ?? []).map((edu: any) => (
                            <li key={edu.id}>
                              <div className="timeline-badge bg-success"></div>
                              <div className="timeline-panel">
                                <div className="timeline-heading">
                                  <h6 className="timeline-title mb-1">{edu.title}</h6>
                                  <p className="text-muted mb-1"><small>{edu.academy} | {edu.year || ""}</small></p>
                                </div>
                                <div className="timeline-body">
                                  <p>{edu.description}</p>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Certifications */}
                    <div className="single-cdtsr-block">
                      <div className="single-cdtsr-header">
                        <h5>Certifications</h5>
                      </div>
                      <div className="single-cdtsr-body">
                        {(candidate.resume?.certifications ?? []).length === 0 && <p>No certifications listed</p>}
                        <ul className="timeline">
                          {(candidate.resume?.certifications ?? []).map((cert: any) => (
                            <li key={cert.id}>
                              <div className="timeline-badge bg-info"></div>
                              <div className="timeline-panel">
                                <div className="timeline-heading">
                                  <h6 className="timeline-title mb-1">{cert.title}</h6>
                                  <p className="text-muted mb-1"><small>{cert.year || ""}</small></p>
                                </div>
                                <div className="timeline-body">
                                  <p>{cert.description}</p>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Projects */}
                    <div className="single-cdtsr-block">
                      <div className="single-cdtsr-header">
                        <h5>Projects</h5>
                      </div>
                      <div className="single-cdtsr-body">
                        {(candidate.resume?.projects ?? []).length === 0 && <p>No projects listed</p>}
                        <ul className="timeline">
                          {(candidate.resume?.projects ?? []).map((proj: any) => (
                            <li key={proj.id}>
                              <div className="timeline-badge bg-warning"></div>
                              <div className="timeline-panel">
                                <div className="timeline-heading">
                                  <h6 className="timeline-title mb-1">{proj.title}</h6>
                                  {proj.link && <p className="text-muted mb-1"><small><a href={proj.link} target="_blank" rel="noreferrer">{proj.link}</a></small></p>}
                                </div>
                                <div className="timeline-body">
                                  <p>{proj.description}</p>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
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
      <section className="bg-cover bg-main" >
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
                  <a href="/jobs" className="btn btn-lg  btn-whites fw-medium px-xl-5 px-lg-4 me-2">
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
      <Footer />
    </>
  );
}
