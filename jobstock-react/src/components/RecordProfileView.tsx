"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

/** Silently logs an employer opening this candidate's profile — powers "who viewed your profile". */
export default function RecordProfileView({ candidateId }: { candidateId: string }) {
  const { user } = useAuth();
  const logged = useRef(false);

  useEffect(() => {
    if (logged.current || !user || user.role !== "EMPLOYER") return;
    logged.current = true;
    api.post(`/candidates/${candidateId}/view`).catch(() => {});
  }, [user, candidateId]);

  return null;
}
