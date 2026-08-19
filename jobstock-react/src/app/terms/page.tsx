import Navbar5 from "@/components/Navbar5";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";



async function fetchTermsDoc() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
    const res = await fetch(`${apiUrl}/legal/terms-of-service`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch terms of service:", err);
    return null;
  }
}

export default async function TermsPage() {
  const doc = await fetchTermsDoc();

  let dynamicSections: { title: string; body: string[] }[] = [];
  let metadata: { version?: number; updatedAt?: string; effectiveDateLastUpdated?: string } = {};

  if (doc && doc.body) {
    try {
      const parsed = JSON.parse(doc.body);
      if (parsed && typeof parsed === "object") {
        const fieldMappings = [
          { key: "introduction", label: "Introduction" },
          { key: "acceptanceOfTerms", label: "Acceptance of Terms" },
          { key: "eligibility", label: "Eligibility" },
          { key: "userAccountRegistration", label: "User Account & Registration" },
          { key: "candidateResponsibilities", label: "Candidate Responsibilities" },
          { key: "employerResponsibilities", label: "Employer Responsibilities" },
          { key: "jobListingsJobApplications", label: "Job Listings & Job Applications" },
          { key: "skillCodingAssessments", label: "Skill & Coding Assessments" },
          { key: "aiPoweredFeatures", label: "AI-Powered Features" },
          { key: "prohibitedActivities", label: "Prohibited Activities" },
          { key: "accountSuspensionTermination", label: "Account Suspension & Termination" },
          { key: "intellectualPropertyRights", label: "Intellectual Property Rights" },
          { key: "disclaimerLimitationLiability", label: "Disclaimer & Limitation of Liability" },
          { key: "privacyDataProtection", label: "Privacy & Data Protection" },
          { key: "governingLawDisputeResolution", label: "Governing Law & Dispute Resolution" },
          { key: "changesToTerms", label: "Changes to Terms" },
          { key: "contactInformation", label: "Contact Information" },
        ];

        dynamicSections = fieldMappings
          .map((m) => ({
            title: m.label,
            body: (parsed[m.key] || "")
              .split("\n")
              .map((p: string) => p.trim())
              .filter((p: string) => p.length > 0),
          }))
          .filter((s) => s.body.length > 0);

        metadata = {
          version: doc.version,
          updatedAt: doc.updatedAt,
          effectiveDateLastUpdated: parsed.effectiveDateLastUpdated,
        };
      }
    } catch {
      // Fallback if not stringified JSON (e.g. legacy plain text)
      dynamicSections = [
        {
          title: "Introduction",
          body: doc.body.split("\n").map((p: string) => p.trim()).filter((p: string) => p.length > 0),
        },
      ];
    }
  }

  const hasDoc = !!doc;

  return (
    <>
      <Navbar5 />

      {/* Page Title Start */}
      <section className="bg-cover bg-second" style={{ background: "url(/assets/img/bg2.png)no-repeat" }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-12 col-md-12">
              <h2 className="ipt-title text-light">{doc?.title ?? "Terms of Service"}</h2>
              {(metadata.effectiveDateLastUpdated || metadata.version) && (
                <span className="ipn-subtitle text-light opacity-75">
                  {metadata.effectiveDateLastUpdated ? `Last Updated: ${metadata.effectiveDateLastUpdated}` : ""}
                  {metadata.effectiveDateLastUpdated && metadata.version ? " | " : ""}
                  {metadata.version ? `Version v${metadata.version}` : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>
      {/* Page Title End */}

      {/* Terms Sections */}
      <section className="gray-simple">
        <div className="container">
          <div className="row">
            <div className="col-lg-12 col-md-12">
              {!hasDoc ? (
                <div className="text-center py-5">
                  <i className="fa-solid fa-scale-balanced fs-1 text-muted mb-3"></i>
                  <h4 className="fw-medium text-dark">Terms of Service Not Published</h4>
                  <p className="text-muted">The Terms of Service have not been configured yet.</p>
                </div>
              ) : dynamicSections.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fa-solid fa-circle-info fs-1 text-muted mb-3"></i>
                  <h4 className="fw-medium text-dark">No Content Available</h4>
                  <p className="text-muted">No sections have been populated in the Terms of Service yet.</p>
                </div>
              ) : (
                <div className="box-block-wrap-group">
                  {dynamicSections.map((section) => (
                    <div className="box-block-wrap" key={section.title}>
                      <div className="box-block-wrap_header">
                        <h4 className="box-block-wrap_title">{section.title}</h4>
                      </div>

                      <div className="box-block-wrap-body">
                        {section.body.map((para, i) => (
                          <p key={i}>{para}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      {/* Terms Sections End */}

      <LoginModal />
      <Footer />
    </>
  );
}
