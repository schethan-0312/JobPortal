import Navbar2 from "@/components/Navbar2";
import Footer2 from "@/components/Footer2";
import LoginModal from "@/components/LoginModal";
import { api, ApiError, assetUrl } from "@/lib/api";

interface Employer {
  id: string;
  companyName: string;
  logoUrl?: string | null;
  description?: string;
  website?: string;
  location?: string;
  industry?: string;
  status?: string;
  cultureBlurb?: string | null;
  photos?: string[];
}

const views = (employer: Employer) => [
  { icon: "fa-solid fa-layer-group text-main", title: "Industry", name: employer.industry ?? "—" },
  { icon: "fa-solid fa-map-location-dot text-main", title: "Location", name: employer.location ?? "—" },
  { icon: "fa-solid fa-building-circle-check text-main", title: "Status", name: employer.status ?? "—" },
];

async function getEmployer(id: string): Promise<{ employer: Employer | null; error: string | null }> {
  try {
    const employer = await api.get<Employer>(`/employers/${id}`, { auth: false });
    return { employer, error: null };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return { employer: null, error: "Employer not found." };
    }
    return { employer: null, error: err instanceof Error ? err.message : "Failed to load employer" };
  }
}

export default async function EmployerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { employer, error } = await getEmployer(slug);

  return (
    <>
      <Navbar2 />

      {/* Header Information Start */}
      <section className="gray-simple">
        <div className="container">
          <div className="row">
            <div className="col-xl-12 col-lg-12 col-md-12">
              {error && (
                <div className="emplr-head-block p-5 text-center">
                  <p className="text-danger m-0">{error}</p>
                </div>
              )}
              {employer && (
                <div className="emplr-head-block">
                  <div className="emplr-head-left">
                    <div className="emplr-head-thumb">
                      <figure>
                        <img
                          src={assetUrl(employer.logoUrl) || "/assets/img/l-1.png"}
                          className="img-fluid rounded"
                          alt=""
                        />
                      </figure>
                    </div>
                    <div className="emplr-head-caption">
                      <div className="emplr-head-caption-top">
                        <div className="emplr-yior-1">
                          <span className="label text-sm-muted text-success bg-light-success">
                            {employer.status ?? "VERIFIED"}
                          </span>
                        </div>
                        <div className="emplr-yior-2">
                          <h4 className="emplr-title">{employer.companyName}</h4>
                        </div>
                        <div className="emplr-yior-3">
                          <span>
                            <i className="fa-solid fa-building-shield me-1"></i>
                            {employer.industry ?? "—"}
                          </span>
                          <span>
                            <i className="fa-solid fa-location-dot me-1"></i>
                            {employer.location ?? "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="emplr-head-right">
                    {employer.website ? (
                      <a href={employer.website} target="_blank" rel="noreferrer" className="btn btn-main">
                        Visit Website
                      </a>
                    ) : (
                      <button type="button" className="btn btn-main" disabled>
                        No Website
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      {/* Header Information End */}

      {employer && (
        <section>
          <div className="container">
            <div className="row">
              <div className="col-xl-8 col-lg-8 col-md-12">
                <div className="cdtsr-groups-block">
                  <div className="single-cdtsr-block">
                    <div className="single-cdtsr-header">
                      <h5>About Company</h5>
                    </div>
                    <div className="single-cdtsr-body">
                      <p>{employer.description ?? "No description provided."}</p>
                    </div>
                  </div>

                  {employer.cultureBlurb && (
                    <div className="single-cdtsr-block">
                      <div className="single-cdtsr-header">
                        <h5>Culture &amp; Values</h5>
                      </div>
                      <div className="single-cdtsr-body">
                        <p style={{ whiteSpace: "pre-line" }}>{employer.cultureBlurb}</p>
                      </div>
                    </div>
                  )}

                  {employer.photos && employer.photos.length > 0 && (
                    <div className="single-cdtsr-block">
                      <div className="single-cdtsr-header">
                        <h5>Life at {employer.companyName}</h5>
                      </div>
                      <div className="single-cdtsr-body">
                        <div className="d-flex flex-wrap gap-3">
                          {employer.photos.map((url) => (
                            <img
                              key={url}
                              src={assetUrl(url) ?? url}
                              alt=""
                              width={160}
                              height={160}
                              style={{ objectFit: "cover", borderRadius: 8 }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="col-xl-4 col-lg-4 col-md-12">
                <div className="eflorio-wrap-block mb-4">
                  <div className="eflorio-wrap-group">
                    <div className="eflorio-wrap-body">
                      <div className="eflorio-list-groups">
                        {views(employer).map((item, idx) => (
                          <div className="single-eflorio-list" key={idx}>
                            <div className="eflorio-list-icons">
                              <i className={item.icon}></i>
                            </div>
                            <div className="eflorio-list-captions">
                              <label>{item.title}</label>
                              <h6>{item.name}</h6>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="eflorio-wrap-footer">
                      <div className="eflorio-footer-body">
                        {employer.website ? (
                          <a
                            href={employer.website}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-main fw-medium full-width"
                          >
                            View Website
                          </a>
                        ) : (
                          <button type="button" className="btn btn-main fw-medium full-width" disabled>
                            View Website
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

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
