const fs = require('fs');

let code = fs.readFileSync('src/components/home/FeaturedJobs.tsx', 'utf8');

// 1. Update Job interface
code = code.replace(
  'employer?: Employer;\n}',
  'employer?: Employer;\n  createdAt?: string;\n}'
);

// 2. Insert getTimeAgo function
const timeAgoFunc = `
function getTimeAgo(dateString?: string) {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  return \`\${diffDays} days ago\`;
}
`;
if (!code.includes('getTimeAgo')) {
  code = code.replace('function formatAmount', timeAgoFunc + '\nfunction formatAmount');
}

// 3. Update the pageSize in the API call
code = code.replace('pageSize=4', 'pageSize=15');
// Wait, there might be a slice(0, 4) right after the api call. Let's find it.
code = code.replace('setJobs((data.items ?? []).slice(0, 4));', 'setJobs(data.items ?? []);');

// 4. Update the Component function body to include state
code = code.replace(
  'const [loaded, setLoaded] = useState(false);',
  'const [loaded, setLoaded] = useState(false);\n  const [currentIndex, setCurrentIndex] = useState(0);\n\n  const nextSlide = () => {\n    if (currentIndex < Math.max(0, jobs.length - 3)) {\n      setCurrentIndex(currentIndex + 1);\n    }\n  };\n\n  const prevSlide = () => {\n    if (currentIndex > 0) {\n      setCurrentIndex(currentIndex - 1);\n    }\n  };'
);

// 5. Update slider buttons
code = code.replace(
  /<button className="f-slider-btn"><i className="fa-solid fa-chevron-left"><\/i><\/button>\s*<button className="f-slider-btn"><i className="fa-solid fa-chevron-right"><\/i><\/button>/,
  `<button className="f-slider-btn" onClick={prevSlide} disabled={currentIndex === 0} style={{ opacity: currentIndex === 0 ? 0.5 : 1, cursor: currentIndex === 0 ? 'default' : 'pointer' }}><i className="fa-solid fa-chevron-left"></i></button>
          <button className="f-slider-btn" onClick={nextSlide} disabled={currentIndex >= Math.max(0, jobs.length - 3)} style={{ opacity: currentIndex >= Math.max(0, jobs.length - 3) ? 0.5 : 1, cursor: currentIndex >= Math.max(0, jobs.length - 3) ? 'default' : 'pointer' }}><i className="fa-solid fa-chevron-right"></i></button>`
);

// 6. Update mapping to use slice(currentIndex, currentIndex + 3)
code = code.replace(
  /\{jobs\.slice\(0, 3\)\.map\(\(item\) => \(/,
  '{jobs.slice(currentIndex, currentIndex + 3).map((item) => ('
);

// 7. Dynamic posted date
code = code.replace(
  /Posted: <strong>1 day ago<\/strong>/,
  'Posted: <strong>{getTimeAgo(item.createdAt)}</strong>'
);

// 8. Remove Save button and rename Quick Apply to View Details
const saveBtnRegex = /<button className="f-btn-save">[\s\S]*?<\/button>\s*<Link href=\{\`\/job-detail\/\$\{item\.slug\}\`\} className="f-btn-apply text-decoration-none">[\s\S]*?<\/Link>/;
code = code.replace(saveBtnRegex, `<Link href={\`/job-detail/\${item.slug}\`} className="f-btn-apply text-decoration-none">
                        View Details
                      </Link>`);

fs.writeFileSync('src/components/home/FeaturedJobs.tsx', code);
console.log('Successfully applied all dynamic and slider changes.');
