// src/store/useSheetStore.ts

import { create } from 'zustand'
import { apiToCellMap } from '../utils/apiTransform'
import type { ApiResponse } from '../types/api'

export type CellValue = { value: string }
export type Column = { name: string; key: string }

export type Store = {
  cells: Record<string, CellValue>
  columns: Column[]
  rowCount: number
  colCount: number
  selection: string | null
  setSelection: (id: string | null) => void
  setCell: (id: string, value: string) => void
  setCells: (updates: Record<string, string>) => void
  setColumnName: (colIndex: number, name: string) => void
  initFromApi: (apiData: ApiResponse) => void
}

export const useSheetStore = create<Store>((set) => ({
  cells: {},
  columns: [],
  rowCount: 0,
  colCount: 0,
  selection: null,

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

  initFromApi: (apiData) => {
    const { cellMap, columns, rowCount, colCount } = apiToCellMap(apiData)
    set({ cells: cellMap, columns, rowCount, colCount })
  },
}))
