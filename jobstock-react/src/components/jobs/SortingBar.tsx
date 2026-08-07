interface SortingBarProps {
  total: number;
  shown: number;
}

export default function SortingBar({ total, shown }: SortingBarProps) {
  return (
    <div className="item-shorting-box">
      <div className="item-shorting clearfix">
        <div className="left-column">
          <h4 className="m-sm-0 mb-2">
            {total === 0 ? "No results found" : `Showing 1 - ${shown} of ${total} Results`}
          </h4>
        </div>
      </div>
      <div className="item-shorting-box-right">
        <div className="shorting-by me-2 small">
          <select>
            <option value="0">Short by (Default)</option>
            <option value="1">Short by (Featured)</option>
            <option value="2">Short by (Urgent)</option>
            <option value="3">Short by (Post Date)</option>
          </select>
        </div>
        <div className="shorting-by small">
          <select>
            <option value="0">10 Per Page</option>
            <option value="1">20 Per Page</option>
            <option value="2">50 Per Page</option>
          </select>
        </div>
      </div>
    </div>
  );
}
