import { useEffect, useRef, useState } from 'react'
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
import { DEFAULT_FIXED_DEDUCTION } from '../utils/settlementFiles'

export function useAppData(firebaseUserId) {
  const [companies, setCompanies] = useState(() =>
    getInitialStoredValue('companies', initialCompanies),
  )
  const [noteCategories, setNoteCategories] = useState(() =>
    getInitialStoredValue('noteCategories', initialNoteCategories),
  )
  const [logs, setLogs] = useState(() => getInitialStoredValue('logs', []))
  const [settlementFixedDeduction, setSettlementFixedDeduction] = useState(() =>
    getInitialNumber('settlementFixedDeduction', DEFAULT_FIXED_DEDUCTION),
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
    settlementRequestTemplates,
  })
  const isApplyingCloudDataRef = useRef(false)
  const isCloudReadyRef = useRef(!isFirebaseConfigured)
  const isDeletingAccountRef = useRef(false)

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
    settlementRequestTemplates,
    firebaseUserId,
  ])

  const resetUserData = () => {
    const defaultData = getDefaultAppData()

    setCompanies(defaultData.companies)
    setNoteCategories(defaultData.noteCategories)
    setLogs(defaultData.logs)
    setSettlementAccounts(defaultData.settlementAccounts)
    setSettlementAccountTemplates(defaultData.settlementAccountTemplates)
    setSettlementFixedDeduction(defaultData.settlementFixedDeduction)
    setSettlementRequestTemplates(defaultData.settlementRequestTemplates)
  }

  return {
    companies,
    setCompanies,
    noteCategories,
    setNoteCategories,
    logs,
    setLogs,
    settlementAccounts,
    setSettlementAccounts,
    settlementAccountTemplates,
    setSettlementAccountTemplates,
    settlementFixedDeduction,
    setSettlementFixedDeduction,
    settlementRequestTemplates,
    setSettlementRequestTemplates,
    isDeletingAccountRef,
    resetUserData,
  }
}
