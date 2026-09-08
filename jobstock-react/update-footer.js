const fs = require('fs');
let code = fs.readFileSync('src/components/Footer.tsx', 'utf8');

const newFooterReturn = `  return (
    <>
      <footer className="footer custom-theme-footer position-relative" style={{ backgroundColor: '#134e4a', overflow: 'hidden', padding: '60px 0 20px', color: '#a8c6c4' }}>
        
        {/* Massive Watermark */}
        <div className="position-absolute w-100 text-center" style={{ top: '-30px', left: 0, zIndex: 0, pointerEvents: 'none' }}>
          <h1 style={{ 
            fontSize: '15vw', 
            fontWeight: 900, 
            color: 'rgba(255,255,255,0.04)', 
            margin: 0,
            lineHeight: 1,
            letterSpacing: '5px'
          }}>JOBSTOCK</h1>
        </div>

        <div className="container position-relative" style={{ zIndex: 1 }}>
          
          {/* Header Row: Logo & Contact */}
          <div className="row align-items-center mb-4">
            <div className="col-md-6 d-flex align-items-center">
              <Link href="/">
                <img
                  src="/assets/img/logo-light.png"
                  style={{ height: "32px", width: "auto" }}
                  alt="JobStock"
                />
              </Link>
            </div>
            <div className="col-md-6 text-md-end mt-3 mt-md-0">
              <div className="d-inline-flex gap-4 align-items-center flex-wrap" style={{ fontSize: '0.85rem', color: '#a8c6c4' }}>
                <div><i className="fa-solid fa-location-dot me-2"></i>#176 jp nagar, banglore</div>
                <div><i className="fa-solid fa-envelope me-2"></i>gtech@gmail.com</div>
              </div>
            </div>
          </div>

          {/* Second Row: Subtitle & Socials */}
          <div className="row align-items-center mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="col-md-6">
              <p className="m-0" style={{ color: '#a8c6c4', fontSize: '0.95rem', maxWidth: '450px', lineHeight: 1.6 }}>
                Find the right opportunities, connect with top companies, and build your career with JobStock.
              </p>
            </div>
            <div className="col-md-6 text-md-end mt-4 mt-md-0">
              <div className="d-inline-flex gap-3">
                <a href="https://facebook.com" className="social-icon-btn"><i className="fa-brands fa-facebook-f"></i></a>
                <a href="https://linkedin.com" className="social-icon-btn"><i className="fa-brands fa-linkedin-in"></i></a>
                <a href="https://twitter.com" className="social-icon-btn"><i className="fa-brands fa-twitter"></i></a>
                <a href="https://github.com" className="social-icon-btn"><i className="fa-brands fa-github"></i></a>
              </div>
            </div>
          </div>

          {/* 4 Equal Navigation Columns Grid */}
          <div className="row mb-5">
            {/* Column 1: For Job Seekers */}
            <div className="col-lg-3 col-md-6 mb-4 mb-lg-0 footer-widget">
              <h4 className="widget-title">FOR JOB SEEKERS</h4>
              <ul className="footer-menu">
                <li><SmartFooterLink href="/jobs" label="Find Jobs" /></li>
                <li><SmartFooterLink href="/candidates" label="Explore Candidates" /></li>
                <li><SmartFooterLink href="/employers" label="Explore Companies" /></li>
                <li><SmartFooterLink href="/candidate-saved-jobs" label="Saved Jobs" requiredRole="CANDIDATE" /></li>
                <li><SmartFooterLink href="/candidate-applied-jobs" label="Applied Jobs" requiredRole="CANDIDATE" /></li>
                <li><SmartFooterLink href="/candidate-profile" label="My Profile" requiredRole="CANDIDATE" /></li>
                <li><SmartFooterLink href="/candidate-alert-job" label="Job Alerts" requiredRole="CANDIDATE" /></li>
              </ul>
            </div>

            {/* Column 2: For Employers */}
            <div className="col-lg-3 col-md-6 mb-4 mb-lg-0 footer-widget">
              <h4 className="widget-title">FOR EMPLOYERS</h4>
              <ul className="footer-menu">
                <li><SmartFooterLink href="/employer-submit-job" label="Post a Job" requiredRole="EMPLOYER" /></li>
                <li><SmartFooterLink href="/employer-jobs" label="Manage Jobs" requiredRole="EMPLOYER" /></li>
                <li><SmartFooterLink href="/employer-applicants-jobs" label="Manage Applications" requiredRole="EMPLOYER" /></li>
                <li><SmartFooterLink href="/employer-candidate-search" label="Find Candidates" requiredRole="EMPLOYER" /></li>
                <li><SmartFooterLink href="/employer-dashboard" label="Employer Dashboard" requiredRole="EMPLOYER" /></li>
                <li><SmartFooterLink href="/employer-profile" label="Company Profile" requiredRole="EMPLOYER" /></li>
              </ul>
            </div>

            {/* Column 3: AI & Career Tools */}
            <div className="col-lg-3 col-md-6 mb-4 mb-lg-0 footer-widget">
              <h4 className="widget-title">AI &amp; CAREER TOOLS</h4>
              <ul className="footer-menu">
                <li><SmartFooterLink href="/candidate-resume-builder" label="AI Resume Builder" requiredRole="CANDIDATE" /></li>
                <li><SmartFooterLink href="/candidate-resume-scanner" label="AI Resume Scanner" requiredRole="CANDIDATE" /></li>
                <li><SmartFooterLink href="/candidate-smart-match" label="Smart Job Match" requiredRole="CANDIDATE" /></li>
                <li><SmartFooterLink href="/candidate-mock-interview" label="Mock AI Interview" requiredRole="CANDIDATE" /></li>
                <li><SmartFooterLink href="/candidate-skill-assessment" label="Skill Assessment" requiredRole="CANDIDATE" /></li>
                <li><SmartFooterLink href="/candidate-career-navigator" label="Career Navigator" requiredRole="CANDIDATE" /></li>
              </ul>
            </div>

            {/* Column 4: Company */}
            <div className="col-lg-3 col-md-6 mb-4 mb-lg-0 footer-widget">
              <h4 className="widget-title">COMPANY</h4>
              <ul className="footer-menu">
                <li><SmartFooterLink href="/about-us" label="About Us" /></li>
                <li><SmartFooterLink href="/blog" label="Latest News &amp; Blog" /></li>
                <li><SmartFooterLink href="/faq" label="FAQs" /></li>
                <li><SmartFooterLink href="/help" label="Help &amp; Support" /></li>
                <li><SmartFooterLink href="/contact" label="Contact Us" /></li>
                <li><SmartFooterLink href="/privacy" label="Privacy &amp; Terms" /></li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="row pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="col-md-6">
              <p className="m-0" style={{ fontSize: '0.8rem', color: '#a8c6c4' }}>&copy; 2026 JobStock. All rights reserved.</p>
            </div>
            <div className="col-md-6 text-md-end mt-2 mt-md-0">
              <p className="m-0" style={{ fontSize: '0.8rem', color: '#a8c6c4' }}>
                <i className="fa-solid fa-code me-1"></i> Designed &amp; Built for Career Growth
              </p>
            </div>
          </div>
        </div>

        <style jsx>{\`
          .footer-widget .widget-title {
            color: #ffffff;
            font-size: 0.8rem;
            font-weight: 700;
            letter-spacing: 1px;
            margin-bottom: 25px;
            text-transform: uppercase;
          }
          .footer-menu {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .footer-menu li {
            margin-bottom: 12px;
          }
          .footer-menu li :global(a) {
            color: #a8c6c4;
            text-decoration: none;
            font-size: 0.85rem;
            transition: all 0.2s ease;
          }
          .footer-menu li :global(a:hover) {
            color: #ffffff;
          }
          .social-icon-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.2);
            color: #a8c6c4;
            text-decoration: none;
            font-size: 0.85rem;
            transition: all 0.2s ease;
          }
          .social-icon-btn:hover {
            border-color: #ffffff;
            color: #ffffff;
            background-color: rgba(255,255,255,0.1);
          }
        \`}</style>
      </footer>

      <RoleMismatchModal
        show={!!mismatchRole}
        requiredRole={mismatchRole}
        onClose={() => setMismatchRole(null)}
        onOpenLogin={openLoginModal}
      />
    </>
  );
}`;

const matchStart = code.indexOf('  return (\n    <>\n      <footer');
if(matchStart === -1) {
  const backupMatch = code.indexOf('  return (\r\n    <>\r\n      <footer');
  if(backupMatch !== -1) {
    code = code.substring(0, backupMatch) + newFooterReturn;
    fs.writeFileSync('src/components/Footer.tsx', code);
    console.log('Successfully wrote Footer.tsx');
  } else {
    console.log('Match failed for Footer.tsx');
  }
} else {
  code = code.substring(0, matchStart) + newFooterReturn;
  fs.writeFileSync('src/components/Footer.tsx', code);
  console.log('Successfully wrote Footer.tsx');
}
