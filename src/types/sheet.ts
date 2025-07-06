import type { ApiResponse } from './api'

export type RowMeta = { height?: number }
export type CellValue = { value: string }
export type Column = { name: string; key: string; width?: number }
export type HistoryEntry = {
  type: 'cell' | 'cells' | 'column' | 'rowHeight' | 'columnWidth'
  timestamp: number
  diff: {
    before: Record<string, any>
    after: Record<string, any>
  }
}
export type Store = {
  cells: Record<string, CellValue>
  columns: Column[]
  rowCount: number
  colCount: number
  selection: string | null
  rowMeta: RowMeta[]
  rangeAnchor: string | null
  rangeHead: string | null

  // History for undo/redo
  history: HistoryEntry[]
  historyIndex: number

  setSelection: (id: string | null) => void
  setCell: (id: string, value: string) => void
  setCells: (updates: Record<string, string>) => void
  initFromApi: (apiData: ApiResponse) => void
  setRowCount: (rows: number) => void
  setColCount: (cols: number) => void
  setColumnName: (colIndex: number, name: string) => void
  setRowHeight: (rowIndex: number, px: number) => void
  setColumnWidth: (index: number, px: number) => void
  setRangeAnchor: (id: string | null) => void
  setRangeHead: (id: string | null) => void
  clearRange: () => void

  // Undo/redo functions
  addHistoryEntry: (entry: HistoryEntry) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
}
