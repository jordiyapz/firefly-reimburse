export interface AttachmentRecord {
  id: number
  /** Transaction journal id this attachment belongs to */
  journalId: number
  title: string
  filename: string
  mime: string
  size: number
}

export type AttachmentKind = 'image' | 'pdf' | 'file'

export function pickAttachmentKind(mime: string): AttachmentKind {
  if (mime.startsWith('image/')) return 'image'
  if (mime === 'application/pdf') return 'pdf'
  return 'file'
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function groupAttachmentsByJournal(
  attachments: Array<AttachmentRecord>,
): Map<number, Array<AttachmentRecord>> {
  const map = new Map<number, Array<AttachmentRecord>>()
  for (const attachment of attachments) {
    const bucket = map.get(attachment.journalId)
    if (bucket) bucket.push(attachment)
    else map.set(attachment.journalId, [attachment])
  }
  return map
}
