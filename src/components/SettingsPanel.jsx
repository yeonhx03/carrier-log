export default function SettingsPanel({
  section,
  currentUser,
  isLocalOnlyMode,
  companies,
  noteCategories,
  fixedDeduction,
  newCompanyName,
  newNoteCategoryName,
  newNoteCategoryPrice,
  onClose,
  onChangeSection,
  onGoogleSignIn,
  onSignOut,
  onChangeNewCompanyName,
  onAddCompany,
  onRenameCompany,
  onDeleteCompany,
  onChangeNewNoteCategoryName,
  onChangeNewNoteCategoryPrice,
  onAddNoteCategory,
  onUpdateNoteCategory,
  onUpdateDefaultUnitPrice,
  onUpdateFixedDeduction,
  onDeleteNoteCategory,
}) {
  const defaultCategory = noteCategories.find((category) => category.value === '')
  const editableCategories = noteCategories.filter((category) => category.value)

  const renderMenu = () => (
    <>
      <div className="setting-header">
        <h2>설정</h2>
        <button type="button" onClick={onClose}>
          닫기
        </button>
      </div>

      <div className="setting-account-card">
        <span>로그인 정보</span>
        {currentUser ? (
          <>
            <strong>{currentUser.displayName || 'Google 사용자'}</strong>
            <p>{currentUser.email}</p>
            <button type="button" onClick={onSignOut}>
              로그아웃
            </button>
          </>
        ) : (
          <>
            <strong>{isLocalOnlyMode ? '로컬 저장 중' : '로그인 전'}</strong>
            <p>기기 변경 시 데이터를 유지하려면 구글로 로그인하세요.</p>
            <button type="button" onClick={onGoogleSignIn}>
              Google 로그인
            </button>
          </>
        )}
      </div>

      <div className="setting-menu">
        <button type="button" onClick={() => onChangeSection('companies')}>
          <span>보험사 설정</span>
          <strong>추가 / 이름 변경 / 삭제</strong>
        </button>
        <button type="button" onClick={() => onChangeSection('rates')}>
          <span>정산 단가 수정</span>
          <strong>비고 카테고리 / 단가</strong>
        </button>
      </div>
    </>
  )

  const renderCompanySettings = () => (
    <>
      <div className="setting-header">
        <h2>보험사 설정</h2>
        <button type="button" onClick={() => onChangeSection('menu')}>
          뒤로
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
    </>
  )

  const renderRateSettings = () => (
    <>
      <div className="setting-header">
        <h2>정산 단가</h2>
        <button type="button" onClick={() => onChangeSection('menu')}>
          뒤로
        </button>
      </div>

      <div className="setting-list">
        <div className="setting-rate-row">
          <input type="text" value="비고 없음" readOnly />
          <input
            type="number"
            inputMode="numeric"
            min="0"
            defaultValue={defaultCategory?.unitPrice || 0}
            onBlur={(event) => onUpdateDefaultUnitPrice(event.target.value)}
          />
        </div>

        <div className="setting-rate-row">
          <input type="text" value="고정 공제" readOnly />
          <input
            type="number"
            inputMode="numeric"
            min="0"
            defaultValue={fixedDeduction}
            onBlur={(event) => onUpdateFixedDeduction(event.target.value)}
          />
        </div>

        {editableCategories.map((category) => (
          <div key={category.value} className="setting-rate-row">
            <input
              type="text"
              defaultValue={category.label}
              onBlur={(event) => {
                onUpdateNoteCategory(
                  category.value,
                  event.target.value,
                  category.unitPrice,
                )
              }}
            />
            <input
              type="number"
              inputMode="numeric"
              min="0"
              defaultValue={category.unitPrice}
              onBlur={(event) => {
                onUpdateNoteCategory(
                  category.value,
                  category.label,
                  event.target.value,
                )
              }}
            />
            <button
              type="button"
              onClick={() => onDeleteNoteCategory(category.value)}
            >
              삭제
            </button>
          </div>
        ))}
      </div>

      <div className="setting-rate-add-row">
        <input
          type="text"
          value={newNoteCategoryName}
          onChange={(event) => onChangeNewNoteCategoryName(event.target.value)}
          placeholder="새 비고"
        />
        <input
          type="number"
          inputMode="numeric"
          min="0"
          value={newNoteCategoryPrice}
          onChange={(event) => onChangeNewNoteCategoryPrice(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onAddNoteCategory()
            }
          }}
          placeholder="단가"
        />
        <button type="button" onClick={onAddNoteCategory}>
          추가
        </button>
      </div>
    </>
  )

  return (
    <div className="setting-backdrop" role="presentation">
      <section className="setting-panel" aria-label="설정">
        {section === 'menu' && renderMenu()}
        {section === 'companies' && renderCompanySettings()}
        {section === 'rates' && renderRateSettings()}
      </section>
    </div>
  )
}
