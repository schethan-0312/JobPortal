const fs = require('fs');

let content = fs.readFileSync('src/components/candidate-dashboard/CandidateSidebar.tsx', 'utf8');

// 1. Add setIsOpen state and styles
content = content.replace(
  /return \(\s*<>\s*<a\s*className="mobNavigation"/,
  `const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <style jsx global>{\`
        @media (max-width: 992px) {
          #MobNav {
            position: fixed !important;
            top: 0 !important;
            left: -280px !important;
            width: 280px !important;
            height: 100vh !important;
            z-index: 1050 !important;
            background: #ffffff !important;
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
            transition: left 0.3s ease !important;
            overflow-y: auto !important;
            display: block !important;
            visibility: hidden !important;
          }
          #MobNav.show {
            left: 0 !important;
            visibility: visible !important;
          }
        }
      \`}</style>

      <a
        className="mobNavigation"
        role="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: "pointer" }}`
);

// Remove the old data-bs-toggle attributes if they are still there
content = content.replace(/\s*data-bs-toggle="collapse"\s*href="#MobNav"\s*role="button"\s*aria-expanded="false"\s*aria-controls="MobNav"\s*>\s*<i/, '>\n        <i');

// Add the backdrop and replace the #MobNav div
content = content.replace(
  /<div className="collapse" id="MobNav">/,
  `{isOpen && (
        <div 
          className="sidebar-backdrop d-lg-none" 
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1040,
            cursor: "pointer"
          }}
        />
      )}
      <div className={\`collapse \${isOpen ? "show" : ""}\`} id="MobNav">`
);

// Add onClick to all Links and the logout button
content = content.replace(/<Link href="([^"]+)">/g, '<Link href="$1" onClick={() => setIsOpen(false)}>');
content = content.replace(/e\.preventDefault\(\); handleLogout\(\);/g, 'e.preventDefault(); setIsOpen(false); handleLogout();');

fs.writeFileSync('src/components/candidate-dashboard/CandidateSidebar.tsx', content, 'utf8');
console.log('Updated CandidateSidebar.tsx');
