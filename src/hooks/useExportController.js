import { useMemo, useState } from 'react'
import { getCurrentMonthKey } from '../utils/date'
import {
  buildExcelWorkbook,
  buildPrintHtml,
  getExportFilename,
} from '../utils/exportFiles'
import { printHtmlDocument, saveOrShareFile } from '../utils/nativeExport'
import {
  getAvailableMonths,
  getCompanyGroupsForMonth,
} from '../utils/logSelectors'

export function useExportController({ logs, companies, setScreen }) {
  const [exportStep, setExportStep] = useState('month')
  const [selectedExportMonth, setSelectedExportMonth] =
    useState(getCurrentMonthKey)
  const [exportFormat, setExportFormat] = useState('excel')
  const [exportMode, setExportMode] = useState('all')
  const [selectedExportCompanyId, setSelectedExportCompanyId] = useState('')

  const exportMonths = useMemo(
    () => getAvailableMonths(logs, selectedExportMonth),
    [logs, selectedExportMonth],
  )
  const exportGroups = useMemo(
    () => getCompanyGroupsForMonth(logs, companies, selectedExportMonth),
    [logs, companies, selectedExportMonth],
  )
  const selectedCompanyGroups = selectedExportCompanyId
    ? exportGroups.filter((group) => group.companyId === selectedExportCompanyId)
    : exportGroups

  const openExport = () => {
    setExportStep('month')
    setSelectedExportMonth(getCurrentMonthKey())
    setExportFormat('excel')
    setExportMode('all')
    setSelectedExportCompanyId('')
    setScreen('export')
  }

  const handleChangeMode = (mode) => {
    setExportMode(mode)

    if (mode === 'all') {
      setSelectedExportCompanyId('')
      return
    }

    setSelectedExportCompanyId(
      selectedExportCompanyId || exportGroups[0]?.companyId || '',
    )
  }

  const handleBack = () => {
    if (exportStep === 'mode') {
      setExportStep('month')
      return
    }

    setScreen('home')
  }

  const runExport = async (mode = 'save') => {
    if (exportMode === 'company' && !selectedExportCompanyId) {
      alert('내보낼 보험사를 선택해주세요.')
      return
    }

    const groups = getCompanyGroupsForMonth(
      logs,
      companies,
      selectedExportMonth,
      exportMode === 'company' ? selectedExportCompanyId : '',
    )

    if (groups.length === 0) {
      alert('내보낼 내역이 없습니다.')
      return
    }

    try {
      if (exportFormat === 'excel') {
        await saveOrShareFile(
          buildExcelWorkbook(selectedExportMonth, groups),
          getExportFilename(selectedExportMonth, groups, 'xls'),
          'application/vnd.ms-excel;charset=utf-8',
          mode,
        )
        return
      }

      await printHtmlDocument(
        buildPrintHtml(selectedExportMonth, groups),
        getExportFilename(selectedExportMonth, groups, 'pdf'),
      )
    } catch (error) {
      console.error('Export failed', error)
      alert(error.message || '파일을 만들 수 없습니다.')
    }
  }

  return {
    exportStep,
    exportMonths,
    selectedExportMonth,
    exportFormat,
    exportMode,
    exportGroups,
    selectedExportCompanyId,
    selectedCompanyGroups,
    openExport,
    setSelectedExportMonth,
    setExportFormat,
    setExportStep,
    setSelectedExportCompanyId,
    handleChangeMode,
    handleBack,
    runExport,
  }
}
