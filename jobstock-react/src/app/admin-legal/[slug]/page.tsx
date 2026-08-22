"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

interface LegalDocDetail {
  slug: string;
  title: string;
  body: string;
  version: number;
  updatedAt: string;
}

interface Revision {
  id: string;
  version: number;
  title: string;
  updatedById: string | null;
  createdAt: string;
}

const PRIVACY_FIELDS_META = [
  { key: "introduction", label: "Introduction", type: "textarea" },
  { key: "informationWeCollect", label: "Information We Collect", type: "textarea" },
  { key: "candidateInformation", label: "Candidate Information", type: "textarea" },
  { key: "employerInformation", label: "Employer Information", type: "textarea" },
  { key: "accountInformation", label: "Account Information", type: "textarea" },
  { key: "resumeProfileData", label: "Resume & Profile Data", type: "textarea" },
  { key: "jobApplications", label: "Job Applications", type: "textarea" },
  { key: "assessmentData", label: "Assessment Data", type: "textarea" },
  { key: "aiPoweredFeatures", label: "AI-Powered Features", type: "textarea" },
  { key: "howWeUsePersonalData", label: "How We Use Personal Data", type: "textarea" },
  { key: "informationSharing", label: "Information Sharing", type: "textarea" },
  { key: "cookiesTracking", label: "Cookies & Tracking", type: "textarea" },
  { key: "dataStorage", label: "Data Storage", type: "textarea" },
  { key: "dataSecurity", label: "Data Security", type: "textarea" },
  { key: "dataRetention", label: "Data Retention", type: "textarea" },
  { key: "userPrivacyRights", label: "User Privacy Rights", type: "textarea" },
  { key: "consentManagement", label: "Consent Management", type: "textarea" },
  { key: "accountDataDeletion", label: "Account & Data Deletion", type: "textarea" },
  { key: "thirdPartyServices", label: "Third-Party Services", type: "textarea" },
  { key: "thirdPartyLinks", label: "Third-Party Links", type: "textarea" },
  { key: "childrensPrivacy", label: "Children’s Privacy", type: "textarea" },
  { key: "dataBreachSecurityIncidents", label: "Data Breach & Security Incidents", type: "textarea" },
  { key: "changesToPrivacyPolicy", label: "Changes to Privacy Policy", type: "textarea" },
  { key: "contactInformation", label: "Contact Information", type: "textarea" },
  { key: "grievanceRedressal", label: "Grievance Redressal", type: "textarea" },
  { key: "privacyPolicyVersion", label: "Privacy Policy Version", type: "text" },
  { key: "lastUpdatedDate", label: "Last Updated Date", type: "text" },
];

const TERMS_FIELDS_META = [
  { key: "introduction", label: "Introduction", type: "textarea" },
  { key: "acceptanceOfTerms", label: "Acceptance of Terms", type: "textarea" },
  { key: "eligibility", label: "Eligibility", type: "textarea" },
  { key: "userAccountRegistration", label: "User Account & Registration", type: "textarea" },
  { key: "candidateResponsibilities", label: "Candidate Responsibilities", type: "textarea" },
  { key: "employerResponsibilities", label: "Employer Responsibilities", type: "textarea" },
  { key: "jobListingsJobApplications", label: "Job Listings & Job Applications", type: "textarea" },
  { key: "skillCodingAssessments", label: "Skill & Coding Assessments", type: "textarea" },
  { key: "aiPoweredFeatures", label: "AI-Powered Features", type: "textarea" },
  { key: "prohibitedActivities", label: "Prohibited Activities", type: "textarea" },
  { key: "accountSuspensionTermination", label: "Account Suspension & Termination", type: "textarea" },
  { key: "intellectualPropertyRights", label: "Intellectual Property Rights", type: "textarea" },
  { key: "disclaimerLimitationLiability", label: "Disclaimer & Limitation of Liability", type: "textarea" },
  { key: "privacyDataProtection", label: "Privacy & Data Protection", type: "textarea" },
  { key: "governingLawDisputeResolution", label: "Governing Law & Dispute Resolution", type: "textarea" },
  { key: "changesToTerms", label: "Changes to Terms", type: "textarea" },
  { key: "contactInformation", label: "Contact Information", type: "textarea" },
  { key: "effectiveDateLastUpdated", label: "Effective Date / Last Updated", type: "text" },
];

