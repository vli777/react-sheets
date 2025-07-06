// src/utils/keyboardMove.ts

import { parseCellId, getCellId } from './getCellId'

export interface MoveParams {
  cellId: string // current cell ID (e.g. "B2")
  key: string // key pressed
  shiftKey: boolean // whether Shift was held
}

export function keyboardMove(params: MoveParams): string | null {
  /**
   * Compute the next cell ID when the user navigates via keyboard.
   *  Prevents going left of column 0 or going above header row (row = -1).
   *  Allows moving right/down indefinitely (so sheet can grow).
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
  const { cellId, key, shiftKey } = params

  let { col, row } = parseCellId(cellId)

  switch (key) {
    case 'ArrowRight':
      col += 1
      break
    case 'ArrowLeft':
      col = Math.max(0, col - 1)
      break
    case 'ArrowDown':
      row += 1
      break
    case 'ArrowUp':
      row = Math.max(-1, row - 1) // header row = -1
      break
    case 'Tab':
      col = shiftKey ? Math.max(0, col - 1) : col + 1
      break
    case 'Enter':
      row = shiftKey ? Math.max(-1, row - 1) : row + 1
      break
  }

  // bounds check
  if (col < 0 || row < -1) {
    return null
  }
  const newCellId = getCellId(col, row)
  // TO-DO: move selection debug output to toolbar
  console.log({newCellId})
  return newCellId
}
