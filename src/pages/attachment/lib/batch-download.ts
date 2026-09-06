import JSZip from 'jszip'
import { groupAttachmentsByJournal } from '../model/interface'
import type { AttachmentRecord } from '../model/interface'
import type { TransactionRecord } from '@/pages/transaction/model/interface'

const UNSAFE_CHARS = /[\\/:*?"<>|]/g
const MAX_DESC_LENGTH = 80

export function sanitizeFilename(name: string): string {
  return name
    .replace(UNSAFE_CHARS, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_DESC_LENGTH)
}

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf('.')
  return dot > 0 ? filename.slice(dot) : ''
}

function buildZipPath(
  attachment: AttachmentRecord,
  description: string,
  date: string,
  index: number,
): string {
  const ext = getExtension(attachment.filename)
  const safeDesc = sanitizeFilename(description || attachment.title)
  const suffix = index > 0 ? ` (${index})` : ''
  return `${date} - ${safeDesc}${suffix}${ext}`
}

export type ZipEntry = {
  path: string
  blob: Blob
}

export type DownloadProgress = {
  done: number
  total: number
}

async function fetchAttachmentBlob(
  token: string,
  attachmentId: number,
): Promise<Blob> {
  const response = await fetch(`/api/v1/attachments/${attachmentId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    throw new Error(
      `Failed to download attachment ${attachmentId} (${response.status})`,
    )
  }
  return response.blob()
}

export async function fetchBlobsForJournals(
  token: string,
  transactions: Array<TransactionRecord>,
  allAttachments: Array<AttachmentRecord>,
  onProgress?: (progress: DownloadProgress) => void,
): Promise<Array<ZipEntry>> {
  const grouped = groupAttachmentsByJournal(allAttachments)
  const entries: Array<ZipEntry> = []

  // Flatten to (transaction, attachment) pairs
  const pairs: Array<{ tx: TransactionRecord; attachment: AttachmentRecord }> =
    []
  for (const tx of transactions) {
    if (!tx.has_attachments) continue
    const attachments = grouped.get(tx.id) ?? []
    for (const attachment of attachments) {
      pairs.push({ tx, attachment })
    }
  }

  if (pairs.length === 0) return entries

  // Track per-transaction attachment index for multi-attachment naming
  const journalCounts = new Map<number, number>()

  for (let i = 0; i < pairs.length; i++) {
    const { tx, attachment } = pairs[i]
    const date = tx.date.format('YYYY-MM-DD')
    const count = journalCounts.get(tx.id) ?? 0
    journalCounts.set(tx.id, count + 1)

    const path = buildZipPath(attachment, tx.description, date, count)
    const blob = await fetchAttachmentBlob(token, attachment.id)
    entries.push({ path, blob })

    onProgress?.({ done: i + 1, total: pairs.length })
  }

  return entries
}

export async function createZipBlob(entries: Array<ZipEntry>): Promise<Blob> {
  const zip = new JSZip()
  for (const entry of entries) {
    zip.file(entry.path, entry.blob)
  }
  return zip.generateAsync({ type: 'blob' })
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
