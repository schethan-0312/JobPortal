"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { JOB_CATEGORIES } from "@/lib/job-categories";

const workModeOptions = [
  { value: "ONSITE", label: "On-site" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "REMOTE", label: "Remote" },
];

const experienceOptions = [
  { value: "0", label: "Fresher" },
  { value: "1", label: "1+ Years" },
  { value: "3", label: "3+ Years" },
  { value: "5", label: "5+ Years" },
  { value: "10", label: "10+ Years" },
];

const salaryOptions = [
  { value: "300000", label: "₹3L+" },
  { value: "600000", label: "₹6L+" },
  { value: "1000000", label: "₹10L+" },
  { value: "1800000", label: "₹18L+" },
];

const postedOptions = [
  { value: "", label: "Any time" },
  { value: "1", label: "Last 24h" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
];

export default function JobFilters({ variant = "simple" }: { variant?: "full" | "simple" }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [location, setLocation] = useState(searchParams.get("location") ?? "");
  const category = searchParams.get("category") ?? "";
  const jobType = searchParams.get("jobType") ?? "";
  const workMode = searchParams.get("workMode") ?? "";
  const minExperience = searchParams.get("minExperience") ?? "";
  const salaryMin = searchParams.get("salaryMin") ?? "";
  const postedWithin = searchParams.get("postedWithin") ?? "";

  function pushParams(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(overrides)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    router.push(`/jobs?${params.toString()}`);
  }

  function toggleParam(key: string, value: string) {
    pushParams({ [key]: searchParams.get(key) === value ? undefined : value });
  }

  function handleKeywordSubmit(e: React.FormEvent) {
    e.preventDefault();
    pushParams({ search, location });
  }

  function clearAll() {
    setSearch("");
    setLocation("");
    router.push("/jobs");
  }

  const categoryList = (
    <ul className="no-ul-list filter-list">
      {JOB_CATEGORIES.map((cat) => (
        <li key={cat}>
          <input
            id={`cat-${cat}`}
            className="form-check-input"
            type="checkbox"
            checked={category === cat}
            onChange={() => toggleParam("category", cat)}
          />
          <label htmlFor={`cat-${cat}`} className="form-check-label">{cat}</label>
        </li>
      ))}
    </ul>
  );

  const workModeList = (
    <ul className="no-ul-list filter-list">
      {workModeOptions.map((opt) => (
        <li key={opt.value}>
          <input
            id={`wm-${opt.value}`}
            className="form-check-input"
            type="checkbox"
            checked={workMode === opt.value}
            onChange={() => toggleParam("workMode", opt.value)}
          />
          <label htmlFor={`wm-${opt.value}`} className="form-check-label">{opt.label}</label>
        </li>
      ))}
    </ul>
  );

  const experienceList = (
    <ul className="no-ul-list filter-list">
      {experienceOptions.map((opt) => (
        <li key={opt.value}>
          <input
            id={`exp-${opt.value}`}
            className="form-check-input"
            type="checkbox"
            checked={minExperience === opt.value}
            onChange={() => toggleParam("minExperience", opt.value)}
          />
          <label htmlFor={`exp-${opt.value}`} className="form-check-label">{opt.label}</label>
        </li>
      ))}
    </ul>
  );

  const salaryList = (
    <ul className="no-ul-list filter-list">
      {salaryOptions.map((opt) => (
        <li key={opt.value}>
          <input
            id={`sal-${opt.value}`}
            className="form-check-input"
            type="checkbox"
            checked={salaryMin === opt.value}
            onChange={() => toggleParam("salaryMin", opt.value)}
          />
          <label htmlFor={`sal-${opt.value}`} className="form-check-label">{opt.label}</label>
        </li>
      ))}
    </ul>
  );

  const jobTypeList = (
    <ul className="no-ul-list filter-list">
      {["FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE", "INTERNSHIP"].map((t) => (
        <li key={t}>
          <input
            id={`jt-${t}`}
            className="form-check-input"
            type="radio"
            checked={jobType === t}
            onChange={() => toggleParam("jobType", t)}
          />
          <label htmlFor={`jt-${t}`} className="form-check-label">
            {t.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
          </label>
        </li>
      ))}
    </ul>
  );

  const postedList = (
    <ul className="no-ul-list filter-list d-flex flex-wrap gap-2" style={{ listStyle: "none" }}>
      {postedOptions.map((opt) => (
        <li key={opt.value}>
          <button
            type="button"
            className={`btn btn-sm ${postedWithin === opt.value ? "btn-main" : "btn-outline-main"}`}
            onClick={() => pushParams({ postedWithin: opt.value || undefined })}
          >
            {opt.label}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="sidebar-widgets collapse miz_show" id="search_open" data-bs-parent="#search_open">
      <div className="sidebar_header d-flex align-items-center justify-content-between px-4 py-3 br-bottom">
        <h4 className="fs-bold fs-5 mb-0">Search Filter</h4>
        <div className="ssh-header">
          <a href="javascript:void(0);" className="clear_all ft-medium text-muted" onClick={clearAll}>
            Clear All
          </a>
          <a
            href="#search_open"
            data-bs-toggle="collapse"
            aria-expanded="false"
            role="button"
            className="collapsed _filter-ico ml-2"
          >
            <i className="fa-solid fa-filter"></i>
          </a>
        </div>
      </div>

      {variant === "full" ? (
        <form className="search-inner" onSubmit={handleKeywordSubmit}>
          <div className="filter-search-box px-4 pt-3">
            <div className="form-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search by keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                className="form-control"
                placeholder="Location, city.."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="filter_wraps">
            <div className="single_search_boxed px-4 pt-0 br-bottom">
              <div className="widget-boxed-header">
                <h4><span className="ft-medium fs-md">Job Categories</span></h4>
              </div>
              <div className="widget-boxed-body show">
                <div className="side-list no-border">
                  <div className="single_filter_card"><div className="card-body p-0"><div className="inner_widget_link">{categoryList}</div></div></div>
                </div>
              </div>
            </div>

            <div className="single_search_boxed px-4 pt-0 br-bottom">
              <div className="widget-boxed-header">
                <h4><span className="ft-medium fs-md">Work Mode</span></h4>
              </div>
              <div className="widget-boxed-body show">
                <div className="side-list no-border">
                  <div className="single_filter_card"><div className="card-body p-0"><div className="inner_widget_link">{workModeList}</div></div></div>
                </div>
              </div>
            </div>

            <div className="single_search_boxed px-4 pt-0 br-bottom">
              <div className="widget-boxed-header">
                <h4><span className="ft-medium fs-md">Experience</span></h4>
              </div>
              <div className="widget-boxed-body show">
                <div className="side-list no-border">
                  <div className="single_filter_card"><div className="card-body p-0"><div className="inner_widget_link">{experienceList}</div></div></div>
                </div>
              </div>
            </div>

            <div className="single_search_boxed px-4 pt-0 br-bottom">
              <div className="widget-boxed-header">
                <h4><span className="ft-medium fs-md">Salary</span></h4>
              </div>
              <div className="widget-boxed-body show">
                <div className="side-list no-border">
                  <div className="single_filter_card"><div className="card-body p-0"><div className="inner_widget_link">{salaryList}</div></div></div>
                </div>
              </div>
            </div>

            <div className="single_search_boxed px-4 pt-0 br-bottom">
              <div className="widget-boxed-header">
                <h4><span className="ft-medium fs-md">Job Type</span></h4>
              </div>
              <div className="widget-boxed-body show">
                <div className="side-list no-border">
                  <div className="single_filter_card"><div className="card-body p-0"><div className="inner_widget_link">{jobTypeList}</div></div></div>
                </div>
              </div>
            </div>

            <div className="single_search_boxed px-4 pt-0">
              <div className="widget-boxed-header">
                <h4><span className="ft-medium fs-md">Posted Date</span></h4>
              </div>
              <div className="widget-boxed-body show">
                <div className="side-list no-border">
                  <div className="single_filter_card"><div className="card-body p-0">{postedList}</div></div>
                </div>
              </div>
            </div>
          </div>

          <div className="form-group filter_button pt-3 pb-3 px-4">
            <button type="submit" className="btn btn-main full-width">
              Search job
            </button>
          </div>
        </form>
      ) : (
        <form className="search-inner" onSubmit={handleKeywordSubmit}>
          <div className="side-widget-inner">
            <div className="form-group">
              <label>Search By Keyword</label>
              <div className="form-group-inner">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by keywords..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Job Category</label>
              <div className="form-group-inner">
                <select value={category} onChange={(e) => toggleParam("category", e.target.value)}>
                  <option value="">Choose category</option>
                  {JOB_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Location</label>
              <div className="form-group-inner">
                <input
                  type="text"
                  className="form-control"
                  placeholder="ex. Bengaluru"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Experience Level</label>
              <div className="form-group-inner">{experienceList}</div>
            </div>

            <div className="form-group">
              <label>Job Type</label>
              <div className="form-group-inner">{jobTypeList}</div>
            </div>

            <div className="form-group">
              <label>Posted Date</label>
              <div className="form-group-inner">{postedList}</div>
            </div>

            <div className="form-group mb-1">
              <button type="submit" className="btn btn-lg btn-main fs-6 fw-medium full-width">
                Search job
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
