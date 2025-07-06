// src/components/Cell.tsx

import React, { useEffect, useRef } from 'react'
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
}

export function Cell({ row, col, className = '' }: CellProps) {
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

  const ref = useRef<HTMLInputElement>(null)

  const isHeader = row === -1
  const value = isHeader ? cols[col]?.name ?? '' : dataVal

  useEffect(() => {
    if (selection === id) {
      ref.current?.focus({ preventScroll: true })
      ref.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
  }, [selection, id])

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

  // Determine border classes for range selection
  const getBorderClasses = () => {
    if (!inRange) return ''

    const { col: c0, row: r0 } = parseCellId(rangeAnchor!)
    const { col: c1, row: r1 } = parseCellId(rangeHead!)
    const loCol = Math.min(c0, c1)
    const hiCol = Math.max(c0, c1)
    const loRow = Math.min(r0, r1)
    const hiRow = Math.max(r0, r1)

    let borderClasses = ''

    // Top border for top row
    if (row === loRow) borderClasses += ' border-t border-blue-600'
    // Bottom border for bottom row
    if (row === hiRow) borderClasses += ' border-b border-blue-600'
    // Left border for leftmost column
    if (col === loCol) borderClasses += ' border-l border-blue-600'
    // Right border for rightmost column
    if (col === hiCol) borderClasses += ' border-r border-blue-600'

    return borderClasses
  }

  // Check if range has multiple cells
  const hasMultipleCells = React.useMemo(() => {
    if (!rangeAnchor || !rangeHead) return false
    const { col: c0, row: r0 } = parseCellId(rangeAnchor)
    const { col: c1, row: r1 } = parseCellId(rangeHead)
    return c0 !== c1 || r0 !== r1
  }, [rangeAnchor, rangeHead])

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
          }
          setHead(id)
          setSel(id)
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
          setSel(id)
        }
      }}
      className={`relative w-full h-full rounded-none ${
        inRange && hasMultipleCells ? 'bg-blue-50' : ''
      } ${getBorderClasses()}`}
    >
      <input
        id={id}
        ref={ref}
        type="text"
        className={`
          w-full h-full
          ${BASE_CELL_CLASS}
          ${className}
          ${selection === id ? 'border border-blue-500' : ''}
          focus:border-blue-400
          focus:outline-2
          focus:outline-blue-600
          focus:outline-offset-0
          ${inRange && hasMultipleCells ? 'bg-blue-50' : ''}
          ${inRange && selection === id ? '' : ''}
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
        spellCheck="false"
        autoComplete="off"
      />
    </div>
  )
}