const COOKIE_FIELDS_META = [
  { key: "introduction", label: "Introduction", type: "textarea" },
  { key: "whatAreCookies", label: "What Are Cookies?", type: "textarea" },
  { key: "typesOfCookiesWeUse", label: "Types of Cookies We Use", type: "textarea" },
  { key: "essentialStrictlyNecessaryCookies", label: "Essential/Strictly Necessary Cookies", type: "textarea" },
  { key: "functionalCookies", label: "Functional Cookies", type: "textarea" },
  { key: "analyticsPerformanceCookies", label: "Analytics/Performance Cookies", type: "textarea" },
  { key: "advertisingMarketingCookies", label: "Advertising/Marketing Cookies, if applicable", type: "textarea" },
  { key: "purposeOfCookies", label: "Purpose of Cookies", type: "textarea" },
  { key: "cookiesUsedOnOurWebsite", label: "Cookies Used on Our Website", type: "textarea" },
  { key: "thirdPartyCookies", label: "Third-Party Cookies", type: "textarea" },
  { key: "sessionAuthenticationCookies", label: "Session & Authentication Cookies", type: "textarea" },
  { key: "cookieManagementPreferences", label: "Cookie Management / Cookie Preferences", type: "textarea" },
  { key: "changesToCookiePolicy", label: "Changes to Cookie Policy", type: "textarea" },
  { key: "contactInformation", label: "Contact Information", type: "textarea" },
  { key: "cookiePolicyVersion", label: "Cookie Policy Version", type: "text" },
  { key: "effectiveDateLastUpdated", label: "Effective Date / Last Updated", type: "text" },
];

