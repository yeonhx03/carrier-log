import { Filesystem, Directory } from '@capacitor/filesystem'
import { Capacitor, registerPlugin } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { downloadBlob } from './exportFiles'

const NativePrint = registerPlugin('NativePrint')
const NativeFileSave = registerPlugin('NativeFileSave')

function encodeBase64(value) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary)
}

export async function saveOrShareFile(content, filename, mimeType, mode = 'share') {
  if (!Capacitor.isNativePlatform()) {
    downloadBlob(content, filename, mimeType)
    return
  }

  const data = encodeBase64(content)

  if (mode === 'save') {
    await NativeFileSave.saveFile({
      data,
      filename,
      mimeType,
    })
    return
  }

  const result = await Filesystem.writeFile({
    path: filename,
    data,
    directory: Directory.Cache,
  })

  await Share.share({
    title: filename,
    text: '파일을 저장하거나 공유할 앱을 선택해주세요.',
    files: [result.uri],
    dialogTitle: '파일 저장 또는 공유',
  })
}

export async function printHtmlDocument(html, filename) {
  if (!Capacitor.isNativePlatform()) {
    const printWindow = window.open('', '_blank')

    if (!printWindow) {
      throw new Error('팝업이 차단되어 PDF 화면을 열 수 없습니다.')
    }

    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    window.setTimeout(() => printWindow.print(), 250)
    return
  }

  await NativePrint.printHtml({
    html,
    jobName: filename.replace(/\.pdf$/i, ''),
  })
}
