export default function SettingsPanel({
  companies,
  newCompanyName,
  onClose,
  onChangeNewCompanyName,
  onAddCompany,
  onRenameCompany,
  onDeleteCompany,
}) {
  return (
    <div className="setting-backdrop" role="presentation">
      <section className="setting-panel" aria-label="보험사 설정">
        <div className="setting-header">
          <h2>보험사 관리</h2>
          <button type="button" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="setting-list">
          {companies.map((company) => (
            <div key={company.id} className="setting-row">
              <input
                type="text"
                defaultValue={company.name}
                onBlur={(event) => {
                  const nextName = event.target.value.trim()

                  if (!nextName) {
                    event.target.value = company.name
                    return
                  }

                  if (
                    companies.some(
                      (item) => item.id !== company.id && item.name === nextName,
                    )
                  ) {
                    event.target.value = company.name
                  }

                  onRenameCompany(company.id, event.target.value)
                }}
              />
              <button type="button" onClick={() => onDeleteCompany(company.id)}>
                삭제
              </button>
            </div>
          ))}
        </div>

        <div className="setting-add-row">
          <input
            type="text"
            value={newCompanyName}
            onChange={(event) => onChangeNewCompanyName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onAddCompany()
              }
            }}
            placeholder="새 보험사"
          />
          <button type="button" onClick={onAddCompany}>
            추가
          </button>
        </div>
      </section>
    </div>
  )
}
