export default function HomeScreen({
  logsCount,
  onInput,
  onHistory,
  onExport,
  onSettlement,
  onSettings,
}) {
  return (
    <section className="phone-screen home-screen">
      <div className="brand-block">
        <p>운행일지</p>
        <h1 className="app-title">Carrier-log</h1>
      </div>

      <div className="home-actions">
        <button type="button" onClick={onInput} className="home-action-button action-input">
          <span>입력</span>
          <strong>새 운행 기록</strong>
        </button>
        <button type="button" onClick={onHistory} className="home-action-button action-history">
          <span>
            내역 <small>보기/수정/삭제</small>
          </span>
          <strong>{logsCount}건</strong>
        </button>
        <button type="button" onClick={onExport} className="home-action-button action-export">
          <span>내보내기</span>
          <strong>Excel / PDF</strong>
        </button>
        <button
          type="button"
          onClick={onSettlement}
          className="home-action-button action-settlement"
        >
          <span>정산 내역서</span>
          <strong>Excel / PDF</strong>
        </button>
      </div>

      <button
        type="button"
        onClick={onSettings}
        className="settings-fab"
        aria-label="설정"
      >
        <span />
      </button>
    </section>
  )
}
