import { useMemo, useState } from 'react'

function getTodayValue() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function parseDateParts(dateValue) {
  const [year, month, day] = dateValue.split('-').map(Number)

  return {
    year,
    month,
    day,
    dateText: `${month}월 ${day}일`,
  }
}

export default function LogInputForm({
  companies,
  logs = [],
  noteCategories,
  onAddLog,
  onUpdateLog,
  initialLog = null,
  onBack,
}) {
  const today = useMemo(() => getTodayValue(), [])
  const isEditMode = Boolean(initialLog)

  const [selectedCompanyId, setSelectedCompanyId] = useState(
    initialLog?.companyId || '',
  )
  const [date, setDate] = useState(initialLog?.date || today)
  const [carType, setCarType] = useState(initialLog?.carType || '')
  const [isCarTypeSuggestionsOpen, setIsCarTypeSuggestionsOpen] =
    useState(false)
  const [carNumber, setCarNumber] = useState(initialLog?.carNumber || '')
  const [extraKm, setExtraKm] = useState(
    initialLog ? String(initialLog.extraKm ?? '') : '',
  )
  const [note, setNote] = useState(initialLog?.note || '')

  const selectedCompany = companies.find(
    (company) => company.id === selectedCompanyId,
  )
  const recentCarTypes = useMemo(() => {
    const seen = new Set()

    return [...logs]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map((log) => log.carType?.trim())
      .filter(Boolean)
      .filter((item) => {
        const key = item.toLowerCase()

        if (seen.has(key)) {
          return false
        }

        seen.add(key)
        return true
      })
      .slice(0, 8)
  }, [logs])
  const carTypeSuggestions = useMemo(() => {
    const normalizedCarType = carType.trim().toLowerCase()

    if (!normalizedCarType) {
      return recentCarTypes
    }

    const matchedCarTypes = recentCarTypes.filter((item) =>
      item.toLowerCase().includes(normalizedCarType),
    )

    return matchedCarTypes.length > 0 ? matchedCarTypes : recentCarTypes
  }, [carType, recentCarTypes])
  const resetFields = () => {
    setDate(getTodayValue())
    setCarType('')
    setIsCarTypeSuggestionsOpen(false)
    setCarNumber('')
    setExtraKm('')
    setNote('')
  }

  const handleBack = () => {
    if (isEditMode) {
      onBack()
      return
    }

    if (selectedCompany) {
      resetFields()
      setSelectedCompanyId('')
      return
    }

    onBack()
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (
      !selectedCompany ||
      !date ||
      !carType.trim() ||
      !carNumber.trim() ||
      extraKm === ''
    ) {
      alert('날짜, 차종, 차량번호, KM을 입력해주세요.')
      return
    }

    const dateParts = parseDateParts(date)

    const nextLog = {
      date,
      dateText: dateParts.dateText,
      year: dateParts.year,
      month: dateParts.month,
      day: dateParts.day,
      companyId: selectedCompany.id,
      companyName: selectedCompany.name,
      company: selectedCompany.name,
      carType: carType.trim(),
      carNumber: carNumber.trim(),
      extraKm: Number(extraKm || 0),
      note: note.trim(),
    }

    if (isEditMode) {
      onUpdateLog(initialLog.id, nextLog)
      return
    }

    onAddLog(nextLog)

    resetFields()
    setSelectedCompanyId('')
  }

  if (!selectedCompany) {
    return (
      <section className="phone-screen company-screen">
        <header className="screen-header">
          <p>입력</p>
          <h1 className="screen-title">보험사 선택</h1>
        </header>

        <div className="company-choice-list">
          {companies.map((company) => (
            <button
              key={company.id}
              type="button"
              onClick={() => setSelectedCompanyId(company.id)}
              className="company-choice-button"
            >
              <span>{company.name}</span>
            </button>
          ))}
        </div>

        <button type="button" onClick={handleBack} className="small-back-button">
          뒤로
        </button>
      </section>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="phone-screen input-screen">
      <header className="screen-header input-header">
        <p>{isEditMode ? '운행 수정' : '운행 입력'}</p>
        <h1 className="screen-title selected-company-title">
          {selectedCompany.name}
        </h1>
      </header>

      <div className="input-flow">
        <label className="flow-field">
          <span>날짜</span>
          <input
            type="date"
            value={date}
            onFocus={() => {
              setIsCarTypeSuggestionsOpen(false)
            }}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>

        <label className="flow-field">
          <span>차종</span>
          <input
            type="text"
            value={carType}
            onFocus={() => setIsCarTypeSuggestionsOpen(true)}
            onChange={(event) => {
              setCarType(event.target.value)
              setIsCarTypeSuggestionsOpen(true)
            }}
            placeholder="그랜저"
          />
        </label>

        {isCarTypeSuggestionsOpen && carTypeSuggestions.length > 0 && (
          <div className="car-type-suggestions" aria-label="최근 차종">
            <strong>최근 차종</strong>
            {carTypeSuggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setCarType(item)
                  setIsCarTypeSuggestionsOpen(false)
                }}
              >
                {item}
              </button>
            ))}
          </div>
        )}

        <label className="flow-field">
          <span>차량번호</span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={carNumber}
            onFocus={() => {
              setIsCarTypeSuggestionsOpen(false)
            }}
            onChange={(event) => setCarNumber(event.target.value)}
            placeholder="4자리"
          />
        </label>

        <label className="flow-field">
          <span>KM</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={extraKm}
            onFocus={() => {
              setIsCarTypeSuggestionsOpen(false)
            }}
            onChange={(event) => setExtraKm(event.target.value)}
            placeholder="0"
          />
        </label>

        <div className="note-category-panel">
          <strong>비고</strong>
          <div className="note-category-grid">
            {noteCategories.map((category) => (
              <button
                key={category.value || 'empty'}
                type="button"
                onClick={() => {
                  setNote(category.value)
                  setIsCarTypeSuggestionsOpen(false)
                }}
                className={note === category.value ? 'is-selected' : ''}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bottom-actions">
        <button type="button" onClick={handleBack} className="small-back-button">
          뒤로
        </button>
        <button type="submit" className="small-save-button">
          {isEditMode ? '수정 완료' : '저장'}
        </button>
      </div>
    </form>
  )
}
