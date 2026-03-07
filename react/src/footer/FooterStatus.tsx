import { useFooter } from '../FooterContext'

export default function FooterStatus() {
  const { pageNoList, pageNo, pageSize, wordCount, rowNo, colNo } = useFooter()
  return (
    <>
      <span>Visible Pages: <span className="page-no-list">{pageNoList}</span></span>
      <span className="footer-divider" />
      <span>Pages: <span className="page-no">{pageNo}</span>/<span className="page-size">{pageSize}</span></span>
      <span className="footer-divider" />
      <span>Words: <span className="word-count">{wordCount}</span></span>
      <span className="footer-divider" />
      <span>Row: <span className="row-no">{rowNo}</span></span>
      <span className="footer-divider" />
      <span>Column: <span className="col-no">{colNo}</span></span>
    </>
  )
}
