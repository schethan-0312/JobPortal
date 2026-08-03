import { Suspense } from "react";
import Link from "next/link";
import Navbar5 from "@/components/Navbar5";
import Footer2 from "@/components/Footer2";
import LoginModal from "@/components/LoginModal";
import JobFilters from "@/components/jobs/JobFilters";
import SortingBar from "@/components/jobs/SortingBar";
import Pagination from "@/components/jobs/Pagination";
import FindJobCta from "@/components/jobs/FindJobCta";
import FilterModal from "@/components/jobs/FilterModal";
import { api, assetUrl } from "@/lib/api";

interface CandidateProfile {
  id: string;
  fullName: string;
  headline?: string;
  location?: string;
  skills?: string[];
  experienceYears?: number;
  resumeUrl?: string | null;
  profilePhotoUrl?: string | null;
}

interface CandidatesResponse {
  items: CandidateProfile[];
  total: number;
  page: number;
  pageSize: number;
}

async function getCandidates(params: {
  location?: string;
  skill?: string;
  page?: string;
}): Promise<{ candidates: CandidateProfile[]; total: number; pageSize: number; error: string | null }> {
  try {
    const query = new URLSearchParams();
    if (params.location) query.set("location", params.location);
    if (params.skill) query.set("skill", params.skill);
    if (params.page) query.set("page", params.page);
    const qs = query.toString();
    const data = await api.get<CandidatesResponse>(`/candidates${qs ? `?${qs}` : ""}`, { auth: false });
    return { candidates: data.items ?? [], total: data.total ?? 0, pageSize: data.pageSize ?? 12, error: null };
  } catch (err) {
    return { candidates: [], total: 0, pageSize: 12, error: err instanceof Error ? err.message : "Failed to load candidates" };
  }
}

export default async function CandidatesGridPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { candidates, total, pageSize, error } = await getCandidates(params);

  return (
    <>
      <Navbar5 />

      {/* Page Title Start */}
      <div className="page-title bg-main" style={{ background: "url(/assets/img/bg2.png) no-repeat" }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-12 col-md-12">
              <h2 className="ipt-title">Browse Candidates</h2>
              <div className="breadcrumbs light">
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                      <a href="/">Home</a>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Candidates
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Page Title End */}

      {/* All List Wrap */}
      <section>
        <div className="container">
          <div className="row">
            {/* Search Sidebar */}
            <div className="col-xxl-3 col-xl-4 col-lg-4 col-md-12 col-sm-12">
              <div className="side-widget-blocks">
                <Suspense fallback={null}>
                  <JobFilters variant="simple" mode="candidates" />
                </Suspense>
              </div>
            </div>
            {/* Sidebar End */}

            {/* Job List Wrap */}
            <div className="col-xxl-9 col-xl-8 col-lg-8 col-md-12 col-sm-12">
              {/* Shorting Box */}
              <div className="row justify-content-center mb-4">
                <div className="col-lg-12 col-md-12">
                  <Suspense fallback={null}>
                    <SortingBar total={total} shown={candidates.length} />
                  </Suspense>
                </div>
              </div>
              {/* Shorting Wrap End */}

              {/* Start All List */}
              {error && <p className="text-danger mb-3">{error}</p>}
              {!error && candidates.length === 0 && <p className="text-muted mb-3">No candidates found</p>}
              <div className="row justify-content-center gx-3 gy-4">
                {candidates.map((item) => (
                  <div className="col-xl-4 col-lg-6 col-md-6 col-12" key={item.id}>
                    <div className="jbs-grid-usrs-block border">
                      <div className="jbs-grid-usrs-thumb">
                        <div className="jbs-grid-yuo jbs-verified">
                          <Link href={`/candidate-detail/${item.id}`}>
                            <figure>
                              <img
                                src={assetUrl(item.profilePhotoUrl) || "/assets/img/avatar.jpg"}
                                className="img-fluid circle"
                                alt=""
                              />
                            </figure>
                          </Link>
                        </div>
                      </div>
                      <div className="jbs-grid-usrs-caption">
                        <div className="jbs-tiosk">
                          <h4 className="jbs-tiosk-title">
                            <Link href={`/candidate-detail/${item.id}`}>{item.fullName}</Link>
                          </h4>
                          <div className="jbs-tiosk-subtitle">
                            <span>{item.headline ?? "—"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="jbs-grid-usrs-info">
                        <div className="jbs-info-ico-style bold">
                          <div className="jbs-single-y1 style-2">
                            <span>
                              <i className="fa-solid fa-location-dot"></i>
                            </span>
                            {item.location ?? "—"}
                          </div>
                          <div className="jbs-single-y1 style-3">
                            <span>
                              <i className="fa-solid fa-coins"></i>
                            </span>
                            {item.experienceYears != null ? `${item.experienceYears} Years exp.` : "—"}
                          </div>
                        </div>
                      </div>
                      <div className="jbs-grid-usrs-contact">
                        <div className="jbs-btn-groups">
                          <a href="#" className="btn btn-md btn-gray px-4">
                            Message
                          </a>
                          <Link href={`/candidate-detail/${item.id}`} className="btn btn-md btn-main px-4">
                            View Detail
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* End All Job List */}

              <Suspense fallback={null}>
                <Pagination total={total} pageSize={pageSize} />
              </Suspense>
            </div>
            {/* Job List Wrap End*/}
          </div>
        </div>
      </section>
      {/* All List Wrap */}

      <FindJobCta />

      <LoginModal />

      <FilterModal />

      <Footer2 />
    </>
  );
}
