export function getCompanyName(companies, companyId, fallbackName = '') {
  return (
    companies.find((company) => company.id === companyId)?.name ||
    fallbackName ||
    ''
  )
}

export function getAvailableMonths(logs, fallbackMonth) {
  const monthMap = new Map()

  logs.forEach((log) => {
    const monthKey = `${log.year}-${String(log.month).padStart(2, '0')}`
    monthMap.set(monthKey, {
      key: monthKey,
      year: log.year,
      month: log.month,
    })
  })

  if (fallbackMonth && !monthMap.has(fallbackMonth)) {
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

export function getMonthLogs(logs, monthKey) {
  const [year, month] = monthKey.split('-').map(Number)

  return logs
    .filter((log) => log.year === year && log.month === month)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
}

export function getCompanyGroupsForMonth(
  logs,
  companies,
  monthKey,
  companyId = '',
) {
  const groupMap = new Map()

  getMonthLogs(logs, monthKey)
    .filter((log) => !companyId || log.companyId === companyId)
    .forEach((log) => {
      if (!groupMap.has(log.companyId)) {
        groupMap.set(log.companyId, {
          companyId: log.companyId,
          companyName: getCompanyName(companies, log.companyId, log.companyName),
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

export function getSettlementLogs(logs, companies, monthKey) {
  const [year, month] = monthKey.split('-').map(Number)

  return logs
    .filter((log) => log.year === year && log.month === month)
    .map((log) => ({
      ...log,
      companyName: getCompanyName(companies, log.companyId, log.companyName),
    }))
}
