/**
 * E2E smoke test for the 3 most critical user journeys.
 * Requires the backend (localhost:4000) and frontend (localhost:3000) to be running.
 * Run with: node tests/critical-flows.e2e.js
 *
 * NOTE: this project has no @playwright/test runner installed (only the raw
 * `playwright` driver). This script uses assert() and a pass/fail summary as a
 * stand-in. Installing @playwright/test and converting this to a proper test
 * suite (with retries, HTML reports, CI integration) is a recommended follow-up.
 */
const { chromium } = require('playwright');
const assert = require('assert');

const API = 'http://localhost:4000/api';
const WEB = 'http://localhost:3000';

let pass = 0;
let fail = 0;
const failures = [];

async function check(name, fn) {
  try {
    await fn();
    pass++;
    console.log('PASS:', name);
  } catch (err) {
    fail++;
    failures.push({ name, error: err.message });
    console.log('FAIL:', name, '-', err.message);
  }
}

(async () => {
  const browser = await chromium.launch();

  // ===== Journey 1: Candidate signup -> browse -> apply -> track status =====
  {
    const page = await browser.newPage();
    const email = 'e2e_candidate_' + Date.now() + '@example.com';

    await check('candidate can load signup page', async () => {
      const res = await page.goto(WEB + '/signup', { waitUntil: 'networkidle' });
      assert.strictEqual(res.status(), 200);
    });

    const reg = await fetch(API + '/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'RealPass123!', role: 'CANDIDATE', fullName: 'Priya Nair' }),
    }).then((r) => r.json());

    await check('registration returns a usable access token', async () => {
      assert.ok(reg.accessToken && reg.accessToken.length > 20);
    });

    await page.evaluate((token) => localStorage.setItem('jobstock_token', token), reg.accessToken);

    await check('candidate dashboard loads after login (session restored)', async () => {
      const res = await page.goto(WEB + '/candidate-dashboard', { waitUntil: 'networkidle' });
      assert.strictEqual(res.status(), 200);
      const text = await page.locator('body').innerText();
      assert.ok(!text.includes('Sign In'), 'should be authenticated, not shown Sign In');
    });

    let jobId = null;
    await check('at least one open job exists to apply to', async () => {
      const jobs = await fetch(API + '/jobs?pageSize=1').then((r) => r.json());
      assert.ok(jobs.items && jobs.items.length > 0, 'no open jobs in DB to test against');
      jobId = jobs.items[0].id;
    });

    if (jobId) {
      await check('candidate can apply to a job', async () => {
        const res = await fetch(API + '/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + reg.accessToken },
          body: JSON.stringify({ jobId, coverNote: 'I am excited to apply for this role.' }),
        });
        assert.strictEqual(res.status, 201);
      });

      await check('application appears in "my applications" list', async () => {
        const apps = await fetch(API + '/applications/mine', {
          headers: { Authorization: 'Bearer ' + reg.accessToken },
        }).then((r) => r.json());
        assert.ok(apps.some((a) => a.jobId === jobId), 'applied job not found in applications/mine');
      });

      await check('duplicate application to the same job is rejected (409)', async () => {
        const res = await fetch(API + '/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + reg.accessToken },
          body: JSON.stringify({ jobId, coverNote: 'Applying again' }),
        });
        assert.strictEqual(res.status, 409);
      });

      await check('applied-jobs page renders the application without console errors', async () => {
        const errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        await page.goto(WEB + '/candidate-applied-jobs', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        assert.strictEqual(errors.length, 0, 'console errors: ' + JSON.stringify(errors));
      });
    }

    await check('logout from top navbar actually clears the session', async () => {
      await page.goto(WEB + '/candidate-dashboard', { waitUntil: 'networkidle' });
      const desktopScope = page.locator('.nav-menu-social.dhsbrd');
      await desktopScope.locator('.account-drop').nth(1).locator('button.btn-order-by-filt').click({ force: true });
      await page.waitForTimeout(500);
      await desktopScope.locator('button.btn-whites:has-text("Logout")').click({ force: true });
      await page.waitForTimeout(1500);
      await page.reload({ waitUntil: 'networkidle' });
      const text = await page.locator('body').innerText();
      assert.ok(text.includes('Sign In'), 'session was not actually cleared on reload');
    });

    await page.close();
  }

  // ===== Journey 2: Employer signup -> (blocked until verified) -> post job -> see applicant =====
  {
    const emp = await fetch(API + '/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'e2e_employer_' + Date.now() + '@example.com', password: 'RealPass123!', role: 'EMPLOYER', fullName: 'Nimbus Cloud Solutions' }),
    }).then((r) => r.json());

    await check('unverified employer is blocked from posting a job (403)', async () => {
      const res = await fetch(API + '/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + emp.accessToken },
        body: JSON.stringify({ title: 'Backend Engineer', description: 'x'.repeat(60), category: 'IT', location: 'Remote', jobType: 'FULL_TIME', salaryMin: 60000, salaryMax: 90000 }),
      });
      assert.strictEqual(res.status, 403);
    });

    await check('employer profile PATCH rejects an invalid logoUrl (not a URL or /uploads path)', async () => {
      const res = await fetch(API + '/employers/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + emp.accessToken },
        body: JSON.stringify({ logoUrl: 'javascript:alert(1)' }),
      });
      assert.strictEqual(res.status, 400);
    });

    await check('employer profile PATCH accepts a real uploaded-file path', async () => {
      const res = await fetch(API + '/employers/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + emp.accessToken },
        body: JSON.stringify({ logoUrl: '/uploads/fake-test-file.png' }),
      });
      assert.strictEqual(res.status, 200);
    });
  }

  // ===== Journey 3: Payment order creation is scoped to the requesting user =====
  {
    const userA = await fetch(API + '/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'e2e_payer_a_' + Date.now() + '@example.com', password: 'RealPass123!', role: 'EMPLOYER', fullName: 'Payer A Co' }),
    }).then((r) => r.json());
    const userB = await fetch(API + '/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'e2e_payer_b_' + Date.now() + '@example.com', password: 'RealPass123!', role: 'EMPLOYER', fullName: 'Payer B Co' }),
    }).then((r) => r.json());

    let orderId = null;
    await check('user A can create a package order', async () => {
      const res = await fetch(API + '/packages/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + userA.accessToken },
        body: JSON.stringify({ packageId: 'pkg-emp-basic' }),
      });
      assert.strictEqual(res.status, 201);
      const body = await res.json();
      orderId = body.id;
    });

    if (orderId) {
      await check("user B cannot create a razorpay-order for user A's order (IDOR guard)", async () => {
        const res = await fetch(API + '/packages/orders/' + orderId + '/razorpay-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + userB.accessToken },
        });
        assert.ok(res.status === 404 || res.status === 403, 'expected 404/403, got ' + res.status);
      });
    }
  }

  await browser.close();

  console.log('\n=== E2E SUMMARY ===');
  console.log('Passed:', pass, '/ Failed:', fail);
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach((f) => console.log(' -', f.name, ':', f.error));
  }
  process.exit(fail > 0 ? 1 : 0);
})();
