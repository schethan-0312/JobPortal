import Link from "next/link";
import Navbar5 from "@/components/Navbar5";
import Footer2 from "@/components/Footer2";
import LoginModal from "@/components/LoginModal";
import Pagination from "@/components/jobs/Pagination";
import FindJobCta from "@/components/jobs/FindJobCta";
import FilterModal from "@/components/jobs/FilterModal";
import SortingBar from "@/components/jobs/SortingBar";
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
    if (params?.page) query.set("page", params.page);
    const qs = query.toString();
    const url = qs ? `${API_BASE}/candidates?${qs}` : `${API_BASE}/candidates`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    const data: CandidatesResponse = await res.json();
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
  
  const query = new URLSearchParams();
  if (params.location) query.set("location", params.location);
  if (params.skill) query.set("skill", params.skill);
  if (params.page) query.set("page", params.page);
  const qs = query.toString();

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
            {/* Job List Wrap */}
            <div className="col-12">
              
              {/* Candidate Search Form */}
              <div className="card mb-4 border-0 shadow-sm">
                <div className="card-body p-4">
                  <form action="/candidates" method="GET" className="row g-3 align-items-end">
                    <div className="col-md-5">
                      <div className="form-group mb-0">
                        <label className="form-label text-muted">Keyword or Skill</label>
                        <input type="text" name="skill" className="form-control" placeholder="e.g. React, Manager" defaultValue={params.skill || ""} />
                      </div>
                    </div>
                    <div className="col-md-5">
                      <div className="form-group mb-0">
                        <label className="form-label text-muted">Location</label>
                        <input type="text" name="location" className="form-control" placeholder="e.g. New York, Remote" defaultValue={params.location || ""} />
                      </div>
                    </div>
                    <div className="col-md-2">
                      <button type="submit" className="btn btn-main w-100">Search</button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Shorting Box */}
              <div className="row justify-content-center mb-4">
                <div className="col-lg-12 col-md-12">
                  <SortingBar total={total} shown={candidates.length} />
                </div>
              </div>
              {/* Shorting Wrap End */}

              {/* Start All List */}
              <CandidatesListClient 
                initialCandidates={candidates} 
                initialTotal={total} 
                initialPageSize={pageSize} 
                initialError={error} 
                qs={qs} 
              />
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

      <FilterModal />

      <Footer2 />
    </>
  );
}
