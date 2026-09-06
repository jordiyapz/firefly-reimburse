import type { RowSelectionState } from '@tanstack/react-table'

/**
 * Build a row-selection patch for shift+click range selection.
 * Returns ids from anchorId..clickedId mapped to targetState, or null when
 * either id is missing from the visible row list (e.g. different page/filter).
 */
export function buildSelectionPatch(
  rowIds: Array<string>,
  anchorId: string,
  clickedId: string,
  targetState: boolean,
): RowSelectionState | null {
  const anchorIndex = rowIds.indexOf(anchorId)
  const clickedIndex = rowIds.indexOf(clickedId)
  if (anchorIndex === -1 || clickedIndex === -1) return null

  const from = Math.min(anchorIndex, clickedIndex)
  const to = Math.max(anchorIndex, clickedIndex)

  const patch: RowSelectionState = {}
  for (let index = from; index <= to; index++) {
    if (targetState) {
      patch[rowIds[index]] = true
    }
  }
  return patch
}
