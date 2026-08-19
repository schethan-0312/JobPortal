import Navbar5 from "@/components/Navbar5";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";

const sections = [
  {
    title: "Introduction",
    body: [
      "This Privacy Policy explains what information JobStock collects, how we use it, and the choices you have. By creating an account or using JobStock, you agree to the practices described here.",
    ],
  },
  {
    title: "Information We Collect",
    body: [
      "Account details you provide directly: name, email, password, and role (candidate or employer).",
      "Profile information: headline, skills, experience, location, phone number, resume, and profile photo for candidates; company name, description, website, and logo for employers.",
      "Content you create: job postings, applications, cover notes, messages between users, and skill assessment or mock interview responses.",
    ],
  },
  {
    title: "Employer Account Information",
    body: [
      "Employers must complete a verification process before posting jobs. We review the company details submitted at signup to confirm legitimacy and reduce fake job postings on the platform.",
    ],
  },
  {
    title: "Candidate Information",
    body: [
      "Candidate profile data (skills, experience, headline, and location) is used to power job matching, AI resume feedback, and search visibility to employers. Your phone number is never shown publicly — employers can only reach you through JobStock's in-app messaging.",
    ],
  },
  {
    title: "AI Feature Data Usage",
    body: [
      "Features like the Resume Health Scanner, AI Resume Builder, Career Path Navigator, Mock Interviews, and the Career Assistant chatbot send the text you provide (resume content, background notes, chat messages) to our AI provider to generate a response. This content is used only to produce that response and is not used to train third-party models.",
    ],
  },
  {
    title: "Payments",
    body: [
      "Payments for premium plans are processed by Razorpay. JobStock does not store your card, UPI, or bank details — we only store the confirmation and status of a completed transaction.",
    ],
  },
  {
    title: "Cookies & Local Storage",
    body: [
      "JobStock uses your browser's local storage to keep you signed in between visits. We do not use third-party advertising or tracking cookies.",
    ],
  },
  {
    title: "Your Choices",
    body: [
      "You can update or remove most profile information at any time from your dashboard. You can also permanently delete your account from the Delete Account page in your dashboard settings.",
    ],
  },
];

async function fetchPrivacyDoc() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
    const res = await fetch(`${apiUrl}/legal/privacy-policy`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch privacy policy:", err);
    return null;
  }
}

export default async function PrivacyPage() {
  const doc = await fetchPrivacyDoc();

  let dynamicSections: { title: string; body: string[] }[] = [];
  let metadata: { version?: number; updatedAt?: string; privacyPolicyVersion?: string; lastUpdatedDate?: string } = {};

  if (doc && doc.body) {
    try {
      const parsed = JSON.parse(doc.body);
      if (parsed && typeof parsed === "object") {
        const fieldMappings = [
          { key: "introduction", label: "Introduction" },
          { key: "informationWeCollect", label: "Information We Collect" },
          { key: "candidateInformation", label: "Candidate Information" },
          { key: "employerInformation", label: "Employer Information" },
          { key: "accountInformation", label: "Account Information" },
          { key: "resumeProfileData", label: "Resume & Profile Data" },
          { key: "jobApplications", label: "Job Applications" },
          { key: "assessmentData", label: "Assessment Data" },
          { key: "aiPoweredFeatures", label: "AI-Powered Features" },
          { key: "howWeUsePersonalData", label: "How We Use Personal Data" },
          { key: "informationSharing", label: "Information Sharing" },
          { key: "cookiesTracking", label: "Cookies & Tracking" },
          { key: "dataStorage", label: "Data Storage" },
          { key: "dataSecurity", label: "Data Security" },
          { key: "dataRetention", label: "Data Retention" },
          { key: "userPrivacyRights", label: "User Privacy Rights" },
          { key: "consentManagement", label: "Consent Management" },
          { key: "accountDataDeletion", label: "Account & Data Deletion" },
          { key: "thirdPartyServices", label: "Third-Party Services" },
          { key: "thirdPartyLinks", label: "Third-Party Links" },
          { key: "childrensPrivacy", label: "Children’s Privacy" },
          { key: "dataBreachSecurityIncidents", label: "Data Breach & Security Incidents" },
          { key: "changesToPrivacyPolicy", label: "Changes to Privacy Policy" },
          { key: "contactInformation", label: "Contact Information" },
          { key: "grievanceRedressal", label: "Grievance Redressal" },
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
          privacyPolicyVersion: parsed.privacyPolicyVersion,
          lastUpdatedDate: parsed.lastUpdatedDate,
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

  const finalSections = dynamicSections.length > 0 ? dynamicSections : sections;

  return (
    <>
      <Navbar5 />

      {/* Page Title Start */}
      <section className="bg-cover bg-second" style={{ background: "url(/assets/img/bg2.png)no-repeat" }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-12 col-md-12">
              <h2 className="ipt-title text-light">{doc?.title ?? "Privacy Policy"}</h2>
              <span className="ipn-subtitle text-light opacity-75">
                {metadata.privacyPolicyVersion ? `Version ${metadata.privacyPolicyVersion}` : "Check our Privacy and Policies"}
                {metadata.lastUpdatedDate ? ` | Last Updated: ${metadata.lastUpdatedDate}` : ""}
              </span>
            </div>
          </div>
        </div>
      </section>
      {/* Page Title End */}

      {/* Policy Sections */}
      <section className="gray-simple">
        <div className="container">
          <div className="row">
            <div className="col-lg-12 col-md-12">
              <div className="box-block-wrap-group">
                {finalSections.map((section) => (
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
            </div>
          </div>
        </div>
      </section>
      {/* Policy Sections End */}

      <LoginModal />
      <Footer />
    </>
  );
}
