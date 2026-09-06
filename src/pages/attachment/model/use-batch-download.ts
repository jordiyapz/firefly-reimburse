import { useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listAttachmentsOptions } from '../api/query'
import {
  createZipBlob,
  fetchBlobsForJournals,
  triggerDownload,
} from '../lib/batch-download'
import type { DownloadProgress } from '../lib/batch-download'
import type { TransactionRecord } from '@/pages/transaction/model/interface'
import { useToken } from '@/shared/auth'

export type BatchDownloadState = {
  isDownloading: boolean
  progress: DownloadProgress | null
  error: string | null
}

export function useBatchDownload() {
  const token = useToken()
  const [state, setState] = useState<BatchDownloadState>({
    isDownloading: false,
    progress: null,
    error: null,
  })

  const attachmentsQuery = useQuery(listAttachmentsOptions(token))

  const downloadSelected = useCallback(
    async (transactions: Array<TransactionRecord>, groupName: string) => {
      if (!token) return
      if (transactions.length === 0) return
      if (!attachmentsQuery.data) return

      setState({ isDownloading: true, progress: null, error: null })

      try {
        const entries = await fetchBlobsForJournals(
          token,
          transactions,
          attachmentsQuery.data,
          (progress) => setState((s) => ({ ...s, progress })),
        )

        if (entries.length === 0) {
          setState({
            isDownloading: false,
            progress: null,
            error: 'No attachments found in selected transactions.',
          })
          return
        }

        const blob = await createZipBlob(entries)
        triggerDownload(blob, `${groupName}.zip`)

        setState({ isDownloading: false, progress: null, error: null })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Download failed'
        setState({ isDownloading: false, progress: null, error: message })
      }
    },
    [token, attachmentsQuery.data],
  )

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }))
  }, [])

  return {
    ...state,
    downloadSelected,
    clearError,
  }
}
