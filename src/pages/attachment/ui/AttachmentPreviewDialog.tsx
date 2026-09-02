import { useEffect, useState } from 'react'
import { DownloadIcon } from 'lucide-react'
import { fetchAttachmentBlobUrl } from '../api/service'
import { pickAttachmentKind } from '../model/interface'
import type { AttachmentRecord } from '../model/interface'
import { useToken } from '@/shared/auth'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'

type Props = {
  attachment: AttachmentRecord | null
  onClose: () => void
}

function AttachmentPreviewDialog({ attachment, onClose }: Props) {
  const token = useToken()
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!attachment || !token) return

    let cancelled = false
    let objectUrl: string | undefined
    setUrl(null)
    setError(null)

    fetchAttachmentBlobUrl(token, attachment.id)
      .then((blobUrl) => {
        if (cancelled) {
          URL.revokeObjectURL(blobUrl)
          return
        }
        objectUrl = blobUrl
        setUrl(blobUrl)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [attachment, token])

  const kind = attachment ? pickAttachmentKind(attachment.mime) : null

  return (
    <Dialog open={attachment !== null} onOpenChange={(open) => !open && onClose()}>
      {attachment && (
        <DialogContent className="w-[90vw] max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-6">{attachment.title}</DialogTitle>
            <DialogDescription>
              {attachment.filename} · {attachment.mime}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <p className="flex h-40 items-center justify-center text-sm text-destructive">
              {error}
            </p>
          )}

          {!url && !error && (
            <div className="flex h-64 items-center justify-center">
              <Spinner className="size-6" />
            </div>
          )}

          {url && kind === 'image' && (
            <img
              src={url}
              alt={attachment.title}
              className="max-h-[70vh] w-full rounded-md object-contain"
            />
          )}

          {url && kind === 'pdf' && (
            <iframe
              src={url}
              title={attachment.title}
              className="h-[70vh] w-full rounded-md border border-border"
            />
          )}

          {url && kind === 'file' && (
            <div className="flex flex-col items-center gap-3 py-10">
              <p className="text-sm text-muted-foreground">
                Preview not supported for this file type.
              </p>
              <Button asChild size="sm" variant="outline">
                <a href={url} download={attachment.filename}>
                  <DownloadIcon className="size-4" />
                  Download
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      )}
    </Dialog>
  )
}

export default AttachmentPreviewDialog
