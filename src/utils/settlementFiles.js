import { getMonthLabel } from './date'

export const EXTRA_KM_RATE = 2000
export const DEDUCTION_RATE = 0.045
export const DEFAULT_FIXED_DEDUCTION = 150000

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatNumber(value) {
  return Math.round(value).toLocaleString('ko-KR')
}

function normalizeNote(note, noteCategories) {
  const value = String(note || '').trim()
  const isKnownCategory = noteCategories.some((category) => {
    return category.value === value
  })

  return isKnownCategory ? value : ''
}

function getSettlementRows(noteCategories) {
  const groupedRows = noteCategories
    .filter((category) => category.value)
    .reduce((rows, category) => {
      const row = rows.find((item) => item.unitPrice === category.unitPrice)

      if (row) {
        row.values.push(category.value)
        row.label = row.values.join(row.unitPrice === 31000 ? ' / ' : ',')
        return rows
      }

      return [
        ...rows,
        {
          key: category.value,
          values: [category.value],
          label: category.label,
          unitPrice: category.unitPrice,
        },
      ]
    }, [])

  return [
    {
      key: 'default',
      values: [''],
      label: '',
      unitPrice: noteCategories[0]?.unitPrice || 45000,
    },
    ...groupedRows,
  ]
}

function getCompanyName(log) {
  return log.companyName || log.company || log.companyId || '미지정'
}

function getCompanyGroups(logs) {
  const groupMap = new Map()

  logs.forEach((log) => {
    const companyId = log.companyId || getCompanyName(log)

    if (!groupMap.has(companyId)) {
      groupMap.set(companyId, {
        companyId,
        companyName: getCompanyName(log),
        logs: [],
      })
    }

    groupMap.get(companyId).logs.push(log)
  })

  return Array.from(groupMap.values())
}

function getCompanySettlement(group, noteCategories) {
  const rows = getSettlementRows(noteCategories).map((row) => {
    const quantity = group.logs.filter((log) => {
      return row.values.includes(normalizeNote(log.note, noteCategories))
    }).length
    const amount = quantity * row.unitPrice

    return {
      ...row,
      quantity,
      amount,
      amountText: quantity > 0 || row.key === 'default' ? formatNumber(amount) : '-',
      quantityText: quantity > 0 ? String(quantity) : '',
    }
  })
  const extraKm = group.logs.reduce(
    (sum, log) => sum + Number(log.extraKm || 0),
    0,
  )
  const extraKmAmount = extraKm * EXTRA_KM_RATE

  rows.push({
    key: 'extraKm',
    quantity: '',
    quantityText: '',
    unitPrice: EXTRA_KM_RATE,
    amount: extraKmAmount,
    amountText: extraKm > 0 ? formatNumber(extraKmAmount) : '-',
    label: `추가견인(${formatNumber(extraKm)}K)`,
  })

  const subtotal = rows.reduce((sum, row) => sum + row.amount, 0)

  return {
    ...group,
    rows,
    subtotal,
    quantity: group.logs.length,
  }
}

export function getSettlementSummary(
  logs,
  noteCategories,
  fixedDeduction = DEFAULT_FIXED_DEDUCTION,
) {
  const companies = getCompanyGroups(logs).map((group) =>
    getCompanySettlement(group, noteCategories),
  )
  const totalAmount = companies.reduce(
    (sum, company) => sum + company.subtotal,
    0,
  )
  const deductionAmount =
    Math.round((totalAmount * DEDUCTION_RATE) / 1000) * 1000
  const payableAmount = Math.max(
    totalAmount - deductionAmount - fixedDeduction,
    0,
  )

  return {
    companies,
    totalAmount,
    deductionAmount,
    fixedDeduction,
    payableAmount,
  }
}

export function getSettlementFilename(monthKey, extension) {
  const [year, month] = monthKey.split('-')

  return `carrier-settlement_${year}-${month}.${extension}`
}

function getVisibleAccounts(accounts = []) {
  return accounts.filter((account) => {
    return (
      String(account.name || '').trim() ||
      String(account.bank || '').trim() ||
      String(account.accountNumber || '').trim() ||
      String(account.amount || '').trim()
    )
  })
}

function buildExcelCompanyRows(company) {
  const detailRows = company.rows
    .map((row, index) => {
      const companyCell =
        index === 0
          ? `<Cell ss:MergeDown="${company.rows.length}" ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(company.companyName)}</Data></Cell>`
          : ''

      return `
      <Row>
        ${companyCell}
        <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(row.quantityText)}</Data></Cell>
        <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(formatNumber(row.unitPrice))}</Data></Cell>
        <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(row.amountText)}</Data></Cell>
        <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(row.label)}</Data></Cell>
      </Row>`
    })
    .join('')

  return `${detailRows}
      <Row>
        <Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>
        <Cell ss:StyleID="Subtotal"><Data ss:Type="String">${company.quantity}</Data></Cell>
        <Cell ss:StyleID="Subtotal"><Data ss:Type="String">소계</Data></Cell>
        <Cell ss:StyleID="Subtotal"><Data ss:Type="String">${escapeXml(formatNumber(company.subtotal))}</Data></Cell>
        <Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>
      </Row>`
}

