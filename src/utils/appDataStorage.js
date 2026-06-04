import { initialNoteCategories } from '../data/noteCategories'
import { initialCompanies } from '../data/sampleData'
import { DEFAULT_FIXED_DEDUCTION } from './settlementFiles'

export const defaultSettlementAccounts = [
  { id: 1, name: '', bank: '', accountNumber: '', amount: '' },
]

export function getInitialStoredValue(key, fallbackValue) {
  try {
    const savedValue = window.localStorage.getItem(key)

    return savedValue ? JSON.parse(savedValue) : fallbackValue
  } catch {
    return fallbackValue
  }
}

export function getInitialNumber(key, fallbackValue) {
  try {
    const savedValue = window.localStorage.getItem(key)

    return savedValue ? Number(savedValue) : fallbackValue
  } catch {
    return fallbackValue
  }
}

export function getInitialStringList(key) {
  return getInitialStoredValue(key, [])
}

export function getInitialSettlementAccounts() {
  return getInitialStoredValue('settlementAccounts', defaultSettlementAccounts)
}

export function getInitialSettlementAccountTemplates() {
  const templates = getInitialStoredValue('settlementAccountTemplates', [])

  return templates.filter((template) => Array.isArray(template.accounts))
}

export function getDefaultAppData() {
  return {
    companies: initialCompanies,
    noteCategories: initialNoteCategories,
    logs: [],
    settlementAccounts: defaultSettlementAccounts,
    settlementAccountTemplates: [],
    settlementFixedDeduction: DEFAULT_FIXED_DEDUCTION,
    settlementRequestTemplates: [],
  }
}

export function persistJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function persistString(key, value) {
  window.localStorage.setItem(key, String(value))
}
