"use client";

import { useEffect, useState } from "react";
import PublicNavbar from "@/components/PublicNavbar";
import Footer2 from "@/components/Footer2";
import LoginModal from "@/components/LoginModal";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

interface Package {
  id: string;
  audience: string;
  name: string;
  priceInPaisa: number;
  featuresJson: string[];
  isActive: boolean;
}

function formatPrice(paisa: number) {
  return `₹${(paisa / 100).toLocaleString("en-IN")}`;
}

function PlanCard({ pkg, featured, ctaHref, ctaLabel }: { pkg: Package; featured: boolean; ctaHref: string; ctaLabel: string }) {
  return (
    <div className="col-lg-4 col-md-6 col-sm-12">
      <div className={`pricing-table-box h-100 ${featured ? "border border-main shadow-sm" : "border"}`} style={{ borderRadius: 12, padding: "2rem", position: "relative" }}>
        {featured && (
          <span className="badge bg-main position-absolute" style={{ top: -12, right: 24 }}>
            Most Popular
          </span>
        )}
        <h4 className="mb-1">{pkg.name}</h4>
        <h2 className="mb-3">
          {formatPrice(pkg.priceInPaisa)}
          <span className="fs-6 text-muted">/mo</span>
        </h2>
        <ul className="list-unstyled mb-4">
          {pkg.featuresJson.map((feature) => (
            <li key={feature} className="mb-2">
              <i className="fa-solid fa-circle-check text-main me-2"></i>
              {feature}
            </li>
          ))}
        </ul>
        <a href={ctaHref} className={`btn w-100 ${featured ? "btn-main" : "btn-outline-main"}`}>
          {ctaLabel}
        </a>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const { user } = useAuth();
  const [candidatePlans, setCandidatePlans] = useState<Package[]>([]);
  const [employerPlans, setEmployerPlans] = useState<Package[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [candidates, employers] = await Promise.all([
          api.get<Package[]>("/packages?audience=CANDIDATE", { auth: false }),
          api.get<Package[]>("/packages?audience=EMPLOYER", { auth: false }),
        ]);
        setCandidatePlans(candidates);
        setEmployerPlans(employers);
      } catch {
        // real pricing failed to load — sections will just render empty
      }
    })();
  }, []);

  const candidateCta = user?.role === "CANDIDATE" ? "/candidate-dashboard" : "/signup?role=CANDIDATE";
  const employerCta = user?.role === "EMPLOYER" ? "/employer-package" : "/signup?role=EMPLOYER";

  return (
    <>
      <PublicNavbar />

      <div className="page-title bg-main" style={{ background: "url(/assets/img/bg2.png) no-repeat" }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-12 col-md-12">
              <h2 className="ipt-title">Pricing</h2>
              <div className="breadcrumbs light">
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item"><a href="/">Home</a></li>
                    <li className="breadcrumb-item active" aria-current="page">Pricing</li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="py-5">
        <div className="container">
          <div className="row justify-content-center mb-4">
            <div className="col-xl-6 col-lg-8 text-center">
              <div className="sec-heading center">
                <h2>For Candidates</h2>
                <p>Find your next role faster with the plan that fits how actively you&apos;re job hunting.</p>
              </div>
            </div>
          </div>
          <div className="row g-4 justify-content-center">
            {candidatePlans.map((pkg, i) => (
              <PlanCard
                key={pkg.id}
                pkg={pkg}
                featured={i === 1}
                ctaHref={candidateCta}
                ctaLabel={user?.role === "CANDIDATE" ? "Go to Dashboard" : "Get Started"}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-5 gray-simple">
        <div className="container">
          <div className="row justify-content-center mb-4">
            <div className="col-xl-6 col-lg-8 text-center">
              <div className="sec-heading center">
                <h2>For Employers</h2>
                <p>Post roles, reach verified candidates, and hire faster with the right plan for your hiring volume.</p>
              </div>
            </div>
          </div>
          <div className="row g-4 justify-content-center">
            {employerPlans.map((pkg, i) => (
              <PlanCard
                key={pkg.id}
                pkg={pkg}
                featured={i === 1}
                ctaHref={employerCta}
                ctaLabel={user?.role === "EMPLOYER" ? "Manage Plan" : "Get Started"}
              />
            ))}
          </div>
        </div>
      </section>

      <LoginModal />
      <Footer2 />
    </>
  );
}
