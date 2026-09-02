"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar7 from "@/components/Navbar7";
import Navbar8 from "@/components/Navbar8";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
import UploadResumeModal from "@/components/candidate-dashboard/UploadResumeModal";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl } from "@/lib/api";
import { Toaster, toast } from "react-hot-toast";

interface FollowItem {
  id: string;
  employer?: {
    id: string;
    companyName: string;
    logoUrl: string | null;
    location: string | null;
    industry?: string | null;
    userId?: string;
  };
  candidate?: {
    id: string;
    fullName: string;
    profilePhotoUrl: string | null;
    location: string | null;
    headline?: string | null;
    userId?: string;
  };
}

type TabType = "companies" | "candidates" | "followers" | "requests";

export default function CandidateFollowEmployersPage() {
  return (
    <Suspense
      fallback={
        <div className="d-flex justify-content-center align-items-center vh-100">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      }
    >
      <CandidateFollowEmployersContent />
    </Suspense>
  );
}

function CandidateFollowEmployersContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabType>("companies");
  const [requestsSubTab, setRequestsSubTab] = useState<"received" | "sent">("received");
  const [followingList, setFollowingList] = useState<FollowItem[]>([]);
  const [followersList, setFollowersList] = useState<FollowItem[]>([]);
  const [requestsList, setRequestsList] = useState<FollowItem[]>([]);
  const [sentRequestsList, setSentRequestsList] = useState<FollowItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["companies", "candidates", "followers", "requests"].includes(tab)) {
      setActiveTab(tab as TabType);
    }
    const sub = searchParams.get("sub");
    if (sub && ["received", "sent"].includes(sub)) {
      setRequestsSubTab(sub as "received" | "sent");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && (!user || (user.role !== "CANDIDATE" && user.role !== "EMPLOYER"))) {
      router.push("/");
    }
  }, [loading, user, router]);

  const loadData = async () => {
    if (!user || (user.role !== "CANDIDATE" && user.role !== "EMPLOYER")) return;
    setDataLoading(true);
    try {
      const [followingRes, followersRes, requestsRes, sentRequestsRes] = await Promise.allSettled([
        api.get<FollowItem[]>("/follow/following"),
        api.get<FollowItem[]>("/follow/followers"),
        api.get<FollowItem[]>("/follow/requests"),
        api.get<FollowItem[]>("/follow/sent-requests"),
      ]);

      if (followingRes.status === "fulfilled") {
        setFollowingList(followingRes.value || []);
      }
      if (followersRes.status === "fulfilled") {
        setFollowersList(followersRes.value || []);
      }
      if (requestsRes.status === "fulfilled") {
        setRequestsList(requestsRes.value || []);
      }
      if (sentRequestsRes.status === "fulfilled") {
        setSentRequestsList(sentRequestsRes.value || []);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load follow data");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle Unfollow / Disconnect
  async function handleUnfollow(targetId: string) {
    setLoadingId(targetId);
    try {
      await api.delete(`/follow/${targetId}`);
      toast.success("Disconnected successfully");
      setFollowingList((prev) =>
        prev.filter((item) => item.employer?.id !== targetId && item.candidate?.id !== targetId)
      );
      loadData();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to disconnect profile");
    } finally {
      setLoadingId(null);
    }
  }

  // Handle Cancel Sent Request
  async function handleCancelSentRequest(targetId: string) {
    setLoadingId(targetId);
    try {
      await api.delete(`/follow/${targetId}`);
      toast.success("Connection request cancelled");
      setSentRequestsList((prev) =>
        prev.filter((item) => item.candidate?.id !== targetId && item.candidate?.userId !== targetId)
      );
      loadData();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to cancel request");
    } finally {
      setLoadingId(null);
    }
  }

  // Handle Follow / Send Request
  async function handleFollow(targetId: string, item: FollowItem) {
    setLoadingId(targetId);
    try {
      const res = await api.post<{ isPending?: boolean; message?: string }>(`/follow/${targetId}`, {});
      if (res?.isPending) {
        toast.success("Connection request sent!");
      } else {
        toast.success("Followed successfully!");
        setFollowingList((prev) => [item, ...prev]);
      }
      loadData();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to follow profile");
    } finally {
      setLoadingId(null);
    }
  }

  // Accept incoming connection request
  async function handleAcceptRequest(candidateId: string) {
    setLoadingId(candidateId);
    try {
      await api.post(`/follow/requests/${candidateId}/accept`, {});
      toast.success("Connection request accepted! You are now connected.");
      setRequestsList((prev) => prev.filter((r) => r.candidate?.id !== candidateId && r.candidate?.userId !== candidateId));
      loadData();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to accept connection request");
    } finally {
      setLoadingId(null);
    }
  }

  // Reject incoming connection request
  async function handleRejectRequest(candidateId: string) {
    setLoadingId(candidateId);
    try {
      await api.post(`/follow/requests/${candidateId}/reject`, {});
      toast.success("Connection request rejected");
      setRequestsList((prev) => prev.filter((r) => r.candidate?.id !== candidateId && r.candidate?.userId !== candidateId));
      loadData();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to reject connection request");
    } finally {
      setLoadingId(null);
    }
  }

  // Check if a targetId is already in following list
  function isFollowing(targetId: string) {
    return followingList.some(
      (item) => item.employer?.id === targetId || item.candidate?.id === targetId
    );
  }

  // Separate companies and candidates from following list
  const followedCompanies = useMemo(
    () => followingList.filter((item) => Boolean(item.employer)),
    [followingList]
  );

  const followedCandidates = useMemo(
    () => followingList.filter((item) => Boolean(item.candidate)),
    [followingList]
  );

  // Active list based on tab
  const displayedList = useMemo(() => {
    let currentList: FollowItem[] = [];
    if (activeTab === "companies") currentList = followedCompanies;
    else if (activeTab === "candidates") currentList = followedCandidates;
    else if (activeTab === "followers") currentList = followersList;
    else if (activeTab === "requests") currentList = requestsSubTab === "received" ? requestsList : sentRequestsList;

    if (!searchQuery.trim()) return currentList;

    const q = searchQuery.toLowerCase();
    return currentList.filter((item) => {
      const name = item.employer?.companyName || item.candidate?.fullName || "";
      const loc = item.employer?.location || item.candidate?.location || "";
      const extra = item.employer?.industry || item.candidate?.headline || "";
      return (
        name.toLowerCase().includes(q) ||
        loc.toLowerCase().includes(q) ||
        extra.toLowerCase().includes(q)
      );
    });
  }, [activeTab, requestsSubTab, followedCompanies, followedCandidates, followersList, requestsList, sentRequestsList, searchQuery]);

  if (loading || !user) {
    return null;
  }

  return (
    <>
      {user.role === "EMPLOYER" ? <Navbar8 /> : <Navbar7 />}
      <Toaster position="top-center" />

      <div className="dashboard-wrap bg-light">
        {user.role === "CANDIDATE" && <CandidateSidebar active="follow-employers" />}

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Network &amp; Follows</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted">
                      <Link href="/">{user.role === "EMPLOYER" ? "Employer" : "Candidate"}</Link>
                    </li>
                    <li className="breadcrumb-item text-muted">
                      <Link href={user.role === "EMPLOYER" ? "/employer-dashboard" : "/candidate-dashboard"}>
                        Dashboard
                      </Link>
                    </li>
                    <li className="breadcrumb-item">
                      <span className="text-main">Network &amp; Follows</span>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {/* Top Quick Stats Row */}
            <div className="row mb-4 g-3">
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12">
                <div
                  className={`card border-0 shadow-sm rounded-4 p-3 cursor-pointer ${
                    activeTab === "companies" ? "border-main border-2 bg-white" : "bg-white"
                  }`}
                  onClick={() => setActiveTab("companies")}
                  style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center bg-light-primary text-primary"
                      style={{ width: "50px", height: "50px", fontSize: "20px" }}
                    >
                      <i className="fa-solid fa-building"></i>
                    </div>
                    <div>
                      <h4 className="mb-0 fw-bold">{followedCompanies.length}</h4>
                      <span className="text-muted small">Followed Companies</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12">
                <div
                  className={`card border-0 shadow-sm rounded-4 p-3 cursor-pointer ${
                    activeTab === "candidates" ? "border-main border-2 bg-white" : "bg-white"
                  }`}
                  onClick={() => setActiveTab("candidates")}
                  style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center bg-light-info text-info"
                      style={{ width: "50px", height: "50px", fontSize: "20px" }}
                    >
                      <i className="fa-solid fa-user-group"></i>
                    </div>
                    <div>
                      <h4 className="mb-0 fw-bold">{followedCandidates.length}</h4>
                      <span className="text-muted small">Connected Candidates</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12">
                <div
                  className={`card border-0 shadow-sm rounded-4 p-3 cursor-pointer ${
                    activeTab === "followers" ? "border-main border-2 bg-white" : "bg-white"
                  }`}
                  onClick={() => setActiveTab("followers")}
                  style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center bg-light-success text-success"
                      style={{ width: "50px", height: "50px", fontSize: "20px" }}
                    >
                      <i className="fa-solid fa-users"></i>
                    </div>
                    <div>
                      <h4 className="mb-0 fw-bold">{followersList.length}</h4>
                      <span className="text-muted small">Followers</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12">
                <div
                  className={`card border-0 shadow-sm rounded-4 p-3 cursor-pointer ${
                    activeTab === "requests" ? "border-main border-2 bg-white" : "bg-white"
                  }`}
                  onClick={() => setActiveTab("requests")}
                  style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center bg-light-warning text-warning"
                      style={{ width: "50px", height: "50px", fontSize: "20px" }}
                    >
                      <i className="fa-solid fa-user-clock"></i>
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <h4 className="mb-0 fw-bold">{requestsList.length}</h4>
                        {requestsList.length > 0 && (
                          <span className="badge bg-danger rounded-pill small">New</span>
                        )}
                      </div>
                      <span className="text-muted small">
                        Requests ({requestsList.length} In / {sentRequestsList.length} Out)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Tab Selection & Search Row */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card shadow-sm border-0 rounded-4">
                  <div className="card-body p-3">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      {/* Tabs */}
                      <div className="d-flex flex-wrap align-items-center gap-2">
                        <button
                          type="button"
                          className="btn btn-sm rounded-pill fw-medium py-2 px-3.5 border"
                          style={{
                            backgroundColor: activeTab === "companies" ? "#126746" : "#f8fafc",
                            color: activeTab === "companies" ? "#ffffff" : "#334155",
                            borderColor: activeTab === "companies" ? "#126746" : "#e2e8f0",
                            transition: "all 0.2s ease",
                          }}
                          onClick={() => setActiveTab("companies")}
                        >
                          <i className="fa-solid fa-building me-2"></i>Companies ({followedCompanies.length})
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm rounded-pill fw-medium py-2 px-3.5 border"
                          style={{
                            backgroundColor: activeTab === "candidates" ? "#126746" : "#f8fafc",
                            color: activeTab === "candidates" ? "#ffffff" : "#334155",
                            borderColor: activeTab === "candidates" ? "#126746" : "#e2e8f0",
                            transition: "all 0.2s ease",
                          }}
                          onClick={() => setActiveTab("candidates")}
                        >
                          <i className="fa-solid fa-user-group me-2"></i>Candidates ({followedCandidates.length})
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm rounded-pill fw-medium py-2 px-3.5 border"
                          style={{
                            backgroundColor: activeTab === "followers" ? "#126746" : "#f8fafc",
                            color: activeTab === "followers" ? "#ffffff" : "#334155",
                            borderColor: activeTab === "followers" ? "#126746" : "#e2e8f0",
                            transition: "all 0.2s ease",
                          }}
                          onClick={() => setActiveTab("followers")}
                        >
                          <i className="fa-solid fa-users me-2"></i>Followers ({followersList.length})
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm rounded-pill fw-medium py-2 px-3.5 border"
                          style={{
                            backgroundColor: activeTab === "requests" ? "#126746" : "#f8fafc",
                            color: activeTab === "requests" ? "#ffffff" : "#334155",
                            borderColor: activeTab === "requests" ? "#126746" : "#e2e8f0",
                            transition: "all 0.2s ease",
                          }}
                          onClick={() => setActiveTab("requests")}
                        >
                          <i className="fa-solid fa-user-clock me-2"></i>Requests ({requestsList.length + sentRequestsList.length})
                        </button>
                      </div>

                      {/* Search Bar */}
                      <div className="position-relative" style={{ minWidth: "260px" }}>
                        <i className="fa-solid fa-magnifying-glass position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                        <input
                          type="text"
                          className="form-control form-control-sm ps-5 rounded-pill bg-light border"
                          placeholder="Search in list..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            className="btn btn-sm position-absolute top-50 end-0 translate-middle-y me-1 text-muted"
                            onClick={() => setSearchQuery("")}
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-tabs for Requests (Received vs Sent) */}
            {activeTab === "requests" && (
              <div className="d-flex align-items-center gap-2 mb-4">
                <button
                  type="button"
                  className="btn btn-sm rounded-pill px-4 py-2 fw-medium border"
                  style={{
                    backgroundColor: requestsSubTab === "received" ? "#126746" : "#ffffff",
                    color: requestsSubTab === "received" ? "#ffffff" : "#334155",
                    borderColor: requestsSubTab === "received" ? "#126746" : "#e2e8f0",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => setRequestsSubTab("received")}
                >
                  <i className="fa-solid fa-inbox me-1.5"></i>Received Requests ({requestsList.length})
                </button>
                <button
                  type="button"
                  className="btn btn-sm rounded-pill px-4 py-2 fw-medium border"
                  style={{
                    backgroundColor: requestsSubTab === "sent" ? "#126746" : "#ffffff",
                    color: requestsSubTab === "sent" ? "#ffffff" : "#334155",
                    borderColor: requestsSubTab === "sent" ? "#126746" : "#e2e8f0",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => setRequestsSubTab("sent")}
                >
                  <i className="fa-solid fa-paper-plane me-1.5"></i>Sent Requests ({sentRequestsList.length})
                </button>
              </div>
            )}

            {/* Content Display */}
            {dataLoading ? (
              <div className="card shadow-sm border-0 rounded-4 p-5 text-center">
                <div className="spinner-border text-main mx-auto mb-3" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted mb-0">Loading your network...</p>
              </div>
            ) : displayedList.length === 0 ? (
              <div className="card shadow-sm border-0 rounded-4 p-5 text-center bg-white">
                <div
                  className="rounded-circle bg-light-main mx-auto mb-3 d-flex align-items-center justify-content-center"
                  style={{ width: "70px", height: "70px" }}
                >
                  <i className="fa-regular fa-folder-open text-main fs-2"></i>
                </div>
                <h5 className="fw-bold mb-1">No profiles found</h5>
                <p className="text-muted small mb-4">
                  {searchQuery
                    ? `No matching profiles found for "${searchQuery}" in this tab.`
                    : activeTab === "companies"
                    ? "You haven't followed any companies yet."
                    : activeTab === "candidates"
                    ? "You haven't connected with any candidates yet."
                    : activeTab === "requests"
                    ? requestsSubTab === "received"
                      ? "You have no incoming connection requests."
                      : "You have no pending sent connection requests."
                    : "No one is following you yet."}
                </p>
                {activeTab === "companies" && (
                  <div>
                    <Link href="/employers" className="btn btn-main px-4 py-2 rounded-3 fw-medium">
                      Browse Companies
                    </Link>
                  </div>
                )}
                {activeTab === "candidates" && (
                  <div>
                    <Link href="/candidates" className="btn btn-main px-4 py-2 rounded-3 fw-medium">
                      Explore Candidates
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="row g-4">
                {displayedList.map((item) => {
                  const isCandidate = Boolean(item.candidate);
                  const name = isCandidate
                    ? item.candidate!.fullName
                    : item.employer!.companyName;
                  const logoUrl = isCandidate
                    ? item.candidate!.profilePhotoUrl
                    : item.employer!.logoUrl;
                  const defaultImg = isCandidate
                    ? "/assets/img/avatar.jpg"
                    : "/assets/img/c-1.png";
                  const location = isCandidate
                    ? item.candidate!.location
                    : item.employer!.location;
                  const industryOrHeadline = isCandidate
                    ? item.candidate!.headline
                    : item.employer!.industry;
                  const detailUrl = isCandidate
                    ? `/candidate-detail/${item.candidate!.id}`
                    : `/employer-detail/${item.employer!.id}`;
                  const viewText = isCandidate ? "View Profile" : "View Company";

                  const targetId = isCandidate ? item.candidate!.id : item.employer!.id;
                  const alreadyFollowing = isFollowing(targetId);
                  const chatUserId = item.candidate?.userId || item.candidate?.id || item.employer?.userId || item.employer?.id;

                  return (
                    <div className="col-xl-4 col-lg-6 col-md-6 col-12" key={item.id}>
                      <div
                        className="card h-100 border-0 shadow-sm rounded-4 p-4 d-flex flex-column justify-content-between bg-white position-relative"
                        style={{
                          transition: "transform 0.2s ease, box-shadow 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.boxShadow = "0 12px 25px -5px rgba(0, 0, 0, 0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "";
                        }}
                      >
                        <div>
                          {/* Card Header */}
                          <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                            <Link href={detailUrl}>
                              <div
                                className="rounded-circle overflow-hidden border d-flex align-items-center justify-content-center bg-white p-2 shadow-2xs"
                                style={{ width: "70px", height: "70px" }}
                              >
                                {logoUrl ? (
                                  <img
                                    src={assetUrl(logoUrl)}
                                    className="img-fluid"
                                    alt={name}
                                    style={{
                                      maxHeight: "100%",
                                      maxWidth: "100%",
                                      objectFit: isCandidate ? "cover" : "contain",
                                      borderRadius: isCandidate ? "50%" : "0",
                                    }}
                                  />
                                ) : isCandidate ? (
                                  <div
                                    className="w-100 h-100 rounded-circle d-flex align-items-center justify-content-center"
                                    style={{ backgroundColor: "#e2e8f0", color: "#64748b" }}
                                  >
                                    <i className="fa-solid fa-user fs-4 text-secondary opacity-75"></i>
                                  </div>
                                ) : (
                                  <img
                                    src="/assets/img/c-1.png"
                                    className="img-fluid"
                                    alt={name}
                                    style={{
                                      maxHeight: "100%",
                                      maxWidth: "100%",
                                      objectFit: "contain",
                                    }}
                                  />
                                )}
                              </div>
                            </Link>

                            <div className="d-flex flex-column align-items-end gap-1">
                              {isCandidate ? (
                                <span className="badge bg-light-info text-info border px-2.5 py-1.5 rounded-pill fw-medium">
                                  <i className="fa-solid fa-user me-1"></i>Candidate
                                </span>
                              ) : (
                                <span className="badge bg-light-success text-success border px-2.5 py-1.5 rounded-pill fw-medium">
                                  <i className="fa-solid fa-building me-1"></i>Company
                                </span>
                              )}

                              {activeTab === "followers" && (
                                <span className="badge bg-light-primary text-primary border px-2 py-1 rounded-pill small">
                                  <i className="fa-solid fa-user-check me-1"></i>Follows You
                                </span>
                              )}

                              {activeTab === "requests" && (
                                requestsSubTab === "sent" ? (
                                  <span className="badge bg-light-warning text-warning border px-2 py-1 rounded-pill small">
                                    <i className="fa-solid fa-paper-plane me-1"></i>Request Sent
                                  </span>
                                ) : (
                                  <span className="badge bg-light-info text-info border px-2 py-1 rounded-pill small">
                                    <i className="fa-solid fa-user-clock me-1"></i>Wants to connect
                                  </span>
                                )
                              )}
                            </div>
                          </div>

                          {/* Name and Subtitle */}
                          <h5 className="fw-bold mb-1 text-dark">
                            <Link
                              href={detailUrl}
                              className="text-dark text-decoration-none"
                              style={{ transition: "color 0.2s" }}
                            >
                              {name}
                            </Link>
                          </h5>

                          {industryOrHeadline && (
                            <p
                              className="text-muted small mb-2"
                              style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {industryOrHeadline}
                            </p>
                          )}

                          <div className="text-muted small d-flex align-items-center gap-2 mb-3">
                            <i className="fa-solid fa-location-dot text-main"></i>
                            <span className="text-truncate">{location || "Location not specified"}</span>
                          </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="d-flex align-items-center gap-2 pt-3 border-top mt-3 flex-wrap">
                          <Link
                            href={detailUrl}
                            className="btn btn-sm btn-light-main flex-grow-1 py-2 fw-medium rounded-3 text-center"
                          >
                            <i className="fa-regular fa-eye me-1"></i>
                            {viewText}
                          </Link>

                          {activeTab === "requests" ? (
                            requestsSubTab === "received" ? (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-main px-3 py-2 fw-medium rounded-3"
                                  onClick={() => handleAcceptRequest(targetId)}
                                  disabled={loadingId === targetId}
                                  title="Accept Connection Request"
                                >
                                  {loadingId === targetId ? "..." : (
                                    <>
                                      <i className="fa-solid fa-check me-1"></i>Accept
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger px-3 py-2 fw-medium rounded-3"
                                  onClick={() => handleRejectRequest(targetId)}
                                  disabled={loadingId === targetId}
                                  title="Reject Request"
                                >
                                  <i className="fa-solid fa-xmark"></i>
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger px-3 py-2 fw-medium rounded-3"
                                onClick={() => handleCancelSentRequest(targetId)}
                                disabled={loadingId === targetId}
                                title="Cancel Sent Request"
                              >
                                {loadingId === targetId ? "..." : (
                                  <>
                                    <i className="fa-solid fa-xmark me-1"></i>Cancel Request
                                  </>
                                )}
                              </button>
                            )
                          ) : (
                            <>
                              {chatUserId && (
                                <Link
                                  href={`/candidate-messages?userId=${chatUserId}`}
                                  className="btn btn-sm btn-outline-main px-3 py-2 fw-medium rounded-3 text-center"
                                  title="Send Message"
                                >
                                  <i className="fa-regular fa-comment-dots me-1"></i>Message
                                </Link>
                              )}

                              {activeTab === "followers" ? (
                                alreadyFollowing ? (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger px-3 py-2 fw-medium rounded-3"
                                    onClick={() => handleUnfollow(targetId)}
                                    disabled={loadingId === targetId}
                                    title="Click to Disconnect"
                                  >
                                    {loadingId === targetId ? "..." : (
                                      <>
                                        <i className="fa-solid fa-user-minus me-1"></i>Disconnect
                                      </>
                                    )}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-main px-3 py-2 fw-medium rounded-3"
                                    onClick={() => handleFollow(targetId, item)}
                                    disabled={loadingId === targetId}
                                    title="Send Connection Request"
                                  >
                                    {loadingId === targetId ? "..." : (
                                      <>
                                        <i className="fa-solid fa-user-plus me-1"></i>Connect Back
                                      </>
                                    )}
                                  </button>
                                )
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger px-3 py-2 fw-medium rounded-3"
                                  onClick={() => handleUnfollow(targetId)}
                                  disabled={loadingId === targetId}
                                  title="Disconnect"
                                >
                                  {loadingId === targetId ? "..." : (
                                    <>
                                      <i className="fa-solid fa-user-minus me-1"></i>Disconnect
                                    </>
                                  )}
                                </button>
                              )}
                            </>
                          )}
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

      <UploadResumeModal />
    </>
  );
}
