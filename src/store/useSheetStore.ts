// src/store/useSheetStore.ts

import { create } from 'zustand'
import { apiToCellMap } from '../utils/apiTransform'
import type { HistoryEntry, Store } from '../types/sheet'

export const MIN_COL_PX = 144 // px ≈ 9rem
export const MIN_ROW_PX = 32 // px ≈ 2rem

export const useSheetStore = create<Store>((set, get) => ({
  cells: {},
  columns: [],
  rowCount: 0,
  colCount: 0,
  selection: null,
  rowMeta: [],
  rangeAnchor: null,
  rangeHead: null,

  // History for undo/redo
  history: [],
  historyIndex: -1,

  initFromApi: (apiData) => {
    const { cellMap, columns, rowCount, colCount } = apiToCellMap(apiData)
    set({ cells: cellMap, columns, rowCount, colCount })
  },

  setSelection: (id) => set({ selection: id }),

  setCell: (id, value) => {
    const state = get()
    const oldValue = state.cells[id]?.value ?? ''

    // Record history
    state.addHistoryEntry({
      type: 'cell',
      timestamp: Date.now(),
      diff: {
        before: { id, value: oldValue },
        after: { id, value },
      },
    })

    set((s) => ({
      cells: { ...s.cells, [id]: { value } },
    }))
  },

  setCells: (updates) => {
    const state = get()
    const before: Record<string, string> = {}
    const after: Record<string, string> = {}

    // Record before and after values
    for (const [id, value] of Object.entries(updates)) {
      before[id] = state.cells[id]?.value ?? ''
      after[id] = value
    }

    // Record history
    state.addHistoryEntry({
      type: 'cells',
      timestamp: Date.now(),
      diff: { before, after },
    })

    set((s) => {
      const next = { ...s.cells }
      for (const [id, value] of Object.entries(updates)) {
        next[id] = { value }
      }
      return { cells: next }
    })
  },

  setColumnName: (colIndex, name) =>
    set((s) => {
      const newCols = s.columns.map((c, i) => (i === colIndex ? { ...c, name } : c))
      return { columns: newCols }
    }),

  setRowHeight: (idx, px) =>
    set((s) => {
      const meta = [...s.rowMeta]
      meta[idx] = { height: Math.max(MIN_ROW_PX, px) }
      return { rowMeta: meta }
    }),

  setColumnWidth: (idx, px) =>
    set((s) => {
      const cols = s.columns.map((c, i) =>
        i === idx ? { ...c, width: Math.max(MIN_COL_PX, px) } : c,
      )
      return { columns: cols }
    }),

  setRowCount: (rows) => set((s) => ({ rowCount: rows > s.rowCount ? rows : s.rowCount })),
  setColCount: (cols) => set((s) => ({ colCount: cols > s.colCount ? cols : s.colCount })),
  setRangeAnchor: (id) => set({ rangeAnchor: id }),
  setRangeHead: (id) => set({ rangeHead: id }),
  clearRange: () => set({ rangeAnchor: null, rangeHead: null }),

  // Helper function to add history entry
  addHistoryEntry: (entry: HistoryEntry) => {
    const state = get()
    const newHistory = state.history.slice(0, state.historyIndex + 1)
    newHistory.push(entry)

    // Limit history to 100 entries
    if (newHistory.length > 100) {
      newHistory.shift()
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    })
  },

  // Undo/redo functions
  undo: () => {
    const state = get()
    if (state.historyIndex < 0) return

    const entry = state.history[state.historyIndex]
    if (!entry) return

    // Apply the "before" state from the diff
    switch (entry.type) {
      case 'cell':
        set((s) => ({
          cells: { ...s.cells, [entry.diff.before.id]: { value: entry.diff.before.value } },
          historyIndex: state.historyIndex - 1,
        }))
        break
      case 'cells':
        set((s) => {
          const newCells = { ...s.cells }
          Object.entries(entry.diff.before).forEach(([id, value]) => {
            newCells[id] = { value }
          })
          return { cells: newCells, historyIndex: state.historyIndex - 1 }
        })
        break
      case 'column':
        set((s) => {
          const newCols = [...s.columns]
          newCols[entry.diff.before.index] = {
            ...newCols[entry.diff.before.index],
            name: entry.diff.before.name,
          }
          return { columns: newCols, historyIndex: state.historyIndex - 1 }
        })
        break
      case 'rowHeight':
        set((s) => {
          const newMeta = [...s.rowMeta]
          newMeta[entry.diff.before.index] = { height: entry.diff.before.height }
          return { rowMeta: newMeta, historyIndex: state.historyIndex - 1 }
        })
        break
      case 'columnWidth':
        set((s) => {
          const newCols = [...s.columns]
          newCols[entry.diff.before.index] = {
            ...newCols[entry.diff.before.index],
            width: entry.diff.before.width,
          }
          return { columns: newCols, historyIndex: state.historyIndex - 1 }
        })
        break
    }
  },

  redo: () => {
    const state = get()
    if (state.historyIndex >= state.history.length - 1) return

    const entry = state.history[state.historyIndex + 1]
    if (!entry) return

    // Apply the "after" state from the diff
    switch (entry.type) {
      case 'cell':
        set((s) => ({
          cells: { ...s.cells, [entry.diff.after.id]: { value: entry.diff.after.value } },
          historyIndex: state.historyIndex + 1,
        }))
        break
      case 'cells':
        set((s) => {
          const newCells = { ...s.cells }
          Object.entries(entry.diff.after).forEach(([id, value]) => {
            newCells[id] = { value }
          })
          return { cells: newCells, historyIndex: state.historyIndex + 1 }
        })
        break
      case 'column':
        set((s) => {
          const newCols = [...s.columns]
          newCols[entry.diff.after.index] = {
            ...newCols[entry.diff.after.index],
            name: entry.diff.after.name,
          }
          return { columns: newCols, historyIndex: state.historyIndex + 1 }
        })
        break
      case 'rowHeight':
        set((s) => {
          const newMeta = [...s.rowMeta]
          newMeta[entry.diff.after.index] = { height: entry.diff.after.height }
          return { rowMeta: newMeta, historyIndex: state.historyIndex + 1 }
        })
        break
      case 'columnWidth':
        set((s) => {
          const newCols = [...s.columns]
          newCols[entry.diff.after.index] = {
            ...newCols[entry.diff.after.index],
            width: entry.diff.after.width,
          }
          return { columns: newCols, historyIndex: state.historyIndex + 1 }
        })
        break
    }
  },

  canUndo: () => get().historyIndex >= 0,
  canRedo: () => get().historyIndex < get().history.length - 1,
}))
