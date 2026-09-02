import { AttachmentsService } from '@billos/firefly-iii-sdk'
import type { AttachmentArray } from '@billos/firefly-iii-sdk'
import type { AttachmentRecord } from '../model/interface'
import { getFireflyClient } from '@/shared/lib/fetch-firefly'

const PAGE_SIZE = 100

function mapToRecord(raw: {
  id: string
  attributes: {
    attachable_type?: string
    attachable_id?: string
    title?: string | null
    filename?: string
    mime?: string
    size?: number
  }
}): AttachmentRecord | null {
  // Only transaction-journal attachments are relevant here
  if (raw.attributes.attachable_type !== 'TransactionJournal') return null
  if (!raw.attributes.attachable_id) return null

  const filename = raw.attributes.filename ?? 'attachment'
  return {
    id: Number(raw.id),
    journalId: Number(raw.attributes.attachable_id),
    title: raw.attributes.title || filename,
    filename,
    mime: raw.attributes.mime ?? '',
    size: raw.attributes.size ?? 0,
  }
}

export async function listAllAttachments(token: string): Promise<Array<AttachmentRecord>> {
  if (!token) throw new Error('Token required')
  const client = getFireflyClient(token)

  const records: Array<AttachmentRecord> = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const result: AttachmentArray = await AttachmentsService.listAttachment({
      query: { page, limit: PAGE_SIZE },
      client,
    })

    for (const raw of result.data) {
      const record = mapToRecord(raw)
      if (record) records.push(record)
    }

    totalPages = result.meta.pagination?.total_pages ?? page
    page += 1
  }

  records.sort((a, b) => a.title.localeCompare(b.title))
  return records
}

/** Downloads the binary content and returns an object URL for preview. */
export async function fetchAttachmentBlobUrl(
  token: string,
  attachmentId: number,
): Promise<string> {
  if (!token) throw new Error('Token required')

  const response = await fetch(`/api/v1/attachments/${attachmentId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    throw new Error(`Failed to download attachment (${response.status})`)
  }

  return URL.createObjectURL(await response.blob())
}
