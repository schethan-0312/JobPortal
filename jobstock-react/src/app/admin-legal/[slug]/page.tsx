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
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function loadDoc() {
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
    try {
      const finalBody = slug === "privacy-policy" ? JSON.stringify(policyFields) : body;
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
                  <input type="text" className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                {slug === "privacy-policy" ? (
                  <div className="row g-3">
                    {PRIVACY_FIELDS_META.map((f) => (
                      <div className={f.type === "text" ? "col-md-6" : "col-12"} key={f.key}>
                        <label className="form-label small fw-semibold text-dark">{f.label}</label>
                        {f.type === "textarea" ? (
                          <textarea
                            className="form-control font-monospace"
                            rows={3}
                            value={policyFields[f.key] || ""}
                            onChange={(e) =>
                              setPolicyFields((prev) => ({ ...prev, [f.key]: e.target.value }))
                            }
                            placeholder={`Enter content for ${f.label}...`}
                          />
                        ) : (
                          <input
                            type="text"
                            className="form-control"
                            value={policyFields[f.key] || ""}
                            onChange={(e) =>
                              setPolicyFields((prev) => ({ ...prev, [f.key]: e.target.value }))
                            }
                            placeholder={`Enter ${f.label}`}
                          />
                        )}
                      </div>
                    ))}
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
