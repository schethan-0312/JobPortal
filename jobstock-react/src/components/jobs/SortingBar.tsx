"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface SortingBarProps {
  total: number;
  shown: number;
}

export default function SortingBar({ total, shown }: SortingBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sortBy = searchParams.get("sortBy") ?? "newest";
  const pageSize = searchParams.get("pageSize") ?? "12";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="item-shorting-box">
      <div className="item-shorting clearfix">
        <div className="left-column">
          <h4 className="m-sm-0 mb-2">
            {total === 0 ? "No results found" : `Showing ${shown} of ${total} Results`}
          </h4>
        </div>
      </div>
      <div className="item-shorting-box-right">
        <div className="shorting-by me-2 small">
          <select value={sortBy} onChange={(e) => updateParam("sortBy", e.target.value)}>
            <option value="newest">Sort by (Newest)</option>
            <option value="salary">Sort by (Salary)</option>
          </select>
        </div>
        <div className="shorting-by small">
          <select value={pageSize} onChange={(e) => updateParam("pageSize", e.target.value)}>
            <option value="12">12 Per Page</option>
            <option value="24">24 Per Page</option>
            <option value="50">50 Per Page</option>
          </select>
        </div>
      </div>
    </div>
  );
}