export default function AdminLegalEditPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [doc, setDoc] = useState<LegalDocDetail | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [policyFields, setPolicyFields] = useState<Record<string, string>>({
    introduction: "",
    informationWeCollect: "",
    candidateInformation: "",
    employerInformation: "",
    accountInformation: "",
    resumeProfileData: "",
    jobApplications: "",
    assessmentData: "",
    aiPoweredFeatures: "",
    howWeUsePersonalData: "",
    informationSharing: "",
    cookiesTracking: "",
    dataStorage: "",
    dataSecurity: "",
    dataRetention: "",
    userPrivacyRights: "",
    consentManagement: "",
    accountDataDeletion: "",
    thirdPartyServices: "",
    thirdPartyLinks: "",
    childrensPrivacy: "",
    dataBreachSecurityIncidents: "",
    changesToPrivacyPolicy: "",
    contactInformation: "",
    grievanceRedressal: "",
    privacyPolicyVersion: "",
    lastUpdatedDate: "",
  });
  const [termsFields, setTermsFields] = useState<Record<string, string>>({
    introduction: "",
    acceptanceOfTerms: "",
    eligibility: "",
    userAccountRegistration: "",
    candidateResponsibilities: "",
    employerResponsibilities: "",
    jobListingsJobApplications: "",
    skillCodingAssessments: "",
    aiPoweredFeatures: "",
    prohibitedActivities: "",
    accountSuspensionTermination: "",
    intellectualPropertyRights: "",
    disclaimerLimitationLiability: "",
    privacyDataProtection: "",
    governingLawDisputeResolution: "",
    changesToTerms: "",
    contactInformation: "",
    effectiveDateLastUpdated: "",
  });
  const [cookieFields, setCookieFields] = useState<Record<string, string>>({
    introduction: "",
    whatAreCookies: "",
    typesOfCookiesWeUse: "",
    essentialStrictlyNecessaryCookies: "",
    functionalCookies: "",
    analyticsPerformanceCookies: "",
    advertisingMarketingCookies: "",
    purposeOfCookies: "",
    cookiesUsedOnOurWebsite: "",
    thirdPartyCookies: "",
    sessionAuthenticationCookies: "",
    cookieManagementPreferences: "",
    changesToCookiePolicy: "",
    contactInformation: "",
    cookiePolicyVersion: "",
    effectiveDateLastUpdated: "",
  });
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  function validatePrivacyFields(): boolean {
    const errs: Record<string, string> = {};

    // Title validation
    if (!title.trim()) {
      errs.title = "Title is required.";
    } else if (title.length < 2) {
      errs.title = "Title must be at least 2 characters.";
    } else if (title.length > 200) {
      errs.title = "Title cannot exceed 200 characters.";
    }

    PRIVACY_FIELDS_META.forEach((f) => {
      const value = policyFields[f.key] || "";
      if (f.key === "privacyPolicyVersion") {
        if (!value.trim()) {
          errs[f.key] = "Privacy Policy Version is required.";
        } else if (value.length > 20) {
          errs[f.key] = "Version cannot exceed 20 characters.";
        } else if (!/^v?\d+(\.\d+)*$/.test(value.trim())) {
          errs[f.key] = "Version must be in a valid format (e.g. 1.0.0 or v2.1).";
        }
      } else if (f.key === "lastUpdatedDate") {
        if (!value.trim()) {
          errs[f.key] = "Last Updated Date is required.";
        } else if (value.length > 50) {
          errs[f.key] = "Last Updated Date cannot exceed 50 characters.";
        }
      } else if (f.key === "contactInformation") {
        if (!value.trim()) {
          errs[f.key] = "Contact Information is required.";
        } else if (value.length > 2000) {
          errs[f.key] = "Contact Information cannot exceed 2000 characters.";
        }
      } else {
        if (!value.trim()) {
          errs[f.key] = `${f.label} is required.`;
        } else if (value.length > 10000) {
          errs[f.key] = `${f.label} cannot exceed 10,000 characters.`;
        }
      }
    });

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateTermsFields(): boolean {
    const errs: Record<string, string> = {};

    // Title validation
    if (!title.trim()) {
      errs.title = "Title is required.";
    } else if (title.length < 2) {
      errs.title = "Title must be at least 2 characters.";
    } else if (title.length > 200) {
      errs.title = "Title cannot exceed 200 characters.";
    }

    TERMS_FIELDS_META.forEach((f) => {
      const value = termsFields[f.key] || "";
      if (f.key === "effectiveDateLastUpdated") {
        if (!value.trim()) {
          errs[f.key] = "Effective Date / Last Updated is required.";
        } else if (value.length > 50) {
          errs[f.key] = "Effective Date / Last Updated cannot exceed 50 characters.";
        }
      } else if (f.key === "contactInformation") {
        if (!value.trim()) {
          errs[f.key] = "Contact Information is required.";
        } else if (value.length > 2000) {
          errs[f.key] = "Contact Information cannot exceed 2000 characters.";
        }
      } else {
        if (!value.trim()) {
          errs[f.key] = `${f.label} is required.`;
        } else if (value.length > 10000) {
          errs[f.key] = `${f.label} cannot exceed 10,000 characters.`;
        }
      }
    });

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateCookieFields(): boolean {
    const errs: Record<string, string> = {};

    // Title validation
    if (!title.trim()) {
      errs.title = "Title is required.";
    } else if (title.length < 2) {
      errs.title = "Title must be at least 2 characters.";
    } else if (title.length > 200) {
      errs.title = "Title cannot exceed 200 characters.";
    }

    COOKIE_FIELDS_META.forEach((f) => {
      const value = cookieFields[f.key] || "";
      if (f.key === "cookiePolicyVersion") {
        if (!value.trim()) {
          errs[f.key] = "Cookie Policy Version is required.";
        } else if (value.length > 20) {
          errs[f.key] = "Version cannot exceed 20 characters.";
        } else if (!/^v?\d+(\.\d+)*$/.test(value.trim())) {
          errs[f.key] = "Version must be in a valid format (e.g. 1.0.0 or v2.1).";
        }
      } else if (f.key === "effectiveDateLastUpdated") {
        if (!value.trim()) {
          errs[f.key] = "Effective Date / Last Updated is required.";
        } else if (value.length > 50) {
          errs[f.key] = "Effective Date / Last Updated cannot exceed 50 characters.";
        }
      } else if (f.key === "contactInformation") {
        if (!value.trim()) {
          errs[f.key] = "Contact Information is required.";
        } else if (value.length > 2000) {
          errs[f.key] = "Contact Information cannot exceed 2000 characters.";
        }
      } else {
        if (!value.trim()) {
          errs[f.key] = `${f.label} is required.`;
        } else if (value.length > 10000) {
          errs[f.key] = `${f.label} cannot exceed 10,000 characters.`;
        }
      }
    });

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  }

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function loadDoc() {
    setValidationErrors({});
    try {
      const res = await api.get<LegalDocDetail>(`/admin/legal/${slug}`);
      setDoc(res);
      setTitle(res.title);
      setBody(res.body);
      const rev = await api.get<Revision[]>(`/admin/legal/${slug}/revisions`);
      setRevisions(rev);

      if (slug === "privacy-policy") {
        try {
          const parsed = JSON.parse(res.body);
          if (parsed && typeof parsed === "object") {
            setPolicyFields({
              introduction: parsed.introduction || "",
              informationWeCollect: parsed.informationWeCollect || "",
              candidateInformation: parsed.candidateInformation || "",
              employerInformation: parsed.employerInformation || "",
              accountInformation: parsed.accountInformation || "",
              resumeProfileData: parsed.resumeProfileData || "",
              jobApplications: parsed.jobApplications || "",
              assessmentData: parsed.assessmentData || "",
              aiPoweredFeatures: parsed.aiPoweredFeatures || "",
              howWeUsePersonalData: parsed.howWeUsePersonalData || "",
              informationSharing: parsed.informationSharing || "",
              cookiesTracking: parsed.cookiesTracking || "",
              dataStorage: parsed.dataStorage || "",
              dataSecurity: parsed.dataSecurity || "",
              dataRetention: parsed.dataRetention || "",
              userPrivacyRights: parsed.userPrivacyRights || "",
              consentManagement: parsed.consentManagement || "",
              accountDataDeletion: parsed.accountDataDeletion || "",
              thirdPartyServices: parsed.thirdPartyServices || "",
              thirdPartyLinks: parsed.thirdPartyLinks || "",
              childrensPrivacy: parsed.childrensPrivacy || "",
              dataBreachSecurityIncidents: parsed.dataBreachSecurityIncidents || "",
              changesToPrivacyPolicy: parsed.changesToPrivacyPolicy || "",
              contactInformation: parsed.contactInformation || "",
              grievanceRedressal: parsed.grievanceRedressal || "",
              privacyPolicyVersion: parsed.privacyPolicyVersion || "",
              lastUpdatedDate: parsed.lastUpdatedDate || "",
            });
          }
        } catch {
          // If it fails to parse (e.g. legacy plain text), fallback to placing the text in introduction
          setPolicyFields((prev) => ({
            ...prev,
            introduction: res.body,
          }));
        }
      } else if (slug === "terms-of-service") {
        try {
          const parsed = JSON.parse(res.body);
          if (parsed && typeof parsed === "object") {
            setTermsFields({
              introduction: parsed.introduction || "",
              acceptanceOfTerms: parsed.acceptanceOfTerms || "",
              eligibility: parsed.eligibility || "",
              userAccountRegistration: parsed.userAccountRegistration || "",
              candidateResponsibilities: parsed.candidateResponsibilities || "",
              employerResponsibilities: parsed.employerResponsibilities || "",
              jobListingsJobApplications: parsed.jobListingsJobApplications || "",
              skillCodingAssessments: parsed.skillCodingAssessments || "",
              aiPoweredFeatures: parsed.aiPoweredFeatures || "",
              prohibitedActivities: parsed.prohibitedActivities || "",
              accountSuspensionTermination: parsed.accountSuspensionTermination || "",
              intellectualPropertyRights: parsed.intellectualPropertyRights || "",
              disclaimerLimitationLiability: parsed.disclaimerLimitationLiability || "",
              privacyDataProtection: parsed.privacyDataProtection || "",
              governingLawDisputeResolution: parsed.governingLawDisputeResolution || "",
              changesToTerms: parsed.changesToTerms || "",
              contactInformation: parsed.contactInformation || "",
              effectiveDateLastUpdated: parsed.effectiveDateLastUpdated || "",
            });
          }
        } catch {
          setTermsFields((prev) => ({
            ...prev,
            introduction: res.body,
          }));
        }
      } else if (slug === "cookie-policy") {
        try {
          const parsed = JSON.parse(res.body);
          if (parsed && typeof parsed === "object") {
            setCookieFields({
              introduction: parsed.introduction || "",
              whatAreCookies: parsed.whatAreCookies || "",
              typesOfCookiesWeUse: parsed.typesOfCookiesWeUse || "",
              essentialStrictlyNecessaryCookies: parsed.essentialStrictlyNecessaryCookies || "",
              functionalCookies: parsed.functionalCookies || "",
              analyticsPerformanceCookies: parsed.analyticsPerformanceCookies || "",
              advertisingMarketingCookies: parsed.advertisingMarketingCookies || "",
              purposeOfCookies: parsed.purposeOfCookies || "",
              cookiesUsedOnOurWebsite: parsed.cookiesUsedOnOurWebsite || "",
              thirdPartyCookies: parsed.thirdPartyCookies || "",
              sessionAuthenticationCookies: parsed.sessionAuthenticationCookies || "",
              cookieManagementPreferences: parsed.cookieManagementPreferences || "",
              changesToCookiePolicy: parsed.changesToCookiePolicy || "",
              contactInformation: parsed.contactInformation || "",
              cookiePolicyVersion: parsed.cookiePolicyVersion || "",
              effectiveDateLastUpdated: parsed.effectiveDateLastUpdated || "",
            });
          }
        } catch {
          setCookieFields((prev) => ({
            ...prev,
            introduction: res.body,
          }));
        }
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
      } else {
        setError(err instanceof ApiError ? err.message : "Failed to load document");
      }
    }
  }

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    loadDoc();
  }, [user, slug]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    setValidationErrors({});

    if (slug === "privacy-policy") {
      const isValid = validatePrivacyFields();
      if (!isValid) {
        setSaving(false);
        setError("Please fix the validation errors before saving.");
        return;
      }
    } else if (slug === "terms-of-service") {
      const isValid = validateTermsFields();
      if (!isValid) {
        setSaving(false);
        setError("Please fix the validation errors before saving.");
        return;
      }
    } else if (slug === "cookie-policy") {
      const isValid = validateCookieFields();
      if (!isValid) {
        setSaving(false);
        setError("Please fix the validation errors before saving.");
        return;
      }
    } else {
      const errs: Record<string, string> = {};
      if (!title.trim()) {
        errs.title = "Title is required.";
      } else if (title.length < 2) {
        errs.title = "Title must be at least 2 characters.";
      } else if (title.length > 200) {
        errs.title = "Title cannot exceed 200 characters.";
      }
      if (Object.keys(errs).length > 0) {
        setValidationErrors(errs);
        setSaving(false);
        setError("Please fix the validation errors before saving.");
        return;
      }
    }

    try {
      const finalBody =
        slug === "privacy-policy"
          ? JSON.stringify(policyFields)
          : slug === "terms-of-service"
          ? JSON.stringify(termsFields)
          : slug === "cookie-policy"
          ? JSON.stringify(cookieFields)
          : body;
      await api.put(`/admin/legal/${slug}`, { title, body: finalBody });
      setSuccessMsg("Saved successfully. A new version was recorded.");
      setNotFound(false);
      await loadDoc();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save document");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <AdminNavbar />

      <div className="dashboard-wrap bg-light">
        <AdminSidebar active="legal" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">{doc?.title ?? slug}</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item text-muted"><a href="/admin-legal">Legal Documents</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">{slug}</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            {error && <div className="alert alert-danger">{error}</div>}
            {successMsg && <div className="alert alert-success">{successMsg}</div>}
            {notFound && <div className="alert alert-warning">This document doesn&apos;t exist yet — saving will create it as version 1.</div>}

            <div className="card mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Edit {doc ? `(current: v${doc.version})` : "(new document)"}</h6>
                <button type="button" className="btn btn-main btn-sm" disabled={saving} onClick={handleSave}>
                  {saving ? "Saving..." : "Save New Version"}
                </button>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label small">Title</label>
                  <input
                    type="text"
                    className={`form-control ${validationErrors.title ? "is-invalid" : ""}`}
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (validationErrors.title) {
                        setValidationErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.title;
                          return copy;
                        });
                      }
                    }}
                  />
                  {validationErrors.title && (
                    <div className="text-danger small mt-1">{validationErrors.title}</div>
                  )}
                </div>
                {slug === "privacy-policy" ? (
                  <div className="row g-3">
                    {PRIVACY_FIELDS_META.map((f) => {
                      const value = policyFields[f.key] || "";
                      const maxLen =
                        f.key === "privacyPolicyVersion"
                          ? 20
                          : f.key === "lastUpdatedDate"
                          ? 50
                          : f.key === "contactInformation"
                          ? 2000
                          : 10000;
                      return (
                        <div className={f.type === "text" ? "col-md-6" : "col-12"} key={f.key}>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <label className="form-label small fw-semibold text-dark mb-0">{f.label}</label>
                            <span className={`small ${value.length > maxLen ? "text-danger fw-bold" : "text-muted"}`}>
                              {value.length} / {maxLen.toLocaleString()}
                            </span>
                          </div>
                          {f.type === "textarea" ? (
                            <textarea
                              className={`form-control font-monospace ${validationErrors[f.key] ? "is-invalid" : ""}`}
                              rows={3}
                              value={value}
                              onChange={(e) => {
                                setPolicyFields((prev) => ({ ...prev, [f.key]: e.target.value }));
                                if (validationErrors[f.key]) {
                                  setValidationErrors((prev) => {
                                    const copy = { ...prev };
                                    delete copy[f.key];
                                    return copy;
                                  });
                                }
                              }}
                              placeholder={`Enter content for ${f.label}...`}
                            />
                          ) : (
                            <input
                              type="text"
                              className={`form-control ${validationErrors[f.key] ? "is-invalid" : ""}`}
                              value={value}
                              onChange={(e) => {
                                setPolicyFields((prev) => ({ ...prev, [f.key]: e.target.value }));
                                if (validationErrors[f.key]) {
                                  setValidationErrors((prev) => {
                                    const copy = { ...prev };
                                    delete copy[f.key];
                                    return copy;
                                  });
                                }
                              }}
                              placeholder={`Enter ${f.label}`}
                            />
                          )}
                          {validationErrors[f.key] && (
                            <div className="text-danger small mt-1">{validationErrors[f.key]}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : slug === "terms-of-service" ? (
                  <div className="row g-3">
                    {TERMS_FIELDS_META.map((f) => {
                      const value = termsFields[f.key] || "";
                      const maxLen =
                        f.key === "effectiveDateLastUpdated"
                          ? 50
                          : f.key === "contactInformation"
                          ? 2000
                          : 10000;
                      return (
                        <div className={f.type === "text" ? "col-md-6" : "col-12"} key={f.key}>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <label className="form-label small fw-semibold text-dark mb-0">{f.label}</label>
                            <span className={`small ${value.length > maxLen ? "text-danger fw-bold" : "text-muted"}`}>
                              {value.length} / {maxLen.toLocaleString()}
                            </span>
                          </div>
                          {f.type === "textarea" ? (
                            <textarea
                              className={`form-control font-monospace ${validationErrors[f.key] ? "is-invalid" : ""}`}
                              rows={3}
                              value={value}
                              onChange={(e) => {
                                setTermsFields((prev) => ({ ...prev, [f.key]: e.target.value }));
                                if (validationErrors[f.key]) {
                                  setValidationErrors((prev) => {
                                    const copy = { ...prev };
                                    delete copy[f.key];
                                    return copy;
                                  });
                                }
                              }}
                              placeholder={`Enter content for ${f.label}...`}
                            />
                          ) : (
                            <input
                              type="text"
                              className={`form-control ${validationErrors[f.key] ? "is-invalid" : ""}`}
                              value={value}
                              onChange={(e) => {
                                setTermsFields((prev) => ({ ...prev, [f.key]: e.target.value }));
                                if (validationErrors[f.key]) {
                                  setValidationErrors((prev) => {
                                    const copy = { ...prev };
                                    delete copy[f.key];
                                    return copy;
                                  });
                                }
                              }}
                              placeholder={`Enter ${f.label}`}
                            />
                          )}
                          {validationErrors[f.key] && (
                            <div className="text-danger small mt-1">{validationErrors[f.key]}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : slug === "cookie-policy" ? (
                  <div className="row g-3">
                    {COOKIE_FIELDS_META.map((f) => {
                      const value = cookieFields[f.key] || "";
                      const maxLen =
                        f.key === "cookiePolicyVersion"
                          ? 20
                          : f.key === "effectiveDateLastUpdated"
                          ? 50
                          : f.key === "contactInformation"
                          ? 2000
                          : 10000;
                      return (
                        <div className={f.type === "text" ? "col-md-6" : "col-12"} key={f.key}>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <label className="form-label small fw-semibold text-dark mb-0">{f.label}</label>
                            <span className={`small ${value.length > maxLen ? "text-danger fw-bold" : "text-muted"}`}>
                              {value.length} / {maxLen.toLocaleString()}
                            </span>
                          </div>
                          {f.type === "textarea" ? (
                            <textarea
                              className={`form-control font-monospace ${validationErrors[f.key] ? "is-invalid" : ""}`}
                              rows={3}
                              value={value}
                              onChange={(e) => {
                                setCookieFields((prev) => ({ ...prev, [f.key]: e.target.value }));
                                if (validationErrors[f.key]) {
                                  setValidationErrors((prev) => {
                                    const copy = { ...prev };
                                    delete copy[f.key];
                                    return copy;
                                  });
                                }
                              }}
                              placeholder={`Enter content for ${f.label}...`}
                            />
                          ) : (
                            <input
                              type="text"
                              className={`form-control ${validationErrors[f.key] ? "is-invalid" : ""}`}
                              value={value}
                              onChange={(e) => {
                                setCookieFields((prev) => ({ ...prev, [f.key]: e.target.value }));
                                if (validationErrors[f.key]) {
                                  setValidationErrors((prev) => {
                                    const copy = { ...prev };
                                    delete copy[f.key];
                                    return copy;
                                  });
                                }
                              }}
                              placeholder={`Enter ${f.label}`}
                            />
                          )}
                          {validationErrors[f.key] && (
                            <div className="text-danger small mt-1">{validationErrors[f.key]}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mb-0">
                    <label className="form-label small">Body</label>
                    <textarea
                      className="form-control font-monospace"
                      rows={20}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            {revisions.length > 0 && (
              <div className="card">
                <div className="card-header"><h6 className="mb-0">Version History</h6></div>
                <div className="card-body">
                  <table className="table table-sm align-middle mb-0">
                    <thead><tr><th>Version</th><th>Title</th><th>When</th></tr></thead>
                    <tbody>
                      {revisions.map((r) => (
                        <tr key={r.id}>
                          <td className="small">v{r.version}</td>
                          <td className="small">{r.title}</td>
                          <td className="small text-muted">{new Date(r.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
