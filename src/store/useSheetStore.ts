// src/store/useSheetStore.ts

import { create } from 'zustand'
import { apiToCellMap } from '../utils/apiTransform'
import type { Store } from '../types/sheet'

export const MIN_COL = 144 // px ≈ 9rem
export const MIN_ROW = 24 // px ≈ 1.5rem

export const useSheetStore = create<Store>((set) => ({
  cells: {},
  columns: [],
  rowCount: 0,
  colCount: 0,
  selection: null,
  rowMeta: [],

  initFromApi: (apiData) => {
    const { cellMap, columns, rowCount, colCount } = apiToCellMap(apiData)
    set({ cells: cellMap, columns, rowCount, colCount })
  },

  setSelection: (id) => set({ selection: id }),

  setCell: (id, value) =>
    set((s) => ({
      cells: { ...s.cells, [id]: { value } },
    })),

  setCells: (updates) =>
    set((s) => {
      const next = { ...s.cells }
      for (const [id, value] of Object.entries(updates)) {
        next[id] = { value }
      }
      return { cells: next }
    }),

  setColumnName: (colIndex, name) =>
    set((s) => {
      const newCols = s.columns.map((c, i) => (i === colIndex ? { ...c, name } : c))
      return { columns: newCols }
    }),

  setRowHeight: (idx, px) =>
    set((s) => {
      const meta = [...s.rowMeta]
      meta[idx] = { height: Math.max(MIN_ROW, px) }
      return { rowMeta: meta }
    }),

  setColumnWidth: (idx, px) =>
    set((s) => {
      const cols = s.columns.map((c, i) => (i === idx ? { ...c, width: Math.max(MIN_COL, px) } : c))
      return { columns: cols }
    }),

  setRowCount: (rows) => set((s) => ({ rowCount: rows > s.rowCount ? rows : s.rowCount })),

  setColCount: (cols) => set((s) => ({ colCount: cols > s.colCount ? cols : s.colCount })),
}))
