import { useState } from 'react'
import './App.css'
import ExportScreen from './components/ExportScreen'
import HistoryCompanyTable from './components/HistoryCompanyTable'
import HistoryScreen from './components/HistoryScreen'
import HomeScreen from './components/HomeScreen'
import LogInputForm from './components/LogInputForm'
import LogDetailView from './components/LogDetailView'
import SettingsPanel from './components/SettingsPanel'
import { initialCompanies, initialLogs } from './data/sampleData'
import { createCompanyId } from './utils/companies'
import {
  getCurrentMonthKey,
  getMonthLabel,
  normalizeDateSearch,
} from './utils/date'
import {
  buildExcelWorkbook,
  buildPrintHtml,
  downloadBlob,
  getExportFilename,
} from './utils/exportFiles'

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

  const renderHistoryScreen = () => {
    const historyGroups = getHistoryGroups()

    if (selectedLog) {
      return (
        <LogDetailView
          log={selectedLog}
          companyName={getCompanyName(selectedLog.companyId, selectedLog.companyName)}
          onBack={() => setSelectedLogId(null)}
        />
      )
    }

    if (selectedHistoryCompanyId) {
      const monthGroup = historyGroups.find(
        (group) => group.key === selectedHistoryGroupKey,
      )
      const companyGroup = monthGroup?.companies.find(
        (item) => item.companyId === selectedHistoryCompanyId,
      )

      if (monthGroup && companyGroup) {
        return (
          <HistoryCompanyTable
            monthGroup={monthGroup}
            companyGroup={companyGroup}
            onSelectLog={setSelectedLogId}
            onBack={() => {
              setSelectedHistoryGroupKey(null)
              setSelectedHistoryCompanyId(null)
            }}
          />
        )
      }
    }

    return (
      <HistoryScreen
        historyGroups={historyGroups}
        isSearchOpen={isHistorySearchOpen}
        searchType={historySearchType}
        searchValue={historySearch}
        selectedMonth={selectedHistoryMonth}
        availableMonths={getAvailableHistoryMonths()}
        onToggleSearch={() => setIsHistorySearchOpen((value) => !value)}
        onChangeSearchType={(type) => {
          setHistorySearchType(type)
          setHistorySearch('')
          setSelectedHistoryGroupKey(null)
          setSelectedHistoryCompanyId(null)
          setSelectedLogId(null)
        }}
        onChangeSearchValue={(value) => {
          setHistorySearch(value)
          setSelectedHistoryGroupKey(null)
          setSelectedHistoryCompanyId(null)
          setSelectedLogId(null)
        }}
        onChangeMonth={(monthKey) => {
          setSelectedHistoryMonth(monthKey)
          setSelectedHistoryGroupKey(null)
          setSelectedHistoryCompanyId(null)
          setSelectedLogId(null)
        }}
        onSelectCompany={(groupKey, companyId) => {
          setSelectedHistoryGroupKey(groupKey)
          setSelectedHistoryCompanyId(companyId)
        }}
        onBack={() => setScreen('home')}
      />
    )
  }

  const renderExportScreen = () => {
    const exportMonths = getAvailableHistoryMonths()
    const exportGroups = getCompanyGroupsForMonth(selectedExportMonth)
    const selectedCompanyGroups = selectedExportCompanyId
      ? exportGroups.filter((group) => group.companyId === selectedExportCompanyId)
      : exportGroups

    return (
      <ExportScreen
        exportStep={exportStep}
        exportMonths={exportMonths}
        selectedExportMonth={selectedExportMonth}
        exportFormat={exportFormat}
        exportMode={exportMode}
        exportGroups={exportGroups}
        selectedExportCompanyId={selectedExportCompanyId}
        selectedCompanyGroups={selectedCompanyGroups}
        monthLabel={getMonthLabel(selectedExportMonth)}
        onChangeMonth={setSelectedExportMonth}
        onChangeFormat={setExportFormat}
        onNext={() => setExportStep('mode')}
        onChangeMode={(mode) => {
          setExportMode(mode)
          if (mode === 'all') {
            setSelectedExportCompanyId('')
            return
          }

          setSelectedExportCompanyId(
            selectedExportCompanyId || exportGroups[0]?.companyId || '',
          )
        }}
        onChangeCompany={setSelectedExportCompanyId}
        onRunExport={runExport}
        onBack={() => {
          if (exportStep === 'mode') {
            setExportStep('month')
            return
          }

          setScreen('home')
        }}
      />
    )
  }

  return (
    <main className="app-shell">
      <div className="phone-frame">
        {screen === 'home' && (
          <HomeScreen
            logsCount={logs.length}
            onInput={() => setScreen('input')}
            onHistory={openHistory}
            onExport={openExport}
            onSettings={() => setIsSettingOpen(true)}
          />
        )}
        {screen === 'input' && (
          <LogInputForm
            companies={companies}
            logs={logs}
            onAddLog={handleAddLog}
            onBack={() => setScreen('home')}
          />
        )}
        {screen === 'history' && renderHistoryScreen()}
        {screen === 'export' && renderExportScreen()}
      </div>

      {isSettingOpen && (
        <SettingsPanel
          companies={companies}
          newCompanyName={newCompanyName}
          onClose={() => setIsSettingOpen(false)}
          onChangeNewCompanyName={setNewCompanyName}
          onAddCompany={handleAddCompany}
          onRenameCompany={handleRenameCompany}
          onDeleteCompany={handleDeleteCompany}
        />
      )}
    </main>
  )
}

export default App
