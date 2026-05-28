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

export default function LogInputForm({ companies, logs = [], onAddLog, onBack }) {
  const today = useMemo(() => getTodayValue(), [])

  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [date, setDate] = useState(today)
  const [carType, setCarType] = useState('')
  const [isCarTypeSuggestionsOpen, setIsCarTypeSuggestionsOpen] =
    useState(false)
  const [carNumber, setCarNumber] = useState('')
  const [extraKm, setExtraKm] = useState('')
  const [note, setNote] = useState('')
  const [isNoteSuggestionsOpen, setIsNoteSuggestionsOpen] = useState(false)

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
  const recentNotes = useMemo(() => {
    const seen = new Set()

    return [...logs]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map((log) => log.note?.trim())
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
  const noteSuggestions = useMemo(() => {
    const normalizedNote = note.trim().toLowerCase()

    if (!normalizedNote) {
      return recentNotes
    }

    const matchedNotes = recentNotes.filter((item) =>
      item.toLowerCase().includes(normalizedNote),
    )

    return matchedNotes.length > 0 ? matchedNotes : recentNotes
  }, [note, recentNotes])

  const resetFields = () => {
    setDate(getTodayValue())
    setCarType('')
    setIsCarTypeSuggestionsOpen(false)
    setCarNumber('')
    setExtraKm('')
    setNote('')
    setIsNoteSuggestionsOpen(false)
  }

  const handleBack = () => {
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

    onAddLog({
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
    })

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
        <p>운행 입력</p>
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
              setIsNoteSuggestionsOpen(false)
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
              setIsNoteSuggestionsOpen(false)
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
              setIsNoteSuggestionsOpen(false)
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
              setIsNoteSuggestionsOpen(false)
            }}
            onChange={(event) => setExtraKm(event.target.value)}
            placeholder="0"
          />
        </label>

        <label className="flow-field note-field">
          <span>비고</span>
          <textarea
            value={note}
            onFocus={() => {
              setIsCarTypeSuggestionsOpen(false)
              setIsNoteSuggestionsOpen(true)
            }}
            onChange={(event) => {
              setNote(event.target.value)
              setIsCarTypeSuggestionsOpen(false)
              setIsNoteSuggestionsOpen(true)
            }}
            placeholder="문자 입력"
            rows={3}
          />
        </label>

        {isNoteSuggestionsOpen && noteSuggestions.length > 0 && (
          <div className="field-suggestions" aria-label="최근 비고">
            <strong>최근 비고</strong>
            {noteSuggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setNote(item)
                  setIsNoteSuggestionsOpen(false)
                }}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bottom-actions">
        <button type="button" onClick={handleBack} className="small-back-button">
          뒤로
        </button>
        <button type="submit" className="small-save-button">
          저장
        </button>
      </div>
    </form>
  )
}
