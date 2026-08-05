"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, assetUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

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

export default function CandidatesListClient({
  initialCandidates,
  initialTotal,
  initialPageSize,
  initialError,
  qs,
}: {
  initialCandidates: CandidateProfile[];
  initialTotal: number;
  initialPageSize: number;
  initialError: string | null;
  qs: string;
}) {
  const { user } = useAuth();
  
  const [candidates, setCandidates] = useState(initialCandidates);
  const [total, setTotal] = useState(initialTotal);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only re-fetch if the user is a CANDIDATE. 
    // Employers and guests can just use the initial SSR data perfectly.
    if (user?.role === "CANDIDATE") {
      setLoading(true);
      api
        .get<CandidatesResponse>(`/candidates${qs ? `?${qs}` : ""}`, { auth: true })
        .then((data) => {
          setCandidates(data.items ?? []);
          setTotal(data.total ?? 0);
          setPageSize(data.pageSize ?? 12);
          setError(null);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Failed to load candidates");
        })
        .finally(() => setLoading(false));
    } else {
      setCandidates(initialCandidates);
      setTotal(initialTotal);
      setPageSize(initialPageSize);
      setError(initialError);
    }
  }, [user, qs, initialCandidates, initialTotal, initialPageSize, initialError]);

  return (
    <>
      {error && <p className="text-danger mb-3">{error}</p>}
      {!error && candidates.length === 0 && !loading && (
        <p className="text-muted mb-3">No candidates found</p>
      )}
      {loading && <p className="text-muted mb-3">Loading candidates...</p>}
      
      {!loading && (
        <div className="row justify-content-center gx-3 gy-4">
          {candidates.map((item) => (
            <div className="col-xl-4 col-lg-6 col-md-6 col-12" key={item.id}>
              <div className="jbs-grid-usrs-block border">
                <div className="jbs-grid-usrs-thumb">
                  <div className="jbs-grid-yuo jbs-verified">
                    <Link href={`/candidate-detail/${item.id}`}>
                      <figure>
                        <img
                          src={assetUrl(item.profilePhotoUrl) || "/assets/img/avatar.jpg"}
                          className="img-fluid circle"
                          alt=""
                        />
                      </figure>
                    </Link>
                  </div>
                </div>
                <div className="jbs-grid-usrs-caption">
                  <div className="jbs-tiosk">
                    <h4 className="jbs-tiosk-title">
                      <Link href={`/candidate-detail/${item.id}`}>{item.fullName}</Link>
                    </h4>
                    <div className="jbs-tiosk-subtitle">
                      <span>{item.headline ?? "—"}</span>
                    </div>
                  </div>
                </div>
                <div className="jbs-grid-usrs-info">
                  <div className="jbs-info-ico-style bold">
                    <div className="jbs-single-y1 style-2">
                      <span>
                        <i className="fa-solid fa-location-dot"></i>
                      </span>
                      {item.location ?? "—"}
                    </div>
                    <div className="jbs-single-y1 style-3">
                      <span>
                        <i className="fa-solid fa-coins"></i>
                      </span>
                      {item.experienceYears != null ? `${item.experienceYears} Years exp.` : "—"}
                    </div>
                  </div>
                </div>
                <div className="jbs-grid-usrs-contact">
                  <div className="jbs-btn-groups">
                    <a href="#" className="btn btn-md btn-gray px-4">
                      Message
                    </a>
                    <Link href={`/candidate-detail/${item.id}`} className="btn btn-md btn-main px-4">
                      View Detail
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
