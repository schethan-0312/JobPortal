"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { JOB_CATEGORIES } from "@/lib/job-categories";

function JobFiltersInner({ variant = "simple" }: { variant?: "full" | "simple" }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [jobType, setJobType] = useState(searchParams.get("jobType") || "");

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setLocation(searchParams.get("location") || "");
    setCategory(searchParams.get("category") || "");
    setJobType(searchParams.get("jobType") || "");
  }, [searchParams]);

  function applyFilters(newCategory = category, newJobType = jobType) {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (location.trim()) params.set("location", location.trim());
    if (newCategory) params.set("category", newCategory);
    if (newJobType) params.set("jobType", newJobType);

    const queryString = params.toString();
    router.push(queryString ? `/jobs?${queryString}` : "/jobs");
  }

  function handleClearAll(e: React.MouseEvent) {
    e.preventDefault();
    setSearch("");
    setLocation("");
    setCategory("");
    setJobType("");
    router.push("/jobs");
  }

  function handleCategoryChange(catName: string) {
    const nextCat = category === catName ? "" : catName;
    setCategory(nextCat);
    applyFilters(nextCat, jobType);
  }

  function handleJobTypeChange(type: string) {
    const nextType = jobType === type ? "" : type;
    setJobType(nextType);
    applyFilters(category, nextType);
  }

  return (
    <div className="sidebar-widgets collapse show miz_show" id="search_open" data-bs-parent="#search_open">
      <div className="sidebar_header d-flex align-items-center justify-content-between px-4 py-3 br-bottom">
        <h4 className="fs-bold fs-5 mb-0">Search Filter</h4>
        <div className="ssh-header">
          <a
            href="#!"
            onClick={handleClearAll}
            className="clear_all ft-medium text-muted"
            style={{ cursor: "pointer" }}
          >
            Clear All
          </a>
        </div>
      </div>

      <div className="search-inner">
        <div className="filter-search-box px-4 pt-3">
          <div className="form-group mb-3">
            <label className="fw-medium text-dark text-sm mb-1">Keywords</label>
            <input
              type="text"
              className="form-control"
              placeholder="Search by title or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyFilters();
              }}
            />
          </div>
          <div className="form-group mb-3">
            <label className="fw-medium text-dark text-sm mb-1">Location</label>
            <input
              type="text"
              className="form-control"
              placeholder="City, State, or Remote..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyFilters();
              }}
            />
          </div>
        </div>

        <div className="filter_wraps">
          {/* Job categories Search */}
          <div className="single_search_boxed px-4 pt-3 br-bottom">
            <div className="widget-boxed-header mb-2">
              <h4 className="ft-medium fs-md mb-0 text-dark">Job Categories</h4>
            </div>
            <div className="widget-boxed-body">
              <div className="side-list no-border">
                <div className="single_filter_card">
                  <div className="card-body p-0">
                    <div className="inner_widget_link">
                      <ul className="no-ul-list filter-list ps-0" style={{ listStyle: "none" }}>
                        {JOB_CATEGORIES.map((cat, idx) => (
                          <li key={idx} className="mb-2">
                            <input
                              id={`cat_${idx}`}
                              className="form-check-input me-2"
                              type="checkbox"
                              checked={category === cat}
                              onChange={() => handleCategoryChange(cat)}
                              style={{ cursor: "pointer" }}
                            />
                            <label
                              htmlFor={`cat_${idx}`}
                              className="form-check-label text-dark"
                              style={{ cursor: "pointer" }}
                            >
                              {cat}
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Job Type Filter */}
          <div className="single_search_boxed px-4 pt-3 br-bottom">
            <div className="widget-boxed-header mb-2">
              <h4 className="ft-medium fs-md mb-0 text-dark">Job Type</h4>
            </div>
            <div className="widget-boxed-body">
              <div className="side-list no-border">
                <div className="single_filter_card">
                  <div className="card-body p-0">
                    <div className="inner_widget_link">
                      <ul className="no-ul-list filter-list ps-0" style={{ listStyle: "none" }}>
                        {["Full-time", "Part-time", "Contract", "Internship", "Remote"].map((type, idx) => (
                          <li key={idx} className="mb-2">
                            <input
                              id={`jtype_${idx}`}
                              className="form-check-input me-2"
                              type="checkbox"
                              checked={jobType === type}
                              onChange={() => handleJobTypeChange(type)}
                              style={{ cursor: "pointer" }}
                            />
                            <label
                              htmlFor={`jtype_${idx}`}
                              className="form-check-label text-dark"
                              style={{ cursor: "pointer" }}
                            >
                              {type}
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="form-group p-4 mb-1">
            <button
              type="button"
              className="btn btn-lg btn-main fs-6 fw-medium full-width"
              onClick={() => applyFilters()}
            >
              Search job
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JobFilters({ variant = "simple" }: { variant?: "full" | "simple" }) {
  return (
    <Suspense fallback={null}>
      <JobFiltersInner variant={variant} />
    </Suspense>
  );
}
