import { useEffect, useState } from 'react'
import { DownloadIcon, ExternalLinkIcon } from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
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

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

type Props = {
  attachment: AttachmentRecord | null
  onClose: () => void
}

function isHeic(mime: string): boolean {
  return mime === 'image/heic' || mime === 'image/heif'
}

function AttachmentPreviewDialog({ attachment, onClose }: Props) {
  const token = useToken()
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [numPages, setNumPages] = useState<number>(0)

  useEffect(() => {
    if (!attachment || !token) return

    let cancelled = false
    let objectUrl: string | undefined
    setUrl(null)
    setError(null)
    setNumPages(0)

    fetchAttachmentBlobUrl(token, attachment.id)
      .then(async (blobUrl) => {
        if (cancelled) {
          URL.revokeObjectURL(blobUrl)
          return
        }

        if (isHeic(attachment.mime)) {
          const response = await fetch(blobUrl)
          const blob = await response.blob()
          const heic2any = (await import('heic2any')).default
          const converted = await heic2any({ blob, toType: 'image/jpeg', quality: 0.85 })
          URL.revokeObjectURL(blobUrl)
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- cancelled is set by cleanup during async await
          if (cancelled) return
          const convertedUrl = URL.createObjectURL(converted as Blob)
          objectUrl = convertedUrl
          setUrl(convertedUrl)
        } else {
          objectUrl = blobUrl
          setUrl(blobUrl)
        }
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
            {url && (
              <div className="flex items-center gap-1 mt-1">
                <Button asChild size="sm" variant="outline">
                  <a href={url} download={attachment.filename}>
                    <DownloadIcon className="size-3.5" />
                    Download
                  </a>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLinkIcon className="size-3.5" />
                    Open
                  </a>
                </Button>
              </div>
            )}
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
            <div className="max-h-[70vh] overflow-auto rounded-md border border-border">
              <Document
                file={url}
                onLoadError={(e) => setError(e.message)}
                onLoadSuccess={({ numPages: n }) => setNumPages(n)}
                loading={
                  <div className="flex h-64 items-center justify-center">
                    <Spinner className="size-6" />
                  </div>
                }
              >
                {Array.from({ length: numPages }, (_, i) => (
                  <Page key={i + 1} pageNumber={i + 1} width={700} />
                ))}
              </Document>
            </div>
          )}

          {url && kind === 'file' && (
            <div className="flex flex-col items-center gap-3 py-10">
              <p className="text-sm text-muted-foreground">
                Preview not supported for this file type.
              </p>
            </div>
          )}
        </DialogContent>
      )}
    </Dialog>
  )
}

export default AttachmentPreviewDialog
