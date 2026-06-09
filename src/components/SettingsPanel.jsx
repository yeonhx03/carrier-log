import { useState } from 'react'

export default function SettingsPanel({
  section,
  currentUser,
  isLocalOnlyMode,
  isDeletingAccount,
  deleteAccountError,
  companies,
  noteCategories,
  fixedDeduction,
  extraKmRate,
  newCompanyName,
  newNoteCategoryName,
  newNoteCategoryPrice,
  onClose,
  onChangeSection,
  onGoogleSignIn,
  onSignOut,
  onDeleteAccount,
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
  onUpdateExtraKmRate,
  onDeleteNoteCategory,
}) {
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
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
            <button
              type="button"
              className="setting-account-delete-link"
              onClick={() => {
                setDeleteConfirmation('')
                onChangeSection('account')
              }}
            >
              계정 및 데이터 삭제
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
          <strong>기본 / KM / 비고 단가</strong>
        </button>
      </div>
    </>
  )

  const renderAccountSettings = () => (
    <>
      <div className="setting-header">
        <h2>계정 및 데이터 삭제</h2>
        <button
          type="button"
          disabled={isDeletingAccount}
          onClick={() => onChangeSection('menu')}
        >
          뒤로
        </button>
      </div>

      <div className="setting-account-delete-card">
        <strong>삭제되는 항목</strong>
        <p>
          Carrier Log 로그인 계정과 서버에 저장된 운행일지, 보험사, 정산
          단가, 입금 계좌 및 요청사항 데이터가 모두 삭제됩니다.
        </p>
        <p>삭제한 데이터는 복구할 수 없습니다.</p>
      </div>

      <label className="setting-delete-confirmation">
        <span>계속하려면 아래에 삭제를 입력하세요.</span>
        <input
          type="text"
          value={deleteConfirmation}
          disabled={isDeletingAccount}
          onChange={(event) => setDeleteConfirmation(event.target.value)}
          placeholder="삭제"
          autoComplete="off"
        />
      </label>

      {deleteAccountError && (
        <p className="setting-delete-error">{deleteAccountError}</p>
      )}

      <button
        type="button"
        className="setting-delete-account-button"
        disabled={deleteConfirmation !== '삭제' || isDeletingAccount}
        onClick={onDeleteAccount}
      >
        {isDeletingAccount ? '삭제 중' : '계정 및 데이터 삭제'}
      </button>
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
        <div className="setting-rate-row setting-rate-base-row">
          <input type="text" value="비고 없음" readOnly />
          <input
            type="number"
            inputMode="numeric"
            min="0"
            defaultValue={defaultCategory?.unitPrice || 0}
            onBlur={(event) => onUpdateDefaultUnitPrice(event.target.value)}
          />
        </div>

        <div className="setting-rate-row setting-rate-base-row">
          <input type="text" value="고정 공제" readOnly />
          <input
            type="number"
            inputMode="numeric"
            min="0"
            defaultValue={fixedDeduction}
            onBlur={(event) => onUpdateFixedDeduction(event.target.value)}
          />
        </div>

        <div className="setting-rate-row setting-rate-base-row">
          <input type="text" value="기본 KM 단가" readOnly />
          <input
            type="number"
            inputMode="numeric"
            min="0"
            defaultValue={extraKmRate}
            onBlur={(event) => onUpdateExtraKmRate(event.target.value)}
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
        {section === 'account' && renderAccountSettings()}
        {section === 'companies' && renderCompanySettings()}
        {section === 'rates' && renderRateSettings()}
      </section>
    </div>
  )
}