function buildExcelAccountRows(accounts) {
  const visibleAccounts = getVisibleAccounts(accounts)

  if (visibleAccounts.length === 0) {
    return ''
  }

  const rows = visibleAccounts
    .map(
      (account) => `
      <Row>
        <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(account.name)}</Data></Cell>
        <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(account.bank)}</Data></Cell>
        <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(account.accountNumber)}</Data></Cell>
        <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(formatNumber(Number(account.amount || 0)))}</Data></Cell>
        <Cell ss:StyleID="Cell"><Data ss:Type="String"></Data></Cell>
      </Row>`,
    )
    .join('')

  return `
      <Row><Cell ss:MergeAcross="4" ss:StyleID="Title"><Data ss:Type="String">입금시 부탁</Data></Cell></Row>
      <Row>
        <Cell ss:StyleID="Header"><Data ss:Type="String">이름</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">은행</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">계좌번호</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">금액</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String"></Data></Cell>
      </Row>
      ${rows}`
}

function buildExcelRequestRows(requestText) {
  const trimmedRequest = String(requestText || '').trim()

  if (!trimmedRequest) {
    return ''
  }

  return `
      <Row><Cell ss:MergeAcross="4" ss:StyleID="Title"><Data ss:Type="String">요청사항</Data></Cell></Row>
      <Row><Cell ss:MergeAcross="4" ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(trimmedRequest)}</Data></Cell></Row>`
}

