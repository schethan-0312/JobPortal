"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import Swal from "sweetalert2";
import { Toaster, toast } from "react-hot-toast";

interface PackageItem {
  id: string;
  name: string;
  audience: "CANDIDATE" | "EMPLOYER" | "RESUME";
  priceInPaisa: number;
  durationType: "DAYS" | "MONTHS" | "YEARS";
  duration: number;
  postJobLimit: number;
  applicantViewLimit: number;
  jobSeekerViewLimit: number;
  chatEnabled: boolean;
  filterShortlistEnabled: boolean;
  scheduleInterviewsEnabled: boolean;
  companyBrandingEnabled: boolean;
  verifiedRecruiterBadgeEnabled: boolean;
  isActive: boolean;
}

export default function AdminPackagesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [totalSubscriptions, setTotalSubscriptions] = useState<number | null>(null);
  const [filterSearch, setFilterSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [name, setName] = useState("");
  const [priceInRupees, setPriceInRupees] = useState<string>("");
  const [durationType, setDurationType] = useState<"DAYS" | "MONTHS" | "YEARS">("DAYS");
  const [duration, setDuration] = useState("");
  const [postJobLimit, setPostJobLimit] = useState("");
  const [applicantViewLimit, setApplicantViewLimit] = useState("");
  const [jobSeekerViewLimit, setJobSeekerViewLimit] = useState("");
  const [chatEnabled, setChatEnabled] = useState(false);
  const [filterShortlistEnabled, setFilterShortlistEnabled] = useState(false);
  const [scheduleInterviewsEnabled, setScheduleInterviewsEnabled] = useState(false);
  const [companyBrandingEnabled, setCompanyBrandingEnabled] = useState(false);
  const [verifiedRecruiterBadgeEnabled, setVerifiedRecruiterBadgeEnabled] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const showSuccessPopup = (title: string, text: string) => {
    Swal.fire({
      icon: "success",
      title: title,
      text: text,
      confirmButtonText: "Great, Done!",
      confirmButtonColor: "#0d4f3c",
      customClass: {
        popup: "elite-pkg-popup",
        title: "elite-pkg-title",
        confirmButton: "elite-pkg-btn",
      },
    });
  };

  const showErrorPopup = (title: string, text: string) => {
    Swal.fire({
      icon: "error",
      title: title,
      text: text,
      confirmButtonText: "Got It",
      confirmButtonColor: "#d94348",
      customClass: {
        popup: "elite-pkg-popup",
        title: "elite-pkg-title",
        confirmButton: "elite-pkg-btn",
      },
    });
  };

  const handleEditClick = (pkg: PackageItem) => {
    setEditingId(pkg.id);
    setName(pkg.name);
    setPriceInRupees(String(pkg.priceInPaisa / 100));
    setDurationType(pkg.durationType || "DAYS");
    setDuration(String(pkg.duration ?? 0));
    setPostJobLimit(String(pkg.postJobLimit ?? 0));
    setApplicantViewLimit(String(pkg.applicantViewLimit ?? 0));
    setJobSeekerViewLimit(String(pkg.jobSeekerViewLimit ?? 0));
    setChatEnabled(pkg.chatEnabled ?? false);
    setFilterShortlistEnabled(pkg.filterShortlistEnabled ?? false);
    setScheduleInterviewsEnabled(pkg.scheduleInterviewsEnabled ?? false);
    setCompanyBrandingEnabled(pkg.companyBrandingEnabled ?? false);
    setVerifiedRecruiterBadgeEnabled(pkg.verifiedRecruiterBadgeEnabled ?? false);
    setIsActive(pkg.isActive ?? true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success(`Editing "${pkg.name}"`, { icon: "✏️" });
  };

  const handleDeletePackage = async (id: string, packageName: string) => {
    const result = await Swal.fire({
      title: "Delete Package?",
      text: `Are you sure you want to permanently delete "${packageName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d94348",
      cancelButtonColor: "#63857d",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "elite-pkg-popup",
        title: "elite-pkg-title",
        confirmButton: "elite-pkg-btn",
      },
    });

    if (!result.isConfirmed) return;

    setDeletingId(id);
    try {
      await api.delete(`/packages/${id}`);
      showSuccessPopup("Deleted Successfully", `Package "${packageName}" was removed.`);
      await loadPackages();
    } catch (err) {
      showErrorPopup("Delete Failed", err instanceof ApiError ? err.message : "Failed to delete package.");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) router.replace("/");
  }, [loading, user, router]);

  const loadPackages = async () => {
    setDataLoading(true);
    try {
      const [packagesData, subsData] = await Promise.all([
        api.get<PackageItem[]>("/packages/all"),
        api.get<any[]>("/admin/financials/subscriptions").catch(() => []),
      ]);
      setPackages(packagesData);
      setTotalSubscriptions(Array.isArray(subsData) ? subsData.length : 0);
    } catch (err) {
      showErrorPopup("Sync Error", err instanceof ApiError ? err.message : "Failed to load packages");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    loadPackages();
  }, [user, refreshKey]);

  const blockInvalidNumberKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["e", "E", "+", "-"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleRefresh = async () => {
    resetForm();
    setFilterSearch("");
    setRefreshKey((prev) => prev + 1);
    toast.success("Data refreshed and form reset!", { icon: "🔄" });
  };

  const resetForm = () => {
    setEditingId(null); setName(""); setPriceInRupees(""); setDurationType("DAYS");
    setDuration(""); setPostJobLimit(""); setApplicantViewLimit(""); setJobSeekerViewLimit("");
    setChatEnabled(false); setFilterShortlistEnabled(false); setScheduleInterviewsEnabled(false);
    setCompanyBrandingEnabled(false); setVerifiedRecruiterBadgeEnabled(false); setIsActive(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { showErrorPopup("Validation Error", "Package name is required."); return; }
    if (!priceInRupees || isNaN(Number(priceInRupees)) || Number(priceInRupees) < 0) { showErrorPopup("Validation Error", "Please enter a valid positive price."); return; }
    if (!duration || isNaN(Number(duration)) || Number(duration) <= 0) { showErrorPopup("Validation Error", "Please enter a valid positive duration."); return; }
    if (Number(postJobLimit) < 0) { showErrorPopup("Validation Error", "Post Job Limit cannot be negative."); return; }
    if (Number(applicantViewLimit) < 0) { showErrorPopup("Validation Error", "Applicant View Limit cannot be negative."); return; }
    if (Number(jobSeekerViewLimit) < 0) { showErrorPopup("Validation Error", "Job Seeker Search Limit cannot be negative."); return; }
    const priceInPaisa = Math.round(Number(priceInRupees) * 100);
    const payload = {
      name: name.trim(), audience: "EMPLOYER", priceInPaisa, durationType,
      duration: Number(duration), postJobLimit: Number(postJobLimit) || 0,
      applicantViewLimit: Number(applicantViewLimit) || 0,
      jobSeekerViewLimit: Number(jobSeekerViewLimit) || 0,
      chatEnabled, filterShortlistEnabled, scheduleInterviewsEnabled,
      companyBrandingEnabled, verifiedRecruiterBadgeEnabled, isActive,
    };
    setSubmitting(true);
    try {
      if (editingId) {
        await api.patch(`/packages/${editingId}`, payload);
        showSuccessPopup("Package Updated", `"${name.trim()}" has been updated successfully!`);
      } else {
        await api.post<PackageItem>("/packages", payload);
        showSuccessPopup("Package Created", `"${name.trim()}" has been added successfully!`);
      }
      resetForm();
      await loadPackages();
    } catch (err) {
      showErrorPopup("Operation Failed", err instanceof ApiError ? err.message : `Failed to ${editingId ? "update" : "create"} package.`);
    } finally { setSubmitting(false); }
  };

  if (loading || !user || user.role !== "ADMIN") return null;

  const totalPackages = packages.length;
  const activePlans = packages.filter((p) => p.isActive).length;
  const filteredPackages = packages.filter((p) =>
    p.name.toLowerCase().includes(filterSearch.toLowerCase())
  );

  const statCards = [
    { icon: "fa-solid fa-box-archive", glowColor: "#dcf4fa", iconColor: "#174742", iconBg: "#eef3f5", label: "TOTAL ACTIVE PLANS", value: `${activePlans} Available` },
    { icon: "fa-solid fa-layer-group", glowColor: "#dbfbf5", iconColor: "#134d42", iconBg: "#def5f0", label: "TOTAL PACKAGES", value: `${totalPackages} Plans Total` },
    { icon: "fa-solid fa-users", glowColor: "#fff3dc", iconColor: "#b07c1a", iconBg: "#fdf3e0", label: "SUBSCRIBED USERS", value: totalSubscriptions === null ? "Loading..." : `${totalSubscriptions} Subscribers` },
  ];

  const features = [
    { id: "chatEnabled", label: "In-App Chat", state: chatEnabled, setter: setChatEnabled },
    { id: "filterShortlistEnabled", label: "Filter & Shortlist", state: filterShortlistEnabled, setter: setFilterShortlistEnabled },
    { id: "scheduleInterviewsEnabled", label: "Schedule Interviews", state: scheduleInterviewsEnabled, setter: setScheduleInterviewsEnabled },
    { id: "companyBrandingEnabled", label: "Company Branding", state: companyBrandingEnabled, setter: setCompanyBrandingEnabled },
    { id: "verifiedRecruiterBadgeEnabled", label: "Verified Recruiter Badge", state: verifiedRecruiterBadgeEnabled, setter: setVerifiedRecruiterBadgeEnabled },
  ];

  return (
    <>
      <style jsx global>{`
        .dashboard-wrap { background-color: #f4f9f8 !important; }
        .pkg-page h1 { color: #06312a; font-weight: 700; }
        .breadcrumb-item a { color: #63857d !important; }
        .breadcrumb-item a.text-main { color: #429e85 !important; }
        .pkg-stat-card { background:#fff;border:1px solid #e1e9e7;border-radius:0.85rem;box-shadow:0 4px 12px rgba(0,0,0,.025);padding:1.25rem 1.4rem;display:flex;align-items:center;gap:1rem;position:relative;overflow:hidden;transition:transform .2s ease,box-shadow .2s ease; }
        .pkg-stat-card:hover { transform:translateY(-2px);box-shadow:0 6px 18px rgba(0,0,0,.05); }
        .pkg-stat-glow { position:absolute;top:-20px;right:-20px;width:130px;height:130px;border-radius:50%;filter:blur(35px);z-index:0;opacity:.85; }
        .pkg-stat-icon { width:52px;height:52px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:1.15rem;position:relative;z-index:1; }
        .pkg-stat-text { position:relative;z-index:1; }
        .pkg-stat-text .slabel { font-size:.68rem;font-weight:700;letter-spacing:.07em;color:#7a9b94;text-transform:uppercase;display:block;margin-bottom:.3rem; }
        .pkg-stat-text .svalue { font-size:1.35rem;font-weight:800;color:#0d362d;line-height:1.15; }
        .pkg-form-card { background:#fff;border:1px solid #e1e9e7;border-radius:0.85rem;box-shadow:0 4px 14px rgba(0,0,0,.025);overflow:hidden; }
        .pkg-form-card .fc-header { background:#f2f8f6;border-bottom:1px solid #d6e8e4;padding:1rem 1.5rem;display:flex;align-items:center;justify-content:space-between; }
        .pkg-form-card .fc-header h5 { font-size:1rem;font-weight:700;color:#0d362d;margin:0; }
        .pkg-form-card .fc-body { padding:1.5rem; }
        .pkg-section-label { font-size:.68rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#7a9b94;margin-bottom:.6rem;margin-top:.1rem; }
        .pkg-form-card .form-label { font-size:.82rem;font-weight:600;color:#2d4e45;margin-bottom:.3rem; }
        .pkg-form-card .form-control,.pkg-form-card .form-select { border:1px solid #d0deda;border-radius:.5rem;font-size:.875rem;color:#1a3630;background:#f9fdfb;padding:.55rem .85rem;transition:border-color .2s,box-shadow .2s; }
        .pkg-form-card .form-control:focus,.pkg-form-card .form-select:focus { border-color:#429e85;box-shadow:0 0 0 3px rgba(66,158,133,.13);background:#fff;outline:none; }
        .pkg-feat-toggle { display:inline-flex;align-items:center;gap:.55rem;background:#f2f8f6;border:1.5px solid #d0deda;border-radius:.5rem;padding:.55rem .9rem;cursor:pointer;transition:all .18s ease;user-select:none; }
        .pkg-feat-toggle:hover { border-color:#429e85;background:#e8f5f1; }
        .pkg-feat-toggle.on { border-color:#429e85;background:#e4f5ef; }
        .pkg-feat-check { width:18px;height:18px;border-radius:4px;border:2px solid #aec8c1;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .18s; }
        .pkg-feat-toggle.on .pkg-feat-check { background:#429e85;border-color:#429e85; }
        .pkg-feat-check i { color:#fff;font-size:.62rem; }
        .pkg-feat-label { font-size:.81rem;font-weight:500;color:#2d4e45; }
        .pkg-publish-row { display:flex;align-items:center;flex-wrap:wrap;gap:.75rem;background:#f2f8f6;border:1px solid #d6e8e4;border-radius:.65rem;padding:.8rem 1.1rem; }
        .pkg-publish-label { font-size:.82rem;font-weight:600;color:#2d4e45;display:flex;align-items:center;gap:.45rem; }
        .pkg-publish-select { border:1px solid #d0deda;border-radius:.4rem;padding:.4rem .75rem;font-size:.82rem;color:#1a3630;background:#fff;min-width:200px; }
        .btn-pkg-primary { background:#0d4f3c;color:#fff;border:none;border-radius:.5rem;padding:.58rem 1.4rem;font-size:.875rem;font-weight:600;cursor:pointer;transition:background .2s; }
        .btn-pkg-primary:hover { background:#0a3c2e; }
        .btn-pkg-primary:disabled { background:#7aad9f;cursor:not-allowed; }
        .btn-pkg-ghost { background:#eef3f1;color:#4a6862;border:1px solid #d0deda;border-radius:.5rem;padding:.58rem 1.2rem;font-size:.875rem;font-weight:500;cursor:pointer;transition:all .2s; }
        .btn-pkg-ghost:hover { background:#dce8e4;color:#2d4e45; }
        .pkg-card { background:#fff;border:1.5px solid #d9e8e4;border-radius:.85rem;overflow:hidden;transition:transform .2s ease,box-shadow .2s ease;position:relative;display:flex;flex-direction:column;height:100%; }
        .pkg-card:hover { transform:translateY(-3px);box-shadow:0 10px 28px rgba(0,0,0,.07); }
        .pkg-card.popular { border-color:#429e85;border-width:2px; }
        .pkg-popular-ribbon { position:absolute;top:0;right:0;background:#0d4f3c;color:#fff;font-size:.63rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:.28rem .75rem;border-bottom-left-radius:.5rem; }
        .pkg-card-top { padding:1rem 1.2rem 0;display:flex;justify-content:space-between;align-items:center; }
        .pkg-dur-badge { font-size:.67rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#5a8578;background:#e4f5ef;border-radius:.35rem;padding:.28rem .65rem; }
        .pkg-status-pill { font-size:.67rem;font-weight:700;border-radius:.35rem;padding:.28rem .65rem; }
        .pkg-status-pill.active { background:#d4f0e4;color:#0d6e3f; }
        .pkg-status-pill.inactive { background:#f0e4e4;color:#6e0d0d; }
        .pkg-card-body { padding:.85rem 1.2rem 1rem;flex:1; }
        .pkg-card-name { font-size:1.2rem;font-weight:800;color:#0d362d;margin-bottom:.2rem; }
        .pkg-card-price { font-size:1.75rem;font-weight:800;color:#0d4f3c;line-height:1.1;margin-bottom:.75rem; }
        .pkg-card-price small { font-size:.88rem;font-weight:500;color:#7a9b94; }
        .pkg-feat-list { list-style:none;padding:0;margin:0; }
        .pkg-feat-list li { font-size:.81rem;color:#3d6157;padding:.22rem 0;display:flex;align-items:center;gap:.5rem; }
        .pkg-feat-list li i { color:#429e85;font-size:.72rem;flex-shrink:0; }
        .pkg-card-footer { border-top:1px solid #e1ecea;padding:.7rem 1.2rem;display:flex;justify-content:flex-end;gap:.55rem;background:#f9fdfb; }
        .btn-pkg-edit { font-size:.77rem;font-weight:600;color:#0d4f3c;background:#e4f5ef;border:1px solid #c0ddd6;border-radius:.4rem;padding:.38rem .8rem;cursor:pointer;transition:all .2s; }
        .btn-pkg-edit:hover { background:#d0ede4; }
        .btn-pkg-del { font-size:.77rem;font-weight:600;color:#b02020;background:#fce8e8;border:1px solid #f0c8c8;border-radius:.4rem;padding:.38rem .8rem;cursor:pointer;transition:all .2s; }
        .btn-pkg-del:hover { background:#f9d4d4; }
        .btn-pkg-del:disabled { opacity:.5;cursor:not-allowed; }
        .pkg-list-bar { display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;flex-wrap:wrap;gap:.75rem; }
        .pkg-search { border:1.5px solid #d0deda;border-radius:.5rem;padding:.42rem .8rem;font-size:.82rem;color:#1a3630;background:#f9fdfb;width:200px;transition:border-color .2s,box-shadow .2s; }
        .pkg-search:focus { outline:none;border-color:#429e85;box-shadow:0 0 0 3px rgba(66,158,133,.12); }
        .btn-pkg-refresh { background:#f2f8f6;border:1px solid #d0deda;color:#4a6862;border-radius:.45rem;padding:.42rem .8rem;font-size:.8rem;cursor:pointer;transition:all .2s; }
        .btn-pkg-refresh:hover { background:#dce8e4; }

        /* SweetAlert2 Professional Theme Integration */
        .elite-pkg-popup {
          border-radius: 1rem !important;
          border: 1px solid #d6e8e4 !important;
          box-shadow: 0 20px 40px -15px rgba(6, 49, 42, 0.18) !important;
          padding: 1.75rem 2rem !important;
          background: #ffffff !important;
          font-family: inherit !important;
        }
        .elite-pkg-title {
          font-size: 1.35rem !important;
          font-weight: 700 !important;
          color: #06312a !important;
          padding: 0 !important;
          margin-bottom: 0.5rem !important;
        }
        .elite-pkg-btn {
          border-radius: 0.5rem !important;
          padding: 0.6rem 1.6rem !important;
          font-weight: 600 !important;
          font-size: 0.88rem !important;
          box-shadow: none !important;
          transition: transform 0.15s ease, opacity 0.15s ease !important;
        }
        .elite-pkg-btn:hover {
          transform: translateY(-1px) !important;
          opacity: 0.95 !important;
        }
      `}</style>

      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: "#ffffff",
            color: "#06312a",
            border: "1px solid #d0deda",
            borderRadius: "0.6rem",
            fontSize: "0.88rem",
            fontWeight: "500",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)",
          },
        }}
      />

      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="packages" />

        <div className="dashboard-content pkg-page">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
              <div>
                <h1 className="mb-1 fs-3">Subscription Packages</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Package Management</a></li>
                  </ol>
                </nav>
              </div>
              <div className="d-flex gap-2">
                <button className="btn-pkg-ghost" onClick={() => router.back()}>
                  <i className="fa-solid fa-arrow-left me-1"></i> Back
                </button>
                <button className="btn-pkg-ghost" onClick={handleRefresh} title="Reset Form & Reload Data">
                  <i className={`fa-solid ${dataLoading ? "fa-spinner fa-spin" : "fa-rotate"} me-1`}></i> Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">

            {/* Stat Boxes */}
            <div className="row gx-4 gy-4 mb-4">
              {statCards.map((card, i) => (
                <div className="col-12 col-sm-6 col-md-4" key={i}>
                  <div className="pkg-stat-card">
                    <div className="pkg-stat-glow" style={{ background: card.glowColor }}></div>
                    <div className="pkg-stat-icon" style={{ backgroundColor: card.iconBg, color: card.iconColor }}>
                      <i className={card.icon}></i>
                    </div>
                    <div className="pkg-stat-text">
                      <span className="slabel">{card.label}</span>
                      <div className="svalue">{card.value}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Create / Edit Form */}
            <div className="pkg-form-card mb-4">
              <div className="fc-header">
                <h5>
                  <i className="fa-solid fa-circle-plus me-2" style={{ color: "#429e85" }}></i>
                  {editingId ? "Edit Package" : "Create New Package"}
                </h5>
                <span style={{ fontSize: "0.76rem", color: "#7a9b94" }}>
                  All fields marked with <span style={{ color: "#d94348" }}>*</span> are mandatory
                </span>
              </div>
              <div className="fc-body">
                <form onSubmit={handleFormSubmit}>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6 col-sm-12">
                      <label className="form-label">Package Name <span style={{ color: "#d94348" }}>*</span></label>
                      <input type="text" className="form-control" placeholder="Example: Enterprise Recruiter Plus"
                        value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="col-md-6 col-sm-12">
                      <label className="form-label">Price (INR ₹) <span style={{ color: "#d94348" }}>*</span></label>
                      <input 
                        type="number" 
                        min="0" 
                        step="any"
                        className="form-control" 
                        placeholder="₹ 999"
                        value={priceInRupees} 
                        onKeyDown={blockInvalidNumberKey}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || !isNaN(Number(val))) {
                            setPriceInRupees(val);
                          }
                        }} 
                      />
                    </div>
                    <div className="col-md-6 col-sm-12">
                      <label className="form-label">Duration Type <span style={{ color: "#d94348" }}>*</span></label>
                      <select className="form-select" value={durationType} onChange={(e) => setDurationType(e.target.value as any)}>
                        <option value="DAYS">Days</option>
                        <option value="MONTHS">Months</option>
                        <option value="YEARS">Years</option>
                      </select>
                    </div>
                    <div className="col-md-6 col-sm-12">
                      <label className="form-label">Duration Value <span style={{ color: "#d94348" }}>*</span></label>
                      <input 
                        type="number" 
                        min="1" 
                        className="form-control" 
                        placeholder="Example: 1, 3, 12, or 30"
                        value={duration} 
                        onKeyDown={blockInvalidNumberKey}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || !isNaN(Number(val))) {
                            setDuration(val);
                          }
                        }} 
                      />
                    </div>
                  </div>

                  <div className="pkg-section-label">Quota &amp; Usage Limits</div>
                  <div className="row g-3 mb-3">
                    <div className="col-md-4 col-sm-12">
                      <label className="form-label">Post Job Limit</label>
                      <input 
                        type="number" 
                        min="0" 
                        className="form-control" 
                        placeholder="Example: 15 (0 for unlimited)"
                        value={postJobLimit} 
                        onKeyDown={blockInvalidNumberKey}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || !isNaN(Number(val))) {
                            setPostJobLimit(val);
                          }
                        }} 
                      />
                    </div>
                    <div className="col-md-4 col-sm-12">
                      <label className="form-label">Applicant View Limit</label>
                      <input 
                        type="number" 
                        min="0" 
                        className="form-control" 
                        placeholder="Example: 5000"
                        value={applicantViewLimit} 
                        onKeyDown={blockInvalidNumberKey}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || !isNaN(Number(val))) {
                            setApplicantViewLimit(val);
                          }
                        }} 
                      />
                    </div>
                    <div className="col-md-4 col-sm-12">
                      <label className="form-label">Candidate Search Limit</label>
                      <input 
                        type="number" 
                        min="0" 
                        className="form-control" 
                        placeholder="Example: 5000"
                        value={jobSeekerViewLimit} 
                        onKeyDown={blockInvalidNumberKey}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || !isNaN(Number(val))) {
                            setJobSeekerViewLimit(val);
                          }
                        }} 
                      />
                    </div>
                  </div>

                  <div className="pkg-section-label">Included Platform Features</div>
                  <div className="d-flex flex-wrap gap-2 mb-4">
                    {features.map((feat) => (
                      <label key={feat.id} className={`pkg-feat-toggle ${feat.state ? "on" : ""}`} onClick={() => feat.setter(!feat.state)}>
                        <div className="pkg-feat-check">
                          {feat.state && <i className="fa-solid fa-check"></i>}
                        </div>
                        <span className="pkg-feat-label">{feat.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="pkg-publish-row">
                    <span className="pkg-publish-label">
                      <i className="fa-solid fa-circle-dot" style={{ color: "#429e85" }}></i>
                      Publish Status
                    </span>
                    <select className="pkg-publish-select" value={isActive ? "Active" : "Inactive"} onChange={(e) => setIsActive(e.target.value === "Active")}>
                      <option value="Active">Active (Visible in Store)</option>
                      <option value="Inactive">Inactive (Hidden)</option>
                    </select>
                    <div className="d-flex gap-2 ms-auto">
                      {editingId && (
                        <button type="button" className="btn-pkg-ghost" onClick={resetForm}>Reset</button>
                      )}
                      <button type="submit" className="btn-pkg-primary" disabled={submitting}>
                        {submitting ? (<><i className="fa-solid fa-spinner fa-spin me-1"></i> Saving...</>) : editingId ? "Update Package" : "Create Package"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Existing Packages */}
            <div>
              <div className="pkg-list-bar">
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0d362d" }}>
                    <i className="fa-solid fa-layer-group me-2" style={{ color: "#429e85" }}></i>
                    Existing Packages
                    <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "#7a9b94", marginLeft: "0.5rem" }}>
                      {totalPackages} Plans Total
                    </span>
                  </div>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <input className="pkg-search" placeholder="Filter plans..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
                  <button className="btn-pkg-refresh" onClick={handleRefresh} title="Reset Form & Reload Data">
                    <i className={`fa-solid ${dataLoading ? "fa-spinner fa-spin" : "fa-rotate"}`}></i>
                  </button>
                </div>
              </div>

              {dataLoading ? (
                <div className="text-center py-5 text-muted">
                  <i className="fa-solid fa-spinner fa-spin me-2"></i> Loading packages...
                </div>
              ) : filteredPackages.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  {packages.length === 0 ? "No packages found. Create one above!" : "No packages match your search."}
                </div>
              ) : (
                <div className="row g-4">
                  {filteredPackages.map((pkg, idx) => {
                    const priceRupees = pkg.priceInPaisa / 100;
                    const isPopular = idx === 1 && filteredPackages.length > 1;
                    const durationLabel = pkg.durationType === "DAYS" ? "day" : pkg.durationType === "MONTHS" ? "month" : "year";
                    return (
                      <div className="col-xl-4 col-lg-6 col-md-6" key={pkg.id}>
                        <div className={`pkg-card ${isPopular ? "popular" : ""}`}>
                          {isPopular && <div className="pkg-popular-ribbon">Popular</div>}
                          <div className="pkg-card-top">
                            <span className="pkg-dur-badge">{pkg.duration} {pkg.durationType}</span>
                            <span className={`pkg-status-pill ${pkg.isActive ? "active" : "inactive"}`}>
                              {pkg.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="pkg-card-body">
                            <div className="pkg-card-name">{pkg.name}</div>
                            <div className="pkg-card-price">
                              ₹{priceRupees.toLocaleString("en-IN")}
                              <small>/{durationLabel}</small>
                            </div>
                            <ul className="pkg-feat-list">
                              <li><i className="fa-solid fa-check"></i> {pkg.postJobLimit} Jobs Limit</li>
                              <li><i className="fa-solid fa-check"></i> {pkg.applicantViewLimit} Applicants Limit</li>
                              <li><i className="fa-solid fa-check"></i> {pkg.jobSeekerViewLimit} Profile Views Limit</li>
                              {pkg.chatEnabled && <li><i className="fa-solid fa-check"></i> In-App Chat Included</li>}
                              {pkg.filterShortlistEnabled && <li><i className="fa-solid fa-check"></i> Filter &amp; Shortlist Tools</li>}
                              {pkg.scheduleInterviewsEnabled && <li><i className="fa-solid fa-check"></i> Schedule Interviews</li>}
                              {pkg.companyBrandingEnabled && <li><i className="fa-solid fa-check"></i> Company Branding Badge</li>}
                              {pkg.verifiedRecruiterBadgeEnabled && <li><i className="fa-solid fa-check"></i> Verified Recruiter Badge</li>}
                            </ul>
                          </div>
                          <div className="pkg-card-footer">
                            <button className="btn-pkg-edit" onClick={() => handleEditClick(pkg)}>
                              <i className="fa-solid fa-pen-to-square me-1"></i> Edit
                            </button>
                            <button className="btn-pkg-del" disabled={deletingId === pkg.id} onClick={() => handleDeletePackage(pkg.id, pkg.name)}>
                              {deletingId === pkg.id
                                ? (<><i className="fa-solid fa-spinner fa-spin me-1"></i> Deleting...</>)
                                : (<><i className="fa-solid fa-trash-can me-1"></i> Delete</>)}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
