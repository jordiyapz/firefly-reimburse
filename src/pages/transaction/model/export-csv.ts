import Papa from 'papaparse'
import type { TransactionRecord } from './interface'

const papaUnparseConfig: Papa.UnparseConfig = {
  quotes: false, // or array of booleans
  quoteChar: '"',
  escapeChar: '"',
  delimiter: ',',
  header: true,
  newline: '\r\n',
  skipEmptyLines: false, // other option is 'greedy', meaning skip delimiters, quotes, and whitespace.
  columns: undefined, // or array of strings
}

export function exportCsv(transactions: Array<TransactionRecord>) {
  const payload = transactions.map(
    ({
      id,
      transactionId,
      account,
      description,
      amount,
      date,
      has_attachments,
      isTodo,
    }) => ({
      id,
      transactionId,
      account,
      description,
      amount,
      date,
      has_attachments,
      isTodo,
    }),
  )
  return Papa.unparse(payload, papaUnparseConfig)
}

// Source - https://stackoverflow.com/a/68146412
// Posted by kolypto, modified by community. See post 'Timeline' for change history
// Retrieved 2026-02-23, License - CC BY-SA 4.0

/**
 * Download contents as a file
 * Source: https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
 */
export function downloadCsvBlob(
  content: string,
  filename: string,
  contentType = 'text/csv;charset=utf-8;',
) {
  // Create a blob
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)

  // Create a link to download it
  const pom = document.createElement('a')
  pom.href = url
  pom.setAttribute('download', filename)
  pom.click()
}
