import Link from "next/link";
import Navbar5 from "@/components/Navbar5";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import JobFilters from "@/components/jobs/JobFilters";
import SortingBar from "@/components/jobs/SortingBar";
import Pagination from "@/components/jobs/Pagination";
import FindJobCta from "@/components/jobs/FindJobCta";
import { api, assetUrl } from "@/lib/api";

interface Employer {
  id: string;
  companyName: string;
  logoUrl?: string | null;
  description?: string;
  website?: string;
  location?: string;
  industry?: string;
  status?: string;
}

interface EmployersResponse {
  items: Employer[];
  total: number;
  page: number;
  pageSize: number;
}

async function getEmployers(): Promise<{ employers: Employer[]; total: number; pageSize: number; error: string | null }> {
  try {
    const data = await api.get<EmployersResponse>("/employers", { auth: false });
    return { employers: data.items ?? [], total: data.total ?? 0, pageSize: data.pageSize ?? 12, error: null };
  } catch (err) {
    return { employers: [], total: 0, pageSize: 12, error: err instanceof Error ? err.message : "Failed to load employers" };
  }
}

export default async function EmployersGridPage() {
  const { employers, total, pageSize, error } = await getEmployers();

  return (
    <>
      <Navbar5 />

      {/* Page Title Start */}
      <div className="page-title bg-main" style={{ background: "url(/assets/img/bg2.png) no-repeat" }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-12 col-md-12 pt-6remt">
              <h2 className="ipt-title">Browse Employers</h2>
              <div className="breadcrumbs light">
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                      <a href="/">Home</a>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Employers
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
                <JobFilters variant="simple" />
              </div>
            </div>
            {/* Sidebar End */}

            {/* Job List Wrap */}
            <div className="col-xxl-9 col-xl-8 col-lg-8 col-md-12 col-sm-12">
              {/* Shorting Box */}
              <div className="row justify-content-center mb-4">
                <div className="col-lg-12 col-md-12">
                  <SortingBar total={total} shown={employers.length} />
                </div>
              </div>
              {/* Shorting Wrap End */}

              {/* Start All List */}
              {error && <p className="text-danger mb-3">{error}</p>}
              {!error && employers.length === 0 && <p className="text-muted mb-3">No employers found</p>}
              <div className="row justify-content-start gx-3 gy-4">
                {employers.map((item) => (
                  <div className="col-xl-4 col-lg-6 col-md-6 col-sm-12" key={item.id}>
                    <div className="emp-grid-blocs border">
                      <div className="emp-grid-thumbs">
                        <Link href={`/employer-detail/${item.id}`}>
                          <figure>
                            <img
                              src={assetUrl(item.logoUrl) || "/assets/img/l-4.png"}
                              className="img-fluid"
                              alt=""
                            />
                          </figure>
                        </Link>
                      </div>

                      <div className="emp-grid-captions">
                        <div className="emplors-job-types-wrap">
                          <span className="text-sm-muted">{item.industry ?? "—"}</span>
                        </div>
                        <div className="emplors-job-title-wrap mb-1">
                          <h4>
                            <Link href={`/employer-detail/${item.id}`} className="emplors-job-title">
                              {item.companyName}
                            </Link>
                          </h4>
                        </div>
                        <div className="emplors-job-mrch-lists">
                          <div className="single-mrch-lists">
                            <span>
                              <i className="fa-solid fa-location-dot me-1"></i>
                              {item.location ?? "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="emp-grid-footrs">
                        <div className="emp-flexio">
                          <span className="label px-4 py-2 text-main bg-light-main">{item.status ?? "VERIFIED"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* End All Job List */}

              <Pagination total={total} pageSize={pageSize} />
            </div>
            {/* Job List Wrap End*/}
          </div>
        </div>
      </section>
      {/* All List Wrap */}

      <FindJobCta />

      <LoginModal />

      <Footer />
    </>
  );
}
