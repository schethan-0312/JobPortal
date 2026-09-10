"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, getToken } from "@/lib/api";
import Swal from "sweetalert2";
import toast, { Toaster } from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

interface OverviewStats {
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalRequests: number;
  activeUsers: number;
  avgTokensPerRequest: number;
  totalCost: number;
}

interface UserUsageItem {
  userId: string;
  name: string;
  email: string;
  totalRequests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  lastUsageTime: string;
}

interface UserDetails {
  userId: string;
  name: string;
  email: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  requestCount: number;
  estimatedCost: number;
  dailyUsage: { date: string; input: number; output: number; total: number; cost: number }[];
  monthlyUsage: { date: string; input: number; output: number; total: number; cost: number }[];
  modelDistribution: { name: string; value: number }[];
  featureDistribution: { name: string; value: number }[];
  history: HistoryLogItem[];
}

interface HistoryLogItem {
  id: string;
  createdAt: string;
  email?: string;
  name?: string;
  feature: string;
  model: string;
  promptTokens: number;
  responseTokens: number;
  totalTokens: number;
  success: boolean;
  errorMessage: string | null;
  latencyMs: number;
  cost: number;
}

interface TrendPoint {
  date: string;
  input: number;
  output: number;
  total: number;
  requests: number;
  cost: number;
}

function formatCost(rs: number) {
  if (rs === 0) return "₹0.00";
  if (rs < 0.1) return `₹${rs.toFixed(4)}`;
  return `₹${rs.toFixed(2)}`;
}

