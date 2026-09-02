"use client";

import Navbar5 from "@/components/Navbar5";
import Navbar7 from "@/components/Navbar7";
import Navbar8 from "@/components/Navbar8";
import { useAuth } from "@/lib/auth-context";

export default function CandidatesNavbar() {
  const { user } = useAuth();

  if (user?.role === "CANDIDATE") {
    return <Navbar7 />;
  }
  if (user?.role === "EMPLOYER") {
    return <Navbar8 />;
  }
  return <Navbar5 />;
}
