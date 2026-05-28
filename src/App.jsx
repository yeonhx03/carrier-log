import { useState } from 'react'
import './App.css'
import LogInputForm from './components/LogInputForm'

const initialCompanies = [
  { id: 'samsung', name: '삼성' },
  { id: 'kb', name: 'KB' },
  { id: 'partner', name: '제휴사' },
]

const initialLogs = [
  {
    id: 1,
    date: '2026-03-04',
    dateText: '3월 4일',
    year: 2026,
    month: 3,
    day: 4,
    companyId: 'samsung',
    companyName: '삼성',
    company: '삼성',
    carType: '아반떼',
    carNumber: '2841',
    extraKm: 12,
    note: '',
  },
  {
    id: 2,
    date: '2026-03-18',
    dateText: '3월 18일',
    year: 2026,
    month: 3,
    day: 18,
    companyId: 'kb',
    companyName: 'KB',
    company: 'KB',
    carType: '카니발',
    carNumber: '5930',
    extraKm: 24,
    note: '대형견인',
  },
  {
    id: 3,
    date: '2026-04-06',
    dateText: '4월 6일',
    year: 2026,
    month: 4,
    day: 6,
    companyId: 'kb',
    companyName: 'KB',
    company: 'KB',
    carType: '디스커버리',
    carNumber: '6114',
    extraKm: 0,
    note: '화물승합',
  },
  {
    id: 4,
    date: '2026-04-21',
    dateText: '4월 21일',
    year: 2026,
    month: 4,
    day: 21,
    companyId: 'partner',
    companyName: '제휴사',
    company: '제휴사',
    carType: '포터2',
    carNumber: '3273',
    extraKm: 5,
    note: '긴급출동',
  },
  {
    id: 5,
    date: '2026-05-03',
    dateText: '5월 3일',
    year: 2026,
    month: 5,
    day: 3,
    companyId: 'samsung',
    companyName: '삼성',
    company: '삼성',
    carType: '그랜저',
    carNumber: '3273',
    extraKm: 5,
    note: '',
  },
  {
    id: 6,
    date: '2026-05-16',
    dateText: '5월 16일',
    year: 2026,
    month: 5,
    day: 16,
    companyId: 'kb',
    companyName: 'KB',
    company: 'KB',
    carType: '트레스',
    carNumber: '7851',
    extraKm: 7,
    note: '화물승합',
  },
]

function createCompanyId(name) {
  const normalizedName = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣-]/g, '')

  return `${normalizedName || 'company'}-${Date.now()}`
}

function getCurrentMonthKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')

  return `${year}-${month}`
}

