const fs = require('fs');
let code = fs.readFileSync('src/app/employer-jobs/page.tsx', 'utf8');

const target = /<button[\s\S]*?onClick=\{\(\) => toggleStatus\(item\)\}[\s\S]*?<\/button>/;

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
                                    item.status === "OPEN" 
                                      ? "btn-outline-warning" 
                                      : item.status === "DRAFT"
                                      ? "btn-outline-success"
                                      : "btn-outline-success"
                                  }\`}
                                  disabled={updatingId === item.id || deletingId === item.id}
                                  onClick={() => toggleStatus(item)}
                                >
                                  {updatingId === item.id 
                                    ? "..." 
                                    : item.status === "OPEN" 
                                    ? "Close" 
                                    : item.status === "DRAFT"
                                    ? "Publish"
                                    : "Reopen"}
                                </button>
`.trim();

code = code.replace(target, replacement);

fs.writeFileSync('src/app/employer-jobs/page.tsx', code, 'utf8');
console.log('Successfully added Edit and Publish buttons!');
