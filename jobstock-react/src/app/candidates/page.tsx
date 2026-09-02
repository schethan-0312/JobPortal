import Link from "next/link";
import CandidatesNavbar from "./CandidatesNavbar";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import Pagination from "@/components/jobs/Pagination";
import FilterModal from "@/components/jobs/FilterModal";
import SortingBar from "@/components/jobs/SortingBar";
import CityLocationInput from "@/components/CityLocationInput";
import CandidatesListClient from "./CandidatesListClient";
import { assetUrl } from "@/lib/api";

export const dynamic = "force-dynamic";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

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

async function getCandidates(params?: Record<string, string | undefined>): Promise<{ candidates: CandidateProfile[]; total: number; pageSize: number; error: string | null }> {
  try {
    const query = new URLSearchParams();
    if (params?.location) query.set("location", params.location);
    if (params?.skill) query.set("skill", params.skill);
    if (params?.keyword) query.set("keyword", params.keyword);
    if (params?.sortBy) query.set("sortBy", params.sortBy);
    if (params?.page) query.set("page", params.page);
    if (params?.pageSize) query.set("pageSize", params.pageSize);
    const qs = query.toString();
    const url = qs ? `${API_BASE}/candidates?${qs}` : `${API_BASE}/candidates`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    const data: CandidatesResponse = await res.json();
    return { candidates: data.items ?? [], total: data.total ?? 0, pageSize: data.pageSize ?? (params?.pageSize ? parseInt(params.pageSize, 10) : 12), error: null };
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
  
  const query = new URLSearchParams();
  if (params.location) query.set("location", params.location);
  if (params.skill) query.set("skill", params.skill);
  if (params.keyword) query.set("keyword", params.keyword);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.page) query.set("page", params.page);
  if (params.pageSize) query.set("pageSize", params.pageSize);
  const qs = query.toString();

  const { candidates, total, pageSize, error } = await getCandidates(params);
  const currentPage = parseInt(params.page || "1", 10) || 1;
  const currentSize = parseInt(params.pageSize || pageSize.toString(), 10) || 12;
  const hasFilters = Boolean((params.skill && params.skill.trim()) || (params.keyword && params.keyword.trim()) || (params.location && params.location.trim()));

  return (
    <>
      <CandidatesNavbar />

      {/* Page Title Start */}
      <div
        className="page-title bg-main"
        style={{
          background: "url(/assets/img/bg2.png) no-repeat",
          paddingTop: "120px",
          paddingBottom: "50px",
        }}
      >
        <div className="container">
          <div className="row">
            <div className="col-lg-12 col-md-12">
              <h2 className="ipt-title text-white">Browse Candidates</h2>
              <div className="breadcrumbs light">
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link href="/" className="text-white-50">Home</Link>
                    </li>
                    <li className="breadcrumb-item active text-white" aria-current="page">
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
      <section className="bg-light py-5">
        <div className="container">
          <div className="row">
            {/* Job List Wrap */}
            <div className="col-12">
              
              {/* Candidate Search Form */}
              <div
                className="card mb-4 border-0 shadow-sm rounded-4"
                style={{ overflow: "visible", position: "relative", zIndex: 50 }}
              >
                <div className="card-body p-4" style={{ overflow: "visible" }}>
                  <form action="/candidates" method="GET" className="row g-3 align-items-end" style={{ overflow: "visible" }}>
                    {params.sortBy && <input type="hidden" name="sortBy" value={params.sortBy} />}
                    {params.pageSize && <input type="hidden" name="pageSize" value={params.pageSize} />}
                    <div className={hasFilters ? "col-lg-5 col-md-5 col-12" : "col-lg-5 col-md-5 col-12"}>
                      <div className="form-group mb-0">
                        <label className="form-label text-dark fw-medium">Keyword or Skill</label>
                        <input
                          type="text"
                          name="skill"
                          className="form-control rounded-3 py-2"
                          placeholder="e.g. React, Manager"
                          defaultValue={params.skill || params.keyword || ""}
                        />
                      </div>
                    </div>
                    <div className={hasFilters ? "col-lg-4 col-md-4 col-12" : "col-lg-5 col-md-5 col-12"}>
                      <div className="form-group mb-0">
                        <label className="form-label text-dark fw-medium">Location</label>
                        <CityLocationInput
                          name="location"
                          defaultValue={params.location || ""}
                          placeholder="e.g. Bangalore, Mumbai, Remote"
                        />
                      </div>
                    </div>
                    <div className={hasFilters ? "col-lg-3 col-md-3 col-12" : "col-lg-2 col-md-2 col-12"}>
                      <div className="d-flex gap-2">
                        <button type="submit" className="btn btn-main flex-grow-1 py-2 fw-medium rounded-3">
                          <i className="fa-solid fa-magnifying-glass me-1.5"></i>Search
                        </button>
                        {hasFilters && (
                          <Link
                            href={params.pageSize ? `/candidates?pageSize=${params.pageSize}` : "/candidates"}
                            className="btn btn-outline-danger py-2 px-3 fw-medium rounded-3 d-flex align-items-center gap-1 text-decoration-none"
                            title="Clear all search filters"
                          >
                            <i className="fa-solid fa-rotate-left me-1"></i>
                            <span>Clear</span>
                          </Link>
                        )}
                      </div>
                    </div>

                    {hasFilters && (
                      <div className="col-12 pt-3 border-top mt-3 d-flex flex-wrap align-items-center gap-2">
                        <span className="text-muted small fw-medium">Active Filters:</span>
                        {(params.skill || params.keyword) && (
                          <span className="badge bg-light-main text-main border px-2.5 py-1.5 rounded-pill d-inline-flex align-items-center gap-1.5 small">
                            <i className="fa-solid fa-code me-1"></i>Skill / Keyword: <strong>{params.skill || params.keyword}</strong>
                          </span>
                        )}
                        {params.location && (
                          <span className="badge bg-light-info text-info border px-2.5 py-1.5 rounded-pill d-inline-flex align-items-center gap-1.5 small">
                            <i className="fa-solid fa-location-dot me-1"></i>Location: <strong>{params.location}</strong>
                          </span>
                        )}
                        <Link
                          href={params.pageSize ? `/candidates?pageSize=${params.pageSize}` : "/candidates"}
                          className="text-danger small text-decoration-none fw-medium ms-auto"
                        >
                          <i className="fa-solid fa-xmark me-1"></i>Reset Filters
                        </Link>
                      </div>
                    )}
                  </form>
                </div>
              </div>

              {/* Sorting Bar */}
              <SortingBar
                total={total}
                shown={candidates.length}
                currentPage={currentPage}
                pageSize={currentSize}
              />

              {/* Start All List */}
              <CandidatesListClient 
                initialCandidates={candidates} 
                initialTotal={total} 
                initialPageSize={currentSize} 
                initialError={error} 
                qs={qs} 
              />
              {/* End All Job List */}

              <div className="mt-4">
                <Pagination total={total} pageSize={currentSize} currentPage={currentPage} />
              </div>
            </div>
            {/* Job List Wrap End*/}
          </div>
        </div>
      </section>
      {/* All List Wrap */}

      <LoginModal />

      <FilterModal />

      <Footer />
    </>
  );
}
