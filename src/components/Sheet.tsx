// src/components/Sheet.tsx

import { useSheetStore, MIN_COL, MIN_ROW } from '../store/useSheetStore'
import { ColumnResizer } from './ColumnResizer'
import { RowResizer } from './RowResizer'
import { Cell } from './Cell'

const INDEX_COLUMN_WIDTH = 8

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

  const rowMeta = useSheetStore((s) => s.rowMeta)
  const columns = useSheetStore((s) => s.columns)

  const columnTemplate = Array.from({ length: colCount })
    .map((_, i) => `${columns[i]?.width ?? MIN_COL}px`)
    .join(' ')

  const renderCols = Array.from({ length: colCount }).map(
    (_, i) => columns[i] || { name: '', key: `__blank_${i}` },
  )

  return (
    <div className="relative w-full h-full">
      <div className="overflow-auto whitespace-nowrap border bg-white shadow rounded-md">
        {/* Header Row */}
        <div className="flex">
          <div
            className={`px-4 relative flex items-center justify-center text-sm text-gray-500 ${
              showIndex ? 'text-center' : ''
            }`}
            style={{ width: INDEX_COLUMN_WIDTH, minWidth: INDEX_COLUMN_WIDTH }}
          />

          <div className="grid" style={{ gridTemplateColumns: columnTemplate, minHeight: MIN_ROW }}>
            {renderCols.map((_, c) => (
              <div key={`h-${c}`} className="relative">
                <Cell row={-1} col={c} className={headerCellClassName} />
                <ColumnResizer colIndex={c} />
              </div>
            ))}
          </div>
        </div>

        {/* Data Rows */}
        {Array.from({ length: rowCount }).map((_, r) => {
          const height = rowMeta[r]?.height ?? MIN_ROW
          return (
            <div key={`row-${r}`} className="flex" style={{ height, minHeight: MIN_ROW }}>
              <div
                className={`px-4 relative flex items-center justify-center text-sm text-gray-500 ${
                  showIndex ? 'text-center' : ''
                }`}
                style={{ width: INDEX_COLUMN_WIDTH, minWidth: INDEX_COLUMN_WIDTH }}
              >
                {showIndex ? r + 1 : null}
                <RowResizer rowIndex={r} />
              </div>

              <div className="grid" style={{ gridTemplateColumns: columnTemplate }}>
                {renderCols.map((_, c) => (
                  <Cell key={`d-${r}-${c}`} row={r} col={c} className={cellClassName} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
