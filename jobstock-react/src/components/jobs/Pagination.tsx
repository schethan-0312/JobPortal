"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
  total: number;
  pageSize: number;
}

export default function Pagination({ total, pageSize }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(total / pageSize);
  const currentPage = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  if (totalPages <= 1) {
    return null;
  }

  function goToPage(num: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(num));
    router.push(`/jobs?${params.toString()}`);
  }

  return (
    <div className="row">
      <div className="col-lg-12 col-md-12 col-sm-12">
        <nav aria-label="Page navigation">
          <ul className="pagination">
            <li className={`page-item${currentPage <= 1 ? " disabled" : ""}`}>
              <button
                type="button"
                className="page-link"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                aria-label="Previous"
              >
                <span aria-hidden="true">&laquo;</span>
              </button>
            </li>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <li className={`page-item${num === currentPage ? " active" : ""}`} key={num}>
                <button type="button" className="page-link" onClick={() => goToPage(num)}>
                  {num}
                </button>
              </li>
            ))}
            <li className={`page-item${currentPage >= totalPages ? " disabled" : ""}`}>
              <button
                type="button"
                className="page-link"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                aria-label="Next"
              >
                <span aria-hidden="true">&raquo;</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
