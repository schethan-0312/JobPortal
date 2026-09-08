const fs = require('fs');

let code = fs.readFileSync('src/components/home/FeaturedJobs.tsx', 'utf8');

const newReturnBlock = `  return (
    <section className="py-5 bg-white position-relative">
      <div className="container py-2">
        <style>{\`
          .f-job-card {
            border: 1px solid #e9ecef;
            border-radius: 12px;
            background: #fff;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.02);
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          .f-job-gradient {
            height: 110px;
            background: linear-gradient(180deg, rgba(60,179,113,0.6) 0%, rgba(255,255,255,0) 100%);
            position: relative;
          }
          .f-job-logo-wrapper {
            position: absolute;
            bottom: -25px;
            left: 20px;
            width: 70px;
            height: 70px;
            background: #fff;
            border-radius: 12px;
            border: 1px solid #eaeaea;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            padding: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.03);
          }
          .f-job-content {
            padding: 35px 20px 20px;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
          }
          .f-job-title {
            font-size: 1.15rem;
            font-weight: 700;
            color: #000;
            margin-bottom: 2px;
          }
          .f-job-company {
            font-size: 0.85rem;
            color: #999;
            margin-bottom: 4px;
          }
          .f-job-location {
            font-size: 0.85rem;
            color: #999;
            margin-bottom: 15px;
          }
          .f-job-location i {
            color: #ff4d4d;
            margin-right: 4px;
          }
          .f-job-divider {
            height: 1px;
            background-color: #f0f0f0;
            margin: auto -20px 15px -20px;
          }
          .f-job-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .f-job-posted {
            font-size: 0.85rem;
            color: #666;
          }
          .f-job-posted strong {
            color: #222;
          }
          .f-btn-save {
            background-color: #f1f1f1;
            color: #333;
            border: none;
            border-radius: 20px;
            padding: 5px 12px;
            font-size: 0.75rem;
            font-weight: 600;
            margin-right: 8px;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
          }
          .f-btn-save:hover {
            background-color: #e2e2e2;
            color: #000;
          }
          .f-btn-apply {
            background-color: #3cb371;
            color: #fff;
            border: none;
            border-radius: 20px;
            padding: 5px 12px;
            font-size: 0.75rem;
            font-weight: 600;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
          }
          .f-btn-apply:hover {
            background-color: #2e8b57;
            color: #fff;
          }
          .f-slider-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: #3cb371;
            color: #fff;
            border: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-left: 10px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.2s;
          }
          .f-slider-btn:hover {
            background-color: #2e8b57;
          }
          .f-view-all {
            background-color: #3cb371;
            color: #fff;
            border: none;
            border-radius: 30px;
            padding: 12px 25px;
            font-size: 1rem;
            font-weight: 600;
            margin-top: 30px;
            display: inline-block;
            text-decoration: none;
            transition: all 0.2s;
          }
          .f-view-all:hover {
            background-color: #2e8b57;
            color: white;
          }
        \`}</style>

        {/* Heading */}
        <div className="text-center mb-4">
          <h2 className="fw-bold fs-1 text-dark mb-2">
            Featured <span style={{ color: '#3cb371' }}>Jobs</span>
          </h2>
          <p className="text-muted" style={{ fontSize: '1.1rem' }}>
            Explore latest opening roles posted by verified employers on JobStock.
          </p>
        </div>

        {/* Controls */}
        <div className="d-flex justify-content-end mb-3">
          <button className="f-slider-btn"><i className="fa-solid fa-chevron-left"></i></button>
          <button className="f-slider-btn"><i className="fa-solid fa-chevron-right"></i></button>
        </div>

        {/* Jobs Grid */}
        <div className="row g-4">
          {jobs.slice(0, 3).map((item) => (
            <div className="col-xl-4 col-lg-4 col-md-6 col-sm-12" key={item.id}>
              <div className="f-job-card">
                <div className="f-job-gradient">
                  <div className="f-job-logo-wrapper">
                    <img
                      src={assetUrl(item.employer?.logoUrl) || "/assets/img/l-1.png"}
                      alt={item.employer?.companyName || "Employer"}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </div>
                </div>
                <div className="f-job-content">
                  <div className="f-job-title text-truncate">
                    <Link href={\`/job-detail/\${item.slug}\`} className="text-dark text-decoration-none">
                      {item.title}
                    </Link>
                  </div>
                  <div className="f-job-company text-truncate">
                    {item.employer?.companyName ?? "Verified Company"}
                  </div>
                  <div className="f-job-location text-truncate">
                    <i className="fa-solid fa-location-dot"></i>
                    {item.location ?? "Remote"}
                  </div>
                  
                  <div className="f-job-divider"></div>
                  
                  <div className="f-job-footer">
                    <div className="f-job-posted">
                      Posted: <strong>1 day ago</strong>
                    </div>
                    <div>
                      <button className="f-btn-save">
                        <i className="fa-solid fa-bookmark me-1"></i> Save
                      </button>
                      <Link href={\`/job-detail/\${item.slug}\`} className="f-btn-apply text-decoration-none">
                        <i className="fa-solid fa-bolt me-1"></i> Quick Apply
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View all jobs button */}
        <div className="text-start">
          <Link href="/jobs" className="f-view-all text-decoration-none">
            View all jobs
          </Link>
        </div>
      </div>
    </section>
  );
}`;

const returnRegex = /return \(\s*<section[\s\S]*?\);\n\}/;
code = code.replace(returnRegex, newReturnBlock);

fs.writeFileSync('src/components/home/FeaturedJobs.tsx', code);
console.log('Successfully updated FeaturedJobs.tsx');
