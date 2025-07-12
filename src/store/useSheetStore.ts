// src/store/useSheetStore.ts

import { create } from 'zustand'
import { apiToCellMap } from '../utils/apiTransform'
import { getCellId, parseCellId } from '../utils/getCellId'
import type { HistoryEntry, Store } from '../types/sheet'

export const MIN_COL_PX = 144 // px ≈ 9rem
export const MIN_COL_RESIZE_PX = 15 // px, matches Google Sheets minimum
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

  initFromApi: (apiData, autoFitTextColumns = true) => {
    const { cellMap, columns, rowCount, colCount } = apiToCellMap(apiData)
    set({ cells: cellMap, columns, rowCount, colCount })
    
    // Auto-fit text columns that don't have user-set widths (only in browser, not tests)
    if (autoFitTextColumns && typeof window !== 'undefined') {
      // Use setTimeout to ensure the state is updated before checking
      setTimeout(() => {
        const state = get()
        for (let colIndex = 0; colIndex < colCount; colIndex++) {
          const column = state.columns[colIndex]
          if (!column.width) { // Only auto-fit if no user-set width
            // Check if this column is text-based by sampling a few values
            const isTextColumn = state.isTextColumn(colIndex)
            if (isTextColumn) {
              state.autoFitColumnWidth(colIndex)
            }
          }
        }
      }, 0)
    }
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
      const cols = s.columns.slice();
      // Pad columns if needed
      while (cols.length <= idx) {
        cols.push({ name: '', key: `__blank_${cols.length}` });
      }
      cols[idx] = {
        ...cols[idx],
        width: Math.max(MIN_COL_RESIZE_PX, px),
      };
      return { columns: cols };
    }),

  resetColumnWidth: (idx: number) =>
    set((s) => {
      const cols = s.columns.slice();
      // Pad columns if needed
      while (cols.length <= idx) {
        cols.push({ name: '', key: `__blank_${cols.length}` });
      }
      cols[idx] = {
        ...cols[idx],
        width: MIN_COL_PX,
      };
      return { columns: cols };
    }),

  autoFitColumnWidth: (idx: number) => {
    const state = get();
    const { cells, columns, rowCount } = state;
    
    // Calculate the maximum width needed for this column
    let maxWidth = MIN_COL_PX;
    
    // Check if we're in a test environment (no canvas support)
    const isTestEnv = typeof document === 'undefined' || !document.createElement('canvas').getContext;
    
    if (isTestEnv) {
      // In test environment, use a simple character-based calculation
      const headerText = columns[idx]?.name || '';
      maxWidth = Math.max(maxWidth, headerText.length * 8 + 16); // Rough estimate: 8px per character
      
      for (let row = 0; row < rowCount; row++) {
        const cellId = getCellId(idx, row);
        const cellValue = cells[cellId]?.value || '';
        const cellWidth = cellValue.length * 8 + 16; // Rough estimate: 8px per character
        maxWidth = Math.max(maxWidth, cellWidth);
      }
    } else {
      // In browser environment, use canvas for accurate measurement
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return;
      
      // Set font to match the cell font (from CSS) - text-sm = 14px
      context.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
      
      // Check header width
      const headerText = columns[idx]?.name || '';
      const headerWidth = context.measureText(headerText).width;
      maxWidth = Math.max(maxWidth, headerWidth + 16); // Add 8px padding on each side for breathing room
      
      // Check all cell values in this column
      for (let row = 0; row < rowCount; row++) {
        const cellId = getCellId(idx, row);
        const cellValue = cells[cellId]?.value || '';
        const cellWidth = context.measureText(cellValue).width;
        maxWidth = Math.max(maxWidth, cellWidth + 16); // Add 8px padding on each side for breathing room
      }
    }
    
    // Apply the calculated width
    set((s) => {
      const cols = s.columns.slice();
      // Pad columns if needed
      while (cols.length <= idx) {
        cols.push({ name: '', key: `__blank_${cols.length}` });
      }
      cols[idx] = {
        ...cols[idx],
        width: Math.max(MIN_COL_RESIZE_PX, Math.ceil(maxWidth)),
      };
      return { columns: cols };
    });
  },

  isTextColumn: (idx: number) => {
    const state = get();
    const { cells, rowCount } = state;
    
    // Sample up to 10 rows to determine if column is text-based
    const sampleSize = Math.min(10, rowCount);
    let textCount = 0;
    let totalCount = 0;
    
    for (let row = 0; row < sampleSize; row++) {
      const cellId = getCellId(idx, row);
      const cellValue = cells[cellId]?.value || '';
      
      if (cellValue.trim() !== '') {
        totalCount++;
        // Check if the value is not a number (or is a number that looks like text)
        const numValue = Number(cellValue);
        const isNumber = !isNaN(numValue) && isFinite(numValue);
        
        // Consider it text if:
        // 1. It's not a number, OR
        // 2. It's a number but has leading zeros or decimal places that suggest it's meant to be text
        // 3. It contains letters or special characters
        const hasLetters = /[a-zA-Z]/.test(cellValue);
        const hasLeadingZeros = /^0+[1-9]/.test(cellValue);
        const isLikelyText = hasLetters || hasLeadingZeros || !isNumber;
        
        if (isLikelyText) {
          textCount++;
        }
      }
    }
    
    // If more than 50% of non-empty values are text, consider it a text column
    return totalCount > 0 && (textCount / totalCount) > 0.5;
  },

  setRowCount: (rows) => set((s) => ({ rowCount: rows > s.rowCount ? rows : s.rowCount })),
  setColCount: (cols) => set((s) => ({ colCount: cols > s.colCount ? cols : s.colCount })),
  setRangeAnchor: (id) => set({ rangeAnchor: id }),
  setRangeHead: (id) => set({ rangeHead: id }),
  clearRange: () => set({ rangeAnchor: null, rangeHead: null }),

  // Copy/paste functionality
  clipboard: null as string[][] | null,

  copySelection: () => {
    const state = get()
    if (!state.rangeAnchor || !state.rangeHead) {
      // Copy single cell
      if (state.selection) {
        const value = state.cells[state.selection]?.value ?? ''
        state.clipboard = [[value]]
        // Also copy to system clipboard
        navigator.clipboard.writeText(value)
      }
      return
    }

    // Copy range
    const { col: c0, row: r0 } = parseCellId(state.rangeAnchor)
    const { col: c1, row: r1 } = parseCellId(state.rangeHead)
    const loCol = Math.min(c0, c1)
    const hiCol = Math.max(c0, c1)
    const loRow = Math.min(r0, r1)
    const hiRow = Math.max(r0, r1)

    const clipboard: string[][] = []
    for (let r = loRow; r <= hiRow; r++) {
      const row: string[] = []
      for (let c = loCol; c <= hiCol; c++) {
        const cellId = getCellId(c, r)
        row.push(state.cells[cellId]?.value ?? '')
      }
      clipboard.push(row)
    }

    set({ clipboard })
    
    // Also copy to system clipboard as tab-separated values
    const clipboardText = clipboard.map(row => row.join('\t')).join('\n')
    navigator.clipboard.writeText(clipboardText)
  },

  pasteToSelection: () => {
    const state = get()
    if (!state.clipboard || state.clipboard.length === 0) return

    const targetCell = state.selection
    if (!targetCell) return

    const { col: targetCol, row: targetRow } = parseCellId(targetCell)
    const clipboard = state.clipboard
    const clipboardRows = clipboard.length
    const clipboardCols = clipboard[0].length

    // Ensure we have enough rows and columns
    const maxRow = targetRow + clipboardRows - 1
    const maxCol = targetCol + clipboardCols - 1
    const { colCount: curCols, rowCount: curRows } = state
    
    if (maxCol + 1 > curCols) {
      set({ colCount: maxCol + 1 })
    }
    if (maxRow + 1 > curRows) {
      set({ rowCount: maxRow + 1 })
    }

    // Paste the clipboard data
    const updates: Record<string, string> = {}
    for (let r = 0; r < clipboardRows; r++) {
      for (let c = 0; c < clipboardCols; c++) {
        const cellId = getCellId(targetCol + c, targetRow + r)
        updates[cellId] = clipboard[r][c]
      }
    }

    state.setCells(updates)
  },

  // Sort rows by a column
  sortByColumn: (colIndex: number, direction: 'asc' | 'desc' = 'asc', rowRange?: [number, number]) => {
    const state = get();
    const { rowCount, colCount, cells } = state;
    // Determine rows to sort
    let startRow = 0, endRow = rowCount - 1;
    if (rowRange && rowRange.length === 2) {
      startRow = rowRange[0];
      endRow = rowRange[1];
    }
    // Build array of row indices to sort
    const rows: number[] = [];
    for (let r = startRow; r <= endRow; r++) rows.push(r);
    // Get values for the column in each row
    const getCellValue = (row: number): string => {
      const cellId = getCellId(colIndex, row);
      return cells[cellId]?.value ?? '';
    };
    // Detect if column is numeric
    const isNumeric = rows.every(r => getCellValue(r).trim() === '' || !isNaN(Number(getCellValue(r))));
    // Sort rows by the column value
    rows.sort((a, b) => {
      const va = getCellValue(a);
      const vb = getCellValue(b);
      if (isNumeric) {
        const na = Number(va);
        const nb = Number(vb);
        return direction === 'asc' ? na - nb : nb - na;
      } else {
        return direction === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
    });
    // Build new cells mapping with rows reordered
    const newCells: Record<string, { value: string }> = { ...cells };
    for (let c = 0; c < colCount; c++) {
      // Extract values for this column in the sorted order
      const values = rows.map(r => {
        const cellId = getCellId(c, r);
        return cells[cellId]?.value ?? '';
      });
      // Write back values in sorted order
      for (let i = 0; i < rows.length; i++) {
        const r = startRow + i;
        const cellId = getCellId(c, r);
        newCells[cellId] = { value: values[i] };
      }
    }
    // Record history
    const before: Record<string, string> = {};
    const after: Record<string, string> = {};
    for (let r = startRow; r <= endRow; r++) {
      for (let c = 0; c < colCount; c++) {
        const cellId = getCellId(c, r);
        before[cellId] = cells[cellId]?.value ?? '';
        after[cellId] = newCells[cellId]?.value ?? '';
      }
    }
    state.addHistoryEntry({
      type: 'cells',
      timestamp: Date.now(),
      diff: { before, after },
    });
    set({ cells: newCells });
  },

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
