export default function LogDetailView({ log, companyName, onBack }) {
  return (
    <section className="phone-screen input-screen log-detail-screen">
      <header className="screen-header input-header">
        <p>{companyName}</p>
        <h1 className="screen-title selected-company-title">상세 내역</h1>
      </header>

      <div className="input-flow">
        <div className="flow-field readonly-field">
          <span>날짜</span>
          <strong>{log.dateText}</strong>
        </div>
        <div className="flow-field readonly-field">
          <span>차종</span>
          <strong>{log.carType}</strong>
        </div>
        <div className="flow-field readonly-field">
          <span>차량번호</span>
          <strong>{log.carNumber}</strong>
        </div>
        <div className="flow-field readonly-field">
          <span>KM</span>
          <strong>{log.extraKm || 0}</strong>
        </div>
        <div className="flow-field readonly-field note-field">
          <span>비고</span>
          <strong>{log.note || '-'}</strong>
        </div>
      </div>

      <div className="bottom-actions">
        <button type="button" onClick={onBack} className="small-back-button">
          뒤로
        </button>
      </div>
    </section>
  )
}
