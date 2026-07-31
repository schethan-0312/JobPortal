/**
 * Human-style manual QA walkthrough with real, realistic content (not "test123"
 * placeholders). Drives the actual UI end to end and screenshots each key step.
 * Run with: node tests/manual-qa-walkthrough.js
 *
 * Requires: backend on :4000, frontend on :3000, and admin@jobstock.com's password
 * reset to ManualQA2026! via `node jobstock-api/admin-tool.mjs reset-password ...`
 * for this session only.
 */
const { chromium } = require("playwright");
const path = require("path");

const WEB = "http://localhost:3000";
const SHOTDIR =
  "C:\\Users\\New\\AppData\\Local\\Temp\\claude\\c--Users-New-Downloads-Jobstock-CakePHP-v1-0-0-Jobstock-CakePHP-v1-0-0\\dda5db0b-e8e0-4574-afa2-d8b2d2674486\\scratchpad\\qa-screens";

const stamp = Date.now();
const candidate = {
  name: "Priya Sharma",
  email: `priya.sharma.${stamp}@gmail.com`,
  password: "GreenValley2026",
};
const employer = {
  company: "TechNova Solutions",
  email: `hr.technova.${stamp}@gmail.com`,
  password: "TechNova2026Hire",
};
const job = {
  title: "Senior Frontend Engineer",
  description:
    "We're looking for a senior frontend engineer to lead our React/TypeScript platform team. You'll own the component library, mentor two mid-level engineers, and work closely with design on our next-gen dashboard.",
  location: "Bengaluru, India",
  salaryMin: "1800000",
  salaryMax: "2600000",
};

let shotN = 0;
async function shot(page, label) {
  shotN++;
  const file = path.join(SHOTDIR, `${String(shotN).padStart(2, "0")}-${label}.png`);
  await page.screenshot({ path: file, fullPage: true }).catch((e) => console.log("screenshot failed:", e.message));
  return file;
}

function log(step, detail) {
  console.log(`\n=== ${step} ===`);
  if (detail) console.log(detail);
}

