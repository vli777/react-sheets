// src/utils/keyboardMove.ts

import { parseCellId, getCellId } from './getCellId'

interface MoveParams {
  cellId: string
  key: string
  shiftKey: boolean
  colCount: number
  rowCount: number
}

export function keyboardMove(params: MoveParams): string | null {
  /**
   * Compute the next cell ID when the user navigates via keyboard.
   *
   * Args:
   *   cellId   current cell’s ID (e.g. "B2")
   *   key      key pressed ("ArrowUp", "Tab", "Enter", etc.)
   *   shiftKey whether Shift is held down
   *   colCount total number of columns in the sheet
   *   rowCount total number of rows in the sheet
   *
   * Returns:
   *   the next cell ID if within bounds, or null if out of range
   */
  const { cellId, key, shiftKey, colCount, rowCount } = params

  let { col, row } = parseCellId(cellId)

  if (key === 'ArrowRight') {
    col++
  }
  if (key === 'ArrowLeft') {
    col = Math.max(0, col - 1)
  }
  if (key === 'ArrowDown') {
    row++
  }
  if (key === 'ArrowUp') {
    row = Math.max(0, row - 1)
  }

  if (key === 'Tab') {
    if (shiftKey) {
      col = Math.max(0, col - 1)
    } else {
      col++
    }
  }

  if (key === 'Enter') {
    if (shiftKey) {
      row = Math.max(0, row - 1)
    } else {
      row++
    }
  }

  // bounds check
  if (col < 0 || col >= colCount || row < 0 || row >= rowCount) {
    return null
  }

  return getCellId(col, row)
}
