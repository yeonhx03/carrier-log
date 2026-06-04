import { useMemo, useState } from 'react'
import { getCurrentMonthKey } from '../utils/date'
import { defaultSettlementAccounts } from '../utils/appDataStorage'
import { getAvailableMonths, getSettlementLogs } from '../utils/logSelectors'
import { printHtmlDocument, saveOrShareFile } from '../utils/nativeExport'
import {
  buildSettlementExcel,
  buildSettlementPrintHtml,
  getSettlementFilename,
  getSettlementSummary,
} from '../utils/settlementFiles'

export function useSettlementController({
  logs,
  companies,
  noteCategories,
  settlementFixedDeduction,
  settlementAccounts,
  setSettlementAccounts,
  setSettlementAccountTemplates,
  setSettlementRequestTemplates,
  setScreen,
}) {
  const [selectedSettlementMonth, setSelectedSettlementMonth] =
    useState(getCurrentMonthKey)
  const [settlementFormat, setSettlementFormat] = useState('excel')
  const [settlementStep, setSettlementStep] = useState('summary')
  const [settlementRequest, setSettlementRequest] = useState('')

  const settlementLogs = useMemo(
    () => getSettlementLogs(logs, companies, selectedSettlementMonth),
    [logs, companies, selectedSettlementMonth],
  )
  const settlementSummary = useMemo(
    () =>
      getSettlementSummary(
        settlementLogs,
        noteCategories,
        settlementFixedDeduction,
      ),
    [settlementLogs, noteCategories, settlementFixedDeduction],
  )
  const settlementMonths = useMemo(
    () => getAvailableMonths(logs, selectedSettlementMonth),
    [logs, selectedSettlementMonth],
  )

  const openSettlement = () => {
    setSelectedSettlementMonth(getCurrentMonthKey())
    setSettlementFormat('excel')
    setSettlementStep('summary')
    setScreen('settlement')
  }

  const handleUpdateSettlementAccount = (accountId, field, value) => {
    setSettlementAccounts((prevAccounts) =>
      prevAccounts.map((account) =>
        account.id === accountId ? { ...account, [field]: value } : account,
      ),
    )
  }

  const handleAddSettlementAccount = () => {
    setSettlementAccounts((prevAccounts) => [
      ...prevAccounts,
      {
        id: Date.now(),
        name: '',
        bank: '',
        accountNumber: '',
        amount: '',
      },
    ])
  }

  const handleDeleteSettlementAccount = (accountId) => {
    setSettlementAccounts((prevAccounts) => {
      if (prevAccounts.length === 1) {
        return prevAccounts
      }

      return prevAccounts.filter((account) => account.id !== accountId)
    })
  }

  const handleSaveSettlementAccountList = (listId, listName) => {
    const trimmedName = listName.trim()
    const accounts = settlementAccounts
      .filter((account) => {
        return (
          account.name.trim() &&
          account.bank.trim() &&
          account.accountNumber.trim()
        )
      })
      .map((account) => ({
        name: account.name.trim(),
        bank: account.bank.trim(),
        accountNumber: account.accountNumber.trim(),
      }))

    if (!trimmedName) {
      alert('계좌 목록 이름을 입력해주세요.')
      return false
    }

    if (accounts.length === 0) {
      alert('저장할 계좌 정보를 입력해주세요.')
      return false
    }

    setSettlementAccountTemplates((prevTemplates) => {
      const nextTemplate = {
        id: listId || String(Date.now()),
        name: trimmedName,
        accounts,
      }
      const filteredTemplates = prevTemplates.filter(
        (template) => template.id !== listId && template.name !== trimmedName,
      )

      return [nextTemplate, ...filteredTemplates].slice(0, 8)
    })

    return true
  }

  const handleUseSettlementAccountTemplate = (template) => {
    setSettlementAccounts(
      template.accounts.map((account, index) => ({
        id: Date.now() + index,
        name: account.name,
        bank: account.bank,
        accountNumber: account.accountNumber,
        amount: '',
      })),
    )
  }

  const handleStartNewSettlementAccountList = () => {
    setSettlementAccounts(defaultSettlementAccounts)
  }

  const saveSettlementRequestTemplate = () => {
    const trimmedRequest = settlementRequest.trim()

    if (!trimmedRequest) {
      return
    }

    setSettlementRequestTemplates((prevTemplates) =>
      [
        trimmedRequest,
        ...prevTemplates.filter((template) => template !== trimmedRequest),
      ].slice(0, 8),
    )
  }

  const runSettlementExport = async (mode = 'save') => {
    if (settlementLogs.length === 0) {
      alert('정산할 내역이 없습니다.')
      return
    }

    try {
      saveSettlementRequestTemplate()

      if (settlementFormat === 'excel') {
        await saveOrShareFile(
          buildSettlementExcel(
            selectedSettlementMonth,
            settlementLogs,
            noteCategories,
            settlementFixedDeduction,
            settlementAccounts,
            settlementRequest,
          ),
          getSettlementFilename(selectedSettlementMonth, 'xls'),
          'application/vnd.ms-excel;charset=utf-8',
          mode,
        )
        return
      }

      await printHtmlDocument(
        buildSettlementPrintHtml(
          selectedSettlementMonth,
          settlementLogs,
          noteCategories,
          settlementFixedDeduction,
          settlementAccounts,
          settlementRequest,
        ),
        getSettlementFilename(selectedSettlementMonth, 'pdf'),
      )
    } catch (error) {
      console.error('Settlement export failed', error)
      alert(error.message || '파일을 만들 수 없습니다.')
    }
  }

  const handleBack = () => {
    if (settlementStep === 'accounts') {
      setSettlementStep('summary')
      return
    }

    setScreen('home')
  }

  return {
    selectedSettlementMonth,
    settlementFormat,
    settlementStep,
    settlementRequest,
    settlementLogs,
    settlementSummary,
    settlementMonths,
    openSettlement,
    setSelectedSettlementMonth,
    setSettlementFormat,
    setSettlementStep,
    setSettlementRequest,
    handleUpdateSettlementAccount,
    handleAddSettlementAccount,
    handleDeleteSettlementAccount,
    handleSaveSettlementAccountList,
    handleUseSettlementAccountTemplate,
    handleStartNewSettlementAccountList,
    saveSettlementRequestTemplate,
    runSettlementExport,
    handleBack,
  }
}
