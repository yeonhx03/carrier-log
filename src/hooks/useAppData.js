import { useCallback, useEffect, useRef, useState } from 'react'
import { initialNoteCategories } from '../data/noteCategories'
import { initialCompanies } from '../data/sampleData'
import { isFirebaseConfigured, saveAppData, subscribeAppData } from '../utils/cloudStore'
import {
  defaultSettlementAccounts,
  getDefaultAppData,
  getInitialNumber,
  getInitialSettlementAccounts,
  getInitialSettlementAccountTemplates,
  getInitialStoredValue,
  getInitialStringList,
  persistJson,
  persistString,
} from '../utils/appDataStorage'
import {
  DEFAULT_EXTRA_KM_RATE,
  DEFAULT_FIXED_DEDUCTION,
} from '../utils/settlementFiles'

export function useAppData(firebaseUserId) {
  const [companies, setCompanies] = useState(() =>
    getInitialStoredValue('companies', initialCompanies),
  )
  const [noteCategories, setNoteCategories] = useState(() =>
    getInitialStoredValue('noteCategories', initialNoteCategories),
  )
  const [logs, setLogsState] = useState(() => getInitialStoredValue('logs', []))
  const [settlementFixedDeduction, setSettlementFixedDeduction] = useState(() =>
    getInitialNumber('settlementFixedDeduction', DEFAULT_FIXED_DEDUCTION),
  )
  const [settlementExtraKmRate, setSettlementExtraKmRate] = useState(() =>
    getInitialNumber('settlementExtraKmRate', DEFAULT_EXTRA_KM_RATE),
  )
  const [settlementRequestTemplates, setSettlementRequestTemplates] = useState(
    () => getInitialStringList('settlementRequestTemplates'),
  )
  const [settlementAccounts, setSettlementAccounts] = useState(
    getInitialSettlementAccounts,
  )
  const [settlementAccountTemplates, setSettlementAccountTemplates] = useState(
    getInitialSettlementAccountTemplates,
  )
  const appDataRef = useRef({
    companies,
    noteCategories,
    logs,
    settlementAccounts,
    settlementAccountTemplates,
    settlementFixedDeduction,
    settlementExtraKmRate,
    settlementRequestTemplates,
  })
  const isApplyingCloudDataRef = useRef(false)
  const isCloudReadyRef = useRef(!isFirebaseConfigured)
  const isDeletingAccountRef = useRef(false)
  const [readyUserId, setReadyUserId] = useState('')

  useEffect(() => {
    appDataRef.current = {
      companies,
      noteCategories,
      logs,
      settlementAccounts,
      settlementAccountTemplates,
      settlementFixedDeduction,
      settlementExtraKmRate,
      settlementRequestTemplates,
    }
  }, [
    companies,
    noteCategories,
    logs,
    settlementAccounts,
    settlementAccountTemplates,
    settlementFixedDeduction,
    settlementExtraKmRate,
    settlementRequestTemplates,
  ])

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
          setReadyUserId(firebaseUserId)
          saveAppData(firebaseUserId, appDataRef.current).catch((error) => {
            console.error('Firebase initial save failed', error)
          })
          return
        }

        isApplyingCloudDataRef.current = true
        setCompanies(cloudData.companies || initialCompanies)
        setNoteCategories(cloudData.noteCategories || initialNoteCategories)
        setLogsState(cloudData.logs || [])
        setSettlementAccounts(
          cloudData.settlementAccounts || defaultSettlementAccounts,
        )
        setSettlementAccountTemplates(
          cloudData.settlementAccountTemplates || [],
        )
        setSettlementFixedDeduction(
          Number(
            cloudData.settlementFixedDeduction ?? DEFAULT_FIXED_DEDUCTION,
          ),
        )
        setSettlementExtraKmRate(
          Number(cloudData.settlementExtraKmRate ?? DEFAULT_EXTRA_KM_RATE),
        )
        setSettlementRequestTemplates(
          cloudData.settlementRequestTemplates || [],
        )
        isCloudReadyRef.current = true
        setReadyUserId(firebaseUserId)
        window.setTimeout(() => {
          isApplyingCloudDataRef.current = false
        }, 0)
      },
      onError: (error) => {
        console.error('Firebase load failed', error)
        isCloudReadyRef.current = true
        setReadyUserId(firebaseUserId)
      },
    })
  }, [firebaseUserId])

  const setLogs = useCallback(
    (nextLogsOrUpdater) => {
      const currentLogs = appDataRef.current.logs
      const nextLogs =
        typeof nextLogsOrUpdater === 'function'
          ? nextLogsOrUpdater(currentLogs)
          : nextLogsOrUpdater
      const nextData = {
        ...appDataRef.current,
        logs: nextLogs,
      }

      appDataRef.current = nextData
      persistJson('logs', nextLogs)
      setLogsState(nextLogs)

      if (
        !isFirebaseConfigured ||
        !firebaseUserId ||
        !isCloudReadyRef.current ||
        isDeletingAccountRef.current
      ) {
        return
      }

      saveAppData(firebaseUserId, nextData).catch((error) => {
        console.error('Firebase immediate log save failed', error)
      })
    },
    [firebaseUserId],
  )

  useEffect(() => persistJson('companies', companies), [companies])
  useEffect(() => persistJson('noteCategories', noteCategories), [noteCategories])
  useEffect(() => persistJson('logs', logs), [logs])
  useEffect(
    () => persistJson('settlementAccounts', settlementAccounts),
    [settlementAccounts],
  )
  useEffect(
    () => persistJson('settlementAccountTemplates', settlementAccountTemplates),
    [settlementAccountTemplates],
  )
  useEffect(
    () => persistString('settlementFixedDeduction', settlementFixedDeduction),
    [settlementFixedDeduction],
  )
  useEffect(
    () => persistString('settlementExtraKmRate', settlementExtraKmRate),
    [settlementExtraKmRate],
  )
  useEffect(
    () => persistJson('settlementRequestTemplates', settlementRequestTemplates),
    [settlementRequestTemplates],
  )

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
    settlementExtraKmRate,
    settlementRequestTemplates,
    firebaseUserId,
  ])

  const resetUserData = () => {
    const defaultData = getDefaultAppData()

    setCompanies(defaultData.companies)
    setNoteCategories(defaultData.noteCategories)
    setLogsState(defaultData.logs)
    setSettlementAccounts(defaultData.settlementAccounts)
    setSettlementAccountTemplates(defaultData.settlementAccountTemplates)
    setSettlementFixedDeduction(defaultData.settlementFixedDeduction)
    setSettlementExtraKmRate(defaultData.settlementExtraKmRate)
    setSettlementRequestTemplates(defaultData.settlementRequestTemplates)
  }

  return {
    companies,
    setCompanies,
    noteCategories,
    setNoteCategories,
    logs,
    setLogs,
    isDataReady:
      !isFirebaseConfigured || !firebaseUserId || readyUserId === firebaseUserId,
    readyUserId,
    settlementAccounts,
    setSettlementAccounts,
    settlementAccountTemplates,
    setSettlementAccountTemplates,
    settlementFixedDeduction,
    setSettlementFixedDeduction,
    settlementExtraKmRate,
    setSettlementExtraKmRate,
    settlementRequestTemplates,
    setSettlementRequestTemplates,
    isDeletingAccountRef,
    resetUserData,
  }
}
