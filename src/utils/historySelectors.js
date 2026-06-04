import { normalizeDateSearch } from './date'
import { getCompanyName } from './logSelectors'

function matchesHistorySearch(log, searchType, searchValue) {
  const normalizedSearch = searchValue.trim().toLowerCase()

  if (!normalizedSearch) {
    return true
  }

  if (searchType === 'date') {
    const dateTargets = [
      log.date,
      log.dateText,
      `${log.month}월 ${log.day}일`,
      `${log.month}월${log.day}일`,
    ]
    const normalizedDateSearch = normalizeDateSearch(searchValue)

    return dateTargets.some((target) =>
      normalizeDateSearch(target).includes(normalizedDateSearch),
    )
  }

  if (searchType === 'carType') {
    return log.carType.toLowerCase().includes(normalizedSearch)
  }

  if (searchType === 'note') {
    return String(log.note || '').toLowerCase().includes(normalizedSearch)
  }

  return String(log.carNumber).toLowerCase().includes(normalizedSearch)
}

export function getHistoryGroups({
  logs,
  companies,
  selectedMonth,
  searchType,
  searchValue,
}) {
  const monthMap = new Map()
  const [targetYear, targetMonth] = selectedMonth.split('-').map(Number)
  const normalizedSearch = searchValue.trim().toLowerCase()
  const selectedMonthLogs = logs.filter(
    (log) => log.year === targetYear && log.month === targetMonth,
  )
  const baseLogs = normalizedSearch ? logs : selectedMonthLogs

  baseLogs
    .filter((log) => matchesHistorySearch(log, searchType, searchValue))
    .forEach((log) => {
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
          companyName: getCompanyName(companies, log.companyId, log.companyName),
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
            companies,
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
