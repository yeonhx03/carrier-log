export function createCompanyId(name) {
  const normalizedName = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣-]/g, '')

  return `${normalizedName || 'company'}-${Date.now()}`
}
