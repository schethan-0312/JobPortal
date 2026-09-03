const fs = require('fs');
let code = fs.readFileSync('src/app/employer-submit-job/page.tsx', 'utf8');

// 1. Rename default export to EmployerSubmitJobContent
code = code.replace('export default function EmployerSubmitJobPage() {', 'function EmployerSubmitJobContent() {');

// 2. Add editId states and searchParams
const searchParamsHook = `
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const [fetchingJob, setFetchingJob] = useState(!!editId);
  const [savingDraft, setSavingDraft] = useState(false);
`;
code = code.replace('const router = useRouter();', 'const router = useRouter();\n' + searchParamsHook);

// 3. Add fetch job details effect
const fetchEffect = `
  // Fetch job details for editing
  useEffect(() => {
    if (!editId || !user || user.role !== 'EMPLOYER') {
      setFetchingJob(false);
      return;
    }
    
    (async () => {
      try {
        setFetchingJob(true);
        // We find the job by looking at the employer's jobs
        const myJobs = await api.get('/jobs/mine');
        const job = myJobs.find((j) => j.id === editId);
        
        if (job) {
          setTitle(job.title || '');
          setSummary(job.summary || '');
          setCategory(job.category || 'Web & Application');
          setJobRole(job.jobRole || '');
          setJobType(job.jobType || 'FULL_TIME');
          setDescription(job.description || '');
          setResponsibilities(job.responsibilities || '');
          setSkills(job.skills || []);
          setMinExperience(job.minExperience != null ? String(job.minExperience) : '');
          setMaxExperience(job.maxExperience != null ? String(job.maxExperience) : '');
          setMinQualification(job.minQualification || "Bachelor's Degree");
          setSpecialization(job.specialization || '');
          setSalaryMin(job.salaryMin != null ? String(job.salaryMin) : '');
          setSalaryMax(job.salaryMax != null ? String(job.salaryMax) : '');
          setCurrency(job.currency || 'INR');
          setSalaryPeriod(job.salaryPeriod || 'MONTHLY');
          setCountry(job.country || 'India');
          setState(job.state || '');
          setCity(job.city || '');
          setWorkMode(job.workMode || 'IN_OFFICE');
          setOpenings(job.openings ? String(job.openings) : '1');
          if (job.applicationDeadline) {
            setApplicationDeadline(new Date(job.applicationDeadline).toISOString().split('T')[0]);
          }
        } else {
          toast.error('Job not found or you do not have permission to edit it.');
          router.push('/employer-jobs');
        }
      } catch (err) {
        toast.error('Failed to load job details');
        router.push('/employer-jobs');
      } finally {
        setFetchingJob(false);
      }
    })();
  }, [editId, user, router]);
`;
code = code.replace('// Skill management helpers', fetchEffect + '\n  // Skill management helpers');

// 4. Update validateForm to accept isDraft
code = code.replace('function validateForm(): boolean {', 'function validateForm(isDraft: boolean): boolean {');

// In validateForm, skip validation for draft except title
code = code.replace(
  'if (!category.trim()) {',
  'if (!isDraft) {\n      if (!category.trim()) {'
);
// We need to carefully close the if (!isDraft) after applicationDeadline
const appDeadlineCheck = `
      if (applicationDeadline) {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        if (new Date(applicationDeadline) < startOfToday) {
          newErrors.applicationDeadline = "Application Deadline cannot be a date in the past.";
        }
      }
`;
code = code.replace(appDeadlineCheck, appDeadlineCheck + '\n    }\n');

// 5. Update handleSubmit to accept isDraft
code = code.replace('async function handleSubmit(e: React.FormEvent) {', 'async function handleSubmit(e: React.FormEvent, isDraft: boolean) {');
code = code.replace('if (!validateForm()) {', 'if (!validateForm(isDraft)) {');

code = code.replace(
  'if (employer && employer.status !== "VERIFIED") {',
  'if (!isDraft && employer && employer.status !== "VERIFIED") {'
);

code = code.replace('setSubmitting(true);', 'if (isDraft) setSavingDraft(true); else setSubmitting(true);');
code = code.replace('setSubmitting(false);', 'setSubmitting(false); setSavingDraft(false);');

const apiCallCode = `
      if (editId) {
        await api.put(\`/jobs/\${editId}\`, { ...payload, status: isDraft ? 'DRAFT' : 'OPEN' });
        toast.success(isDraft ? 'Draft updated successfully!' : 'Job updated successfully!');
      } else {
        await api.post("/jobs", { ...payload, status: isDraft ? 'DRAFT' : 'OPEN' });
        toast.success(isDraft ? 'Draft saved successfully!' : 'Job posted successfully!');
      }
`;
code = code.replace('await api.post("/jobs", payload);', apiCallCode);
code = code.replace('toast.success("Job posted successfully!");', '');

const saveButtonCode = `
                  <button
                    type="button"
                    className="btn btn-main px-5 py-3 fs-6 fw-medium"
                    disabled={submitting || savingDraft}
                    onClick={(e) => handleSubmit(e, false)}
                  >
                    {submitting ? "Publishing..." : editId ? "Publish Updates" : "Publish Job Listing"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-5 py-3 fs-6 fw-medium ms-3"
                    disabled={submitting || savingDraft}
                    onClick={(e) => handleSubmit(e, true)}
                  >
                    {savingDraft ? "Saving..." : "Save as Draft"}
                  </button>
`;

code = code.replace(
  /<button\s+type="button"\s+className="btn btn-main[^>]+onClick=\{handleSubmit\}[^>]*>[\s\S]*?<\/button>/,
  saveButtonCode
);

code = code.replace(/<h1 className="mb-1 fs-3 fw-medium">Post a Job<\/h1>/g, '<h1 className="mb-1 fs-3 fw-medium">{editId ? "Edit Job" : "Post a Job"}</h1>');
code = code.replace(/<a href="#" className="text-main">\s*Post Job\s*<\/a>/g, '<a href="#" className="text-main">{editId ? "Edit Job" : "Post Job"}</a>');

const suspenseWrapper = `
export default function EmployerSubmitJobPage() {
  return (
    <Suspense fallback={
      <div className="dashboard-wrap bg-light">
        <div className="dashboard-content d-flex align-items-center justify-content-center" style={{ minHeight: "50vh" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    }>
      <EmployerSubmitJobContent />
    </Suspense>
  );
}
`;
code += '\n\n' + suspenseWrapper;

// Handle the top level <Suspense fallback={<div>Loading...</div>}> we accidentally added earlier
code = code.replace('<Suspense fallback={<div>Loading...</div>}>', '<>');

const fetchingCode = `
  if (fetchingJob) {
    return (
      <div className="dashboard-wrap bg-light">
        <EmployerSidebar active="submit-job" />
        <div className="dashboard-content d-flex align-items-center justify-content-center" style={{ minHeight: "50vh" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading job...</span>
          </div>
        </div>
      </div>
    );
  }
`;
code = code.replace('return (\n    <>\n      <style jsx global>', fetchingCode + '\n  return (\n    <>\n      <style jsx global>');


fs.writeFileSync('src/app/employer-submit-job/page.tsx', code, 'utf8');
console.log('Successfully transformed employer-submit-job/page.tsx');