function normalizeDateSearch(value) {
  return String(value).toLowerCase().replace(/[\s-]/g, '')
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function sanitizeSheetName(value) {
  return String(value || 'Sheet')
    .replace(/[\\/?*[\]:]/g, ' ')
    .slice(0, 31)
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function App() {
  const [screen, setScreen] = useState('home')
  const [companies, setCompanies] = useState(initialCompanies)
  const [logs, setLogs] = useState(initialLogs)
  const [isHistorySearchOpen, setIsHistorySearchOpen] = useState(false)
  const [historySearchType, setHistorySearchType] = useState('date')
  const [historySearch, setHistorySearch] = useState('')
  const [selectedHistoryMonth, setSelectedHistoryMonth] =
    useState(getCurrentMonthKey)
  const [selectedHistoryGroupKey, setSelectedHistoryGroupKey] = useState(null)
  const [selectedHistoryCompanyId, setSelectedHistoryCompanyId] =
    useState(null)
  const [selectedLogId, setSelectedLogId] = useState(null)
  const [exportStep, setExportStep] = useState('month')
  const [selectedExportMonth, setSelectedExportMonth] =
    useState(getCurrentMonthKey)
  const [exportFormat, setExportFormat] = useState('excel')
  const [exportMode, setExportMode] = useState('all')
  const [selectedExportCompanyId, setSelectedExportCompanyId] = useState('')
  const [isSettingOpen, setIsSettingOpen] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')

  const selectedLog = logs.find((log) => log.id === selectedLogId)

  const getCompanyName = (companyId, fallbackName) => {
    return (
      companies.find((company) => company.id === companyId)?.name ||
      fallbackName ||
      ''
    )
  }

  const getAvailableHistoryMonths = () => {
    const monthMap = new Map()

    logs.forEach((log) => {
      const monthKey = `${log.year}-${String(log.month).padStart(2, '0')}`
      monthMap.set(monthKey, {
        key: monthKey,
        year: log.year,
        month: log.month,
      })
    })

    if (!monthMap.has(selectedHistoryMonth)) {
      const [year, month] = selectedHistoryMonth.split('-').map(Number)
      monthMap.set(selectedHistoryMonth, {
        key: selectedHistoryMonth,
        year,
        month,
      })
    }

    return Array.from(monthMap.values()).sort((a, b) =>
      b.key.localeCompare(a.key),
    )
  }

  const getMonthLabel = (monthKey) => {
    const [year, month] = monthKey.split('-').map(Number)

    return `${year}년 ${month}월`
  }

  const getMonthLogs = (monthKey) => {
    const [year, month] = monthKey.split('-').map(Number)

    return logs
      .filter((log) => log.year === year && log.month === month)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  const getCompanyGroupsForMonth = (monthKey, companyId = '') => {
    const groupMap = new Map()

    getMonthLogs(monthKey)
      .filter((log) => !companyId || log.companyId === companyId)
      .forEach((log) => {
        if (!groupMap.has(log.companyId)) {
          groupMap.set(log.companyId, {
            companyId: log.companyId,
            companyName: getCompanyName(log.companyId, log.companyName),
            logs: [],
          })
        }

        groupMap.get(log.companyId).logs.push(log)
      })

    return Array.from(groupMap.values()).sort((a, b) => {
      const aIndex = companies.findIndex((company) => company.id === a.companyId)
      const bIndex = companies.findIndex((company) => company.id === b.companyId)

      return aIndex - bIndex
    })
  }

  const getExportFilename = (monthKey, groups, extension) => {
    const [year, month] = monthKey.split('-')
    const companyPart = groups.length === 1 ? `_${groups[0].companyName}` : ''

    return `carrier-log_${year}-${month}${companyPart}.${extension}`
  }

  const buildExcelWorkbook = (monthKey, groups) => {
    const monthLabel = getMonthLabel(monthKey)
    const worksheets = groups
      .map((group) => {
        const totalKm = group.logs.reduce(
          (sum, log) => sum + Number(log.extraKm || 0),
          0,
        )
        const rows = group.logs
          .map(
            (log, index) => `
        <Row>
          <Cell ss:StyleID="Cell"><Data ss:Type="Number">${index + 1}</Data></Cell>
          <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(log.dateText)}</Data></Cell>
          <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(log.carType)}</Data></Cell>
          <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(log.carNumber)}</Data></Cell>
          <Cell ss:StyleID="Cell"><Data ss:Type="Number">${Number(log.extraKm || 0)}</Data></Cell>
          <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(log.note || '')}</Data></Cell>
        </Row>`,
          )
          .join('')

        return `
  <Worksheet ss:Name="${escapeXml(sanitizeSheetName(group.companyName))}">
    <Table>
      <Column ss:Width="40" />
      <Column ss:Width="90" />
      <Column ss:Width="120" />
      <Column ss:Width="90" />
      <Column ss:Width="70" />
      <Column ss:Width="140" />
      <Row>
        <Cell ss:MergeAcross="5" ss:StyleID="Title"><Data ss:Type="String">${escapeXml(monthLabel)} 전인내역 (${escapeXml(group.companyName)})</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="Header"><Data ss:Type="String">NO</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">일자</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">차종</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">차량번호</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">추가(KM)</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">비고</Data></Cell>
      </Row>
      ${rows}
      <Row>
        <Cell ss:MergeAcross="3" ss:StyleID="Total"><Data ss:Type="String">합계</Data></Cell>
        <Cell ss:StyleID="Total"><Data ss:Type="Number">${totalKm}</Data></Cell>
        <Cell ss:StyleID="Total"><Data ss:Type="String"></Data></Cell>
      </Row>
    </Table>
  </Worksheet>`
      })
      .join('')

    return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Title"><Font ss:Bold="1" ss:Size="16" /><Alignment ss:Horizontal="Center" /><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" /></Borders></Style>
    <Style ss:ID="Header"><Font ss:Bold="1" /><Interior ss:Color="#E5E7EB" ss:Pattern="Solid" /><Alignment ss:Horizontal="Center" /><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" /><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" /><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" /><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" /></Borders></Style>
    <Style ss:ID="Cell"><Alignment ss:Horizontal="Center" /><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" /><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" /><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" /><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" /></Borders></Style>
    <Style ss:ID="Total"><Font ss:Bold="1" /><Interior ss:Color="#F3F4F6" ss:Pattern="Solid" /><Alignment ss:Horizontal="Center" /><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" /><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" /><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" /><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" /></Borders></Style>
  </Styles>
  ${worksheets}
</Workbook>`
  }

  const buildPrintHtml = (monthKey, groups) => {
    const monthLabel = getMonthLabel(monthKey)
    const sections = groups
      .map((group) => {
        const totalKm = group.logs.reduce(
          (sum, log) => sum + Number(log.extraKm || 0),
          0,
        )
        const rows = group.logs
          .map(
            (log, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(log.dateText)}</td>
                <td>${escapeHtml(log.carType)}</td>
                <td>${escapeHtml(log.carNumber)}</td>
                <td>${Number(log.extraKm || 0)}</td>
                <td>${escapeHtml(log.note || '')}</td>
              </tr>`,
          )
          .join('')

        return `
          <section class="report-section">
            <h1>${escapeHtml(monthLabel)} 전인내역 (${escapeHtml(group.companyName)})</h1>
            <table>
              <thead>
                <tr>
                  <th>NO</th>
                  <th>일자</th>
                  <th>차종</th>
                  <th>차량번호</th>
                  <th>추가(KM)</th>
                  <th>비고</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
                <tr class="total-row">
                  <td colspan="4">합계</td>
                  <td>${totalKm}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </section>`
      })
      .join('')

    return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(monthLabel)} 운행일지</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    body { color: #111827; font-family: Arial, "Malgun Gothic", sans-serif; margin: 0; }
    .report-section { page-break-after: always; }
    .report-section:last-child { page-break-after: auto; }
    h1 { font-size: 20px; margin: 0 0 12px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #111827; font-size: 13px; height: 28px; padding: 4px 6px; text-align: center; }
    th { background: #e5e7eb; font-weight: 700; }
    td:nth-child(3), td:nth-child(6) { text-align: left; }
    .total-row td { background: #f3f4f6; font-weight: 700; }
  </style>
</head>
<body>${sections}</body>
</html>`
  }

  const runExport = () => {
    if (exportMode === 'company' && !selectedExportCompanyId) {
      alert('내보낼 보험사를 선택해주세요.')
      return
    }

    const groups = getCompanyGroupsForMonth(
      selectedExportMonth,
      exportMode === 'company' ? selectedExportCompanyId : '',
    )

    if (groups.length === 0) {
      alert('내보낼 내역이 없습니다.')
      return
    }

    if (exportFormat === 'excel') {
      downloadBlob(
        buildExcelWorkbook(selectedExportMonth, groups),
        getExportFilename(selectedExportMonth, groups, 'xls'),
        'application/vnd.ms-excel;charset=utf-8',
      )
      return
    }

    const printWindow = window.open('', '_blank')

    if (!printWindow) {
      alert('팝업이 차단되어 PDF 화면을 열 수 없습니다.')
      return
    }

    printWindow.document.write(buildPrintHtml(selectedExportMonth, groups))
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 250)
  }

  const getHistoryGroups = () => {
    const monthMap = new Map()
    const [targetYear, targetMonth] = selectedHistoryMonth
      .split('-')
      .map(Number)
    const normalizedSearch = historySearch.trim().toLowerCase()
    const selectedMonthLogs = logs.filter(
      (log) => log.year === targetYear && log.month === targetMonth,
    )
    const baseLogs = normalizedSearch ? logs : selectedMonthLogs
    const filteredLogs = normalizedSearch
      ? baseLogs.filter((log) => {
          if (historySearchType === 'date') {
            const dateTargets = [
              log.date,
              log.dateText,
              `${log.month}월 ${log.day}일`,
              `${log.month}월${log.day}일`,
            ]
            const normalizedDateSearch = normalizeDateSearch(historySearch)

            return dateTargets.some((target) =>
              normalizeDateSearch(target).includes(normalizedDateSearch),
            )
          }

          if (historySearchType === 'carType') {
            return log.carType.toLowerCase().includes(normalizedSearch)
          }

          if (historySearchType === 'note') {
            return String(log.note || '').toLowerCase().includes(normalizedSearch)
          }

          return String(log.carNumber).toLowerCase().includes(normalizedSearch)
        })
      : baseLogs

    filteredLogs.forEach((log) => {
      const monthKey = `${log.year}-${String(log.month).padStart(2, '0')}`

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          key: monthKey,
          year: log.year,
          month: log.month,
          companies: new Map(),
        })
      }

      const monthGroup = monthMap.get(monthKey)

      if (!monthGroup.companies.has(log.companyId)) {
        monthGroup.companies.set(log.companyId, {
          companyId: log.companyId,
          companyName: getCompanyName(log.companyId, log.companyName),
          logs: [],
        })
      }

      monthGroup.companies.get(log.companyId).logs.push(log)
    })

    return Array.from(monthMap.values())
      .sort((a, b) => b.key.localeCompare(a.key))
      .map((monthGroup) => ({
        ...monthGroup,
        companies: Array.from(monthGroup.companies.values())
          .map((companyGroup) => ({
            ...companyGroup,
            companyName: getCompanyName(
              companyGroup.companyId,
              companyGroup.companyName,
            ),
            logs: companyGroup.logs.sort(
              (a, b) => new Date(a.date) - new Date(b.date),
            ),
          }))
          .sort((a, b) => {
            const aIndex = companies.findIndex(
              (company) => company.id === a.companyId,
            )
            const bIndex = companies.findIndex(
              (company) => company.id === b.companyId,
            )

            return aIndex - bIndex
          }),
      }))
  }

  const handleAddLog = (log) => {
    setLogs((prevLogs) => [
      {
        id: Date.now(),
        ...log,
      },
      ...prevLogs,
    ])
    setScreen('home')
  }

  const openHistory = () => {
    setIsHistorySearchOpen(false)
    setHistorySearch('')
    setHistorySearchType('date')
    setSelectedHistoryGroupKey(null)
    setSelectedHistoryCompanyId(null)
    setSelectedLogId(null)
    setScreen('history')
  }

  const openExport = () => {
    setExportStep('month')
    setSelectedExportMonth(getCurrentMonthKey())
    setExportFormat('excel')
    setExportMode('all')
    setSelectedExportCompanyId('')
    setScreen('export')
  }

  const handleAddCompany = () => {
    const trimmedName = newCompanyName.trim()

    if (!trimmedName) {
      return
    }

    if (companies.some((company) => company.name === trimmedName)) {
      alert('이미 등록된 보험사입니다.')
      return
    }

    setCompanies((prevCompanies) => [
      ...prevCompanies,
      { id: createCompanyId(trimmedName), name: trimmedName },
    ])
    setNewCompanyName('')
  }

  const handleRenameCompany = (companyId, nextName) => {
    const trimmedName = nextName.trim()

    if (!trimmedName) {
      alert('보험사 이름을 입력해주세요.')
      return
    }

    if (
      companies.some(
        (company) => company.id !== companyId && company.name === trimmedName,
      )
    ) {
      alert('이미 등록된 보험사입니다.')
      return
    }

    setCompanies((prevCompanies) =>
      prevCompanies.map((company) =>
        company.id === companyId ? { ...company, name: trimmedName } : company,
      ),
    )
  }

  const handleDeleteCompany = (companyId) => {
    setCompanies((prevCompanies) =>
      prevCompanies.filter((company) => company.id !== companyId),
    )
  }

  const renderHome = () => (
    <section className="phone-screen home-screen">
      <div className="brand-block">
        <p>운행일지</p>
        <h1 className="app-title">Carrier-log</h1>
      </div>

      <div className="home-actions">
        <button
          type="button"
          onClick={() => setScreen('input')}
          className="home-action-button action-input"
        >
          <span>입력</span>
          <strong>새 운행 기록</strong>
        </button>
        <button
          type="button"
          onClick={openHistory}
          className="home-action-button action-history"
        >
          <span>내역 보기</span>
          <strong>{logs.length}건</strong>
        </button>
        <button
          type="button"
          onClick={openExport}
          className="home-action-button action-export"
        >
          <span>내보내기</span>
          <strong>Excel / PDF</strong>
        </button>
      </div>

      <button
        type="button"
        onClick={() => setIsSettingOpen(true)}
        className="settings-fab"
        aria-label="설정"
      >
        <span />
      </button>
    </section>
  )

  const renderLogDetail = () => {
    return (
      <section className="phone-screen input-screen log-detail-screen">
        <header className="screen-header input-header">
          <p>{getCompanyName(selectedLog.companyId, selectedLog.companyName)}</p>
          <h1 className="screen-title selected-company-title">상세 내역</h1>
        </header>

        <div className="input-flow">
          <div className="flow-field readonly-field">
            <span>날짜</span>
            <strong>{selectedLog.dateText}</strong>
          </div>
          <div className="flow-field readonly-field">
            <span>차종</span>
            <strong>{selectedLog.carType}</strong>
          </div>
          <div className="flow-field readonly-field">
            <span>차량번호</span>
            <strong>{selectedLog.carNumber}</strong>
          </div>
          <div className="flow-field readonly-field">
            <span>KM</span>
            <strong>{selectedLog.extraKm || 0}</strong>
          </div>
          <div className="flow-field readonly-field note-field">
            <span>비고</span>
            <strong>{selectedLog.note || '-'}</strong>
          </div>
        </div>

        <div className="bottom-actions">
          <button
            type="button"
            onClick={() => setSelectedLogId(null)}
            className="small-back-button"
          >
            뒤로
          </button>
        </div>
      </section>
    )
  }

  const renderHistoryCompanyTable = (monthGroup, companyGroup) => {
    const totalKm = companyGroup.logs.reduce(
      (sum, log) => sum + Number(log.extraKm || 0),
      0,
    )

    return (
      <section className="phone-screen history-screen">
        <header className="screen-header">
          <p>
            {monthGroup.year}년 {monthGroup.month}월
          </p>
          <h1 className="screen-title">{companyGroup.companyName}</h1>
        </header>

        <article className="history-company-table selected-history-table">
          <div className="history-company-header">
            <strong>{companyGroup.companyName}</strong>
            <span>
              {companyGroup.logs.length}건 / {totalKm}km
            </span>
          </div>

          <div className="history-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>NO</th>
                  <th>일자</th>
                  <th>차종</th>
                  <th>차량번호</th>
                  <th>추가</th>
                  <th>비고</th>
                </tr>
              </thead>
              <tbody>
                {companyGroup.logs.map((log, index) => (
                  <tr
                    key={log.id}
                    className="history-select-row"
                    onClick={() => setSelectedLogId(log.id)}
                  >
                    <td>{index + 1}</td>
                    <td>{log.dateText}</td>
                    <td>{log.carType}</td>
                    <td>{log.carNumber}</td>
                    <td>{log.extraKm || ''}</td>
                    <td>{log.note || ''}</td>
                  </tr>
                ))}
                <tr className="history-total-row">
                  <td colSpan="4">합계</td>
                  <td>{totalKm}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <button
          type="button"
          onClick={() => {
            setSelectedHistoryGroupKey(null)
            setSelectedHistoryCompanyId(null)
          }}
          className="small-back-button"
        >
          뒤로
        </button>
      </section>
    )
  }

  const renderHistory = () => {
    const historyGroups = getHistoryGroups()
    const isSearchMode = Boolean(historySearch.trim())

    return (
      <section className="phone-screen history-screen">
        <header className="screen-header">
          <p>{isSearchMode ? '전체 검색' : '월별 정리'}</p>
          <h1 className="screen-title">내역 보기</h1>
        </header>

        {isHistorySearchOpen && (
          <section className="history-search-panel">
            <div className="history-search-types">
              {[
                { id: 'date', label: '날짜' },
                { id: 'carType', label: '차종' },
                { id: 'carNumber', label: '차량번호' },
                { id: 'note', label: '비고' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setHistorySearchType(item.id)
                    setHistorySearch('')
                    setSelectedHistoryGroupKey(null)
                    setSelectedHistoryCompanyId(null)
                    setSelectedLogId(null)
                  }}
                  className={
                    historySearchType === item.id ? 'is-selected' : ''
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>

            <label className="history-search">
              <span>검색</span>
              <input
                type="search"
                value={historySearch}
                onChange={(event) => {
                  setHistorySearch(event.target.value)
                  setSelectedHistoryGroupKey(null)
                  setSelectedHistoryCompanyId(null)
                  setSelectedLogId(null)
                }}
                placeholder={
                  historySearchType === 'date'
                    ? '예: 4월6일'
                    : historySearchType === 'carType'
                      ? '예: 그랜저'
                      : historySearchType === 'carNumber'
                        ? '예: 3273'
                        : '예: 긴급출동'
                }
              />
            </label>
          </section>
        )}

        <label className="history-month-select">
          <span>조회 월</span>
          <select
            value={selectedHistoryMonth}
            onChange={(event) => {
              setSelectedHistoryMonth(event.target.value)
              setSelectedHistoryGroupKey(null)
              setSelectedHistoryCompanyId(null)
              setSelectedLogId(null)
            }}
          >
            {getAvailableHistoryMonths().map((month) => (
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
                    onClick={() => {
                      setSelectedHistoryGroupKey(monthGroup.key)
                      setSelectedHistoryCompanyId(companyGroup.companyId)
                    }}
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

        <button
          type="button"
          onClick={() => setScreen('home')}
          className="small-back-button"
        >
          뒤로
        </button>
        <button
          type="button"
          className={[
            'small-search-button',
            isHistorySearchOpen ? 'is-active' : '',
          ].join(' ')}
          onClick={() => setIsHistorySearchOpen((value) => !value)}
        >
          검색
        </button>
      </section>
    )
  }

  const renderHistoryScreen = () => {
    if (selectedLog) {
      return renderLogDetail()
    }

    if (selectedHistoryCompanyId) {
      const monthGroup = getHistoryGroups().find(
        (group) => group.key === selectedHistoryGroupKey,
      )
      const companyGroup = monthGroup?.companies.find(
        (item) => item.companyId === selectedHistoryCompanyId,
      )

      if (monthGroup && companyGroup) {
        return renderHistoryCompanyTable(monthGroup, companyGroup)
      }
    }

    return renderHistory()
  }

  const renderExport = () => {
    const exportMonths = getAvailableHistoryMonths()
    const exportGroups = getCompanyGroupsForMonth(selectedExportMonth)
    const selectedCompanyGroups = selectedExportCompanyId
      ? exportGroups.filter((group) => group.companyId === selectedExportCompanyId)
      : exportGroups

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
              <select
                value={selectedExportMonth}
                onChange={(event) => setSelectedExportMonth(event.target.value)}
              >
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
                  onClick={() => setExportFormat('excel')}
                  className={exportFormat === 'excel' ? 'is-selected' : ''}
                >
                  엑셀
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat('pdf')}
                  className={exportFormat === 'pdf' ? 'is-selected' : ''}
                >
                  PDF
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setExportStep('mode')}
              className="export-next-button"
            >
              다음
            </button>
          </div>
        )}

        {exportStep === 'mode' && (
          <div className="export-flow">
            <div className="export-summary">
              <span>{getMonthLabel(selectedExportMonth)}</span>
              <strong>{exportFormat === 'excel' ? '엑셀' : 'PDF'}</strong>
            </div>

            <div className="export-mode-grid">
              <button
                type="button"
                onClick={() => {
                  setExportMode('all')
                  setSelectedExportCompanyId('')
                }}
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
                onClick={() => {
                  setExportMode('company')
                  setSelectedExportCompanyId(
                    selectedExportCompanyId || exportGroups[0]?.companyId || '',
                  )
                }}
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
                  onChange={(event) =>
                    setSelectedExportCompanyId(event.target.value)
                  }
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

            <button type="button" onClick={runExport} className="export-next-button">
              파일 만들기
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            if (exportStep === 'mode') {
              setExportStep('month')
              return
            }

            setScreen('home')
          }}
          className="small-back-button"
        >
          뒤로
        </button>
      </section>
    )
  }

  return (
    <main className="app-shell">
      <div className="phone-frame">
        {screen === 'home' && renderHome()}
        {screen === 'input' && (
          <LogInputForm
            companies={companies}
            logs={logs}
            onAddLog={handleAddLog}
            onBack={() => setScreen('home')}
          />
        )}
        {screen === 'history' && renderHistoryScreen()}
        {screen === 'export' && renderExport()}
      </div>

      {isSettingOpen && (
        <div className="setting-backdrop" role="presentation">
          <section className="setting-panel" aria-label="보험사 설정">
            <div className="setting-header">
              <h2>보험사 관리</h2>
              <button type="button" onClick={() => setIsSettingOpen(false)}>
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
                          (item) =>
                            item.id !== company.id && item.name === nextName,
                        )
                      ) {
                        event.target.value = company.name
                      }

                      handleRenameCompany(company.id, event.target.value)
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteCompany(company.id)}
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>

            <div className="setting-add-row">
              <input
                type="text"
                value={newCompanyName}
                onChange={(event) => setNewCompanyName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleAddCompany()
                  }
                }}
                placeholder="새 보험사"
              />
              <button type="button" onClick={handleAddCompany}>
                추가
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default App
