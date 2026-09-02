"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface SortingBarProps {
  total: number;
  shown: number;
  currentPage?: number;
  pageSize?: number;
}

export default function SortingBar(props: SortingBarProps) {
  return (
    <Suspense fallback={null}>
      <SortingBarContent {...props} />
    </Suspense>
  );
}

function SortingBarContent({ total, shown, currentPage = 1, pageSize = 12 }: SortingBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = parseInt(searchParams.get("page") || currentPage.toString(), 10) || 1;
  const currentSize = parseInt(searchParams.get("pageSize") || pageSize.toString(), 10) || 12;
  const currentSort = searchParams.get("sortBy") || "default";

  const start = total === 0 ? 0 : (page - 1) * currentSize + 1;
  const end = total === 0 ? 0 : Math.min(total, (page - 1) * currentSize + shown);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "default") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== "page") {
      params.set("page", "1");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="item-shorting-box d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 bg-white rounded-3 shadow-sm border mb-4">
      <div className="item-shorting clearfix">
        <div className="left-column">
          <h5 className="m-0 fw-semibold text-dark fs-6">
            {total === 0 ? "No results found" : `Showing ${start} - ${end} of ${total} Results`}
          </h5>
        </div>
      </div>
      <div className="item-shorting-box-right d-flex align-items-center gap-2">
        <div className="shorting-by">
          <select
            className="form-select form-select-sm rounded-3 py-1.5 px-3 border"
            value={currentSort}
            onChange={(e) => updateParam("sortBy", e.target.value)}
          >
            <option value="default">Sort by (Default)</option>
            <option value="featured">Sort by (Featured)</option>
            <option value="experience">Sort by (Experience)</option>
            <option value="newest">Sort by (Post Date)</option>
            <option value="name_asc">Sort by (Name: A to Z)</option>
            <option value="name_desc">Sort by (Name: Z to A)</option>
          </select>
        </div>
        <div className="shorting-by">
          <select
            className="form-select form-select-sm rounded-3 py-1.5 px-3 border"
            value={currentSize.toString()}
            onChange={(e) => updateParam("pageSize", e.target.value)}
          >
            <option value="10">10 Per Page</option>
            <option value="12">12 Per Page</option>
            <option value="20">20 Per Page</option>
            <option value="50">50 Per Page</option>
          </select>
        </div>
      </div>
    </div>
  );
}
