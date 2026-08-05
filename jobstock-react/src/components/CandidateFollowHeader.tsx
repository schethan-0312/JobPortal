"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl } from "@/lib/api";

interface CandidateProfile {
  id: string;
  fullName: string;
  headline?: string;
  location?: string;
  skills?: string[];
  experienceYears?: number;
  resumeUrl?: string | null;
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
  const [followBusy, setFollowBusy] = useState(false);
  const [followersCount, setFollowersCount] = useState(initialCounts.followersCount);
  const [followingCount, setFollowingCount] = useState(initialCounts.followingCount);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await api.get<{ following: boolean }>(`/follow/status/${candidate.id}`);
        setFollowing(res.following);
      } catch {
        // non-critical
      }
    })();
  }, [user, candidate.id]);

  async function toggleFollow() {
    if (!user) {
      alert("Please log in to follow this candidate.");
      return;
    }
    setFollowBusy(true);
    const previousFollowing = following;
    const previousCount = followersCount;

    // Optimistic UI updates
    setFollowing(!previousFollowing);
    setFollowersCount(previousFollowing ? previousCount - 1 : previousCount + 1);

    try {
      if (previousFollowing) {
        await api.delete(`/follow/${candidate.id}`);
      } else {
        await api.post(`/follow/${candidate.id}`);
      }

      // Fetch fresh counts from backend
      const counts = await api.get<{ followersCount: number; followingCount: number }>(`/follow/counts/${candidate.id}`, { auth: false });
      setFollowersCount(counts.followersCount);
      setFollowingCount(counts.followingCount);
    } catch (err) {
      // Revert on error
      setFollowing(previousFollowing);
      setFollowersCount(previousCount);
      alert(err instanceof ApiError ? err.message : "Failed to toggle follow status");
    } finally {
      setFollowBusy(false);
    }
  }

  return (
    <div className="cndt-head-block">
      <div className="cndt-head-left">
        <div className="cndt-head-thumb">
          <figure>
            <img
              src={assetUrl(candidate.profilePhotoUrl) || "/assets/img/avatar.jpg"}
              className="img-fluid circle"
              alt=""
            />
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
      <div className="cndt-head-right d-flex gap-2 align-items-center">
        <button
          type="button"
          className={`btn ${following ? "btn-outline-main" : "btn-main"}`}
          disabled={followBusy}
          onClick={toggleFollow}
        >
          {following ? "Unfollow" : "Follow"}
        </button>
        {candidate.resumeUrl ? (
          <a href={candidate.resumeUrl} target="_blank" rel="noreferrer" className="btn btn-main">
            Download CV
            <i className="fa-solid fa-download ms-2"></i>
          </a>
        ) : (
          <button type="button" className="btn btn-main" disabled>
            No Resume
          </button>
        )}
        <button type="button" className="btn btn-outline-main">
          <i className="fa-solid fa-bookmark"></i>
        </button>
      </div>
    </div>
  );
}
