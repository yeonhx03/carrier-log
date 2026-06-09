import { getMonthLabel } from './date'

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

function sanitizeSheetName(value) {
  return String(value || 'Sheet')
    .replace(/[\\/?*[\]:]/g, ' ')
    .slice(0, 31)
}

export function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function getExportFilename(monthKey, groups, extension) {
  const [year, month] = monthKey.split('-')
  const companyPart = groups.length === 1 ? `_${groups[0].companyName}` : ''

  return `carrier-log_${year}-${month}${companyPart}.${extension}`
}

export function buildExcelWorkbook(monthKey, groups) {
  const monthLabel = getMonthLabel(monthKey)
  const worksheets = groups
    .map((group) => {
      const totalKm = group.logs.reduce(
        (sum, log) => sum + Number(log.extraKm || 0),
        0,
      )
      const rows = group.logs
        .map(
          (log, index) => `
        <Row>
          <Cell ss:StyleID="Cell"><Data ss:Type="Number">${index + 1}</Data></Cell>
          <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(log.dateText)}</Data></Cell>
          <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(log.carType)}</Data></Cell>
          <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(log.carNumber)}</Data></Cell>
          <Cell ss:StyleID="Cell"><Data ss:Type="Number">${Number(log.extraKm || 0)}</Data></Cell>
          <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(log.note || '')}</Data></Cell>
        </Row>`,
        )
        .join('')

      return `
  <Worksheet ss:Name="${escapeXml(sanitizeSheetName(group.companyName))}">
    <Table>
      <Column ss:Width="40" />
      <Column ss:Width="90" />
      <Column ss:Width="120" />
      <Column ss:Width="90" />
      <Column ss:Width="70" />
      <Column ss:Width="140" />
      <Row>
        <Cell ss:MergeAcross="5" ss:StyleID="Title"><Data ss:Type="String">${escapeXml(monthLabel)} 전인내역 (${escapeXml(group.companyName)})</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="Header"><Data ss:Type="String">NO</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">일자</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">차종</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">차량번호</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">추가(KM)</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">비고</Data></Cell>
      </Row>
      ${rows}
      <Row>
        <Cell ss:MergeAcross="3" ss:StyleID="Total"><Data ss:Type="String">합계</Data></Cell>
        <Cell ss:StyleID="Total"><Data ss:Type="Number">${totalKm}</Data></Cell>
        <Cell ss:StyleID="Total"><Data ss:Type="String"></Data></Cell>
      </Row>
    </Table>
  </Worksheet>`
    })
    .join('')

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Title"><Font ss:Bold="1" ss:Size="16" /><Alignment ss:Horizontal="Center" /><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" /></Borders></Style>
    <Style ss:ID="Header"><Font ss:Bold="1" /><Interior ss:Color="#E5E7EB" ss:Pattern="Solid" /><Alignment ss:Horizontal="Center" /><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" /><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" /><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" /><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" /></Borders></Style>
    <Style ss:ID="Cell"><Alignment ss:Horizontal="Center" /><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" /><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" /><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" /><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" /></Borders></Style>
    <Style ss:ID="Total"><Font ss:Bold="1" /><Interior ss:Color="#F3F4F6" ss:Pattern="Solid" /><Alignment ss:Horizontal="Center" /><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" /><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" /><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" /><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" /></Borders></Style>
  </Styles>
  ${worksheets}
</Workbook>`
}

export function buildPrintHtml(monthKey, groups) {
  const monthLabel = getMonthLabel(monthKey)
  const sections = groups
    .map((group) => {
      const totalKm = group.logs.reduce(
        (sum, log) => sum + Number(log.extraKm || 0),
        0,
      )
      const rows = group.logs
        .map(
          (log, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(log.dateText)}</td>
                <td>${escapeHtml(log.carType)}</td>
                <td>${escapeHtml(log.carNumber)}</td>
                <td>${Number(log.extraKm || 0)}</td>
                <td>${escapeHtml(log.note || '')}</td>
              </tr>`,
        )
        .join('')

      return `
          <section class="report-section">
            <h1>${escapeHtml(monthLabel)} 전인내역 (${escapeHtml(group.companyName)})</h1>
            <table>
              <thead>
                <tr>
                  <th>NO</th>
                  <th>일자</th>
                  <th>차종</th>
                  <th>차량번호</th>
                  <th>추가(KM)</th>
                  <th>비고</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
                <tr class="total-row">
                  <td colspan="4">합계</td>
                  <td>${totalKm}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </section>`
    })
    .join('')

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(monthLabel)} 운행일지</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body { color: #111827; font-family: Arial, "Malgun Gothic", sans-serif; margin: 0; }
    .report-section { page-break-after: always; }
    .report-section:last-child { page-break-after: auto; }
    h1 { font-size: 16px; margin: 0 0 8px; }
    table { border-collapse: collapse; table-layout: fixed; width: 100%; }
    thead { display: table-header-group; }
    th, td {
      border: 1px solid #111827;
      box-sizing: border-box;
      font-size: 10px;
      height: 20px;
      line-height: 1.15;
      padding: 2px 3px;
      text-align: center;
    }
    th { background: #e5e7eb; font-weight: 700; }
    td:nth-child(3), td:nth-child(6) { text-align: left; }
    th:nth-child(1), td:nth-child(1) { width: 8%; }
    th:nth-child(2), td:nth-child(2) { width: 15%; }
    th:nth-child(3), td:nth-child(3) { width: 22%; }
    th:nth-child(4), td:nth-child(4) { width: 17%; }
    th:nth-child(5), td:nth-child(5) { width: 12%; }
    th:nth-child(6), td:nth-child(6) { width: 26%; }
    .total-row td { background: #f3f4f6; font-weight: 700; }
  </style>
</head>
<body>${sections}</body>
</html>`
}
