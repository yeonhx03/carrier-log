import { useState } from 'react'
import { DEDUCTION_RATE, EXTRA_KM_RATE } from '../utils/settlementFiles'

function formatMoney(value) {
  return Math.round(value).toLocaleString('ko-KR')
}

export default function SettlementScreen({
  months,
  selectedMonth,
  format,
  noteCategories,
  summary,
  logsCount,
  step,
  accounts,
  accountTemplates,
  requestText,
  requestTemplates,
  onChangeMonth,
  onChangeFormat,
  onNext,
  onUpdateAccount,
  onAddAccount,
  onDeleteAccount,
  onRegisterAccountTemplate,
  onUseAccountTemplate,
  onChangeRequestText,
  onUseRequestTemplate,
  onRunExport,
  onBack,
}) {
  const [isRateOpen, setIsRateOpen] = useState(false)
  const [accountMode, setAccountMode] = useState('template')
  const [templateName, setTemplateName] = useState('')
  const rateGroups = noteCategories
    .filter((category) => category.value)
    .reduce((groups, category) => {
      const group = groups.find((item) => item.unitPrice === category.unitPrice)

      if (group) {
        group.labels.push(category.label)
        return groups
      }

      return [
        ...groups,
        {
          labels: [category.label],
          unitPrice: category.unitPrice,
        },
      ]
    }, [])
  const accountTotal = accounts.reduce(
    (sum, account) => sum + Number(account.amount || 0),
    0,
  )
  const remainingAmount = summary.payableAmount - accountTotal

  return (
    <section className="phone-screen settlement-screen">
      <header className="screen-header">
        <p>파일 생성</p>
        <h1 className="screen-title">정산 내역서</h1>
      </header>

      <div className="settlement-flow">
        {step === 'summary' && (
          <>
            <label className="history-month-select">
              <span>년월</span>
              <select
                value={selectedMonth}
                onChange={(event) => onChangeMonth(event.target.value)}
              >
                {months.map((month) => (
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
                  className={format === 'excel' ? 'is-selected' : ''}
                >
                  엑셀
                </button>
                <button
                  type="button"
                  onClick={() => onChangeFormat('pdf')}
                  className={format === 'pdf' ? 'is-selected' : ''}
                >
                  PDF
                </button>
              </div>
            </div>

            <div className="settlement-summary-card">
              <div className="settlement-summary-head">
                <strong>정산 요약</strong>
                <div>
                  <button type="button" onClick={() => setIsRateOpen(true)}>
                    단가표
                  </button>
                  <span>{logsCount}건</span>
                </div>
              </div>
              <dl>
                <div>
                  <dt>운행 금액</dt>
                  <dd>{formatMoney(summary.totalAmount)}원</dd>
                </div>
                <div>
                  <dt>공제 {DEDUCTION_RATE * 100}%</dt>
                  <dd>{formatMoney(summary.deductionAmount)}원</dd>
                </div>
                <div>
                  <dt>고정 공제</dt>
                  <dd>{formatMoney(summary.fixedDeduction)}원</dd>
                </div>
                <div className="settlement-payable">
                  <dt>실지급액</dt>
                  <dd>{formatMoney(summary.payableAmount)}원</dd>
                </div>
              </dl>
            </div>

            <button type="button" onClick={onNext} className="export-next-button">
              다음
            </button>
          </>
        )}

        {step === 'accounts' && (
          <>
            <div className="settlement-account-card">
              <div className="settlement-account-head">
                <strong>입금 계좌</strong>
                <span
                  className={
                    remainingAmount === 0 ? 'is-balanced' : 'is-remaining'
                  }
                >
                  남은 금액 {formatMoney(remainingAmount)}원
                </span>
              </div>

              <div className="settlement-account-mode">
                <button
                  type="button"
                  onClick={() => setAccountMode('template')}
                  className={accountMode === 'template' ? 'is-selected' : ''}
                >
                  템플릿 불러오기
                </button>
                <button
                  type="button"
                  onClick={() => setAccountMode('manual')}
                  className={accountMode === 'manual' ? 'is-selected' : ''}
                >
                  신규 입력
                </button>
              </div>

              {accountMode === 'template' && (
                <>
                  {accountTemplates.length > 0 ? (
                    <div className="settlement-account-templates">
                      {accountTemplates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => {
                            onUseAccountTemplate(template)
                            setAccountMode('manual')
                          }}
                        >
                          <strong>{template.name}</strong>
                          <span>{template.accounts.length}개 계좌</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="settlement-account-empty">
                      저장된 계좌 템플릿이 없습니다.
                    </p>
                  )}
                </>
              )}

              {accountMode === 'manual' && (
                <>
                  <div className="settlement-account-list">
                    {accounts.map((account) => (
                      <div key={account.id} className="settlement-account-row">
                        <input
                          type="text"
                          value={account.name}
                          onChange={(event) =>
                            onUpdateAccount(
                              account.id,
                              'name',
                              event.target.value,
                            )
                          }
                          placeholder="이름"
                        />
                        <input
                          type="text"
                          value={account.bank}
                          onChange={(event) =>
                            onUpdateAccount(
                              account.id,
                              'bank',
                              event.target.value,
                            )
                          }
                          placeholder="은행"
                        />
                        <input
                          type="text"
                          inputMode="numeric"
                          value={account.accountNumber}
                          onChange={(event) =>
                            onUpdateAccount(
                              account.id,
                              'accountNumber',
                              event.target.value,
                            )
                          }
                          placeholder="계좌번호"
                        />
                        <input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          value={account.amount}
                          onChange={(event) =>
                            onUpdateAccount(
                              account.id,
                              'amount',
                              event.target.value,
                            )
                          }
                          placeholder="금액"
                        />
                        {accounts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onDeleteAccount(account.id)}
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={onAddAccount}
                    className="settlement-account-add"
                  >
                    계좌 추가
                  </button>
                </>
              )}

              <div className="settlement-account-actions">
                <input
                  type="text"
                  value={templateName}
                  onChange={(event) => setTemplateName(event.target.value)}
                  placeholder="템플릿 이름"
                />
                <button
                  type="button"
                  onClick={() => {
                    onRegisterAccountTemplate(templateName)
                    setTemplateName('')
                  }}
                >
                  템플릿 등록
                </button>
                <button type="button" onClick={() => setAccountMode('template')}>
                  완료
                </button>
              </div>
            </div>

            <div className="settlement-request-card">
              <strong>요청사항</strong>
              {requestTemplates.length > 0 && (
                <div className="settlement-request-templates">
                  {requestTemplates.map((template) => (
                    <button
                      key={template}
                      type="button"
                      onClick={() => onUseRequestTemplate(template)}
                    >
                      {template}
                    </button>
                  ))}
                </div>
              )}
              <textarea
                value={requestText}
                onChange={(event) => onChangeRequestText(event.target.value)}
                placeholder="요청사항 작성"
                rows={3}
              />
            </div>

            <button
              type="button"
              onClick={onRunExport}
              className="export-next-button"
            >
              파일 만들기
            </button>
          </>
        )}
      </div>

      <button type="button" onClick={onBack} className="small-back-button">
        뒤로
      </button>

      {isRateOpen && (
        <div className="settlement-rate-backdrop" role="presentation">
          <section className="settlement-rate-modal" aria-label="정산 단가표">
            <div className="settlement-rate-modal-head">
              <strong>단가표</strong>
              <button type="button" onClick={() => setIsRateOpen(false)}>
                닫기
              </button>
            </div>

            <div className="settlement-rate-row">
              <span>기본</span>
              <strong>{formatMoney(noteCategories[0].unitPrice)}원</strong>
            </div>

            {rateGroups.map((group) => (
              <div key={group.labels.join('/')} className="settlement-rate-row">
                <span>{group.labels.join(' / ')}</span>
                <strong>{formatMoney(group.unitPrice)}원</strong>
              </div>
            ))}

            <div className="settlement-rate-row">
              <span>추가 KM</span>
              <strong>{EXTRA_KM_RATE.toLocaleString('ko-KR')}원</strong>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
