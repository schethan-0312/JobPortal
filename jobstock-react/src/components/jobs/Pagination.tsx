"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface PaginationProps {
  total: number;
  pageSize: number;
  currentPage?: number;
}

function PaginationInner({ total, pageSize, currentPage }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) {
    return null;
  }

  const pageFromQuery = searchParams.get("page");
  const activePage = currentPage || (pageFromQuery ? parseInt(pageFromQuery, 10) : 1) || 1;

  function createPageUrl(pageNum: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNum.toString());
    return `${pathname}?${params.toString()}`;
  }

  let startPage = Math.max(1, activePage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  const pageNumbers: number[] = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="row">
      <div className="col-lg-12 col-md-12 col-sm-12">
        <nav aria-label="Page navigation">
          <ul className="pagination justify-content-center">
            {/* Previous */}
            <li className={`page-item ${activePage <= 1 ? "disabled" : ""}`}>
              {activePage <= 1 ? (
                <span className="page-link" aria-label="Previous">
                  <span aria-hidden="true">&laquo;</span>
                </span>
              ) : (
                <Link className="page-link" href={createPageUrl(activePage - 1)} aria-label="Previous">
                  <span aria-hidden="true">&laquo;</span>
                </Link>
              )}
            </li>

            {/* First Jump */}
            {startPage > 1 && (
              <>
                <li className="page-item">
                  <Link className="page-link" href={createPageUrl(1)}>1</Link>
                </li>
                {startPage > 2 && (
                  <li className="page-item disabled">
                    <span className="page-link">...</span>
                  </li>
                )}
              </>
            )}

            {/* Page Numbers */}
            {pageNumbers.map((num) => (
              <li className={`page-item${num === activePage ? " active" : ""}`} key={num}>
                {num === activePage ? (
                  <span className="page-link">{num}</span>
                ) : (
                  <Link className="page-link" href={createPageUrl(num)}>
                    {num}
                  </Link>
                )}
              </li>
            ))}

            {/* Last Jump */}
            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && (
                  <li className="page-item disabled">
                    <span className="page-link">...</span>
                  </li>
                )}
                <li className="page-item">
                  <Link className="page-link" href={createPageUrl(totalPages)}>{totalPages}</Link>
                </li>
              </>
            )}

            {/* Next */}
            <li className={`page-item ${activePage >= totalPages ? "disabled" : ""}`}>
              {activePage >= totalPages ? (
                <span className="page-link" aria-label="Next">
                  <span aria-hidden="true">&raquo;</span>
                </span>
              ) : (
                <Link className="page-link" href={createPageUrl(activePage + 1)} aria-label="Next">
                  <span aria-hidden="true">&raquo;</span>
                </Link>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}

export default function Pagination(props: PaginationProps) {
  return (
    <Suspense fallback={null}>
      <PaginationInner {...props} />
    </Suspense>
  );
}
