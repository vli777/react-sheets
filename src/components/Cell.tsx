// src/components/Cell.tsx

import React, { useEffect, useRef, useState } from 'react'
import { getCellId, parseCellId } from '../utils/getCellId'
import { keyboardMove } from '../utils/keyboardMove'
import { useSheetStore } from '../store/useSheetStore'
import { ColumnResizer } from './ColumnResizer'

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
  isResizable?: boolean
}

export function Cell({ row, col, className = '', maxCol, maxRow, showGrid = true, isResizable = true }: CellProps) {
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

  // Mobile range selection state
  const longPressTimeout = useRef<number | null>(null)
  const [isTouchSelecting, setIsTouchSelecting] = useState(false)

  // Helper to get cell id from touch event
  function getCellIdFromTouch(e: React.TouchEvent) {
    // Find the closest input under the touch
    const touch = e.touches[0] || e.changedTouches[0]
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    if (el && el instanceof HTMLElement && el.id) {
      return el.id
    }
    return id // fallback to current cell
  }

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
    if (row !== maxRow - 1) border += ' border-b border-[#e0e0e0]'
    if (col !== maxCol - 1) border += ' border-r border-[#e0e0e0]'
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
        // Only prevent default if not clicking the input itself
        if (e.target !== ref.current) {
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
        }
      }}
      onMouseOver={(e) => {
        if (e.buttons === 1 && rangeAnchor) {
          // Left mouse button is pressed
          setHead(id)
          setSel(id)
        }
        setHovered(true)
      }}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={(e) => {
        if (isHeader) return
        // Start long-press timer
        longPressTimeout.current = setTimeout(() => {
          setIsTouchSelecting(true)
          setAnchor(id)
          setHead(id)
          setSel(id)
        }, 400)
      }}
      onTouchMove={(e) => {
        if (!isTouchSelecting) return
        const targetId = getCellIdFromTouch(e)
        setHead(targetId)
        setSel(targetId)
      }}
      onTouchEnd={() => {
        if (longPressTimeout.current) {
          clearTimeout(longPressTimeout.current)
          longPressTimeout.current = null
        }
        setIsTouchSelecting(false)
      }}
      onTouchCancel={() => {
        if (longPressTimeout.current) {
          clearTimeout(longPressTimeout.current)
          longPressTimeout.current = null
        }
        setIsTouchSelecting(false)
      }}
      className={`relative w-full h-full rounded-none ${getGridBorderClasses()} ${
        inRange && hasMultipleCells ? 'bg-blue-50' : ''
      }`}
    >
      {/* Header cell: add single sort icon, right-aligned, only on hover */}
      {isHeader && (
        <button
          type="button"
          title="Sort column"
          className={`absolute top-1 right-2 z-30 text-xs px-1 py-0.5 rounded transition-opacity duration-150 ${hovered ? 'opacity-100' : 'opacity-0'} hover:bg-blue-100`}
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
          ${selection === id ? 'border border-blue-500' : ''}
          focus:border-blue-400
          focus:outline-2
          focus:outline-blue-600
          focus:outline-offset-0
          ${inRange && hasMultipleCells ? 'bg-transparent' : ''}
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
        // On mobile, quick tap selects single cell
        onTouchStart={(e) => {
          if (isHeader) return
          longPressTimeout.current = setTimeout(() => {
            setIsTouchSelecting(true)
            setAnchor(id)
            setHead(id)
            setSel(id)
          }, 400)
        }}
        onTouchEnd={() => {
          if (longPressTimeout.current) {
            clearTimeout(longPressTimeout.current)
            longPressTimeout.current = null
            // If not long-press, treat as single tap
            if (!isTouchSelecting) {
              clearRange()
              setSel(id)
            }
          }
          setIsTouchSelecting(false)
        }}
        onTouchCancel={() => {
          if (longPressTimeout.current) {
            clearTimeout(longPressTimeout.current)
            longPressTimeout.current = null
          }
          setIsTouchSelecting(false)
        }}
      />
      {/* Add ColumnResizer to the right edge of every cell except index column */}
      {col >= 0 && (
        <div className="absolute top-0 right-0 h-full w-1 z-10">
          <ColumnResizer colIndex={col} isResizable={isResizable} />
        </div>
      )}
    </div>
  )
}
