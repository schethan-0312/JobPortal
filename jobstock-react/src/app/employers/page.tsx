"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Navbar5 from "@/components/Navbar5";
import Navbar7 from "@/components/Navbar7";
import Navbar8 from "@/components/Navbar8";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import FindJobCta from "@/components/jobs/FindJobCta";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl } from "@/lib/api";
import { Toaster, toast } from "react-hot-toast";

interface EmployerItem {
  id: string;
  companyName: string;
  logoUrl?: string | null;
  description?: string;
  website?: string;
  location?: string;
  industry?: string;
  status?: string;
  _count?: {
    jobs: number;
  };
}

interface EmployersResponse {
  items: EmployerItem[];
  total: number;
  page: number;
  pageSize: number;
}

export default function EmployersPage() {
  const { user } = useAuth();

  const [employers, setEmployers] = useState<EmployerItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("ALL");
  const [selectedLocation, setSelectedLocation] = useState<string>("ALL");

  // Following list
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followBusyId, setFollowBusyId] = useState<string | null>(null);

  // Load employers
  const loadEmployers = async () => {
    setLoading(true);
    try {
      const data = await api.get<EmployersResponse>("/employers?pageSize=50", { auth: false });
      setEmployers(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  // Load candidate's followed employers
  const loadFollowedList = async () => {
    if (!user || user.role !== "CANDIDATE") return;
    try {
      const data = await api.get<Array<{ employer?: { id: string } }>>("/follow/following");
      if (Array.isArray(data)) {
        const ids = new Set(
          data.filter((item) => item.employer?.id).map((item) => item.employer!.id)
        );
        setFollowingIds(ids);
      }
    } catch {
      // Non-critical
    }
  };

  useEffect(() => {
    loadEmployers();
  }, []);

  useEffect(() => {
    loadFollowedList();
  }, [user]);

  // Follow / Unfollow Toggle
  async function toggleFollow(employerId: string, companyName: string) {
    if (!user) {
      toast.error("Please login to follow companies");
      return;
    }
    if (user.role !== "CANDIDATE") {
      toast.error("Only candidates can follow companies");
      return;
    }

    setFollowBusyId(employerId);
    const isCurrentlyFollowing = followingIds.has(employerId);

    // Optimistic UI update
    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyFollowing) {
        next.delete(employerId);
      } else {
        next.add(employerId);
      }
      return next;
    });

    try {
      if (isCurrentlyFollowing) {
        await api.delete(`/follow/${employerId}`);
        toast.success(`Unfollowed ${companyName}`);
      } else {
        await api.post(`/follow/${employerId}`, {});
        toast.success(`Following ${companyName}! Added to your Network & Follows.`);
      }
    } catch (err) {
      // Revert
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyFollowing) {
          next.add(employerId);
        } else {
          next.delete(employerId);
        }
        return next;
      });
      toast.error(err instanceof ApiError ? err.message : "Failed to update follow status");
    } finally {
      setFollowBusyId(null);
    }
  }

  // Extract unique industries & locations for quick filters
  const industries = useMemo(() => {
    const set = new Set<string>();
    employers.forEach((e) => {
      if (e.industry) set.add(e.industry);
    });
    return Array.from(set);
  }, [employers]);

  const locations = useMemo(() => {
    const set = new Set<string>();
    employers.forEach((e) => {
      if (e.location) set.add(e.location);
    });
    return Array.from(set);
  }, [employers]);

  // Filtered companies
  const filteredEmployers = useMemo(() => {
    return employers.filter((e) => {
      if (selectedIndustry !== "ALL" && e.industry !== selectedIndustry) {
        return false;
      }
      if (selectedLocation !== "ALL" && e.location !== selectedLocation) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = e.companyName.toLowerCase().includes(q);
        const matchesLoc = (e.location || "").toLowerCase().includes(q);
        const matchesInd = (e.industry || "").toLowerCase().includes(q);
        if (!matchesName && !matchesLoc && !matchesInd) return false;
      }
      return true;
    });
  }, [employers, selectedIndustry, selectedLocation, search]);

  return (
    <>
      {user?.role === "CANDIDATE" ? (
        <Navbar7 />
      ) : user?.role === "EMPLOYER" ? (
        <Navbar8 />
      ) : (
        <Navbar5 />
      )}

      <Toaster position="top-center" />

      {/* Page Title Start */}
      <div className="page-title bg-main" style={{ background: "url(/assets/img/bg2.png) no-repeat" }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-12 col-md-12 pt-6remt">
              <h2 className="ipt-title text-white">Registered Companies</h2>
              <div className="breadcrumbs light">
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link href={user?.role === "CANDIDATE" ? "/candidate-dashboard" : "/"}>
                        {user?.role === "CANDIDATE" ? "Dashboard" : "Home"}
                      </Link>
                    </li>
                    <li className="breadcrumb-item active text-white-50" aria-current="page">
                      Companies Directory
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Page Title End */}

      {/* Main Content Section */}
      <section className="bg-light py-5">
        <div className="container">
          {/* Top Search & Filter Bar */}
          <div className="card shadow-sm border-0 rounded-4 p-4 mb-4">
            <div className="row g-3 align-items-center">
              <div className="col-lg-5 col-md-6 col-12">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0">
                    <i className="fa-solid fa-magnifying-glass text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 py-2"
                    placeholder="Search company by name, industry, or location..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setSearch("")}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="col-lg-3 col-md-3 col-6">
                <select
                  className="form-select py-2"
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                >
                  <option value="ALL">All Industries</option>
                  {industries.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-lg-3 col-md-3 col-6">
                <select
                  className="form-select py-2"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                >
                  <option value="ALL">All Locations</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-lg-1 col-md-12 text-end">
                <button
                  type="button"
                  className="btn btn-outline-secondary full-width py-2"
                  onClick={() => {
                    setSearch("");
                    setSelectedIndustry("ALL");
                    setSelectedLocation("ALL");
                  }}
                  title="Reset Filters"
                >
                  <i className="fa-solid fa-rotate-left"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Header Summary */}
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <h5 className="mb-0 text-dark fw-bold">
              Showing {filteredEmployers.length} of {total} Companies
            </h5>
            {user?.role === "CANDIDATE" && (
              <Link href="/candidate-follow-employers" className="btn btn-sm btn-outline-main px-3 py-2 fw-medium">
                <i className="fa-solid fa-users-viewfinder me-1"></i>View My Followed Companies ({followingIds.size})
              </Link>
            )}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-main" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mt-2">Loading registered companies...</p>
            </div>
          )}

          {/* Error state */}
          {error && <div className="alert alert-danger mb-4">{error}</div>}

          {/* Empty state */}
          {!loading && !error && filteredEmployers.length === 0 && (
            <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
              <div
                className="mx-auto mb-3 d-flex align-items-center justify-content-center bg-light rounded-circle"
                style={{ width: "70px", height: "70px" }}
              >
                <i className="fa-solid fa-building-circle-exclamation fs-2 text-muted"></i>
              </div>
              <h5 className="fw-bold mb-1">No Companies Found</h5>
              <p className="text-muted">Try clearing your search query or selecting different filters.</p>
            </div>
          )}

          {/* Company Grid */}
          {!loading && !error && filteredEmployers.length > 0 && (
            <div className="row g-4">
              {filteredEmployers.map((company) => {
                const isFollowing = followingIds.has(company.id);
                const isBusy = followBusyId === company.id;
                const openJobsCount = company._count?.jobs ?? 0;

                return (
                  <div className="col-xl-4 col-lg-6 col-md-6 col-12" key={company.id}>
                    <div
                      className="card h-100 border-0 shadow-sm rounded-4 p-4 d-flex flex-column justify-content-between"
                      style={{ transition: "transform 0.2s, box-shadow 0.2s" }}
                    >
                      <div>
                        {/* Top Row: Logo & Open Jobs Badge */}
                        <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                          <Link href={`/employer-detail/${company.id}`}>
                            <div
                              className="rounded-circle overflow-hidden border d-flex align-items-center justify-content-center bg-white p-2"
                              style={{ width: "65px", height: "65px" }}
                            >
                              <img
                                src={assetUrl(company.logoUrl) || "/assets/img/l-4.png"}
                                alt={company.companyName}
                                className="img-fluid"
                                style={{ maxHeight: "100%", objectFit: "contain" }}
                              />
                            </div>
                          </Link>

                          <span className="badge bg-light-main text-main border px-3 py-2 fw-medium rounded-pill">
                            <i className="fa-solid fa-briefcase me-1"></i>
                            {openJobsCount} {openJobsCount === 1 ? "Job" : "Jobs"}
                          </span>
                        </div>

                        {/* Company Name & Details */}
                        <h5 className="fw-bold mb-1">
                          <Link
                            href={`/employer-detail/${company.id}`}
                            className="text-dark text-decoration-none"
                          >
                            {company.companyName}
                          </Link>
                        </h5>

                        <div className="d-flex flex-wrap gap-2 text-muted small mb-3">
                          {company.industry && (
                            <span>
                              <i className="fa-solid fa-layer-group me-1 text-main"></i>
                              {company.industry}
                            </span>
                          )}
                          {company.location && (
                            <span>
                              <i className="fa-solid fa-location-dot me-1 text-main"></i>
                              {company.location}
                            </span>
                          )}
                        </div>

                        <p
                          className="text-muted small mb-4"
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            minHeight: "40px",
                          }}
                        >
                          {company.description || "Leading company hiring top talent on JobStock."}
                        </p>
                      </div>

                      {/* Action Buttons: View Jobs & Follow */}
                      <div className="d-flex align-items-center gap-2 pt-3 border-top">
                        <Link
                          href={`/employer-detail/${company.id}?tab=jobs`}
                          className="btn btn-sm btn-light-main flex-grow-1 py-2 fw-medium"
                        >
                          <i className="fa-regular fa-eye me-1"></i>
                          View Jobs
                        </Link>

                        <button
                          type="button"
                          className={`btn btn-sm px-3 py-2 fw-medium ${
                            isFollowing
                              ? "btn-outline-main"
                              : "btn-main"
                          }`}
                          onClick={() => toggleFollow(company.id, company.companyName)}
                          disabled={isBusy}
                          title={isFollowing ? "Click to Unfollow" : "Click to Follow"}
                        >
                          {isBusy ? (
                            "..."
                          ) : isFollowing ? (
                            <>
                              <i className="fa-solid fa-check me-1"></i>Following
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-plus me-1"></i>Follow
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <FindJobCta />
      <LoginModal />
      <Footer />
    </>
  );
}
