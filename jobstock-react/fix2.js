const fs = require('fs');
let code = fs.readFileSync('src/app/employer-jobs/page.tsx', 'utf8');

const target = /<button[\s\S]*?onClick=\{\(\) => toggleStatus\(item\)\}/;

const replacement = `
                                <a
                                  href={\`/employer-submit-job?id=\${item.id}\`}
                                  className="btn btn-sm btn-outline-primary px-3 fw-medium"
                                >
                                  Edit
                                </a>

                                <button
                                  type="button"
                                  className={\`btn btn-sm px-3 fw-medium \${
                                    item.status === "OPEN" ? "btn-outline-warning" : "btn-outline-success"
                                  }\`}
                                  disabled={updatingId === item.id || deletingId === item.id}
                                  onClick={() => toggleStatus(item)}
`;

code = code.replace(target, replacement.trim());

fs.writeFileSync('src/app/employer-jobs/page.tsx', code, 'utf8');
console.log('Added Edit button!');
