"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, getToken } from "@/lib/api";

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
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
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
      setError(err instanceof ApiError ? err.message : "Failed to load user details");
    } finally {
      setLoadingDetails(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, [activeTab, fromDate, toDate, selectedFeature, selectedModel, aggPeriod, userSortBy, userSortOrder, userPage, historyPage, userSearchQuery, userSearch]);

  // Handle Export CSV
  async function handleExport() {
    try {
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
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `token-usage-report.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to export token usage CSV");
    }
  }

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="tokens" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Token Usage Dashboard</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Token Usage</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Overall Cards */}
            {overview && (
              <div className="row g-3 mb-4">
                <div className="col-md-2 col-sm-4 col-6">
                  <div className="card h-100 shadow-sm border-0"><div className="card-body p-3">
                    <div className="text-muted small mb-1">Total Tokens</div>
                    <div className="fw-bold fs-5 text-dark">{overview.totalTokens.toLocaleString()}</div>
                    <div className="small text-muted" style={{ fontSize: 10 }}>In + Out</div>
                  </div></div>
                </div>
                <div className="col-md-2 col-sm-4 col-6">
                  <div className="card h-100 shadow-sm border-0"><div className="card-body p-3">
                    <div className="text-muted small mb-1">Input Tokens</div>
                    <div className="fw-bold fs-5 text-primary">{overview.totalInputTokens.toLocaleString()}</div>
                  </div></div>
                </div>
                <div className="col-md-2 col-sm-4 col-6">
                  <div className="card h-100 shadow-sm border-0"><div className="card-body p-3">
                    <div className="text-muted small mb-1">Output Tokens</div>
                    <div className="fw-bold fs-5 text-success">{overview.totalOutputTokens.toLocaleString()}</div>
                  </div></div>
                </div>
                <div className="col-md-2 col-sm-4 col-6">
                  <div className="card h-100 shadow-sm border-0"><div className="card-body p-3">
                    <div className="text-muted small mb-1">AI Requests</div>
                    <div className="fw-bold fs-5 text-dark">{overview.totalRequests.toLocaleString()}</div>
                  </div></div>
                </div>
                <div className="col-md-2 col-sm-4 col-6">
                  <div className="card h-100 shadow-sm border-0"><div className="card-body p-3">
                    <div className="text-muted small mb-1">Active Users</div>
                    <div className="fw-bold fs-5 text-info">{overview.activeUsers.toLocaleString()}</div>
                  </div></div>
                </div>
                <div className="col-md-2 col-sm-4 col-6">
                  <div className="card h-100 shadow-sm border-0"><div className="card-body p-3">
                    <div className="text-muted small mb-1">Estimated Cost</div>
                    <div className="fw-bold fs-5 text-danger">{formatCost(overview.totalCost)}</div>
                  </div></div>
                </div>
              </div>
            )}

            {/* Filter Section */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-3">
                <div className="row g-2 align-items-end">
                  <div className="col-md-2 col-sm-6">
                    <label className="form-label small mb-1">From Date</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={fromDate}
                      max={todayStr}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val && todayStr && val > todayStr) {
                          alert("From Date cannot be a future date.");
                          setFromDate(todayStr);
                          if (toDate && toDate < todayStr) {
                            setToDate(todayStr);
                          }
                        } else {
                          setFromDate(val);
                          if (val && toDate && toDate < val) {
                            setToDate(val);
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="col-md-2 col-sm-6">
                    <label className="form-label small mb-1">To Date</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={toDate}
                      min={fromDate}
                      max={todayStr}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          if (fromDate && val < fromDate) {
                            alert("To Date cannot be before From Date.");
                            setToDate(fromDate);
                          } else if (todayStr && val > todayStr) {
                            alert("To Date cannot be a future date.");
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
                  <div className="col-md-2 col-sm-6">
                    <label className="form-label small mb-1">AI Feature</label>
                    <select className="form-select form-select-sm" value={selectedFeature} onChange={(e) => setSelectedFeature(e.target.value)}>
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
                  <div className="col-md-2 col-sm-6">
                    <label className="form-label small mb-1">Gemini Model</label>
                    <select className="form-select form-select-sm" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
                      <option value="">All Models</option>
                      <option value="gemini-3.6-flash">gemini-3.6-flash</option>
                      <option value="gemini-flash-latest">gemini-flash-latest</option>
                    </select>
                  </div>
                  {activeTab === "history" && (
                    <div className="col-md-2 col-sm-6">
                      <label className="form-label small mb-1">Email Search</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
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
                    <div className="col-md-2 col-sm-6">
                      <label className="form-label small mb-1">Aggregation</label>
                      <select className="form-select form-select-sm" value={aggPeriod} onChange={(e) => setAggPeriod(e.target.value as any)}>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  )}
                  <div className="col-md-2 col-sm-6 d-flex gap-2">
                    <button type="button" className="btn btn-sm btn-outline-secondary w-100" onClick={() => {
                      setFromDate("");
                      setToDate("");
                      setSelectedFeature("");
                      setSelectedModel("");
                      setUserSearch("");
                      setUserSearchQuery("");
                    }}>Reset</button>
                    <button type="button" className="btn btn-sm btn-main w-100" onClick={handleExport}>Export</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="d-flex border-bottom mb-4">
              <button className={`btn py-2 px-4 rounded-0 border-0 fw-medium ${activeTab === "analytics" ? "border-bottom border-3 border-primary text-primary" : "text-muted"}`} onClick={() => setActiveTab("analytics")}>
                Token Analytics
              </button>
              <button className={`btn py-2 px-4 rounded-0 border-0 fw-medium ${activeTab === "users" ? "border-bottom border-3 border-primary text-primary" : "text-muted"}`} onClick={() => setActiveTab("users")}>
                User Token Usage
              </button>
              <button className={`btn py-2 px-4 rounded-0 border-0 fw-medium ${activeTab === "history" ? "border-bottom border-3 border-primary text-primary" : "text-muted"}`} onClick={() => setActiveTab("history")}>
                Usage History Logs
              </button>
            </div>

            <>
              {/* 1. ANALYTICS TAB */}
              {activeTab === "analytics" && (
                <div className="row g-4">
                  <div className="col-md-8">
                    <div className="card border-0 shadow-sm mb-4">
                      <div className="card-header bg-white border-0 py-3"><h6 className="mb-0 fw-bold">Token Trend ({aggPeriod})</h6></div>
                      <div className="card-body">
                        {loadingData ? (
                          <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status" />
                            <p className="text-muted mt-2 small">Fetching latest token logs...</p>
                          </div>
                        ) : trendData.length === 0 ? (
                          <p className="text-muted text-center py-5 small">No trends data available for current selection.</p>
                        ) : (
                          <div className="d-flex align-items-end gap-1 w-100" style={{ height: 180 }}>
                            {(() => {
                              const maxVal = Math.max(1, ...trendData.map((d) => d.total));
                              return trendData.slice(-30).map((t, idx) => {
                                const totalH = (t.total / maxVal) * 100;
                                const inputPercent = (t.input / (t.total || 1)) * 100;
                                const outputPercent = (t.output / (t.total || 1)) * 100;
                                return (
                                  <div key={idx} className="flex-fill d-flex flex-column justify-content-end align-items-center h-100">
                                    <div className="w-100 d-flex flex-column justify-content-end rounded-top overflow-hidden" style={{ height: `${totalH}%` }}>
                                      <div className="bg-success w-100" style={{ height: `${outputPercent}%` }} title={`Output: ${t.output.toLocaleString()}`} />
                                      <div className="bg-primary w-100" style={{ height: `${inputPercent}%` }} title={`Input: ${t.input.toLocaleString()}`} />
                                    </div>
                                    <div className="text-muted text-truncate mt-1 text-center" style={{ fontSize: 9, width: "100%" }} title={t.date}>
                                      {aggPeriod === "monthly" ? t.date.split("-")[1] : t.date.slice(5)}
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        )}
                        <div className="d-flex justify-content-center gap-4 mt-3 small">
                          <div className="d-flex align-items-center gap-1"><div className="bg-primary rounded-circle" style={{ width: 10, height: 10 }} /> Input Tokens</div>
                          <div className="d-flex align-items-center gap-1"><div className="bg-success rounded-circle" style={{ width: 10, height: 10 }} /> Output Tokens</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="card border-0 shadow-sm mb-4">
                      <div className="card-header bg-white border-0 py-3"><h6 className="mb-0 fw-bold">Requests Count Trend</h6></div>
                      <div className="card-body">
                        {loadingData ? (
                          <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status" />
                            <p className="text-muted mt-2 small">Loading trends...</p>
                          </div>
                        ) : trendData.length === 0 ? (
                          <p className="text-muted text-center py-5 small">No requests data available.</p>
                        ) : (
                          <div className="d-flex align-items-end gap-1 w-100" style={{ height: 180 }}>
                            {(() => {
                              const maxReq = Math.max(1, ...trendData.map((d) => d.requests));
                              return trendData.slice(-30).map((t, idx) => {
                                const heightPercent = (t.requests / maxReq) * 100;
                                return (
                                  <div key={idx} className="flex-fill d-flex flex-column justify-content-end align-items-center h-100">
                                    <div className="bg-info w-100 rounded-top" style={{ height: `${Math.max(2, heightPercent)}%` }} title={`Requests: ${t.requests}`} />
                                    <div className="text-muted text-truncate mt-1 text-center" style={{ fontSize: 9, width: "100%" }}>
                                      {aggPeriod === "monthly" ? t.date.split("-")[1] : t.date.slice(5)}
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        )}
                        <p className="text-center mt-3 text-muted small">Requests / Timeframe</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. USER TAB */}
              {activeTab === "users" && (
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 fw-bold">User-wise AI Consumption</h6>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      style={{ width: 250 }}
                      placeholder="Search user name/email..."
                      value={userSearchQuery}
                      onChange={(e) => {
                        setUserSearchQuery(e.target.value);
                        setUserPage(1);
                      }}
                    />
                  </div>
                  <div className="card-body p-0">
                    {loadingData ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status" />
                        <p className="text-muted mt-2 small">Fetching latest token logs...</p>
                      </div>
                    ) : (
                      <>
                        <div className="table-responsive">
                          <table className="table align-middle mb-0">
                            <thead>
                              <tr className="bg-light small fw-bold">
                                <th>User Name</th>
                                <th>Email</th>
                                <th>Requests</th>
                                <th onClick={() => { setUserSortBy("inputTokens"); setUserSortOrder(userSortOrder === "asc" ? "desc" : "asc"); }} style={{ cursor: "pointer" }}>Input Tokens</th>
                                <th onClick={() => { setUserSortBy("outputTokens"); setUserSortOrder(userSortOrder === "asc" ? "desc" : "asc"); }} style={{ cursor: "pointer" }}>Output Tokens</th>
                                <th onClick={() => { setUserSortBy("totalTokens"); setUserSortOrder(userSortOrder === "asc" ? "desc" : "asc"); }} style={{ cursor: "pointer" }}>Total Tokens</th>
                                <th onClick={() => { setUserSortBy("estimatedCost"); setUserSortOrder(userSortOrder === "asc" ? "desc" : "asc"); }} style={{ cursor: "pointer" }}>Estimated Cost</th>
                                <th>Last Active</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {usersList.items.length === 0 ? (
                                <tr><td colSpan={9} className="text-muted text-center py-4 small">No users found.</td></tr>
                              ) : (
                                usersList.items.map((u) => (
                                  <tr key={u.userId} className="small">
                                    <td className="fw-semibold">{u.name}</td>
                                    <td>{u.email}</td>
                                    <td>{u.totalRequests}</td>
                                    <td>{u.inputTokens.toLocaleString()}</td>
                                    <td>{u.outputTokens.toLocaleString()}</td>
                                    <td className="fw-bold">{u.totalTokens.toLocaleString()}</td>
                                    <td className="text-danger fw-medium">{formatCost(u.estimatedCost)}</td>
                                    <td>{new Date(u.lastUsageTime).toLocaleString()}</td>
                                    <td>
                                      <button type="button" className="btn btn-sm btn-outline-main py-1" onClick={() => {
                                        setSelectedUserId(u.userId);
                                        loadUserUsageDetails(u.userId);
                                      }}>Details</button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* User list Pagination */}
                        {usersList.total > 10 && (
                          <div className="d-flex justify-content-between align-items-center p-3 border-top small text-muted">
                            <span>Showing {(userPage - 1) * 10 + 1} - {Math.min(userPage * 10, usersList.total)} of {usersList.total} users</span>
                            <div className="d-flex gap-2">
                              <button type="button" className="btn btn-sm btn-outline-secondary" disabled={userPage === 1} onClick={() => setUserPage(userPage - 1)}>Prev</button>
                              <button type="button" className="btn btn-sm btn-outline-secondary" disabled={userPage * 10 >= usersList.total} onClick={() => setUserPage(userPage + 1)}>Next</button>
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
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white border-0 py-3"><h6 className="mb-0 fw-bold">AI Usage Log History</h6></div>
                  <div className="card-body p-0">
                    {loadingData ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status" />
                        <p className="text-muted mt-2 small">Fetching latest token logs...</p>
                      </div>
                    ) : (
                      <>
                        <div className="table-responsive">
                          <table className="table align-middle mb-0">
                            <thead>
                              <tr className="bg-light small fw-bold">
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
                                <th>Cost</th>
                              </tr>
                            </thead>
                            <tbody>
                              {historyList.items.length === 0 ? (
                                <tr><td colSpan={11} className="text-muted text-center py-4 small">No history logs found.</td></tr>
                              ) : (
                                historyList.items.map((log) => (
                                  <tr key={log.id} className="small">
                                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                                    <td className="fw-semibold">{log.name || "Guest"}</td>
                                    <td>{log.email || "guest@jobstock.com"}</td>
                                    <td>{featureLabel(log.feature)}</td>
                                    <td>{log.model}</td>
                                    <td>{log.promptTokens.toLocaleString()}</td>
                                    <td>{log.responseTokens.toLocaleString()}</td>
                                    <td className="fw-bold">{log.totalTokens.toLocaleString()}</td>
                                    <td>{log.latencyMs} ms</td>
                                    <td>
                                      <span className={`badge ${log.success ? "bg-success" : "bg-danger"}`}>
                                        {log.success ? "SUCCESS" : "FAILED"}
                                      </span>
                                    </td>
                                    <td className="text-danger fw-semibold">{formatCost(log.cost)}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* History list Pagination */}
                        {historyList.total > 15 && (
                          <div className="d-flex justify-content-between align-items-center p-3 border-top small text-muted">
                            <span>Showing {(historyPage - 1) * 15 + 1} - {Math.min(historyPage * 15, historyList.total)} of {historyList.total} logs</span>
                            <div className="d-flex gap-2">
                              <button type="button" className="btn btn-sm btn-outline-secondary" disabled={historyPage === 1} onClick={() => setHistoryPage(historyPage - 1)}>Prev</button>
                              <button type="button" className="btn btn-sm btn-outline-secondary" disabled={historyPage * 15 >= historyList.total} onClick={() => setHistoryPage(historyPage + 1)}>Next</button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </>

            {/* Modal: User details usage */}
            {selectedUserId && (
              <div className="modal show d-block" style={{ backgroundColor: "rgba(0, 0, 0, 0.45)", zIndex: 1050 }} tabIndex={-1}>
                <div className="modal-dialog modal-xl modal-dialog-scrollable">
                  <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header bg-white border-bottom">
                      <h5 className="modal-title fw-bold text-dark">User AI Token Usage Details</h5>
                      <button type="button" className="btn-close" onClick={() => { setSelectedUserId(null); setUserDetails(null); }} />
                    </div>

                    <div className="modal-body bg-light p-4">
                      {loadingDetails && (
                        <div className="text-center py-5">
                          <div className="spinner-border text-primary" role="status" />
                          <p className="text-muted mt-2 small">Loading user detailed records...</p>
                        </div>
                      )}

                      {!loadingDetails && userDetails && (
                        <div>
                          {/* User details header cards */}
                          <div className="row g-3 mb-4">
                            <div className="col-md-3">
                              <div className="card border-0 shadow-sm h-100"><div className="card-body p-3">
                                <div className="text-muted small">User Details</div>
                                <div className="fw-bold mt-1 text-truncate">{userDetails.name}</div>
                                <div className="text-muted text-truncate small" style={{ fontSize: 11 }}>{userDetails.email}</div>
                              </div></div>
                            </div>
                            <div className="col-md-3">
                              <div className="card border-0 shadow-sm h-100"><div className="card-body p-3">
                                <div className="text-muted small">Total Tokens</div>
                                <div className="fw-bold fs-5 text-dark mt-1">{userDetails.totalTokens.toLocaleString()}</div>
                                <div className="text-muted small" style={{ fontSize: 10 }}>In: {userDetails.inputTokens.toLocaleString()} | Out: {userDetails.outputTokens.toLocaleString()}</div>
                              </div></div>
                            </div>
                            <div className="col-md-3">
                              <div className="card border-0 shadow-sm h-100"><div className="card-body p-3">
                                <div className="text-muted small">Total Requests</div>
                                <div className="fw-bold fs-5 text-info mt-1">{userDetails.requestCount.toLocaleString()}</div>
                              </div></div>
                            </div>
                            <div className="col-md-3">
                              <div className="card border-0 shadow-sm h-100"><div className="card-body p-3">
                                <div className="text-muted small">Estimated Cost</div>
                                <div className="fw-bold fs-5 text-danger mt-1">{formatCost(userDetails.estimatedCost)}</div>
                              </div></div>
                            </div>
                          </div>

                          {/* Charts / Distribution row */}
                          <div className="row g-4 mb-4">
                            <div className="col-md-6">
                              <div className="card border-0 shadow-sm h-100">
                                <div className="card-header bg-white border-0 py-3"><h6 className="mb-0 fw-bold">Gemini Model Breakdown</h6></div>
                                <div className="card-body">
                                  {userDetails.modelDistribution.length === 0 ? (
                                    <p className="text-muted text-center py-4 small">No model data recorded.</p>
                                  ) : (
                                    userDetails.modelDistribution.map((m) => (
                                      <div key={m.name} className="mb-3 small">
                                        <div className="d-flex justify-content-between mb-1">
                                          <span>{m.name}</span>
                                          <span className="fw-bold">{m.value.toLocaleString()} tokens</span>
                                        </div>
                                        <div className="progress" style={{ height: 6 }}>
                                          <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${(m.value / (userDetails.totalTokens || 1)) * 100}%` }} />
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="col-md-6">
                              <div className="card border-0 shadow-sm h-100">
                                <div className="card-header bg-white border-0 py-3"><h6 className="mb-0 fw-bold">AI Feature Breakdown</h6></div>
                                <div className="card-body" style={{ maxHeight: 220, overflowY: "auto" }}>
                                  {userDetails.featureDistribution.length === 0 ? (
                                    <p className="text-muted text-center py-4 small">No features recorded.</p>
                                  ) : (
                                    userDetails.featureDistribution.map((f) => (
                                      <div key={f.name} className="mb-2 small">
                                        <div className="d-flex justify-content-between mb-1">
                                          <span>{featureLabel(f.name)}</span>
                                          <span className="fw-bold">{f.value.toLocaleString()} tokens</span>
                                        </div>
                                        <div className="progress" style={{ height: 6 }}>
                                          <div className="progress-bar bg-success" role="progressbar" style={{ width: `${(f.value / (userDetails.totalTokens || 1)) * 100}%` }} />
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Detail history table */}
                          <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0 py-3"><h6 className="mb-0 fw-bold">Chronological AI Activity</h6></div>
                            <div className="card-body p-0">
                              <div className="table-responsive" style={{ maxHeight: 250 }}>
                                <table className="table align-middle mb-0">
                                  <thead>
                                    <tr className="bg-light small fw-bold">
                                      <th>Timestamp</th>
                                      <th>Action</th>
                                      <th>Model</th>
                                      <th>Tokens (In / Out)</th>
                                      <th>Latency</th>
                                      <th>Status</th>
                                      <th>Cost</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {userDetails.history.length === 0 ? (
                                      <tr><td colSpan={7} className="text-muted text-center py-3 small">No usage history records found.</td></tr>
                                    ) : (
                                      userDetails.history.map((log) => (
                                        <tr key={log.id} className="small">
                                          <td>{new Date(log.createdAt).toLocaleString()}</td>
                                          <td>{featureLabel(log.feature)}</td>
                                          <td>{log.model}</td>
                                          <td>{log.totalTokens.toLocaleString()} ({log.promptTokens}/{log.responseTokens})</td>
                                          <td>{log.latencyMs} ms</td>
                                          <td>
                                            <span className={`badge ${log.success ? "bg-success" : "bg-danger"}`}>
                                              {log.success ? "SUCCESS" : "FAILED"}
                                            </span>
                                          </td>
                                          <td className="text-danger fw-semibold">{formatCost(log.cost)}</td>
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

                    <div className="modal-footer bg-white border-top">
                      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { setSelectedUserId(null); setUserDetails(null); }}>Close</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="row">
            <div className="col-md-12">
              <div className="py-3 text-center">
                &copy; {new Date().getFullYear()} JobStock. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
