import { useEffect, useRef, useState } from 'react'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import { Capacitor } from '@capacitor/core'
import {
  deleteUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  signInWithCredential,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import './App.css'
import AuthScreen from './components/AuthScreen'
import ExportScreen from './components/ExportScreen'
import HistoryCompanyTable from './components/HistoryCompanyTable'
import HistoryScreen from './components/HistoryScreen'
import HomeScreen from './components/HomeScreen'
import LogInputForm from './components/LogInputForm'
import LogDetailView from './components/LogDetailView'
import SettlementScreen from './components/SettlementScreen'
import SettingsPanel from './components/SettingsPanel'
import { initialNoteCategories } from './data/noteCategories'
import { initialCompanies } from './data/sampleData'
import { createCompanyId } from './utils/companies'
import {
  getCurrentMonthKey,
  getMonthLabel,
  normalizeDateSearch,
} from './utils/date'
import {
  buildExcelWorkbook,
  buildPrintHtml,
  getExportFilename,
} from './utils/exportFiles'
import { printHtmlDocument, saveOrShareFile } from './utils/nativeExport'
import {
  buildSettlementExcel,
  buildSettlementPrintHtml,
  DEFAULT_FIXED_DEDUCTION,
  getSettlementFilename,
  getSettlementSummary,
} from './utils/settlementFiles'
import {
  deleteAppData,
  isFirebaseConfigured,
  saveAppData,
  subscribeAppData,
} from './utils/cloudStore'
import { auth } from './firebase'

const defaultSettlementAccounts = [
  { id: 1, name: '', bank: '', accountNumber: '', amount: '' },
]

function getInitialSettlementAccounts() {
  try {
    const savedAccounts = window.localStorage.getItem('settlementAccounts')

    return savedAccounts ? JSON.parse(savedAccounts) : defaultSettlementAccounts
  } catch {
    return defaultSettlementAccounts
  }
}

function getInitialSettlementAccountTemplates() {
  try {
    const savedTemplates = window.localStorage.getItem(
      'settlementAccountTemplates',
    )

    if (!savedTemplates) {
      return []
    }

    const parsedTemplates = JSON.parse(savedTemplates)

    return parsedTemplates.filter((template) => Array.isArray(template.accounts))
  } catch {
    return []
  }
}

function getInitialNumber(key, fallbackValue) {
  try {
    const savedValue = window.localStorage.getItem(key)

    return savedValue ? Number(savedValue) : fallbackValue
  } catch {
    return fallbackValue
  }
}

function getInitialStringList(key) {
  try {
    const savedValue = window.localStorage.getItem(key)

    return savedValue ? JSON.parse(savedValue) : []
  } catch {
    return []
  }
}

function getInitialStoredValue(key, fallbackValue) {
  try {
    const savedValue = window.localStorage.getItem(key)

    return savedValue ? JSON.parse(savedValue) : fallbackValue
  } catch {
    return fallbackValue
  }
}

function App() {
  const [screen, setScreen] = useState('home')
  const [companies, setCompanies] = useState(() =>
    getInitialStoredValue('companies', initialCompanies),
  )
  const [noteCategories, setNoteCategories] = useState(() =>
    getInitialStoredValue('noteCategories', initialNoteCategories),
  )
  const [logs, setLogs] = useState(() => getInitialStoredValue('logs', []))
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
  const [exportStep, setExportStep] = useState('month')
  const [selectedExportMonth, setSelectedExportMonth] =
    useState(getCurrentMonthKey)
  const [exportFormat, setExportFormat] = useState('excel')
  const [exportMode, setExportMode] = useState('all')
  const [selectedExportCompanyId, setSelectedExportCompanyId] = useState('')
  const [selectedSettlementMonth, setSelectedSettlementMonth] =
    useState(getCurrentMonthKey)
  const [settlementFormat, setSettlementFormat] = useState('excel')
  const [isSettingOpen, setIsSettingOpen] = useState(false)
  const [settingSection, setSettingSection] = useState('menu')
  const [newCompanyName, setNewCompanyName] = useState('')
  const [newNoteCategoryName, setNewNoteCategoryName] = useState('')
  const [newNoteCategoryPrice, setNewNoteCategoryPrice] = useState('')
  const [settlementFixedDeduction, setSettlementFixedDeduction] = useState(() =>
    getInitialNumber('settlementFixedDeduction', DEFAULT_FIXED_DEDUCTION),
  )
  const [settlementStep, setSettlementStep] = useState('summary')
  const [settlementRequest, setSettlementRequest] = useState('')
  const [settlementRequestTemplates, setSettlementRequestTemplates] = useState(
    () => getInitialStringList('settlementRequestTemplates'),
  )
  const [settlementAccounts, setSettlementAccounts] = useState(
    getInitialSettlementAccounts,
  )
  const [settlementAccountTemplates, setSettlementAccountTemplates] = useState(
    getInitialSettlementAccountTemplates,
  )
  const [isLocalOnlyMode, setIsLocalOnlyMode] = useState(() =>
    getInitialStoredValue('isLocalOnlyMode', false),
  )
  const [isAuthLoading, setIsAuthLoading] = useState(isFirebaseConfigured)
  const [authErrorMessage, setAuthErrorMessage] = useState('')
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteAccountError, setDeleteAccountError] = useState('')
  const appDataRef = useRef({
    companies,
    noteCategories,
    logs,
    settlementAccounts,
    settlementAccountTemplates,
    settlementFixedDeduction,
    settlementRequestTemplates,
  })
  const isApplyingCloudDataRef = useRef(false)
  const isCloudReadyRef = useRef(!isFirebaseConfigured)
  const isDeletingAccountRef = useRef(false)

  const selectedLog = logs.find((log) => log.id === selectedLogId)
  const firebaseUserId = firebaseUser?.uid || ''

  useEffect(() => {
    appDataRef.current = {
      companies,
      noteCategories,
      logs,
      settlementAccounts,
      settlementAccountTemplates,
      settlementFixedDeduction,
      settlementRequestTemplates,
    }
  }, [
    companies,
    noteCategories,
    logs,
    settlementAccounts,
    settlementAccountTemplates,
    settlementFixedDeduction,
    settlementRequestTemplates,
  ])

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return undefined
    }

    if (!auth) {
      return undefined
    }

    return onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user)
      setIsAuthLoading(false)
      isCloudReadyRef.current = Boolean(user)

      if (user) {
        setIsLocalOnlyMode(false)
        setAuthErrorMessage('')
      }
    })
  }, [])

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseUserId) {
      return undefined
    }

    isCloudReadyRef.current = false

    return subscribeAppData({
      userId: firebaseUserId,
      onData: (cloudData) => {
        if (!cloudData) {
          if (isDeletingAccountRef.current) {
            return
          }

          isCloudReadyRef.current = true
          saveAppData(firebaseUserId, appDataRef.current).catch((error) => {
            console.error('Firebase initial save failed', error)
          })
          return
        }

        isApplyingCloudDataRef.current = true
        setCompanies(cloudData.companies || initialCompanies)
        setNoteCategories(cloudData.noteCategories || initialNoteCategories)
        setLogs(cloudData.logs || [])
        setSettlementAccounts(
          cloudData.settlementAccounts || defaultSettlementAccounts,
        )
        setSettlementAccountTemplates(
          cloudData.settlementAccountTemplates || [],
        )
        setSettlementFixedDeduction(
          Number(cloudData.settlementFixedDeduction || DEFAULT_FIXED_DEDUCTION),
        )
        setSettlementRequestTemplates(
          cloudData.settlementRequestTemplates || [],
        )
        isCloudReadyRef.current = true
        window.setTimeout(() => {
          isApplyingCloudDataRef.current = false
        }, 0)
      },
      onError: (error) => {
        console.error('Firebase load failed', error)
        isCloudReadyRef.current = true
      },
    })
  }, [firebaseUserId])

  useEffect(() => {
    window.localStorage.setItem(
      'isLocalOnlyMode',
      JSON.stringify(isLocalOnlyMode),
    )
  }, [isLocalOnlyMode])

  useEffect(() => {
    window.localStorage.setItem('companies', JSON.stringify(companies))
  }, [companies])

  useEffect(() => {
    window.localStorage.setItem(
      'noteCategories',
      JSON.stringify(noteCategories),
    )
  }, [noteCategories])

  useEffect(() => {
    window.localStorage.setItem('logs', JSON.stringify(logs))
  }, [logs])

  useEffect(() => {
    window.localStorage.setItem(
      'settlementAccounts',
      JSON.stringify(settlementAccounts),
    )
  }, [settlementAccounts])

  useEffect(() => {
    window.localStorage.setItem(
      'settlementAccountTemplates',
      JSON.stringify(settlementAccountTemplates),
    )
  }, [settlementAccountTemplates])

  useEffect(() => {
    window.localStorage.setItem(
      'settlementFixedDeduction',
      String(settlementFixedDeduction),
    )
  }, [settlementFixedDeduction])

  useEffect(() => {
    window.localStorage.setItem(
      'settlementRequestTemplates',
      JSON.stringify(settlementRequestTemplates),
    )
  }, [settlementRequestTemplates])

  useEffect(() => {
    if (
      !isFirebaseConfigured ||
      !firebaseUserId ||
      !isCloudReadyRef.current ||
      isApplyingCloudDataRef.current ||
      isDeletingAccountRef.current
    ) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      saveAppData(firebaseUserId, appDataRef.current).catch((error) => {
        console.error('Firebase save failed', error)
      })
    }, 500)

    return () => window.clearTimeout(timeoutId)
  }, [
    companies,
    noteCategories,
    logs,
    settlementAccounts,
    settlementAccountTemplates,
    settlementFixedDeduction,
    settlementRequestTemplates,
    firebaseUserId,
  ])

  const getCompanyName = (companyId, fallbackName) => {
    return (
      companies.find((company) => company.id === companyId)?.name ||
      fallbackName ||
      ''
    )
  }

  const getAvailableHistoryMonths = (fallbackMonth = selectedHistoryMonth) => {
    const monthMap = new Map()

    logs.forEach((log) => {
      const monthKey = `${log.year}-${String(log.month).padStart(2, '0')}`
      monthMap.set(monthKey, {
        key: monthKey,
        year: log.year,
        month: log.month,
      })
    })

    if (!monthMap.has(fallbackMonth)) {
      const [year, month] = fallbackMonth.split('-').map(Number)
      monthMap.set(fallbackMonth, {
        key: fallbackMonth,
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

  const runExport = async (mode = 'save') => {
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
    setSelectedHistoryGroupKey(null)
    setSelectedHistoryCompanyId(null)
    setSelectedLogId(null)
    setIsEditingLog(false)
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

  const openSettlement = () => {
    setSelectedSettlementMonth(getCurrentMonthKey())
    setSettlementFormat('excel')
    setSettlementStep('summary')
    setScreen('settlement')
  }

  const getSettlementLogs = (monthKey) => {
    const [year, month] = monthKey.split('-').map(Number)

    return logs
      .filter((log) => log.year === year && log.month === month)
      .map((log) => ({
        ...log,
        companyName: getCompanyName(log.companyId, log.companyName),
      }))
  }

  const runSettlementExport = async (mode = 'save') => {
    const targetLogs = getSettlementLogs(selectedSettlementMonth)

    if (targetLogs.length === 0) {
      alert('정산할 내역이 없습니다.')
      return
    }

    try {
      saveSettlementRequestTemplate()

      if (settlementFormat === 'excel') {
        await saveOrShareFile(
          buildSettlementExcel(
            selectedSettlementMonth,
            targetLogs,
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
          targetLogs,
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

  const handleUpdateNoteCategory = (categoryValue, nextName, nextPrice) => {
    const trimmedName = nextName.trim()
    const unitPrice = Number(nextPrice || 0)

    if (categoryValue && !trimmedName) {
      alert('비고 이름을 입력해주세요.')
      return
    }

    if (
      categoryValue &&
      noteCategories.some(
        (category) =>
          category.value !== categoryValue && category.value === trimmedName,
      )
    ) {
      alert('이미 등록된 비고 카테고리입니다.')
      return
    }

    setNoteCategories((prevCategories) =>
      prevCategories.map((category) => {
        if (category.value !== categoryValue) {
          return category
        }

        return {
          ...category,
          value: trimmedName,
          label: trimmedName,
          unitPrice,
        }
      }),
    )

    if (categoryValue && categoryValue !== trimmedName) {
      setLogs((prevLogs) =>
        prevLogs.map((log) =>
          log.note === categoryValue ? { ...log, note: trimmedName } : log,
        ),
      )
    }
  }

  const handleUpdateDefaultUnitPrice = (nextPrice) => {
    setNoteCategories((prevCategories) =>
      prevCategories.map((category) =>
        category.value === ''
          ? { ...category, unitPrice: Number(nextPrice || 0) }
          : category,
      ),
    )
  }

  const handleUpdateFixedDeduction = (nextPrice) => {
    setSettlementFixedDeduction(Number(nextPrice || 0))
  }

  const handleAddNoteCategory = () => {
    const trimmedName = newNoteCategoryName.trim()

    if (!trimmedName) {
      return
    }

    if (noteCategories.some((category) => category.value === trimmedName)) {
      alert('이미 등록된 비고 카테고리입니다.')
      return
    }

    setNoteCategories((prevCategories) => [
      ...prevCategories,
      {
        value: trimmedName,
        label: trimmedName,
        unitPrice: Number(newNoteCategoryPrice || 0),
      },
    ])
    setNewNoteCategoryName('')
    setNewNoteCategoryPrice('')
  }

  const handleDeleteNoteCategory = (categoryValue) => {
    setNoteCategories((prevCategories) =>
      prevCategories.filter((category) => category.value !== categoryValue),
    )
    setLogs((prevLogs) =>
      prevLogs.map((log) =>
        log.note === categoryValue ? { ...log, note: '' } : log,
      ),
    )
  }

  const handleUpdateSettlementAccount = (accountId, field, value) => {
    setSettlementAccounts((prevAccounts) =>
      prevAccounts.map((account) =>
        account.id === accountId ? { ...account, [field]: value } : account,
      )
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
        (template) =>
          template.id !== listId && template.name !== trimmedName,
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

    setSettlementRequestTemplates((prevTemplates) => [
      trimmedRequest,
      ...prevTemplates.filter((template) => template !== trimmedRequest),
    ].slice(0, 8))
  }

  const resetUserData = () => {
    setCompanies(initialCompanies)
    setNoteCategories(initialNoteCategories)
    setLogs([])
    setSettlementAccounts(defaultSettlementAccounts)
    setSettlementAccountTemplates([])
    setSettlementFixedDeduction(DEFAULT_FIXED_DEDUCTION)
    setSettlementRequestTemplates([])
    setSettlementRequest('')
    setSelectedLogId(null)
    setSelectedHistoryCompanyId(null)
    setSelectedHistoryGroupKey(null)
    setScreen('home')
  }

  const reauthenticateCurrentUser = async () => {
    if (!auth?.currentUser) {
      throw new Error('Current Firebase user was not found.')
    }

    if (Capacitor.isNativePlatform()) {
      const result = await FirebaseAuthentication.signInWithGoogle({
        skipNativeAuth: true,
      })
      const idToken = result.credential?.idToken

      if (!idToken) {
        throw new Error('Google ID token was not returned.')
      }

      await reauthenticateWithCredential(
        auth.currentUser,
        GoogleAuthProvider.credential(idToken),
      )
      return
    }

    await reauthenticateWithPopup(auth.currentUser, new GoogleAuthProvider())
  }

  const handleGoogleSignIn = () => {
    if (!auth) {
      setAuthErrorMessage('Firebase 설정을 확인해주세요.')
      return
    }

    const provider = new GoogleAuthProvider()

    setIsAuthLoading(true)
    setAuthErrorMessage('')

    const signInPromise = Capacitor.isNativePlatform()
      ? FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: true }).then(
          (result) => {
            const idToken = result.credential?.idToken

            if (!idToken) {
              throw new Error('Google ID token was not returned.')
            }

            return signInWithCredential(
              auth,
              GoogleAuthProvider.credential(idToken),
            )
          },
        )
      : signInWithPopup(auth, provider)

    signInPromise
      .catch((error) => {
        console.error('Google sign in failed', error)
        setAuthErrorMessage('구글 로그인에 실패했습니다. 다시 시도해주세요.')
      })
      .finally(() => {
        setIsAuthLoading(false)
      })
  }

  const handleStartLocalOnly = () => {
    setIsLocalOnlyMode(true)
    setAuthErrorMessage('')
  }

  const handleSignOut = () => {
    if (!auth) {
      return
    }

    const nativeSignOutPromise = Capacitor.isNativePlatform()
      ? FirebaseAuthentication.signOut()
      : Promise.resolve()

    nativeSignOutPromise
      .then(() => signOut(auth))
      .then(() => {
        setIsLocalOnlyMode(true)
        setIsSettingOpen(false)
        setSettingSection('menu')
      })
      .catch((error) => {
        console.error('Google sign out failed', error)
      })
  }

  const handleDeleteAccount = async () => {
    if (!auth?.currentUser || !firebaseUserId || isDeletingAccountRef.current) {
      return
    }

    let cloudDataDeleted = false

    isDeletingAccountRef.current = true
    setIsDeletingAccount(true)
    setDeleteAccountError('')

    try {
      await reauthenticateCurrentUser()
      await deleteAppData(firebaseUserId)
      cloudDataDeleted = true
      await deleteUser(auth.currentUser)

      if (Capacitor.isNativePlatform()) {
        await FirebaseAuthentication.signOut().catch((error) => {
          console.error('Native Google sign out after account deletion failed', error)
        })
      }

      resetUserData()
      setIsLocalOnlyMode(false)
      setIsSettingOpen(false)
      setSettingSection('menu')
    } catch (error) {
      console.error('Firebase account deletion failed', error)

      if (cloudDataDeleted) {
        resetUserData()
        setIsLocalOnlyMode(false)
        setIsSettingOpen(false)
        setSettingSection('menu')
        setAuthErrorMessage(
          '서버 데이터는 삭제되었지만 계정 삭제를 완료하지 못했습니다. 다시 로그인한 후 계정 삭제를 재시도해주세요.',
        )
        if (Capacitor.isNativePlatform()) {
          await FirebaseAuthentication.signOut().catch((signOutError) => {
            console.error('Native sign out after account deletion failure failed', signOutError)
          })
        }
        await signOut(auth).catch((signOutError) => {
          console.error('Firebase sign out after account deletion failure failed', signOutError)
        })
        return
      }

      setDeleteAccountError(
        '계정 삭제에 실패했습니다. Google 계정을 다시 확인한 후 재시도해주세요.',
      )
    } finally {
      isDeletingAccountRef.current = false
      setIsDeletingAccount(false)
    }
  }

  const renderHistoryScreen = () => {
    const historyGroups = getHistoryGroups()

    if (selectedLog) {
      if (isEditingLog) {
        return (
          <LogInputForm
            companies={companies}
            logs={logs}
            noteCategories={noteCategories}
            initialLog={selectedLog}
            onUpdateLog={handleUpdateLog}
            onBack={() => setIsEditingLog(false)}
          />
        )
      }

      return (
        <LogDetailView
          log={selectedLog}
          companyName={getCompanyName(selectedLog.companyId, selectedLog.companyName)}
          onBack={() => {
            setSelectedLogId(null)
            setIsEditingLog(false)
          }}
          onEdit={() => setIsEditingLog(true)}
          onDelete={() => handleDeleteLog(selectedLog.id)}
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
            onSelectLog={(logId) => {
              setSelectedLogId(logId)
              setIsEditingLog(false)
            }}
            onBack={() => {
              setSelectedHistoryGroupKey(null)
              setSelectedHistoryCompanyId(null)
              setIsEditingLog(false)
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
          setIsEditingLog(false)
        }}
        onChangeSearchValue={(value) => {
          setHistorySearch(value)
          setSelectedHistoryGroupKey(null)
          setSelectedHistoryCompanyId(null)
          setSelectedLogId(null)
          setIsEditingLog(false)
        }}
        onChangeMonth={(monthKey) => {
          setSelectedHistoryMonth(monthKey)
          setSelectedHistoryGroupKey(null)
          setSelectedHistoryCompanyId(null)
          setSelectedLogId(null)
          setIsEditingLog(false)
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
    const exportMonths = getAvailableHistoryMonths(selectedExportMonth)
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

  const renderSettlementScreen = () => {
    const settlementLogs = getSettlementLogs(selectedSettlementMonth)
    const settlementSummary = getSettlementSummary(
      settlementLogs,
      noteCategories,
      settlementFixedDeduction,
    )

    return (
      <SettlementScreen
        months={getAvailableHistoryMonths(selectedSettlementMonth)}
        selectedMonth={selectedSettlementMonth}
        format={settlementFormat}
        noteCategories={noteCategories}
        summary={settlementSummary}
        logsCount={settlementLogs.length}
        step={settlementStep}
        accounts={settlementAccounts}
        accountTemplates={settlementAccountTemplates}
        requestText={settlementRequest}
        requestTemplates={settlementRequestTemplates}
        onChangeMonth={setSelectedSettlementMonth}
        onChangeFormat={setSettlementFormat}
        onNext={() => setSettlementStep('accounts')}
        onUpdateAccount={handleUpdateSettlementAccount}
        onAddAccount={handleAddSettlementAccount}
        onDeleteAccount={handleDeleteSettlementAccount}
        onSaveAccountList={handleSaveSettlementAccountList}
        onUseAccountTemplate={handleUseSettlementAccountTemplate}
        onStartNewAccountList={handleStartNewSettlementAccountList}
        onChangeRequestText={setSettlementRequest}
        onUseRequestTemplate={setSettlementRequest}
        onRunExport={runSettlementExport}
        onBack={() => {
          if (settlementStep === 'accounts') {
            setSettlementStep('summary')
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
        {isFirebaseConfigured && !firebaseUser && !isLocalOnlyMode && (
          <AuthScreen
            errorMessage={authErrorMessage}
            isLoading={isAuthLoading}
            onGoogleSignIn={handleGoogleSignIn}
            onStartLocalOnly={handleStartLocalOnly}
          />
        )}
        {(!isFirebaseConfigured || firebaseUser || isLocalOnlyMode) && (
          <>
            {screen === 'home' && (
              <HomeScreen
                logsCount={logs.length}
                onInput={() => setScreen('input')}
                onHistory={openHistory}
                onExport={openExport}
                onSettlement={openSettlement}
                onSettings={() => setIsSettingOpen(true)}
              />
            )}
            {screen === 'input' && (
              <LogInputForm
                companies={companies}
                logs={logs}
                noteCategories={noteCategories}
                onAddLog={handleAddLog}
                onBack={() => setScreen('home')}
              />
            )}
            {screen === 'history' && renderHistoryScreen()}
            {screen === 'export' && renderExportScreen()}
            {screen === 'settlement' && renderSettlementScreen()}
          </>
        )}
      </div>

      {isSettingOpen && (
        <SettingsPanel
          section={settingSection}
          currentUser={firebaseUser}
          isLocalOnlyMode={isLocalOnlyMode}
          isDeletingAccount={isDeletingAccount}
          deleteAccountError={deleteAccountError}
          companies={companies}
          noteCategories={noteCategories}
          fixedDeduction={settlementFixedDeduction}
          newCompanyName={newCompanyName}
          newNoteCategoryName={newNoteCategoryName}
          newNoteCategoryPrice={newNoteCategoryPrice}
          onClose={() => {
            setIsSettingOpen(false)
            setSettingSection('menu')
          }}
          onChangeSection={setSettingSection}
          onGoogleSignIn={handleGoogleSignIn}
          onSignOut={handleSignOut}
          onDeleteAccount={handleDeleteAccount}
          onChangeNewCompanyName={setNewCompanyName}
          onAddCompany={handleAddCompany}
          onRenameCompany={handleRenameCompany}
          onDeleteCompany={handleDeleteCompany}
          onChangeNewNoteCategoryName={setNewNoteCategoryName}
          onChangeNewNoteCategoryPrice={setNewNoteCategoryPrice}
          onAddNoteCategory={handleAddNoteCategory}
          onUpdateNoteCategory={handleUpdateNoteCategory}
          onUpdateDefaultUnitPrice={handleUpdateDefaultUnitPrice}
          onUpdateFixedDeduction={handleUpdateFixedDeduction}
          onDeleteNoteCategory={handleDeleteNoteCategory}
        />
      )}
    </main>
  )
}

export default App