export function buildSettlementExcel(
  monthKey,
  logs,
  noteCategories,
  fixedDeduction = DEFAULT_FIXED_DEDUCTION,
  accounts = [],
  requestText = '',
) {
  const monthLabel = getMonthLabel(monthKey)
  const summary = getSettlementSummary(logs, noteCategories, fixedDeduction)
  const companyRows = summary.companies.map(buildExcelCompanyRows).join('')
  const accountRows = buildExcelAccountRows(accounts)
  const requestRows = buildExcelRequestRows(requestText)

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Title"><Font ss:Bold="1" ss:Size="18" /><Alignment ss:Horizontal="Left" /></Style>
    <Style ss:ID="Header"><Font ss:Bold="1" /><Interior ss:Color="#E5E7EB" ss:Pattern="Solid" /><Alignment ss:Horizontal="Center" /><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" /><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" /><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" /><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" /></Borders></Style>
    <Style ss:ID="Cell"><Alignment ss:Horizontal="Center" ss:Vertical="Center" /><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" /><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" /><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" /><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" /></Borders></Style>
    <Style ss:ID="Subtotal"><Font ss:Bold="1" /><Alignment ss:Horizontal="Center" /><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" /><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" /><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" /><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" /></Borders></Style>
    <Style ss:ID="Summary"><Font ss:Bold="1" /><Interior ss:Color="#F3F4F6" ss:Pattern="Solid" /><Alignment ss:Horizontal="Center" /><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" /><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" /><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" /><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" /></Borders></Style>
  </Styles>
  <Worksheet ss:Name="정산 내역">
    <Table>
      <Column ss:Width="70" />
      <Column ss:Width="80" />
      <Column ss:Width="120" />
      <Column ss:Width="120" />
      <Column ss:Width="180" />
      <Row>
        <Cell ss:MergeAcross="4" ss:StyleID="Title"><Data ss:Type="String">${escapeXml(monthLabel)} 정산 내역</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="Header"><Data ss:Type="String">구분</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">수량</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">단가</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">금액</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">비고</Data></Cell>
      </Row>
      ${companyRows}
      <Row><Cell ss:MergeAcross="2" ss:StyleID="Summary"><Data ss:Type="String">합계</Data></Cell><Cell ss:StyleID="Summary"><Data ss:Type="String">${escapeXml(formatNumber(summary.totalAmount))}</Data></Cell><Cell ss:StyleID="Summary"><Data ss:Type="String"></Data></Cell></Row>
      <Row><Cell ss:MergeAcross="2" ss:StyleID="Summary"><Data ss:Type="String">공제(4.5%) 금액</Data></Cell><Cell ss:StyleID="Summary"><Data ss:Type="String">${escapeXml(formatNumber(summary.deductionAmount))}</Data></Cell><Cell ss:StyleID="Summary"><Data ss:Type="String"></Data></Cell></Row>
      <Row><Cell ss:MergeAcross="2" ss:StyleID="Summary"><Data ss:Type="String">매월 공제</Data></Cell><Cell ss:StyleID="Summary"><Data ss:Type="String">${escapeXml(formatNumber(summary.fixedDeduction))}</Data></Cell><Cell ss:StyleID="Summary"><Data ss:Type="String"></Data></Cell></Row>
      <Row><Cell ss:MergeAcross="2" ss:StyleID="Summary"><Data ss:Type="String">공제후 금액</Data></Cell><Cell ss:StyleID="Summary"><Data ss:Type="String">${escapeXml(formatNumber(summary.payableAmount))}</Data></Cell><Cell ss:StyleID="Summary"><Data ss:Type="String"></Data></Cell></Row>
      ${accountRows}
      ${requestRows}
    </Table>
  </Worksheet>
</Workbook>`
}

function buildPrintCompanyRows(company) {
  const detailRows = company.rows
    .map((row, index) => {
      const companyCell =
        index === 0
          ? `<td rowspan="${company.rows.length + 1}">${escapeHtml(company.companyName)}</td>`
          : ''

      return `
        <tr>
          ${companyCell}
          <td>${escapeHtml(row.quantityText)}</td>
          <td>${escapeHtml(formatNumber(row.unitPrice))}</td>
          <td>${escapeHtml(row.amountText)}</td>
          <td>${escapeHtml(row.label)}</td>
        </tr>`
    })
    .join('')

  return `${detailRows}
        <tr class="subtotal">
          <td>${company.quantity}</td>
          <td>소계</td>
          <td>${escapeHtml(formatNumber(company.subtotal))}</td>
          <td></td>
        </tr>`
}

function buildPrintAccountTable(accounts) {
  const visibleAccounts = getVisibleAccounts(accounts)

  if (visibleAccounts.length === 0) {
    return ''
  }

  const rows = visibleAccounts
    .map(
      (account) => `
      <tr>
        <td>${escapeHtml(account.name)}</td>
        <td>${escapeHtml(account.bank)}</td>
        <td>${escapeHtml(account.accountNumber)}</td>
        <td>${escapeHtml(formatNumber(Number(account.amount || 0)))}</td>
      </tr>`,
    )
    .join('')

  return `
  <table class="deposit-table">
    <thead>
      <tr><th colspan="4">입금시 부탁</th></tr>
      <tr>
        <th>이름</th>
        <th>은행</th>
        <th>계좌번호</th>
        <th>금액</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`
}

function buildPrintRequestBox(requestText) {
  const trimmedRequest = String(requestText || '').trim()

  if (!trimmedRequest) {
    return ''
  }

  return `
  <table class="request-table">
    <thead><tr><th>요청사항</th></tr></thead>
    <tbody><tr><td>${escapeHtml(trimmedRequest)}</td></tr></tbody>
  </table>`
}

export function buildSettlementPrintHtml(
  monthKey,
  logs,
  noteCategories,
  fixedDeduction = DEFAULT_FIXED_DEDUCTION,
  accounts = [],
  requestText = '',
) {
  const monthLabel = getMonthLabel(monthKey)
  const summary = getSettlementSummary(logs, noteCategories, fixedDeduction)
  const companyRows = summary.companies.map(buildPrintCompanyRows).join('')
  const accountTable = buildPrintAccountTable(accounts)
  const requestBox = buildPrintRequestBox(requestText)

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(monthLabel)} 정산 내역</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body { color: #111827; font-family: Arial, "Malgun Gothic", sans-serif; margin: 0; }
    h1 { font-size: 28px; letter-spacing: 2px; margin: 0 0 10px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1.5px solid #111827; font-size: 18px; height: 34px; padding: 4px 8px; text-align: center; }
    th { background: #e5e7eb; font-weight: 800; }
    td:nth-child(5) { text-align: center; }
    .subtotal td { border-top-width: 3px; font-weight: 800; }
    .summary td { background: #f3f4f6; font-weight: 800; }
    .deposit-table, .request-table { margin-top: 18px; }
    .request-table td { text-align: left; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>${escapeHtml(monthLabel)} 정산 내역</h1>
  <table>
    <thead>
      <tr>
        <th>구분</th>
        <th>수량</th>
        <th>단가</th>
        <th>금액</th>
        <th>비고</th>
      </tr>
    </thead>
    <tbody>
      ${companyRows}
      <tr class="summary"><td colspan="3">합계</td><td>${escapeHtml(formatNumber(summary.totalAmount))}</td><td></td></tr>
      <tr class="summary"><td colspan="3">공제(4.5%) 금액</td><td>${escapeHtml(formatNumber(summary.deductionAmount))}</td><td></td></tr>
      <tr class="summary"><td colspan="3">매월 공제</td><td>${escapeHtml(formatNumber(summary.fixedDeduction))}</td><td></td></tr>
      <tr class="summary"><td colspan="3">공제후 금액</td><td>${escapeHtml(formatNumber(summary.payableAmount))}</td><td></td></tr>
    </tbody>
  </table>
  ${accountTable}
  ${requestBox}
</body>
</html>`
}
