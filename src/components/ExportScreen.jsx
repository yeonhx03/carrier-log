export default function ExportScreen({
  exportStep,
  exportMonths,
  selectedExportMonth,
  exportFormat,
  exportMode,
  exportGroups,
  selectedExportCompanyId,
  selectedCompanyGroups,
  monthLabel,
  onChangeMonth,
  onChangeFormat,
  onNext,
  onChangeMode,
  onChangeCompany,
  onRunExport,
  onBack,
}) {
  return (
    <section className="phone-screen export-screen">
      <header className="screen-header">
        <p>파일 생성</p>
        <h1 className="screen-title">내보내기</h1>
      </header>

      {exportStep === 'month' && (
        <div className="export-flow">
          <label className="history-month-select">
            <span>년월</span>
            <select value={selectedExportMonth} onChange={(event) => onChangeMonth(event.target.value)}>
              {exportMonths.map((month) => (
                <option key={month.key} value={month.key}>
                  {month.year}년 {month.month}월
                </option>
              ))}
            </select>
          </label>

          <div className="export-option-card">
            <strong>파일 형식</strong>
            <div className="export-segment">
              <button
                type="button"
                onClick={() => onChangeFormat('excel')}
                className={exportFormat === 'excel' ? 'is-selected' : ''}
              >
                엑셀
              </button>
              <button
                type="button"
                onClick={() => onChangeFormat('pdf')}
                className={exportFormat === 'pdf' ? 'is-selected' : ''}
              >
                PDF
              </button>
            </div>
          </div>

          <button type="button" onClick={onNext} className="export-next-button">
            다음
          </button>
        </div>
      )}

      {exportStep === 'mode' && (
        <div className="export-flow">
          <div className="export-summary">
            <span>{monthLabel}</span>
            <strong>{exportFormat === 'excel' ? '엑셀' : 'PDF'}</strong>
          </div>

          <div className="export-mode-grid">
            <button
              type="button"
              onClick={() => onChangeMode('all')}
              className={[
                'export-mode-button',
                exportMode === 'all' ? 'is-selected' : '',
              ].join(' ')}
            >
              <span>내보내기</span>
              <strong>전체</strong>
            </button>

            <button
              type="button"
              onClick={() => onChangeMode('company')}
              className={[
                'export-mode-button',
                exportMode === 'company' ? 'is-selected' : '',
              ].join(' ')}
            >
              <span>보험사별</span>
              <strong>1개</strong>
            </button>
          </div>

          {exportMode === 'company' && (
            <label className="history-month-select">
              <span>보험사</span>
              <select
                value={selectedExportCompanyId}
                onChange={(event) => onChangeCompany(event.target.value)}
              >
                {exportGroups.map((group) => (
                  <option key={group.companyId} value={group.companyId}>
                    {group.companyName}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="export-preview">
            <strong>생성 대상</strong>
            <span>
              {selectedCompanyGroups.length > 0
                ? selectedCompanyGroups
                    .map((group) => `${group.companyName} ${group.logs.length}건`)
                    .join(', ')
                : '내역 없음'}
            </span>
          </div>

          <button type="button" onClick={onRunExport} className="export-next-button">
            파일 만들기
          </button>
        </div>
      )}

      <button type="button" onClick={onBack} className="small-back-button">
        뒤로
      </button>
    </section>
  )
}
