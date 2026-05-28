export default function HistoryCompanyTable({
  monthGroup,
  companyGroup,
  onSelectLog,
  onBack,
}) {
  const totalKm = companyGroup.logs.reduce(
    (sum, log) => sum + Number(log.extraKm || 0),
    0,
  )

  return (
    <section className="phone-screen history-screen">
      <header className="screen-header">
        <p>
          {monthGroup.year}년 {monthGroup.month}월
        </p>
        <h1 className="screen-title">{companyGroup.companyName}</h1>
      </header>

      <article className="history-company-table selected-history-table">
        <div className="history-company-header">
          <strong>{companyGroup.companyName}</strong>
          <span>
            {companyGroup.logs.length}건 / {totalKm}km
          </span>
        </div>

        <div className="history-table-wrap">
          <table>
            <thead>
              <tr>
                <th>NO</th>
                <th>일자</th>
                <th>차종</th>
                <th>차량번호</th>
                <th>추가</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              {companyGroup.logs.map((log, index) => (
                <tr
                  key={log.id}
                  className="history-select-row"
                  onClick={() => onSelectLog(log.id)}
                >
                  <td>{index + 1}</td>
                  <td>{log.dateText}</td>
                  <td>{log.carType}</td>
                  <td>{log.carNumber}</td>
                  <td>{log.extraKm || ''}</td>
                  <td>{log.note || ''}</td>
                </tr>
              ))}
              <tr className="history-total-row">
                <td colSpan="4">합계</td>
                <td>{totalKm}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <button type="button" onClick={onBack} className="small-back-button">
        뒤로
      </button>
    </section>
  )
}