function featureLabel(feature: string) {
  return feature
    .toLowerCase()
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export default function AdminTokenUsagePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<"analytics" | "users" | "history">("analytics");

  // Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [selectedFeature, setSelectedFeature] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [aggPeriod, setAggPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  // Sorting / Pagination
  const [userPage, setUserPage] = useState(1);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSortBy, setUserSortBy] = useState("totalTokens");
  const [userSortOrder, setUserSortOrder] = useState<"asc" | "desc">("desc");

  const [historyPage, setHistoryPage] = useState(1);

  // Data State
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [usersList, setUsersList] = useState<{ items: UserUsageItem[]; total: number }>({ items: [], total: 0 });
  const [historyList, setHistoryList] = useState<{ items: HistoryLogItem[]; total: number }>({ items: [], total: 0 });

  // Modals & Details
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [todayStr, setTodayStr] = useState("");

  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setTodayStr(`${yyyy}-${mm}-${dd}`);
  }, []);

  // Ensure only Admins access
  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  // Load Overview & Tab specific data
  async function loadDashboardData() {
    if (!user || user.role !== "ADMIN") return;
    setLoadingData(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (fromDate) queryParams.append("from", fromDate);
      if (toDate) queryParams.append("to", toDate);
      if (selectedFeature) queryParams.append("feature", selectedFeature);
      if (selectedModel) queryParams.append("model", selectedModel);

      // 1. Fetch Overview
      const ovData = await api.get<OverviewStats>(`/admin/tokens/overview?${queryParams.toString()}`);
      setOverview(ovData);

      // 2. Fetch Tab Specific Data
      if (activeTab === "analytics") {
        const trParams = new URLSearchParams(queryParams);
        trParams.append("period", aggPeriod);
        const trData = await api.get<TrendPoint[]>(`/admin/tokens/analytics?${trParams.toString()}`);
        setTrendData(trData);
      } else if (activeTab === "users") {
        const uParams = new URLSearchParams(queryParams);
        if (userSearchQuery) uParams.append("search", userSearchQuery);
        uParams.append("sortBy", userSortBy);
        uParams.append("sortOrder", userSortOrder);
        uParams.append("page", String(userPage));
        uParams.append("pageSize", "10");
        const uData = await api.get<{ items: UserUsageItem[]; total: number }>(`/admin/tokens/users?${uParams.toString()}`);
        setUsersList(uData);
      } else if (activeTab === "history") {
        const hParams = new URLSearchParams(queryParams);
        if (userSearch) hParams.append("userEmail", userSearch);
        hParams.append("page", String(historyPage));
        hParams.append("pageSize", "15");
        const hData = await api.get<{ items: HistoryLogItem[]; total: number }>(`/admin/tokens/history?${hParams.toString()}`);
        setHistoryList(hData);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load token usage statistics");
    } finally {
      setLoadingData(false);
    }
  }

  // Load User Details
  async function loadUserUsageDetails(userId: string) {
    setLoadingDetails(true);
    try {
      const data = await api.get<UserDetails>(`/admin/tokens/users/${userId}`);
      setUserDetails(data);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Details Failed",
        text: err instanceof ApiError ? err.message : "Failed to load user details",
        customClass: {
          popup: "elite-pkg-popup",
          title: "elite-pkg-title",
          confirmButton: "elite-pkg-btn",
        },
        confirmButtonColor: "#0d4f3c",
      });
    } finally {
      setLoadingDetails(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, [
    activeTab,
    fromDate,
    toDate,
    selectedFeature,
    selectedModel,
    aggPeriod,
    userSortBy,
    userSortOrder,
    userPage,
    historyPage,
    userSearchQuery,
    userSearch,
  ]);

  // Handle Export CSV
  async function handleExport() {
    try {
      toast.loading("Generating token usage CSV export...", { id: "token-export" });
      const queryParams = new URLSearchParams();
      if (fromDate) queryParams.append("from", fromDate);
      if (toDate) queryParams.append("to", toDate);
      if (selectedFeature) queryParams.append("feature", selectedFeature);
      if (selectedModel) queryParams.append("model", selectedModel);
      if (userSearch) queryParams.append("userEmail", userSearch);

      const token = getToken();
      const res = await fetch(`${API_URL}/admin/tokens/export?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed on server");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `token-usage-report.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Token usage report exported successfully!", { id: "token-export" });
    } catch (err: any) {
      toast.error(err.message || "Failed to export token usage CSV", { id: "token-export" });
    }
  }

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <Toaster position="top-right" />
      <AdminNavbar />

      <style jsx global>{`
        .dashboard-wrap {
          background-color: #f4f9f8 !important;
          min-height: 100vh;
          overflow-x: hidden !important;
        }
        .dashboard-content.pkg-page {
          background-color: #f4f9f8 !important;
          padding: 30px 24px !important;
          max-width: 100% !important;
          overflow-x: hidden !important;
        }
        .pkg-header-title {
          font-size: 24px;
          font-weight: 800;
          color: #0b2b22;
          letter-spacing: -0.5px;
        }
        .pkg-header-subtitle {
          color: #5c756d;
          font-size: 13.5px;
        }

        .token-metric-card {
          background: #ffffff;
          border: 1px solid #d6e8e4;
          border-radius: 14px;
          padding: 16px 18px;
          box-shadow: 0 4px 14px rgba(13, 79, 60, 0.03);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          height: 100%;
        }
        .token-metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(13, 79, 60, 0.07);
        }
        .token-metric-label {
          font-size: 11.5px;
          font-weight: 700;
          color: #5c756d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .token-metric-val {
          font-size: 22px;
          font-weight: 800;
          line-height: 1.2;
        }

        .elite-card {
          background: #ffffff;
          border: 1px solid #d6e8e4;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(13, 79, 60, 0.04);
          overflow: hidden;
          margin-bottom: 24px;
        }
        .elite-card-header {
          background: #fbfdfc;
          border-bottom: 1px solid #d6e8e4;
          padding: 16px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .elite-card-title {
          font-size: 16px;
          font-weight: 700;
          color: #0b2b22;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-input {
          background: #ffffff;
          border: 1.5px solid #d6e8e4;
          border-radius: 9px;
          padding: 7px 12px;
          font-size: 13px;
          color: #0b2b22;
          width: 100%;
          transition: all 0.2s;
        }
        .filter-input:focus {
          border-color: #429e85;
          outline: none;
          box-shadow: 0 0 0 3px rgba(66, 158, 133, 0.15);
        }

        .nav-tab-btn {
          padding: 10px 22px;
          font-size: 13.5px;
          font-weight: 700;
          color: #5c756d;
          background: transparent;
          border: none;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
          cursor: pointer;
        }
        .nav-tab-btn:hover {
          color: #0d4f3c;
        }
        .nav-tab-btn.active {
          color: #0d4f3c;
          border-bottom-color: #0d4f3c;
          background: #fbfdfc;
        }

        .btn-main-action {
          background: #0d4f3c;
          border: 1px solid #0d4f3c;
          color: #ffffff;
          font-weight: 700;
          font-size: 13px;
          padding: 7px 16px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .btn-main-action:hover {
          background: #08382b;
          color: #ffffff;
        }
        .btn-reset-action {
          background: #ffffff;
          border: 1.5px solid #d6e8e4;
          color: #4b635b;
          font-weight: 600;
          font-size: 13px;
          padding: 7px 16px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .btn-reset-action:hover {
          background: #f4f9f8;
          color: #0b2b22;
        }

        .token-table-wrap {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .token-table {
          width: 100%;
          min-width: 800px;
          border-collapse: collapse;
          white-space: nowrap;
        }
        .token-table th {
          background: #f8fbfa;
          color: #446158;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 13px 16px;
          border-bottom: 1px solid #d6e8e4;
        }
        .token-table td {
          padding: 13px 16px;
          border-bottom: 1px solid #eef5f3;
          color: #334d44;
          font-size: 13px;
          vertical-align: middle;
        }
        .token-table tbody tr:hover {
          background: #f2f9f6;
        }

        .badge-status {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 9px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .badge-status.success { background: #e8f5f1; color: #0d4f3c; border: 1px solid #bce2d8; }
        .badge-status.failed { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }

        .elite-pkg-popup {
          border-radius: 16px !important;
          padding: 24px !important;
          border: 1px solid #d6e8e4 !important;
          font-family: inherit !important;
        }
        .elite-pkg-title {
          font-size: 20px !important;
          font-weight: 800 !important;
          color: #0b2b22 !important;
        }
        .elite-pkg-btn {
          border-radius: 8px !important;
          font-weight: 700 !important;
          padding: 10px 22px !important;
          font-size: 14px !important;
        }
      `}</style>

      <div className="dashboard-wrap">
        <AdminSidebar active="tokens" />

        <div className="dashboard-content pkg-page">
          {/* Header */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
              <h1 className="pkg-header-title mb-1">AI Token Usage &amp; Cost Intelligence</h1>
              <p className="pkg-header-subtitle mb-0">
                Track real-time token consumption across models, features, users, and estimated INR platform costs.
              </p>
            </div>
          </div>

          {/* Overall 6 Stat Cards */}
          {overview && (
            <div className="row g-3 mb-4">
              <div className="col-12 col-sm-6 col-md-4 col-xl-2">
                <div className="token-metric-card">
                  <div className="token-metric-label">Total Tokens</div>
                  <div className="token-metric-val" style={{ color: "#0b2b22" }}>
                    {overview.totalTokens.toLocaleString()}
                  </div>
                  <div className="small text-muted mt-1" style={{ fontSize: "11px" }}>Prompt + Output</div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-md-4 col-xl-2">
                <div className="token-metric-card">
                  <div className="token-metric-label">Input Tokens</div>
                  <div className="token-metric-val text-primary">
                    {overview.totalInputTokens.toLocaleString()}
                  </div>
                  <div className="small text-muted mt-1" style={{ fontSize: "11px" }}>Prompts Submitted</div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-md-4 col-xl-2">
                <div className="token-metric-card">
                  <div className="token-metric-label">Output Tokens</div>
                  <div className="token-metric-val" style={{ color: "#0d4f3c" }}>
                    {overview.totalOutputTokens.toLocaleString()}
                  </div>
                  <div className="small text-muted mt-1" style={{ fontSize: "11px" }}>Generated Responses</div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-md-4 col-xl-2">
                <div className="token-metric-card">
                  <div className="token-metric-label">AI Requests</div>
                  <div className="token-metric-val" style={{ color: "#0b2b22" }}>
                    {overview.totalRequests.toLocaleString()}
                  </div>
                  <div className="small text-muted mt-1" style={{ fontSize: "11px" }}>Invocations</div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-md-4 col-xl-2">
                <div className="token-metric-card">
                  <div className="token-metric-label">Active Users</div>
                  <div className="token-metric-val" style={{ color: "#2563eb" }}>
                    {overview.activeUsers.toLocaleString()}
                  </div>
                  <div className="small text-muted mt-1" style={{ fontSize: "11px" }}>Distinct Consumers</div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-md-4 col-xl-2">
                <div className="token-metric-card">
                  <div className="token-metric-label">Estimated Cost</div>
                  <div className="token-metric-val text-danger">
                    {formatCost(overview.totalCost)}
                  </div>
                  <div className="small text-muted mt-1" style={{ fontSize: "11px" }}>Platform Spend</div>
                </div>
              </div>
            </div>
          )}

          {/* Filter Section */}
          <div className="elite-card mb-4">
            <div className="elite-card-header">
              <h2 className="elite-card-title">
                <i className="fa-solid fa-filter" style={{ color: "#429e85" }}></i>
                Filter Usage Analytics
              </h2>
            </div>
            <div className="p-4">
              <div className="row g-2 align-items-end">
                <div className="col-12 col-sm-6 col-md-2">
                  <label className="form-label small fw-bold text-muted mb-1">From Date</label>
                  <input
                    type="date"
                    className="filter-input"
                    value={fromDate}
                    max={todayStr}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && todayStr && val > todayStr) {
                        Swal.fire({
                          icon: "warning",
                          title: "Invalid Date",
                          text: "From Date cannot be in the future.",
                          customClass: { popup: "elite-pkg-popup", title: "elite-pkg-title", confirmButton: "elite-pkg-btn" },
                          confirmButtonColor: "#0d4f3c",
                        });
                        setFromDate(todayStr);
                        if (toDate && toDate < todayStr) setToDate(todayStr);
                      } else {
                        setFromDate(val);
                        if (val && toDate && toDate < val) setToDate(val);
                      }
                    }}
                  />
                </div>

                <div className="col-12 col-sm-6 col-md-2">
                  <label className="form-label small fw-bold text-muted mb-1">To Date</label>
                  <input
                    type="date"
                    className="filter-input"
                    value={toDate}
                    min={fromDate}
                    max={todayStr}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        if (fromDate && val < fromDate) {
                          Swal.fire({
                            icon: "warning",
                            title: "Invalid Range",
                            text: "To Date cannot be earlier than From Date.",
                            customClass: { popup: "elite-pkg-popup", title: "elite-pkg-title", confirmButton: "elite-pkg-btn" },
                            confirmButtonColor: "#0d4f3c",
                          });
                          setToDate(fromDate);
                        } else if (todayStr && val > todayStr) {
                          Swal.fire({
                            icon: "warning",
                            title: "Invalid Date",
                            text: "To Date cannot be in the future.",
                            customClass: { popup: "elite-pkg-popup", title: "elite-pkg-title", confirmButton: "elite-pkg-btn" },
                            confirmButtonColor: "#0d4f3c",
                          });
                          setToDate(todayStr);
                        } else {
                          setToDate(val);
                        }
                      } else {
                        setToDate(val);
                      }
                    }}
                  />
                </div>

                <div className="col-12 col-sm-6 col-md-2">
                  <label className="form-label small fw-bold text-muted mb-1">AI Feature</label>
                  <select
                    className="filter-input"
                    value={selectedFeature}
                    onChange={(e) => setSelectedFeature(e.target.value)}
                  >
                    <option value="">All Features</option>
                    <option value="RESUME_SCANNER">Resume Scanner</option>
                    <option value="CHATBOT">Chatbot / AI Assistant</option>
                    <option value="SKILL_ASSESSMENT">Skill Assessment</option>
                    <option value="MOCK_INTERVIEW">Mock Interview</option>
                    <option value="CAREER_NAVIGATOR">Career Navigator</option>
                    <option value="SMART_MATCH">Smart Match</option>
                    <option value="AUTO_SHORTLIST">Auto Shortlist</option>
                    <option value="RESUME_BUILDER">Resume Builder</option>
                  </select>
                </div>

                <div className="col-12 col-sm-6 col-md-2">
                  <label className="form-label small fw-bold text-muted mb-1">Gemini Model</label>
                  <select
                    className="filter-input"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                  >
                    <option value="">All Models</option>
                    <option value="gemini-3.6-flash">gemini-3.6-flash</option>
                    <option value="gemini-flash-latest">gemini-flash-latest</option>
                  </select>
                </div>

                {activeTab === "history" && (
                  <div className="col-12 col-sm-6 col-md-2">
                    <label className="form-label small fw-bold text-muted mb-1">Email Search</label>
                    <input
                      type="text"
                      className="filter-input"
                      placeholder="Search email..."
                      value={userSearch}
                      onChange={(e) => {
                        setUserSearch(e.target.value);
                        setHistoryPage(1);
                      }}
                    />
                  </div>
                )}

                {activeTab === "analytics" && (
                  <div className="col-12 col-sm-6 col-md-2">
                    <label className="form-label small fw-bold text-muted mb-1">Aggregation</label>
                    <select
                      className="filter-input"
                      value={aggPeriod}
                      onChange={(e) => setAggPeriod(e.target.value as any)}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                )}

                <div className="col-12 col-md-2 d-flex gap-2">
                  <button
                    type="button"
                    className="btn-reset-action w-50"
                    onClick={() => {
                      setFromDate("");
                      setToDate("");
                      setSelectedFeature("");
                      setSelectedModel("");
                      setUserSearch("");
                      setUserSearchQuery("");
                    }}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="btn-main-action w-50"
                    onClick={handleExport}
                  >
                    <i className="fa-solid fa-download"></i> Export
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="d-flex border-bottom mb-4 bg-white rounded-3 shadow-sm px-2">
            <button
              className={`nav-tab-btn ${activeTab === "analytics" ? "active" : ""}`}
              onClick={() => setActiveTab("analytics")}
            >
              <i className="fa-solid fa-chart-line me-1"></i> Token Analytics
            </button>
            <button
              className={`nav-tab-btn ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              <i className="fa-solid fa-users me-1"></i> User Token Usage
            </button>
            <button
              className={`nav-tab-btn ${activeTab === "history" ? "active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              <i className="fa-solid fa-clock-rotate-left me-1"></i> Usage History Logs
            </button>
          </div>

          {/* 1. ANALYTICS TAB */}
          {activeTab === "analytics" && (
            <div className="row g-4">
              <div className="col-12 col-lg-8">
                <div className="elite-card">
                  <div className="elite-card-header">
                    <h2 className="elite-card-title">
                      <i className="fa-solid fa-chart-simple" style={{ color: "#429e85" }}></i>
                      Token Trend ({aggPeriod})
                    </h2>
                  </div>
                  <div className="p-4">
                    {loadingData ? (
                      <div className="text-center py-5">
                        <i className="fa-solid fa-circle-notch fa-spin text-muted fs-2 mb-2"></i>
                        <p className="text-muted small">Fetching latest token trends...</p>
                      </div>
                    ) : trendData.length === 0 ? (
                      <p className="text-muted text-center py-5 small">No trend data available for current selection.</p>
                    ) : (
                      <div className="d-flex align-items-end gap-1 w-100 flex-wrap" style={{ height: 180 }}>
                        {(() => {
                          const maxVal = Math.max(1, ...trendData.map((d) => d.total));
                          return trendData.slice(-30).map((t, idx) => {
                            const totalH = (t.total / maxVal) * 100;
                            const inputPercent = (t.input / (t.total || 1)) * 100;
                            const outputPercent = (t.output / (t.total || 1)) * 100;
                            return (
                              <div
                                key={idx}
                                className="flex-fill d-flex flex-column justify-content-end align-items-center h-100"
                              >
                                <div
                                  className="w-100 d-flex flex-column justify-content-end rounded-top overflow-hidden"
                                  style={{ height: `${totalH}%` }}
                                >
                                  <div
                                    style={{ background: "#429e85", height: `${outputPercent}%` }}
                                    title={`Output: ${t.output.toLocaleString()}`}
                                  />
                                  <div
                                    style={{ background: "#2563eb", height: `${inputPercent}%` }}
                                    title={`Input: ${t.input.toLocaleString()}`}
                                  />
                                </div>
                                <div
                                  className="text-muted text-truncate mt-1 text-center"
                                  style={{ fontSize: 9, width: "100%" }}
                                  title={t.date}
                                >
                                  {aggPeriod === "monthly" ? t.date.split("-")[1] : t.date.slice(5)}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                    <div className="d-flex justify-content-center gap-4 mt-3 small flex-wrap">
                      <div className="d-flex align-items-center gap-1">
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#2563eb" }} />
                        <span className="text-muted">Input Tokens</span>
                      </div>
                      <div className="d-flex align-items-center gap-1">
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#429e85" }} />
                        <span className="text-muted">Output Tokens</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-lg-4">
                <div className="elite-card">
                  <div className="elite-card-header">
                    <h2 className="elite-card-title">
                      <i className="fa-solid fa-arrow-up-right-dots" style={{ color: "#429e85" }}></i>
                      Requests Count Trend
                    </h2>
                  </div>
                  <div className="p-4">
                    {loadingData ? (
                      <div className="text-center py-5">
                        <i className="fa-solid fa-circle-notch fa-spin text-muted fs-2 mb-2"></i>
                        <p className="text-muted small">Loading request counts...</p>
                      </div>
                    ) : trendData.length === 0 ? (
                      <p className="text-muted text-center py-5 small">No requests data available.</p>
                    ) : (
                      <div className="d-flex align-items-end gap-1 w-100 flex-wrap" style={{ height: 180 }}>
                        {(() => {
                          const maxReq = Math.max(1, ...trendData.map((d) => d.requests));
                          return trendData.slice(-30).map((t, idx) => {
                            const heightPercent = (t.requests / maxReq) * 100;
                            return (
                              <div
                                key={idx}
                                className="flex-fill d-flex flex-column justify-content-end align-items-center h-100"
                              >
                                <div
                                  className="w-100 rounded-top"
                                  style={{ background: "#0d4f3c", height: `${Math.max(4, heightPercent)}%` }}
                                  title={`Requests: ${t.requests}`}
                                />
                                <div className="text-muted text-truncate mt-1 text-center" style={{ fontSize: 9, width: "100%" }}>
                                  {aggPeriod === "monthly" ? t.date.split("-")[1] : t.date.slice(5)}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                    <p className="text-center mt-3 text-muted small mb-0">Total Invocations / Timeframe</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. USER TAB */}
          {activeTab === "users" && (
            <div className="elite-card">
              <div className="elite-card-header d-flex flex-wrap gap-2 justify-content-between align-items-center">
                <h2 className="elite-card-title">
                  <i className="fa-solid fa-user-gear" style={{ color: "#429e85" }}></i>
                  User-wise AI Consumption
                </h2>
                <input
                  type="text"
                  className="filter-input"
                  style={{ width: 250 }}
                  placeholder="Search user name/email..."
                  value={userSearchQuery}
                  onChange={(e) => {
                    setUserSearchQuery(e.target.value);
                    setUserPage(1);
                  }}
                />
              </div>

              <div className="token-table-wrap">
                {loadingData ? (
                  <div className="text-center py-5">
                    <i className="fa-solid fa-circle-notch fa-spin text-muted fs-2 mb-2"></i>
                    <p className="text-muted small">Fetching latest user consumption...</p>
                  </div>
                ) : (
                  <>
                    <table className="token-table">
                      <thead>
                        <tr>
                          <th>User Name</th>
                          <th>Email</th>
                          <th>Requests</th>
                          <th
                            onClick={() => {
                              setUserSortBy("inputTokens");
                              setUserSortOrder(userSortOrder === "asc" ? "desc" : "asc");
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            Input Tokens <i className="fa-solid fa-sort ms-1 text-muted"></i>
                          </th>
                          <th
                            onClick={() => {
                              setUserSortBy("outputTokens");
                              setUserSortOrder(userSortOrder === "asc" ? "desc" : "asc");
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            Output Tokens <i className="fa-solid fa-sort ms-1 text-muted"></i>
                          </th>
                          <th
                            onClick={() => {
                              setUserSortBy("totalTokens");
                              setUserSortOrder(userSortOrder === "asc" ? "desc" : "asc");
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            Total Tokens <i className="fa-solid fa-sort ms-1 text-muted"></i>
                          </th>
                          <th
                            onClick={() => {
                              setUserSortBy("estimatedCost");
                              setUserSortOrder(userSortOrder === "asc" ? "desc" : "asc");
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            Estimated Cost <i className="fa-solid fa-sort ms-1 text-muted"></i>
                          </th>
                          <th>Last Active</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.items.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="text-muted text-center py-4 small">
                              No users match this search criteria.
                            </td>
                          </tr>
                        ) : (
                          usersList.items.map((u) => (
                            <tr key={u.userId}>
                              <td className="fw-bold" style={{ color: "#0b2b22" }}>
                                {u.name}
                              </td>
                              <td className="text-muted">{u.email}</td>
                              <td className="fw-semibold">{u.totalRequests}</td>
                              <td>{u.inputTokens.toLocaleString()}</td>
                              <td>{u.outputTokens.toLocaleString()}</td>
                              <td className="fw-bold" style={{ color: "#0d4f3c" }}>
                                {u.totalTokens.toLocaleString()}
                              </td>
                              <td className="text-danger fw-bold">{formatCost(u.estimatedCost)}</td>
                              <td className="text-muted">{new Date(u.lastUsageTime).toLocaleString()}</td>
                              <td className="text-end">
                                <button
                                  type="button"
                                  className="btn btn-sm"
                                  style={{
                                    background: "#ffffff",
                                    border: "1px solid #d6e8e4",
                                    color: "#0d4f3c",
                                    fontWeight: 600,
                                    borderRadius: "7px",
                                    fontSize: "12px",
                                  }}
                                  onClick={() => {
                                    setSelectedUserId(u.userId);
                                    loadUserUsageDetails(u.userId);
                                  }}
                                >
                                  Details <i className="fa-solid fa-arrow-right ms-1"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>

                    {usersList.total > 10 && (
                      <div className="d-flex justify-content-between align-items-center p-3 border-top small text-muted">
                        <span>
                          Showing {(userPage - 1) * 10 + 1} - {Math.min(userPage * 10, usersList.total)} of{" "}
                          {usersList.total} users
                        </span>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            disabled={userPage === 1}
                            onClick={() => setUserPage(userPage - 1)}
                          >
                            Prev
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            disabled={userPage * 10 >= usersList.total}
                            onClick={() => setUserPage(userPage + 1)}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* 3. HISTORY TAB */}
          {activeTab === "history" && (
            <div className="elite-card">
              <div className="elite-card-header">
                <h2 className="elite-card-title">
                  <i className="fa-solid fa-list-ul" style={{ color: "#429e85" }}></i>
                  AI Usage Log History
                </h2>
              </div>

              <div className="token-table-wrap">
                {loadingData ? (
                  <div className="text-center py-5">
                    <i className="fa-solid fa-circle-notch fa-spin text-muted fs-2 mb-2"></i>
                    <p className="text-muted small">Fetching usage logs...</p>
                  </div>
                ) : (
                  <>
                    <table className="token-table">
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>User Name</th>
                          <th>Email</th>
                          <th>Action / Feature</th>
                          <th>Model</th>
                          <th>Input</th>
                          <th>Output</th>
                          <th>Total</th>
                          <th>Latency</th>
                          <th>Status</th>
                          <th className="text-end">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyList.items.length === 0 ? (
                          <tr>
                            <td colSpan={11} className="text-muted text-center py-4 small">
                              No history logs found.
                            </td>
                          </tr>
                        ) : (
                          historyList.items.map((log) => (
                            <tr key={log.id}>
                              <td className="text-muted">{new Date(log.createdAt).toLocaleString()}</td>
                              <td className="fw-semibold" style={{ color: "#0b2b22" }}>
                                {log.name || "Guest"}
                              </td>
                              <td className="text-muted">{log.email || "guest@Nockree.com"}</td>
                              <td>
                                <span className="badge bg-light text-dark border">
                                  {featureLabel(log.feature)}
                                </span>
                              </td>
                              <td className="font-monospace small">{log.model}</td>
                              <td>{log.promptTokens.toLocaleString()}</td>
                              <td>{log.responseTokens.toLocaleString()}</td>
                              <td className="fw-bold" style={{ color: "#0d4f3c" }}>
                                {log.totalTokens.toLocaleString()}
                              </td>
                              <td>{log.latencyMs} ms</td>
                              <td>
                                <span className={`badge-status ${log.success ? "success" : "failed"}`}>
                                  {log.success ? "SUCCESS" : "FAILED"}
                                </span>
                              </td>
                              <td className="text-end text-danger fw-bold">{formatCost(log.cost)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>

                    {historyList.total > 15 && (
                      <div className="d-flex justify-content-between align-items-center p-3 border-top small text-muted">
                        <span>
                          Showing {(historyPage - 1) * 15 + 1} - {Math.min(historyPage * 15, historyList.total)} of{" "}
                          {historyList.total} logs
                        </span>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            disabled={historyPage === 1}
                            onClick={() => setHistoryPage(historyPage - 1)}
                          >
                            Prev
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            disabled={historyPage * 15 >= historyList.total}
                            onClick={() => setHistoryPage(historyPage + 1)}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Modal: User details usage */}
          {selectedUserId && (
            <div
              className="modal show d-block"
              style={{ backgroundColor: "rgba(11, 43, 34, 0.45)", backdropFilter: "blur(4px)", zIndex: 1050 }}
              tabIndex={-1}
            >
              <div className="modal-dialog modal-xl modal-dialog-scrollable modal-dialog-centered">
                <div
                  className="modal-content"
                  style={{
                    borderRadius: "16px",
                    border: "1px solid #d6e8e4",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    className="modal-header"
                    style={{ background: "#fbfdfc", borderBottom: "1px solid #d6e8e4", padding: "16px 22px" }}
                  >
                    <h5 className="modal-title fw-bold" style={{ color: "#0b2b22", fontSize: "16px" }}>
                      <i className="fa-solid fa-circle-user me-2 text-primary"></i>
                      User AI Token Usage Details
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => {
                        setSelectedUserId(null);
                        setUserDetails(null);
                      }}
                    />
                  </div>

                  <div className="modal-body p-4" style={{ background: "#f4f9f8" }}>
                    {loadingDetails && (
                      <div className="text-center py-5">
                        <i className="fa-solid fa-circle-notch fa-spin text-muted fs-2 mb-2"></i>
                        <p className="text-muted small">Loading user detailed records...</p>
                      </div>
                    )}

                    {!loadingDetails && userDetails && (
                      <div>
                        {/* User details header cards */}
                        <div className="row g-3 mb-4">
                          <div className="col-12 col-sm-6 col-md-3">
                            <div className="token-metric-card">
                              <div className="token-metric-label">User Account</div>
                              <div className="fw-bold mt-1 text-truncate" style={{ color: "#0b2b22" }}>
                                {userDetails.name}
                              </div>
                              <div className="text-muted text-truncate small" style={{ fontSize: 11 }}>
                                {userDetails.email}
                              </div>
                            </div>
                          </div>

                          <div className="col-12 col-sm-6 col-md-3">
                            <div className="token-metric-card">
                              <div className="token-metric-label">Total Tokens</div>
                              <div className="token-metric-val mt-1" style={{ color: "#0d4f3c" }}>
                                {userDetails.totalTokens.toLocaleString()}
                              </div>
                              <div className="text-muted small" style={{ fontSize: 10 }}>
                                In: {userDetails.inputTokens.toLocaleString()} | Out: {userDetails.outputTokens.toLocaleString()}
                              </div>
                            </div>
                          </div>

                          <div className="col-12 col-sm-6 col-md-3">
                            <div className="token-metric-card">
                              <div className="token-metric-label">Total Requests</div>
                              <div className="token-metric-val text-primary mt-1">
                                {userDetails.requestCount.toLocaleString()}
                              </div>
                              <div className="text-muted small" style={{ fontSize: 10 }}>API Invocations</div>
                            </div>
                          </div>

                          <div className="col-12 col-sm-6 col-md-3">
                            <div className="token-metric-card">
                              <div className="token-metric-label">Estimated Cost</div>
                              <div className="token-metric-val text-danger mt-1">
                                {formatCost(userDetails.estimatedCost)}
                              </div>
                              <div className="text-muted small" style={{ fontSize: 10 }}>User Spend</div>
                            </div>
                          </div>
                        </div>

                        {/* Charts / Distribution row */}
                        <div className="row g-3 mb-4">
                          <div className="col-12 col-md-6">
                            <div className="elite-card h-100 mb-0">
                              <div className="elite-card-header">
                                <h2 className="elite-card-title">
                                  <i className="fa-solid fa-microchip" style={{ color: "#429e85" }}></i>
                                  Gemini Model Breakdown
                                </h2>
                              </div>
                              <div className="p-3">
                                {userDetails.modelDistribution.length === 0 ? (
                                  <p className="text-muted text-center py-4 small">No model data recorded.</p>
                                ) : (
                                  userDetails.modelDistribution.map((m) => (
                                    <div key={m.name} className="mb-3 small">
                                      <div className="d-flex justify-content-between mb-1">
                                        <span className="fw-semibold">{m.name}</span>
                                        <span className="fw-bold" style={{ color: "#0d4f3c" }}>
                                          {m.value.toLocaleString()} tokens
                                        </span>
                                      </div>
                                      <div className="progress" style={{ height: 6, borderRadius: 3 }}>
                                        <div
                                          className="progress-bar"
                                          role="progressbar"
                                          style={{
                                            background: "#0d4f3c",
                                            width: `${(m.value / (userDetails.totalTokens || 1)) * 100}%`,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="col-12 col-md-6">
                            <div className="elite-card h-100 mb-0">
                              <div className="elite-card-header">
                                <h2 className="elite-card-title">
                                  <i className="fa-solid fa-shapes" style={{ color: "#429e85" }}></i>
                                  AI Feature Breakdown
                                </h2>
                              </div>
                              <div className="p-3" style={{ maxHeight: 220, overflowY: "auto" }}>
                                {userDetails.featureDistribution.length === 0 ? (
                                  <p className="text-muted text-center py-4 small">No features recorded.</p>
                                ) : (
                                  userDetails.featureDistribution.map((f) => (
                                    <div key={f.name} className="mb-2 small">
                                      <div className="d-flex justify-content-between mb-1">
                                        <span className="fw-semibold">{featureLabel(f.name)}</span>
                                        <span className="fw-bold" style={{ color: "#429e85" }}>
                                          {f.value.toLocaleString()} tokens
                                        </span>
                                      </div>
                                      <div className="progress" style={{ height: 6, borderRadius: 3 }}>
                                        <div
                                          className="progress-bar"
                                          role="progressbar"
                                          style={{
                                            background: "#429e85",
                                            width: `${(f.value / (userDetails.totalTokens || 1)) * 100}%`,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Detail history table */}
                        <div className="elite-card mb-0">
                          <div className="elite-card-header">
                            <h2 className="elite-card-title">
                              <i className="fa-solid fa-timeline" style={{ color: "#429e85" }}></i>
                              Chronological AI Activity
                            </h2>
                          </div>
                          <div className="token-table-wrap">
                            <div style={{ maxHeight: 250, overflowY: "auto" }}>
                              <table className="token-table">
                                <thead>
                                  <tr>
                                    <th>Timestamp</th>
                                    <th>Action</th>
                                    <th>Model</th>
                                    <th>Tokens (In / Out)</th>
                                    <th>Latency</th>
                                    <th>Status</th>
                                    <th className="text-end">Cost</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {userDetails.history.length === 0 ? (
                                    <tr>
                                      <td colSpan={7} className="text-muted text-center py-3 small">
                                        No usage history records found.
                                      </td>
                                    </tr>
                                  ) : (
                                    userDetails.history.map((log) => (
                                      <tr key={log.id}>
                                        <td className="text-muted">{new Date(log.createdAt).toLocaleString()}</td>
                                        <td className="fw-semibold">{featureLabel(log.feature)}</td>
                                        <td className="font-monospace small">{log.model}</td>
                                        <td>
                                          {log.totalTokens.toLocaleString()} ({log.promptTokens}/{log.responseTokens})
                                        </td>
                                        <td>{log.latencyMs} ms</td>
                                        <td>
                                          <span className={`badge-status ${log.success ? "success" : "failed"}`}>
                                            {log.success ? "SUCCESS" : "FAILED"}
                                          </span>
                                        </td>
                                        <td className="text-end text-danger fw-bold">{formatCost(log.cost)}</td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    className="modal-footer"
                    style={{ background: "#fbfdfc", borderTop: "1px solid #d6e8e4", padding: "14px 22px" }}
                  >
                    <button
                      type="button"
                      className="btn-main-action"
                      onClick={() => {
                        setSelectedUserId(null);
                        setUserDetails(null);
                      }}
                    >
                      Close Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