async function loginViaModal(page, email, password) {
  await page.goto(`${WEB}/`, { waitUntil: "load" });
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${WEB}/`, { waitUntil: "load" });
  await page.locator('a[data-bs-target="#login"]').first().click();
  await page.waitForTimeout(600);
  await page.locator("#login input[type='email']").fill(email);
  await page.locator("#login input[type='password']").fill(password);
  await page.locator("#login button[type='submit']").click();
  await page.waitForTimeout(2000);
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(`PAGE ERROR: ${err.message}`));

  try {
    // ---------- Homepage / PWA check ----------
    log("1. Homepage + PWA manifest check");
    await page.goto(WEB, { waitUntil: "load" });
    await shot(page, "homepage");
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href").catch(() => null);
    console.log("PWA manifest linked:", manifestHref);
    const swRegistered = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return "unsupported";
      const regs = await navigator.serviceWorker.getRegistrations();
      return regs.length > 0 ? regs.map((r) => r.active?.scriptURL) : "none yet (registers async)";
    });
    console.log("Service worker registrations:", swRegistered);

    // ---------- Candidate signup ----------
    log("2. Sign up as a real candidate", `${candidate.name} <${candidate.email}>`);
    await page.goto(`${WEB}/signup`, { waitUntil: "load" });
    const signupForm1 = page.locator("form").first();
    await signupForm1.locator('input[placeholder="What is your name?"]').fill(candidate.name);
    await signupForm1.locator('input[placeholder="Tell us your Email ID"]').fill(candidate.email);
    await signupForm1.locator('input[type="password"]').fill(candidate.password);
    await shot(page, "signup-candidate-filled");
    await Promise.all([
      page.waitForURL(/candidate-dashboard/, { timeout: 20000 }).catch(() => {}),
      signupForm1.locator('button[type="submit"]:has-text("Register")').click(),
    ]);
    console.log("URL after candidate signup:", page.url());
    const onDashboard = page.url().includes("candidate-dashboard");
    console.log("Landed on candidate dashboard:", onDashboard);
    await shot(page, "candidate-dashboard-fresh");

    // ---------- Complete candidate profile ----------
    log("3. Complete candidate profile with real content");
    await page.goto(`${WEB}/candidate-profile`, { waitUntil: "load" });
    await page.waitForTimeout(1000);
    const form = page.locator("form").first();
    await form.locator('input[type="text"]').nth(0).fill(candidate.name); // Your Name
    await form.locator('input[type="text"]').nth(1).fill("Senior Frontend Engineer"); // Headline
    await form.locator('input[type="number"]').fill("6"); // Experience years
    await form.locator('input[type="text"]').nth(2).fill("React, TypeScript, Node.js, GraphQL, Jest"); // Skills
    await form
      .locator("textarea")
      .first()
      .fill(
        "Frontend engineer with 6 years building React and TypeScript applications for fintech products. Led the migration of a legacy Angular app to Next.js, cutting page load times by 40%.",
      );
    await form.locator('input[type="text"]').nth(4).fill("+91 98765 43210"); // Phone (nth(3) is the disabled email field)
    await form.locator('input[type="text"]').nth(5).fill("Bengaluru, India"); // Location
    await shot(page, "candidate-profile-filled");
    await form.locator('button[type="submit"]').click();
    await page.waitForTimeout(1500);
    const saveMsg = await page.locator(".alert-success").textContent().catch(() => null);
    console.log("Profile save result:", saveMsg);
    await shot(page, "candidate-profile-saved");

    console.log("Gamification 'Your Progress' card present:", (await page.locator("text=Your Progress").count()) > 0);
    console.log("Connected Accounts card present:", (await page.locator("text=Connected Accounts").count()) > 0);
    console.log("Notification Channels card present:", (await page.locator("text=Notification Channels").count()) > 0);
    console.log("Video Profile card present:", (await page.locator("text=Video Profile").count()) > 0);

    // ---------- Employer signup (in a fresh context to avoid session clash) ----------
    log("4. Sign up as a real employer", `${employer.company} <${employer.email}>`);
    const empContext = await browser.newContext();
    const empPage = await empContext.newPage();
    await empPage.goto(`${WEB}/signup`, { waitUntil: "load" });
    const signupForm2 = empPage.locator("form").first();
    await signupForm2.locator("#findtalent").click({ force: true });
    await signupForm2.locator('input[placeholder="What is your name?"]').fill(employer.company);
    await signupForm2.locator('input[placeholder="Tell us your Email ID"]').fill(employer.email);
    await signupForm2.locator('input[type="password"]').fill(employer.password);
    await shot(empPage, "signup-employer-filled");
    await Promise.all([
      empPage.waitForURL(/employer-dashboard/, { timeout: 20000 }).catch(() => {}),
      signupForm2.locator('button[type="submit"]:has-text("Register")').click(),
    ]);
    console.log("URL after employer signup:", empPage.url());
    await shot(empPage, "employer-dashboard-fresh");

    // ---------- Employer fills company profile (unverified state check) ----------
    log("5. Employer profile — culture blurb + photos card");
    await empPage.goto(`${WEB}/employer-profile`, { waitUntil: "load" });
    await page.waitForTimeout(500);
    console.log("Company Culture Page card present:", (await empPage.locator("text=Company Culture Page").count()) > 0);
    const empForm = empPage.locator("form").first();
    await empForm.locator('input[type="text"]').nth(0).fill(employer.company);
    await empForm.locator('input[type="text"]').nth(2).fill("https://technova.example.com"); // nth(1) is the disabled email field
    await empForm.locator('input[type="text"]').nth(3).fill("Bengaluru, India");
    await empForm.locator('input[type="text"]').nth(4).fill("Information Technology");
    await empForm
      .locator("textarea")
      .first()
      .fill("TechNova Solutions builds developer tooling for mid-size fintech companies across India.");
    // Culture blurb is the second textarea, in the second card, outside `form` — find by page.
    const cultureTextarea = empPage.locator('textarea[placeholder*="What\'s it like"]');
    if (await cultureTextarea.count()) {
      await cultureTextarea.fill(
        "Small, senior team. Flexible hours, fully remote-friendly, quarterly offsites, and real ownership over what you ship.",
      );
    }
    await shot(empPage, "employer-profile-filled");
    await empForm.locator('button[type="submit"]').click();
    await empPage.waitForTimeout(1500);
    await shot(empPage, "employer-profile-saved");

    // ---------- Try posting a job while unverified (should be blocked) ----------
    log("6. Unverified employer attempts to post a job (should be blocked)");
    await empPage.goto(`${WEB}/employer-submit-job`, { waitUntil: "load" });
    await empPage.locator('input[placeholder="ex. Senior UI/UX Designer"]').fill(job.title);
    await empPage.locator("textarea").first().fill(job.description);
    await empPage.locator('input[placeholder="ex. 5000"]').fill(job.salaryMin);
    await empPage.locator('input[placeholder="ex. 10000"]').fill(job.salaryMax);
    const locationInputs = empPage.locator('input[type="text"]');
    await locationInputs.last().fill(job.location);
    await shot(empPage, "job-form-filled-unverified");
    const postBtn = empPage.locator('button[type="submit"]');
    await postBtn.click();
    await empPage.waitForTimeout(1500);
    const blockedMsg = await empPage.locator(".alert-danger").textContent().catch(() => null);
    console.log("Blocked-post message (expected: verification required):", blockedMsg);
    await shot(empPage, "job-post-blocked");

    // ---------- Admin verifies the employer ----------
    log("7. Admin logs in and verifies TechNova Solutions");
    await loginViaModal(page, "admin@jobstock.com", "ManualQA2026!");
    console.log("URL after admin login:", page.url());
    await shot(page, "admin-dashboard");
    await page.goto(`${WEB}/admin-employers`, { waitUntil: "load" });
    await page.waitForTimeout(1000);
    await shot(page, "admin-employers-pending");
    const employerCard = page.locator(".jbs-list-box", { hasText: employer.company }).first();
    const cardCount = await employerCard.count();
    console.log(`TechNova Solutions found in pending list: ${cardCount > 0}`);
    if (cardCount > 0) {
      await employerCard.locator('button:has-text("Verify")').click();
      await page.waitForTimeout(1200);
      await shot(page, "admin-employers-after-verify");
      const successMsg = await page.locator(".alert-success").textContent().catch(() => null);
      console.log("Verify result:", successMsg);
    }

    // ---------- Employer posts the job again (now verified) ----------
    log("8. Verified employer posts the job for real");
    await empPage.goto(`${WEB}/employer-submit-job`, { waitUntil: "load" });
    await empPage.locator('input[placeholder="ex. Senior UI/UX Designer"]').fill(job.title);
    await empPage.locator("textarea").first().fill(job.description);
    await empPage.locator('input[placeholder="ex. 5000"]').fill(job.salaryMin);
    await empPage.locator('input[placeholder="ex. 10000"]').fill(job.salaryMax);
    await empPage.locator('input[type="text"]').last().fill(job.location);
    await empPage.locator('button[type="submit"]').click();
    await empPage.waitForTimeout(2000);
    const postSuccessMsg = await empPage.locator(".alert-success").textContent().catch(() => null);
    console.log("Job post result (now verified):", postSuccessMsg);
    await shot(empPage, "job-posted-verified");

    // ---------- Candidate browses jobs and applies ----------
    log("9. Candidate finds the real job and applies with a cover note");
    await page.goto(`${WEB}/jobs`, { waitUntil: "load" });
    await page.waitForTimeout(1000);
    await shot(page, "jobs-list-with-new-job");
    const jobLink = page.locator(`a:has-text("${job.title}")`).first();
    const jobLinkExists = (await jobLink.count()) > 0;
    console.log(`"${job.title}" visible in jobs list:`, jobLinkExists);
    if (jobLinkExists) {
      // Log back in as the candidate on the main `page` (admin session currently active there)
      await loginViaModal(page, candidate.email, candidate.password);
      await page.goto(`${WEB}/jobs`, { waitUntil: "load" });
      await page.locator(`a:has-text("${job.title}")`).first().click();
      await page.waitForTimeout(1000);
      await shot(page, "job-detail-real-job");
      const coverNoteBox = page.locator('textarea[placeholder="Cover note (optional)"]');
      if (await coverNoteBox.count()) {
        await coverNoteBox.fill(
          "I've led two React/Next.js platform migrations at similar scale and would love to bring that experience to TechNova's dashboard team.",
        );
      }
      await page.locator('button:has-text("Apply Now")').click();
      await page.waitForTimeout(1500);
      const applyMsg = await page.locator("text=Application submitted successfully.").count();
      console.log("Application submitted successfully:", applyMsg > 0);
      await shot(page, "job-applied");
    }

    // ---------- Skill assessment (proctored) ----------
    log("10. Candidate takes a proctored React skill assessment");
    await page.goto(`${WEB}/candidate-skill-assessment`, { waitUntil: "load" });
    await page.locator('input[placeholder*="React"]').fill("React");
    await page.locator('button:has-text("Start Assessment")').click();
    await page.waitForTimeout(7000);
    await shot(page, "skill-assessment-quiz");
    const timerVisible = await page.locator("text=/\\d{2}:\\d{2}/").count();
    console.log("Countdown timer rendered:", timerVisible > 0);
    const radios = page.locator('input[type="radio"]');
    const radioCount = await radios.count();
    const seenNames = new Set();
    for (let i = 0; i < radioCount; i++) {
      const r = radios.nth(i);
      const name = await r.getAttribute("name");
      if (!seenNames.has(name)) {
        await r.check();
        seenNames.add(name);
      }
    }
    console.log(`Answered ${seenNames.size} questions`);
    await page.locator('button:has-text("Submit Answers")').click();
    await page.waitForTimeout(4000);
    await shot(page, "skill-assessment-result");
    const proctoredBadge = await page.locator("text=/Proctored|not verified/").first().textContent().catch(() => null);
    console.log("Proctoring result badge:", proctoredBadge);

    // ---------- Dashboard + gamification recheck ----------
    log("11. Candidate dashboard after activity");
    await page.goto(`${WEB}/candidate-dashboard`, { waitUntil: "load" });
    await page.waitForTimeout(1000);
    await shot(page, "candidate-dashboard-after-activity");
    console.log("Applied jobs count visible on dashboard:", (await page.locator("text=Applied jobs").count()) > 0);

    // ---------- Employer full-text candidate search ----------
    log("12. Employer searches candidates with boolean full-text query");
    await empPage.goto(`${WEB}/employer-candidate-search`, { waitUntil: "load" });
    await empPage.waitForTimeout(1000);
    const ftsInput = empPage.locator('input[placeholder*="React"]').first();
    await ftsInput.fill('"React" AND "TypeScript"');
    await empPage.locator('button:has-text("Search")').click();
    await empPage.waitForTimeout(1500);
    await shot(empPage, "employer-fts-search");
    const resultsHeader = await empPage.locator(".card-header h4").filter({ hasText: /Candidate/ }).textContent().catch(() => null);
    console.log("Full-text search results header:", resultsHeader);
    const priyaCardVisible = (await empPage.locator(`text=${candidate.name}`).count()) > 0;
    console.log(`${candidate.name} found via full-text search "React AND TypeScript":`, priyaCardVisible);

    // ---------- Employer opens candidate profile (records a view) ----------
    if (priyaCardVisible) {
      log("13. Employer opens Priya's profile — should log a profile view");
      const priyaLink = empPage.locator(`a:has-text("${candidate.name}")`).first();
      await priyaLink.click();
      await empPage.waitForTimeout(1500);
      await shot(empPage, "employer-views-candidate-profile");
      console.log("Verified badge visible on candidate detail:", (await empPage.locator("text=Verified").count()) > 0);
    }

    // ---------- Candidate checks "who viewed your profile" ----------
    log("14. Candidate checks Who Viewed Your Profile");
    await page.goto(`${WEB}/candidate-profile`, { waitUntil: "load" });
    await page.waitForTimeout(1000);
    await shot(page, "candidate-profile-views");
    const viewerListed = (await page.locator(`text=${employer.company}`).count()) > 0;
    console.log(`${employer.company} shown in "Who Viewed Your Profile":`, viewerListed);
    const viewCountBadge = await page.locator("text=/\\d+ profile view/").first().textContent().catch(() => null);
    console.log("Profile view count badge:", viewCountBadge);

    // ---------- Smart match + bulk apply ----------
    log("15. Smart match page — bulk apply UI");
    await page.goto(`${WEB}/candidate-smart-match`, { waitUntil: "load" });
    await page.waitForTimeout(4000);
    await shot(page, "smart-match");
    console.log("Select-all-strong-matches button present:", (await page.locator('button:has-text("Select all")').count()) > 0);

    // ---------- Employer bulk resume download ----------
    log("16. Employer downloads resumes as a zip");
    await empPage.goto(`${WEB}/employer-applicants-jobs`, { waitUntil: "load" });
    await empPage.waitForTimeout(1500);
    await shot(empPage, "employer-applicants");
    const zipBtn = empPage.locator('button:has-text("resumes")');
    console.log("Bulk resume download button present:", (await zipBtn.count()) > 0);
    if ((await zipBtn.count()) > 0) {
      const [download] = await Promise.all([
        empPage.waitForEvent("download", { timeout: 20000 }).catch(() => null),
        zipBtn.click(),
      ]);
      console.log("Zip download triggered:", download ? download.suggestedFilename() : "no download event captured");
    }

    // ---------- Logout check ----------
    log("17. Candidate logs out and session clears");
    await page.goto(`${WEB}/candidate-dashboard`, { waitUntil: "load" });
    const accountDrop = page.locator(".account-drop").first();
    if (await accountDrop.count()) {
      await accountDrop.click();
      await page.waitForTimeout(500);
      const logoutBtn = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
      if (await logoutBtn.count()) {
        await logoutBtn.click();
        await page.waitForTimeout(1500);
        console.log("URL after logout:", page.url());
        await shot(page, "after-logout");
      }
    }

    console.log("\n=== Console/page errors observed during walkthrough ===");
    console.log(consoleErrors.length === 0 ? "None" : [...new Set(consoleErrors)].slice(0, 30).join("\n"));

    await empContext.close();
  } catch (err) {
    console.error("WALKTHROUGH ERROR:", err);
    await shot(page, "error-state");
  } finally {
    await browser.close();
  }
})();
