const fs = require('fs');
let content = fs.readFileSync('../jobstock-react/src/app/admin-employer-directory/[id]/page.tsx', 'utf8');

const target = \<button 
                      className="btn btn-sm btn-danger"
                      disabled={!!actingDecision || detail.status === "SUSPENDED"}
                      onClick={() => handleDecision("SUSPENDED")}
                    >
                      {actingDecision === "SUSPENDED" ? "Wait..." : "Suspend"}
                    </button>\;

const replacement = \<button 
                      className="btn btn-sm btn-danger"
                      disabled={!!actingDecision || detail.status === "SUSPENDED"}
                      onClick={() => handleDecision("SUSPENDED")}
                    >
                      {actingDecision === "SUSPENDED" ? "Wait..." : "Suspend"}
                    </button>
                    {detail.status === "SUSPENDED" && (
                      <button 
                        className="btn btn-sm btn-info text-white"
                        disabled={!!actingDecision}
                        onClick={() => handleDecision("VERIFIED")}
                      >
                        {actingDecision === "VERIFIED" ? "Wait..." : "Reopen"}
                      </button>
                    )}\;

content = content.replace(target, replacement);
fs.writeFileSync('../jobstock-react/src/app/admin-employer-directory/[id]/page.tsx', content);
