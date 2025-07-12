import type { ApiResponse } from './api'

export type RowMeta = { height?: number }
export type CellValue = { value: string }
export type Column = { name: string; key: string; width?: number }

export type CellHistoryDiff = {
  before: { id: string; value: string };
  after: { id: string; value: string };
};

export type CellsHistoryDiff = {
  before: Record<string, string>;
  after: Record<string, string>;
};

export type ColumnHistoryDiff = {
  before: { index: number; name: string };
  after: { index: number; name: string };
};

export type RowHeightHistoryDiff = {
  before: { index: number; height: number };
  after: { index: number; height: number };
};

export type ColumnWidthHistoryDiff = {
  before: { index: number; width: number };
  after: { index: number; width: number };
};

export type HistoryEntry =
  | { type: 'cell'; timestamp: number; diff: CellHistoryDiff }
  | { type: 'cells'; timestamp: number; diff: CellsHistoryDiff }
  | { type: 'column'; timestamp: number; diff: ColumnHistoryDiff }
  | { type: 'rowHeight'; timestamp: number; diff: RowHeightHistoryDiff }
  | { type: 'columnWidth'; timestamp: number; diff: ColumnWidthHistoryDiff };

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
  initFromApi: (apiData: ApiResponse, autoFitTextColumns?: boolean) => void
  setRowCount: (rows: number) => void
  setColCount: (cols: number) => void
  setColumnName: (colIndex: number, name: string) => void
  setRowHeight: (rowIndex: number, px: number) => void
  setColumnWidth: (index: number, px: number) => void
  resetColumnWidth: (index: number) => void
  autoFitColumnWidth: (index: number) => void
  isTextColumn: (index: number) => boolean
  setRangeAnchor: (id: string | null) => void
  setRangeHead: (id: string | null) => void
  clearRange: () => void

  // Copy/paste functionality
  clipboard: string[][] | null
  copySelection: () => void
  pasteToSelection: () => void

  // Undo/redo functions
  addHistoryEntry: (entry: HistoryEntry) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  // Sorting
  sortByColumn: (colIndex: number, direction: 'asc' | 'desc', rowRange?: [number, number]) => void

  // Formula evaluation
  getCellValue: (cellId: string) => string
}
