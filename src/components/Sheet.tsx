// src/components/Sheet.tsx

import { useRef, useState, useLayoutEffect, useEffect } from 'react'
import { useSheetStore, MIN_COL_PX, MIN_ROW_PX } from '../store/useSheetStore'
import { ColumnResizer } from './ColumnResizer'
import { RowResizer } from './RowResizer'
import { Cell } from './Cell'

const INDEX_COLUMN_WIDTH = 48

export interface SheetProps {
  headerCellClassName?: string
  cellClassName?: string
  showIndex?: boolean
}

export function Sheet({
  headerCellClassName = 'text-sm',
  cellClassName = 'text-sm',
  showIndex = true,
}: SheetProps) {
  const rowCount = useSheetStore((s) => s.rowCount)
  const colCount = useSheetStore((s) => s.colCount)

  const columns = useSheetStore((s) => s.columns)
  const rowMeta = useSheetStore((s) => s.rowMeta)

  const undo = useSheetStore((s) => s.undo)
  const redo = useSheetStore((s) => s.redo)

  const containerRef = useRef<HTMLDivElement>(null)
  const [minCols, setMinCols] = useState(0)
  const [minRows, setMinRows] = useState(0)

  // Handle keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault()
          undo()
        } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault()
          redo()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  useLayoutEffect(() => {
    const compute = () => {
      const el = containerRef.current
      if (!el) return
      const { width, height } = el.getBoundingClientRect()
      const contentWidth = width - INDEX_COLUMN_WIDTH
      const fitCols = Math.floor(contentWidth / MIN_COL_PX)
      // subtract header row height for the rows computation:
      const contentHeight = height - MIN_ROW_PX
      const fitRows = Math.floor(contentHeight / MIN_ROW_PX)
      setMinCols(Math.max(fitCols, 1))
      setMinRows(Math.max(fitRows, 1))
    }

    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  const paddedCols = Math.max(colCount, minCols)
  const paddedRows = Math.max(rowCount, minRows)

  const columnTemplate = Array.from({ length: paddedCols })
    .map((_, i) => `${columns[i]?.width ?? MIN_COL_PX}px`)
    .join(' ')

  const renderCols = Array.from({ length: paddedCols }).map(
    (_, i) => columns[i] || { name: '', key: `__blank_${i}` },
  )

  return (
    <div
      ref={containerRef}
      className="inline-block overflow-auto border bg-white shadow rounded-md"
      style={{ minHeight: 400 }}
    >
      {/* Header Row */}
      <div className="flex">
        <div
          className={`px-4 relative flex items-center justify-center text-sm text-gray-500 ${
            showIndex ? 'text-center' : ''
          }`}
          style={{ width: INDEX_COLUMN_WIDTH, minWidth: INDEX_COLUMN_WIDTH }}
        />

        <div
          className="grid bg-gray-200"
          style={{ gridTemplateColumns: columnTemplate, minHeight: MIN_ROW_PX, gap: '1px' }}
        >
          {renderCols.map((_, c) => (
            <div key={`h-${c}`} className="relative">
              <Cell row={-1} col={c} className={headerCellClassName} />
              <ColumnResizer colIndex={c} />
            </div>
          ))}
        </div>
      </div>

      {/* Data Rows */}
      {Array.from({ length: paddedRows }).map((_, r) => {
        const height = rowMeta[r]?.height ?? MIN_ROW_PX
        return (
          <div key={`row-${r}`} className="flex" style={{ height, minHeight: MIN_ROW_PX }}>
            <div
              className={`px-4 relative flex items-center justify-center text-sm text-gray-500 ${
                showIndex ? 'text-center' : ''
              }`}
              style={{ width: INDEX_COLUMN_WIDTH, minWidth: INDEX_COLUMN_WIDTH }}
            >
              {showIndex ? r + 1 : null}
              <RowResizer rowIndex={r} />
            </div>

            <div
              className="grid bg-gray-200"
              style={{ gridTemplateColumns: columnTemplate, gap: '1px', paddingBottom: '1px' }}
            >
              {renderCols.map((_, c) => (
                <Cell key={`d-${r}-${c}`} row={r} col={c} className={cellClassName} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
