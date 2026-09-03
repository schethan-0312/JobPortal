"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl } from "@/lib/api";
import { toast, Toaster } from "react-hot-toast";

interface CandidateProfile {
  id: string;
  fullName: string;
  headline?: string;
  location?: string;
  skills?: string[];
  experienceYears?: number;
  resumeUrl?: string | null;
  resume?: {
    resumeUrl: string | null;
  } | null;
  profilePhotoUrl?: string | null;
  isVerified?: boolean;
  githubUsername?: string | null;
  githubProfileUrl?: string | null;
  linkedinProfileUrl?: string | null;
}

interface FollowHeaderProps {
  candidate: CandidateProfile;
  initialCounts: { followersCount: number; followingCount: number };
}

export default function CandidateFollowHeader({ candidate, initialCounts }: FollowHeaderProps) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isIncomingPending, setIsIncomingPending] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [followersCount, setFollowersCount] = useState(initialCounts.followersCount);
  const [followingCount, setFollowingCount] = useState(initialCounts.followingCount);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setIsSaved(localStorage.getItem(`saved_cand_${candidate.id}`) === 'true');
  }, [candidate.id]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await api.get<{
          following: boolean;
          isPending?: boolean;
          isIncomingPending?: boolean;
          isConnected?: boolean;
        }>(`/follow/status/${candidate.id}`);
        setFollowing(Boolean(res.following));
        setIsPending(Boolean(res.isPending));
        setIsIncomingPending(Boolean(res.isIncomingPending));
      } catch {
        // non-critical
      }
    })();
  }, [user, candidate.id]);

  async function toggleFollow() {
    if (!user) {
      toast.error("Please log in to follow or connect with this candidate.");
      return;
    }
    setFollowBusy(true);

    try {
      if (following || isPending) {
        // Unfollow or Cancel pending request
        await api.delete(`/follow/${candidate.id}`);
        if (isPending) {
          setIsPending(false);
          toast.success("Follow request cancelled.");
        } else {
          setFollowing(false);
          setFollowersCount((prev) => Math.max(0, prev - 1));
          toast.success("Unfollowed candidate.");
        }
      } else {
        // Send follow request or follow directly
        const res = await api.post<{ isPending?: boolean; message?: string }>(`/follow/${candidate.id}`, {});
        if (res?.isPending) {
          setIsPending(true);
          toast.success("Follow request sent! An email notification has been sent to the candidate.");
        } else {
          setFollowing(true);
          setFollowersCount((prev) => prev + 1);
          toast.success("Followed successfully!");
        }
      }

      // Refresh follow counts from server
      const counts = await api.get<{ followersCount: number; followingCount: number }>(
        `/follow/counts/${candidate.id}`,
        { auth: false }
      );
      setFollowersCount(counts.followersCount);
      setFollowingCount(counts.followingCount);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update follow status");
    } finally {
      setFollowBusy(false);
    }
  }

  function toggleSave() {
    const nextState = !isSaved;
    setIsSaved(nextState);
    if (nextState) {
      localStorage.setItem(`saved_cand_${candidate.id}`, 'true');
      toast.success("Candidate saved successfully!");
    } else {
      localStorage.removeItem(`saved_cand_${candidate.id}`);
      toast.success("Candidate removed from saved list.");
    }
  }

  async function acceptIncoming() {
    setFollowBusy(true);
    try {
      await api.post(`/follow/requests/${candidate.id}/accept`, {});
      setIsIncomingPending(false);
      setFollowing(true);
      toast.success("Connection request accepted! You are now connected.");
      const counts = await api.get<{ followersCount: number; followingCount: number }>(
        `/follow/counts/${candidate.id}`,
        { auth: false }
      );
      setFollowersCount(counts.followersCount);
      setFollowingCount(counts.followingCount);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to accept connection request");
    } finally {
      setFollowBusy(false);
    }
  }

  async function rejectIncoming() {
    setFollowBusy(true);
    try {
      await api.post(`/follow/requests/${candidate.id}/reject`, {});
      setIsIncomingPending(false);
      toast.success("Connection request declined.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to decline connection request");
    } finally {
      setFollowBusy(false);
    }
  }

  return (
    <div className="cndt-head-block">
      <Toaster position="top-center" />
      <div className="cndt-head-left">
        <div className="cndt-head-thumb">
          <figure style={{ overflow: "hidden", borderRadius: "50%", background: "#f8fafc" }}>
            {candidate.profilePhotoUrl ? (
              <img
                src={assetUrl(candidate.profilePhotoUrl)}
                className="img-fluid circle"
                alt={candidate.fullName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div
                className="d-flex align-items-center justify-content-center w-100 h-100 text-secondary"
                style={{
                  backgroundColor: "#e2e8f0",
                  color: "#64748b",
                  minHeight: "100px",
                  minWidth: "100px",
                  borderRadius: "50%",
                }}
              >
                <i className="fa-solid fa-user fa-3x text-secondary opacity-75"></i>
              </div>
            )}
          </figure>
        </div>
        <div className="cndt-head-caption">
          <div className="cndt-head-caption-top">
            <div className="cndt-yior-2">
              <h4 className="cndt-title">
                {candidate.fullName}
                {candidate.isVerified && (
                  <span className="badge bg-success-subtle text-success border border-success ms-2" title="Passed a proctored skill assessment">
                    <i className="fa-solid fa-shield-check me-1"></i>Verified
                  </span>
                )}
              </h4>
            </div>
            <div className="cndt-yior-3">
              <span>
                <i className="fa-solid fa-user-graduate me-1"></i>
                {candidate.headline ?? "—"}
              </span>
              <span>
                <i className="fa-solid fa-location-dot me-1"></i>
                {candidate.location ?? "—"}
              </span>
              <span>
                <i className="fa-solid fa-briefcase me-1"></i>
                {candidate.experienceYears != null ? `${candidate.experienceYears} Years exp.` : "—"}
              </span>
              <span>
                <i className="fa-solid fa-users me-1"></i>
                {followersCount} Followers
              </span>
              <span>
                <i className="fa-solid fa-user-plus me-1"></i>
                {followingCount} Following
              </span>
              {candidate.githubUsername && (
                <span>
                  <a href={candidate.githubProfileUrl ?? undefined} target="_blank" rel="noreferrer">
                    <i className="fa-brands fa-github me-1"></i>
                    {candidate.githubUsername}
                  </a>
                </span>
              )}
              {candidate.linkedinProfileUrl && (
                <span>
                  <a href={candidate.linkedinProfileUrl} target="_blank" rel="noreferrer">
                    <i className="fa-brands fa-linkedin me-1"></i>
                    LinkedIn
                  </a>
                </span>
              )}
            </div>
          </div>
          <div className="cndt-head-caption-bottom">
            <div className="cndt-yior-skills">
              {(candidate.skills ?? []).length === 0 && <span>No skills listed</span>}
              {(candidate.skills ?? []).map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="cndt-head-right d-flex gap-2 align-items-center flex-wrap">
        {user?.role !== "EMPLOYER" && (
          <>
            {isIncomingPending ? (
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-success"
                  disabled={followBusy}
                  onClick={acceptIncoming}
                >
                  <i className="fa-solid fa-check me-1"></i> Accept
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  disabled={followBusy}
                  onClick={rejectIncoming}
                >
                  <i className="fa-solid fa-xmark me-1"></i> Decline
                </button>
              </div>
            ) : isPending ? (
              <button
                type="button"
                className="btn btn-outline-warning d-flex align-items-center gap-1"
                disabled={followBusy}
                onClick={toggleFollow}
                title="Click to cancel follow request"
              >
                {followBusy ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Cancelling...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-clock-rotate-left text-warning"></i> Requested (Cancel)
                  </>
                )}
              </button>
            ) : following ? (
              <button
                type="button"
                className="btn btn-outline-main d-flex align-items-center gap-1"
                disabled={followBusy}
                onClick={toggleFollow}
              >
                {followBusy ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Updating...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-user-check"></i> Following
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-main d-flex align-items-center gap-1"
                disabled={followBusy}
                onClick={toggleFollow}
              >
                {followBusy ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Sending...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-user-plus"></i> Follow
                  </>
                )}
              </button>
            )}
          </>
        )}
        {(candidate.resume?.resumeUrl || candidate.resumeUrl) ? (
          <a href={assetUrl(candidate.resume?.resumeUrl || candidate.resumeUrl || "")} target="_blank" rel="noreferrer" className="btn btn-main">
            Download CV
            <i className="fa-solid fa-download ms-2"></i>
          </a>
        ) : (
          <button type="button" className="btn btn-secondary" disabled>
            No Resume
          </button>
        )}
        <button 
          type="button" 
          className={`btn ${isSaved ? "btn-main" : "btn-outline-main"}`} 
          title={isSaved ? "Unsave Candidate" : "Save Candidate"}
          onClick={toggleSave}
        >
          <i className="fa-solid fa-bookmark"></i>
        </button>
      </div>
    </div>
  );
}
