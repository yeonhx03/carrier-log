import { useMemo, useState } from 'react'
import { getCurrentMonthKey } from '../utils/date'
import { getHistoryGroups } from '../utils/historySelectors'
import { getAvailableMonths } from '../utils/logSelectors'

function resetHistorySelection({
  setSelectedHistoryGroupKey,
  setSelectedHistoryCompanyId,
  setSelectedLogId,
  setIsEditingLog,
}) {
  setSelectedHistoryGroupKey(null)
  setSelectedHistoryCompanyId(null)
  setSelectedLogId(null)
  setIsEditingLog(false)
}

export function useHistoryController({ logs, setLogs, companies, setScreen }) {
  const [isHistorySearchOpen, setIsHistorySearchOpen] = useState(false)
  const [historySearchType, setHistorySearchType] = useState('date')
  const [historySearch, setHistorySearch] = useState('')
  const [selectedHistoryMonth, setSelectedHistoryMonth] =
    useState(getCurrentMonthKey)
  const [selectedHistoryGroupKey, setSelectedHistoryGroupKey] = useState(null)
  const [selectedHistoryCompanyId, setSelectedHistoryCompanyId] =
    useState(null)
  const [selectedLogId, setSelectedLogId] = useState(null)
  const [isEditingLog, setIsEditingLog] = useState(false)

  const selectedLog = logs.find((log) => log.id === selectedLogId)
  const historyGroups = useMemo(
    () =>
      getHistoryGroups({
        logs,
        companies,
        selectedMonth: selectedHistoryMonth,
        searchType: historySearchType,
        searchValue: historySearch,
      }),
    [logs, companies, selectedHistoryMonth, historySearchType, historySearch],
  )
  const availableMonths = useMemo(
    () => getAvailableMonths(logs, selectedHistoryMonth),
    [logs, selectedHistoryMonth],
  )

  const clearHistorySelection = () => {
    resetHistorySelection({
      setSelectedHistoryGroupKey,
      setSelectedHistoryCompanyId,
      setSelectedLogId,
      setIsEditingLog,
    })
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

  const handleUpdateLog = (logId, nextLog) => {
    setLogs((prevLogs) =>
      prevLogs.map((log) => (log.id === logId ? { ...log, ...nextLog } : log)),
    )
    setIsEditingLog(false)
  }

  const handleDeleteLog = (logId) => {
    if (!window.confirm('이 운행 내역을 삭제하시겠습니까?')) {
      return
    }

    setLogs((prevLogs) => prevLogs.filter((log) => log.id !== logId))
    setSelectedLogId(null)
    setIsEditingLog(false)
  }

  const openHistory = () => {
    setIsHistorySearchOpen(false)
    setHistorySearch('')
    setHistorySearchType('date')
    clearHistorySelection()
    setScreen('history')
  }

  const handleChangeSearchType = (type) => {
    setHistorySearchType(type)
    setHistorySearch('')
    clearHistorySelection()
  }

  const handleChangeSearchValue = (value) => {
    setHistorySearch(value)
    clearHistorySelection()
  }

  const handleChangeMonth = (monthKey) => {
    setSelectedHistoryMonth(monthKey)
    clearHistorySelection()
  }

  const handleSelectCompany = (groupKey, companyId) => {
    setSelectedHistoryGroupKey(groupKey)
    setSelectedHistoryCompanyId(companyId)
  }

  return {
    isHistorySearchOpen,
    historySearchType,
    historySearch,
    selectedHistoryMonth,
    selectedHistoryGroupKey,
    selectedHistoryCompanyId,
    selectedLog,
    isEditingLog,
    historyGroups,
    availableMonths,
    openHistory,
    clearHistorySelection,
    setIsHistorySearchOpen,
    setSelectedLogId,
    setIsEditingLog,
    handleAddLog,
    handleUpdateLog,
    handleDeleteLog,
    handleChangeSearchType,
    handleChangeSearchValue,
    handleChangeMonth,
    handleSelectCompany,
  }
}
