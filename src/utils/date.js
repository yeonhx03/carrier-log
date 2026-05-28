export function getCurrentMonthKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')

  return `${year}-${month}`
}

export function getMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)

  return `${year}년 ${month}월`
}

export function normalizeDateSearch(value) {
  return String(value).toLowerCase().replace(/[\s-]/g, '')
}
