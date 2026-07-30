interface PaginationProps {
  total: number;
  pageSize: number;
}

export default function Pagination({ total, pageSize }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="row">
      <div className="col-lg-12 col-md-12 col-sm-12">
        <nav aria-label="Page navigation example">
          <ul className="pagination">
            <li className="page-item">
              <a className="page-link" href="JavaScript:Void(0);" aria-label="Previous">
                <span aria-hidden="true">&laquo;</span>
              </a>
            </li>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <li className={`page-item${num === 1 ? " active" : ""}`} key={num}>
                <a className="page-link" href="JavaScript:Void(0);">
                  {num}
                </a>
              </li>
            ))}
            <li className="page-item">
              <a className="page-link" href="JavaScript:Void(0);" aria-label="Next">
                <span aria-hidden="true">&raquo;</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
