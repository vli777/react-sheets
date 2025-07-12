// src/components/Cell.tsx

import React, { useEffect, useRef, useState } from 'react'
import { getCellId, parseCellId } from '../utils/getCellId'
import { keyboardMove } from '../utils/keyboardMove'
import { useSheetStore } from '../store/useSheetStore'


const NAV_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'])
const DELETE_KEYS = new Set(['Delete', 'Backspace'])

const BASE_CELL_CLASS = 'flex-none w-36 min-w-0 p-1 truncate text-sm rounded-none'

export interface CellProps {
  col: number
  row: number
  className?: string
  maxCol: number
  maxRow: number
  showGrid?: boolean
}

export function Cell({ row, col, className = '', maxCol, maxRow, showGrid = true }: CellProps) {
  const id = getCellId(col, row)
  const cols = useSheetStore((s) => s.columns)
  const dataVal = useSheetStore((s) => s.cells[id]?.value ?? '')
  const selection = useSheetStore((s) => s.selection)
  const rangeAnchor = useSheetStore((s) => s.rangeAnchor)
  const rangeHead = useSheetStore((s) => s.rangeHead)

  const setCell = useSheetStore((s) => s.setCell)
  const setCol = useSheetStore((s) => s.setColumnName)
  const setSel = useSheetStore((s) => s.setSelection)
  const setRowCount = useSheetStore((s) => s.setRowCount)
  const setColCount = useSheetStore((s) => s.setColCount)
  const setAnchor = useSheetStore((s) => s.setRangeAnchor)
  const setHead = useSheetStore((s) => s.setRangeHead)
  const clearRange = useSheetStore((s) => s.clearRange)
  const copySelection = useSheetStore((s) => s.copySelection)
  const pasteToSelection = useSheetStore((s) => s.pasteToSelection)

  const ref = useRef<HTMLInputElement>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [hovered, setHovered] = useState(false)

  const isHeader = row === -1
  const value = isHeader ? cols[col]?.name ?? '' : dataVal

  useEffect(() => {
    if (selection === id) {
      ref.current?.focus({ preventScroll: true })
      ref.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
  }, [selection, id])

  // Determine if this cell should show the selection border
  const isSelected = React.useMemo(() => {
    if (selection === id) return true
    // If we have a range and this cell is the range anchor, it should be selected
    if (rangeAnchor === id) return true
    return false
  }, [selection, id, rangeAnchor])

  const inRange = React.useMemo(() => {
    if (!rangeAnchor || !rangeHead) return false
    const { col: c0, row: r0 } = parseCellId(rangeAnchor)
    const { col: c1, row: r1 } = parseCellId(rangeHead)
    const loCol = Math.min(c0, c1),
      hiCol = Math.max(c0, c1)
    const loRow = Math.min(r0, r1),
      hiRow = Math.max(r0, r1)
    return col >= loCol && col <= hiCol && row >= loRow && row <= hiRow
  }, [rangeAnchor, rangeHead, col, row])

  // Check if range has multiple cells
  const hasMultipleCells = React.useMemo(() => {
    if (!rangeAnchor || !rangeHead) return false
    const { col: c0, row: r0 } = parseCellId(rangeAnchor)
    const { col: c1, row: r1 } = parseCellId(rangeHead)
    return c0 !== c1 || r0 !== r1
  }, [rangeAnchor, rangeHead])

  const getGridBorderClasses = () => {
    if (!showGrid) return ''
    let border = ''
    if (row !== maxRow - 1) border += ' border-b border-[#e0e0e0] dark:border-[#30363d]'
    if (col !== maxCol - 1) border += ' border-r border-[#e0e0e0] dark:border-[#30363d]'
    return border
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    if (isHeader) {
      setCol(col, v)
    } else {
      setCell(id, v)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle delete/backspace for range selection
    if (DELETE_KEYS.has(e.key) && inRange && hasMultipleCells) {
      e.preventDefault()

      // Get all cells in the range
      const { col: c0, row: r0 } = parseCellId(rangeAnchor!)
      const { col: c1, row: r1 } = parseCellId(rangeHead!)
      const loCol = Math.min(c0, c1)
      const hiCol = Math.max(c0, c1)
      const loRow = Math.min(r0, r1)
      const hiRow = Math.max(r0, r1)

      // Clear all cells in the range
      const updates: Record<string, string> = {}
      for (let r = loRow; r <= hiRow; r++) {
        for (let c = loCol; c <= hiCol; c++) {
          const cellId = getCellId(c, r)
          updates[cellId] = ''
        }
      }

      useSheetStore.getState().setCells(updates)
      return
    }

    // Handle copy/paste operations
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'c') {
        e.preventDefault()
        copySelection()
        return
      } else if (e.key === 'v') {
        e.preventDefault()
        pasteToSelection()
        return
      } else if (e.key === 'x') {
        e.preventDefault()
        copySelection()
        // Clear the selection after copying
        if (inRange && hasMultipleCells) {
          const { col: c0, row: r0 } = parseCellId(rangeAnchor!)
          const { col: c1, row: r1 } = parseCellId(rangeHead!)
          const loCol = Math.min(c0, c1)
          const hiCol = Math.max(c0, c1)
          const loRow = Math.min(r0, r1)
          const hiRow = Math.max(r0, r1)

          const updates: Record<string, string> = {}
          for (let r = loRow; r <= hiRow; r++) {
            for (let c = loCol; c <= hiCol; c++) {
              const cellId = getCellId(c, r)
              updates[cellId] = ''
            }
          }
          useSheetStore.getState().setCells(updates)
        } else if (selection) {
          setCell(selection, '')
        }
        return
      }
      // Allow other Ctrl/Cmd combinations (like Ctrl+A) to work normally
      return
    }

    if (!NAV_KEYS.has(e.key)) return

    const next = keyboardMove({
      cellId: id,
      key: e.key,
      shiftKey: e.shiftKey,
    })
    if (!next) return

    e.preventDefault()

    const { col: nc, row: nr } = parseCellId(next)
    const { colCount: curCols, rowCount: curRows } = useSheetStore.getState()
    if (nc + 1 > curCols) {
      setColCount(nc + 1)
    }
    if (nr + 1 > curRows) {
      setRowCount(nr + 1)
    }

    if (e.shiftKey) {
      // Extend range selection
      if (!rangeAnchor) {
        setAnchor(id)
      }
      setHead(next)
      setSel(next)
    } else {
      // Clear range and move selection
      clearRange()
      setSel(next)
    }

    document.getElementById(next)?.focus({ preventScroll: true })
  }

  return (
    <div
      onMouseDown={(e) => {
        e.preventDefault()
        if (e.shiftKey) {
          // Extend range selection
          if (!rangeAnchor) {
            setAnchor(id)
            setSel(id) // Selection should be at the anchor (start) of range
          }
          setHead(id)
        } else {
          // Start new selection
          setAnchor(id)
          setHead(id)
          setSel(id)
        }
      }}
      onMouseOver={(e) => {
        if (e.buttons === 1 && rangeAnchor) {
          // Left mouse button is pressed
          setHead(id)
          // Keep selection at the anchor (start) of range
        }
        setHovered(true)
      }}
      onMouseLeave={() => setHovered(false)}

      className={`relative w-full h-full rounded-none ${getGridBorderClasses()} ${
        inRange && hasMultipleCells ? 'bg-blue-100/50 dark:bg-[#21262d]/50' : ''
      }`}
    >
      {/* Header cell: add single sort icon, right-aligned, only on hover */}
      {isHeader && (
        <button
          type="button"
          title="Sort column"
          className={`absolute top-1 right-2 z-30 text-xs px-1 py-0.5 rounded transition-opacity duration-150 ${hovered ? 'opacity-100' : 'opacity-0'} hover:bg-blue-100 dark:hover:bg-[#30363d]`}
          style={{ pointerEvents: 'auto' }}
          onClick={(e) => {
            e.stopPropagation()
            let rowRange: [number, number] | undefined = undefined
            if (rangeAnchor && rangeHead) {
              const { col: c0, row: r0 } = parseCellId(rangeAnchor)
              const { col: c1, row: r1 } = parseCellId(rangeHead)
              const loCol = Math.min(c0, c1)
              const hiCol = Math.max(c0, c1)
              const loRow = Math.min(r0, r1)
              const hiRow = Math.max(r0, r1)
              if (col >= loCol && col <= hiCol && loRow >= 0 && hiRow >= 0) {
                rowRange = [loRow, hiRow]
              }
            }
            useSheetStore.getState().sortByColumn(col, sortDir, rowRange)
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
          }}
        >
          {sortDir === 'asc' ? '▲' : '▼'}
        </button>
      )}
      <input
        id={id}
        ref={ref}
        type="text"
        className={`
          w-full h-full
          ${BASE_CELL_CLASS}
          ${className}
          ${inRange && hasMultipleCells ? 'bg-transparent dark:bg-transparent' : 'bg-white dark:bg-transparent'}
          ${isSelected ? 'border border-blue-600 dark:border-[#58a6ff]' : ''}
          focus:border-blue-600 dark:focus:border-[#58a6ff]
          focus:outline-none
          ${inRange && hasMultipleCells ? 'focus:bg-transparent dark:focus:bg-transparent' : 'focus:bg-blue-100 dark:focus:bg-[#161b22]'}
          rounded-none
        `}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={(e) => {
          e.stopPropagation()
          clearRange()
          setSel(id)
        }}
        onDoubleClick={(e) => {
          e.stopPropagation()
          // Select all text in the input
          e.currentTarget.select()
        }}
        spellCheck="false"
        autoComplete="off"
      />

    </div>
  )
}
