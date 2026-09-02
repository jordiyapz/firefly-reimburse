import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileImageIcon, FileTextIcon, PaperclipIcon } from 'lucide-react'
import { listAttachmentsOptions } from '../api/query'
import { formatBytes, groupAttachmentsByJournal, pickAttachmentKind } from '../model/interface'
import AttachmentPreviewDialog from './AttachmentPreviewDialog'
import type { AttachmentRecord } from '../model/interface'
import type { LucideIcon } from 'lucide-react'
import { useToken } from '@/shared/auth'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const KIND_ICONS: Record<ReturnType<typeof pickAttachmentKind>, LucideIcon> = {
  image: FileImageIcon,
  pdf: FileTextIcon,
  file: PaperclipIcon,
}

type Props = {
  journalId: number
  hasAttachments: boolean
}

function AttachmentIcons({ journalId, hasAttachments }: Props) {
  const token = useToken()
  const [preview, setPreview] = useState<AttachmentRecord | null>(null)
  const attachmentsQuery = useQuery(listAttachmentsOptions(token))

  const items = useMemo(() => {
    if (!attachmentsQuery.data) return []
    return groupAttachmentsByJournal(attachmentsQuery.data).get(journalId) ?? []
  }, [attachmentsQuery.data, journalId])

  if (!hasAttachments) return null
  if (attachmentsQuery.isLoading) {
    return <Spinner className="size-3.5 text-muted-foreground/50" />
  }
  if (items.length === 0) return <span className="text-xs text-muted-foreground">—</span>

  return (
    <>
      <div className="flex items-center gap-1">
        {items.map((attachment) => {
          const Icon = KIND_ICONS[pickAttachmentKind(attachment.mime)]
          return (
            <Tooltip key={attachment.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setPreview(attachment)}
                  className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
                  aria-label={`Preview ${attachment.title}`}
                >
                  <Icon className="size-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="font-mono text-[11px]">
                <p className="max-w-48 truncate">{attachment.title}</p>
                <p className="text-background/70">{formatBytes(attachment.size)}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>

      <AttachmentPreviewDialog attachment={preview} onClose={() => setPreview(null)} />
    </>
  )
}

export default AttachmentIcons
