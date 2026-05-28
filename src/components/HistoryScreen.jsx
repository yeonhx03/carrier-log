const searchTypes = [
  { id: 'date', label: '날짜' },
  { id: 'carType', label: '차종' },
  { id: 'carNumber', label: '차량번호' },
  { id: 'note', label: '비고' },
]

function getSearchPlaceholder(searchType) {
  if (searchType === 'date') {
    return '예: 4월6일'
  }

  if (searchType === 'carType') {
    return '예: 그랜저'
  }

  if (searchType === 'carNumber') {
    return '예: 3273'
  }

  return '예: 긴급출동'
}

export default function HistoryScreen({
  historyGroups,
  isSearchOpen,
  searchType,
  searchValue,
  selectedMonth,
  availableMonths,
  onToggleSearch,
  onChangeSearchType,
  onChangeSearchValue,
  onChangeMonth,
  onSelectCompany,
  onBack,
}) {
  const isSearchMode = Boolean(searchValue.trim())

  return (
    <section className="phone-screen history-screen">
      <header className="screen-header">
        <p>{isSearchMode ? '전체 검색' : '월별 정리'}</p>
        <h1 className="screen-title">내역 보기</h1>
      </header>

      {isSearchOpen && (
        <section className="history-search-panel">
          <div className="history-search-types">
            {searchTypes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeSearchType(item.id)}
                className={searchType === item.id ? 'is-selected' : ''}
              >
                {item.label}
              </button>
            ))}
          </div>

          <label className="history-search">
            <span>검색</span>
            <input
              type="search"
              value={searchValue}
              onChange={(event) => onChangeSearchValue(event.target.value)}
              placeholder={getSearchPlaceholder(searchType)}
            />
          </label>
        </section>
      )}

      <label className="history-month-select">
        <span>조회 월</span>
        <select
          value={selectedMonth}
          onChange={(event) => onChangeMonth(event.target.value)}
        >
          {availableMonths.map((month) => (
            <option key={month.key} value={month.key}>
              {month.year}년 {month.month}월
            </option>
          ))}
        </select>
      </label>

      <div className="history-list">
        {historyGroups.map((monthGroup) => (
          <section key={monthGroup.key} className="history-month-group">
            {isSearchMode && (
              <h2>
                {monthGroup.year}년 {monthGroup.month}월
              </h2>
            )}

            {monthGroup.companies.map((companyGroup) => {
              const totalKm = companyGroup.logs.reduce(
                (sum, log) => sum + Number(log.extraKm || 0),
                0,
              )

              return (
                <button
                  key={`${monthGroup.key}-${companyGroup.companyId}`}
                  type="button"
                  onClick={() => onSelectCompany(monthGroup.key, companyGroup.companyId)}
                  className="history-company-summary"
                >
                  <span>{companyGroup.companyName}</span>
                  <strong>
                    {companyGroup.logs.length}건 / {totalKm}km
                  </strong>
                </button>
              )
            })}
          </section>
        ))}
        {historyGroups.length === 0 && (
          <p className="empty-history">검색 결과가 없습니다.</p>
        )}
      </div>

      <button type="button" onClick={onBack} className="small-back-button">
        뒤로
      </button>
      <button
        type="button"
        className={[
          'small-search-button',
          isSearchOpen ? 'is-active' : '',
        ].join(' ')}
        onClick={onToggleSearch}
      >
        검색
      </button>
    </section>
  )
}
